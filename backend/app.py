import os
import json
import asyncio
import re
from urllib.parse import urlparse
from datetime import datetime, timezone
import logging

import httpx
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path

# 加载 .env 文件
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# 日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger("phishguard")

# 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com/v1").strip()
MODEL_NAME = os.getenv("MODEL_NAME", "deepseek-chat").strip()
USE_AI_TEXT = os.getenv("USE_AI_TEXT", "false").lower() == "true"
# 共享 token：扩展调用 /check 时必须带上 X-PhishGuard-Token 与此值一致
PHISHGUARD_TOKEN = os.getenv("PHISHGUARD_TOKEN", "").strip()

# 简易内存限流：单 IP 60 秒内最多 30 次 /check，避免被刷
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 30
_rate_buckets: dict[str, list[float]] = {}

app = FastAPI(title="PhishGuard-Vision Backend")

# CORS 收紧：只允许扩展来源（chrome-extension://* 与本地回环前端）
# 注意：allow_origins 只做精确匹配，正则需用 allow_origin_regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],
    allow_origin_regex=r"^chrome-extension://.*$",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-PhishGuard-Token"],
    allow_credentials=False,
    max_age=600,
)


# ---------- 数据模型 ----------
class CheckRequest(BaseModel):
    url: str = ""
    title: str = ""
    page_text: str = ""   # 注意：只接纯文本，不再接 html


class CheckResponse(BaseModel):
    is_phishing: bool
    accuracy: float
    reasons: list[str]
    brand_name: str | None = None
    ai_official_url: str | None = None
    ai_used: bool = False
    engine: str = "rule"


# ---------- 鉴权 + 限流 ----------
async def require_token(request: Request):
    # 浏览器扩展通过自定义头传 token
    provided = request.headers.get("X-PhishGuard-Token", "").strip()
    if not PHISHGUARD_TOKEN:
        log.warning("未配置 PHISHGUARD_TOKEN，跳过 token 校验（仅开发模式）")
    elif provided != PHISHGUARD_TOKEN:
        raise HTTPException(status_code=401, detail="invalid token")

    # 限流
    ip = request.client.host if request.client else "unknown"
    now = asyncio.get_event_loop().time()
    bucket = _rate_buckets.setdefault(ip, [])
    bucket[:] = [t for t in bucket if now - t < RATE_LIMIT_WINDOW]
    if len(bucket) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="too many requests")
    bucket.append(now)


# ---------- 品牌库与可疑词 ----------
BRANDS = {
    "paypal.com": "PayPal",
    "google.com": "Google",
    "facebook.com": "Facebook",
    "apple.com": "Apple",
    "amazon.com": "Amazon",
    "microsoft.com": "Microsoft",
    "alipay.com": "支付宝",
    "taobao.com": "淘宝",
    "jd.com": "京东",
    "qq.com": "腾讯",
    "baidu.com": "百度",
}

OFFICIAL_SITES = {
    "PayPal": "https://www.paypal.com",
    "Google": "https://www.google.com",
    "Facebook": "https://www.facebook.com",
    "Apple": "https://www.apple.com",
    "Amazon": "https://www.amazon.com",
    "Microsoft": "https://www.microsoft.com",
    "支付宝": "https://www.alipay.com",
    "淘宝": "https://www.taobao.com",
    "京东": "https://www.jd.com",
    "腾讯": "https://www.qq.com",
    "百度": "https://www.baidu.com",
}

# 可疑关键词：只保留钓鱼/欺诈场景的特异性词汇
# 泛化的"登录""安全""验证"等正常网站常用词已移除，避免误报
SUSPICIOUS_KEYWORDS = [
    "verify your account", "confirm your password", "account suspended",
    "信用卡号", "银行卡号", "身份证号", "有效期", "CVV", "安全码",
    "恭喜中奖", "您的账户已被锁定", "解锁账户",
]


# ---------- 工具函数 ----------
def normalize_text(s: str) -> str:
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()[:2000]


async def safe_whois(domain: str) -> dict:
    """WHOIS 查询，带超时与异常隔离，永不抛错"""
    try:
        import whois
    except ImportError:
        return {"ok": False, "reason": "whois module not installed"}
    try:
        import concurrent.futures
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = loop.run_in_executor(executor, whois.whois, domain)
            try:
                w = await asyncio.wait_for(future, timeout=4.0)
            except asyncio.TimeoutError:
                future.cancel()
                return {"ok": False, "reason": "timeout"}
        cd = w.creation_date
        if isinstance(cd, list):
            cd = cd[0] if cd else None
        if cd:
            days = (datetime.now(timezone.utc) - cd).days
            return {"ok": True, "age_days": days}
        return {"ok": True, "age_days": None}
    except asyncio.TimeoutError:
        return {"ok": False, "reason": "timeout"}
    except Exception as e:
        return {"ok": False, "reason": str(e)[:80]}


def lev_ratio(a: str, b: str) -> float:
    """短串的相似度（避免引入 Levenshtein 依赖时的兼容写法）"""
    a, b = a.lower(), b.lower()
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0
    # 用 difflib 作为 Python 标准库回退
    from difflib import SequenceMatcher
    return SequenceMatcher(None, a, b).ratio()


def rule_engine(url: str, page_text: str) -> tuple[bool, float, list[str], str | None]:
    """基于 URL + 纯文本的规则引擎（与前端 ruleEngine.js 保持一致：无罪推定模型）
    本地引擎不判定钓鱼，只计算准确率。准确率 < 50% 时由 AI 判定。
    返回值第一个元素 is_phish 始终为 False（兼容旧接口）。
    """

    # 扣分权重表（与前端 DEDUCTION_WEIGHTS 对应）
    DEDUCTION_WEIGHTS = {
        "IP_DOMAIN":         0.55,
        "BRAND_TYPOSQUAT":   0.55,
        "BRAND_MISMATCH":    0.50,
        "PASSWORD_NO_HTTPS": 0.50,
        "CARD_INPUT":        0.50,
        "FORM_EXTERNAL":     0.25,
        "AT_SYMBOL":         0.25,
        "HIGH_RISK_TLD":     0.25,
        "LINK_IP":           0.18,
        "LINK_BRAND_IMPER":  0.18,
        "META_REDIRECT":     0.15,
        "UNCOMMON_TLD":      0.08,
        "NO_HTTPS":          0.08,
        "LONG_DOMAIN":       0.03,
        "LONG_LINK_DOMAIN":  0.03,
        "AT_IN_LINK":        0.03,
        "SUSPICIOUS_WORDS":  0.00,
    }

    # 阈值（与前端一致）
    INITIAL_ACCURACY = 0.99
    AI_REVIEW_LINE = 0.50   # < 50% 触发 AI

    reasons: list[str] = []
    matched_brand = None
    parsed = urlparse(url or "")
    domain = (parsed.netloc or "").lower()
    is_https = parsed.scheme == "https"
    lower = (page_text or "").lower()

    # 收集特征 ID 列表
    triggered: list[str] = []

    # 1. URL 基本检查
    is_ip_domain = False
    if domain and domain.replace(".", "").isdigit() and not domain.startswith("127.") and not domain.startswith("192.168."):
        is_ip_domain = True
        triggered.append("IP_DOMAIN")
        reasons.append("域名是IP地址，高度可疑")

    if "@" in (url or ""):
        triggered.append("AT_SYMBOL")
        reasons.append("URL中包含@符号，可能用于混淆")

    if len(domain) > 30:
        triggered.append("LONG_DOMAIN")
        reasons.append("域名长度异常")

    if not is_https and domain:
        triggered.append("NO_HTTPS")
        reasons.append("未使用 HTTPS")

    # 2. 品牌相似度
    for brand_domain, brand_name in BRANDS.items():
        if domain and domain != brand_domain:
            r = lev_ratio(domain, brand_domain)
            if 0.85 <= r < 1.0:
                triggered.append("BRAND_TYPOSQUAT")
                reasons.append(f"域名与{brand_name}官方域名高度相似 (相似度{r:.2f})")
                matched_brand = brand_name
                break

    # 3. 品牌名出现但域名不符
    has_form = "form" in lower or "input" in lower or "password" in lower
    if domain:
        for brand_domain, brand_name in BRANDS.items():
            if brand_name.lower() in lower and not (
                domain == brand_domain or domain.endswith("." + brand_domain)
            ):
                if has_form or is_ip_domain:
                    triggered.append("BRAND_MISMATCH")
                    reasons.append(f"页面文本提及{brand_name}，但当前域名并非其官方域名")
                    matched_brand = matched_brand or brand_name
                    break

    # 4. 密码框无 HTTPS / 信用卡
    if has_form and not is_https and domain:
        triggered.append("PASSWORD_NO_HTTPS")
    if "信用卡" in lower or "银行卡" in lower or "card" in lower:
        triggered.append("CARD_INPUT")

    # 5. 关键词（INFO 级，不计分但展示）
    found = [k for k in SUSPICIOUS_KEYWORDS if k.lower() in lower]
    if found:
        triggered.append("SUSPICIOUS_WORDS")
        reasons.append(f"页面文本提及: {', '.join(found[:6])}（仅供参考）")

    # 去重理由
    reasons = list(dict.fromkeys(reasons))

    # 计算扣分
    total_deduction = sum(DEDUCTION_WEIGHTS.get(t, 0) for t in triggered)
    accuracy = max(0.0, INITIAL_ACCURACY - total_deduction)

    # 本地引擎不判定钓鱼，is_phish 始终为 False（由 AI 判定）
    is_phish = False

    return is_phish, accuracy, reasons, matched_brand


# ---------- AI 调用 ----------
async def call_ai(messages: list[dict], max_tokens: int = 300) -> dict | None:
    if not OPENAI_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL_NAME,
                    "messages": messages,
                    "temperature": 0.1,
                    "max_tokens": max_tokens
                }
            )
        if resp.status_code != 200:
            log.warning("AI API %s: %s", resp.status_code, resp.text[:200])
            return None
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        # 解析 JSON
        start = content.find("{")
        end = content.rfind("}") + 1
        if start == -1 or end <= 0:
            return None
        return json.loads(content[start:end])
    except Exception as e:
        log.warning("AI 调用失败: %s: %s", type(e).__name__, e)
        return None


async def ai_text_analysis(url: str, page_text: str) -> tuple[bool, float, list[str]] | None:
    if not OPENAI_API_KEY:
        return False, 0.5, ["AI Key未配置，使用规则引擎结果"]
    system_prompt = (
        "你是一个专业的网络安全分析师，请根据URL和页面文本判断是否为钓鱼网站。"
        "核心原则：宁可误报不可漏报。保护用户安全是第一优先级。"
        "只要有可疑迹象，就应标记为钓鱼，让用户警惕。\n\n"
        "判定为钓鱼的特征（满足任意1条即可标记）：\n"
        "- 域名是裸IP地址（如 http://192.168.x.x）\n"
        "- 域名与知名品牌域名高度相似（如 paypa1.com、g00gle.com）\n"
        "- 页面提到品牌名但域名不是该品牌官方域名\n"
        "- 要求输入信用卡号/银行卡号/身份证号/CVV/安全码\n"
        "- URL中包含@符号（可能用于混淆真实地址）\n"
        "- 域名使用高风险TLD（.xyz/.tk/.club/.top/.vip 等）\n"
        "- 页面有紧急诱导词汇（如：您的账户已被锁定、立即验证、恭喜中奖）\n"
        "- 登录表单提交到外部域名\n"
        "- 使用HTTP传输密码或敏感信息\n\n"
        "只有以下情况才可判定为安全：\n"
        "- 域名是知名官方域名（如 google.com、paypal.com、baidu.com）\n"
        "- 页面是正常的内容页、博客、新闻，无登录表单和敏感信息输入\n"
        "- URL看起来完全正常，无任何可疑特征\n\n"
        "请以JSON返回：{\"is_phishing\": bool, \"accuracy\": float, \"reasons\": [\"理由1\", \"理由2\"]}"
        "accuracy范围：0.0-1.0，有可疑特征时给高分（>=0.75），非常确定是钓鱼时给极高分（>=0.90）"
    )
    user_msg = f"URL: {url}\n页面文本: {page_text[:800]}"
    result = await call_ai([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ], max_tokens=300)
    if not result:
        return None
    return (
        bool(result.get("is_phishing", False)),
        float(result.get("accuracy", 0.5)),
        list(result.get("reasons", []))
    )


async def ai_search_official_site(url: str, page_text: str) -> str | None:
    """让 AI 推断被仿冒的官方网站地址。返回经过白名单校验的 URL。"""
    if not OPENAI_API_KEY:
        return None
    prompt = (
        "你是一个网络安全专家。当前网页疑似钓鱼网站，请根据以下信息推断它仿冒的是哪个官方网站，"
        "并返回该官方网站的完整 URL（以 https:// 开头）。\n\n"
        f"当前页面 URL: {url}\n页面文本片段: {page_text[:500]}\n\n"
        '请严格以 JSON 格式返回：{"brand_name": "品牌名称", "official_url": "https://..."}\n'
        '如果无法确定，返回：{"brand_name": null, "official_url": null}'
    )
    result = await call_ai(
        [{"role": "user", "content": prompt}],
        max_tokens=200
    )
    if not result:
        return None
    ai_url = result.get("official_url")
    return sanitize_official_url(ai_url)


def sanitize_official_url(ai_url: str | None) -> str | None:
    """对 AI 推断的官网做白名单校验，避免 AI 幻觉跳到另一个钓鱼站。"""
    if not ai_url:
        return None
    try:
        host = urlparse(ai_url).hostname.lower().lstrip("www.")
    except Exception:
        return None
    for site in OFFICIAL_SITES.values():
        try:
            oh = urlparse(site).hostname.lower().lstrip("www.")
            if host == oh or host.endswith("." + oh):
                return site
        except Exception:
            continue
    return None


# ---------- 主端点 ----------
@app.post("/check", response_model=CheckResponse, dependencies=[Depends(require_token)])
async def check_url(req: CheckRequest):
    log.info("check url=%s", req.url)
    text = normalize_text(req.page_text)

    rule_is_phish, rule_acc, rule_reasons, rule_brand = rule_engine(req.url, text)

    # 本地引擎不判定钓鱼，初始为 False
    final_is_phish = False
    final_acc = rule_acc
    final_reasons = list(rule_reasons)
    final_brand = rule_brand
    ai_official_url = None
    ai_used = False

    # 准确率 < 50%（AI_REVIEW_LINE）时自动调用 AI 判定
    needs_ai = rule_acc < 0.50
    if needs_ai and OPENAI_API_KEY:
        ai = await ai_text_analysis(req.url, text)
        if ai:
            ai_used = True
            ai_is_phish, ai_acc, ai_reasons = ai
            final_is_phish = ai_is_phish     # AI 直接判定
            final_acc = ai_acc
            # 合并理由（去重）
            for r in rule_reasons:
                if r not in final_reasons:
                    final_reasons.append(r)
            for r in ai_reasons:
                if r not in final_reasons:
                    final_reasons.append(r)
            # 推断官网
            if final_is_phish and not final_brand:
                ai_url = await ai_search_official_site(req.url, text)
                if ai_url:
                    ai_official_url = ai_url
        else:
            # AI 调用失败，追加提示
            final_reasons.append("AI 分析不可用，请检查后端配置")
    elif needs_ai and not OPENAI_API_KEY:
        final_reasons.append("检测到可疑特征但 AI 未配置，无法做最终判定")

    return CheckResponse(
        is_phishing=final_is_phish,
        accuracy=round(final_acc, 3),
        reasons=final_reasons,
        brand_name=final_brand,
        ai_official_url=ai_official_url,
        ai_used=ai_used,
        engine="ai" if ai_used else "rule"
    )


@app.get("/health")
async def health():
    return {
        "ok": True,
        "ai_enabled": USE_AI_TEXT and bool(OPENAI_API_KEY),
        "auth_required": bool(PHISHGUARD_TOKEN),
        "model": MODEL_NAME,
        "base_url": OPENAI_BASE_URL
    }


@app.get("/test")
async def test_connection():
    """测试 API Key 和模型连接是否正常"""
    if not OPENAI_API_KEY:
        return {"ok": False, "error": "API Key 未配置"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # 1. 尝试列出模型
            resp = await client.get(
                f"{OPENAI_BASE_URL}/models",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"}
            )
            if resp.status_code == 401:
                return {"ok": False, "error": "API Key 无效（401 Unauthorized）"}
            if resp.status_code == 403:
                return {"ok": False, "error": "API Key 无权限（403 Forbidden）"}
            if resp.status_code != 200:
                # 有些 API 不支持 /models 端点，尝试用 chat 测试
                resp2 = await client.post(
                    f"{OPENAI_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": MODEL_NAME,
                        "messages": [{"role": "user", "content": "hi"}],
                        "max_tokens": 5
                    }
                )
                if resp2.status_code == 200:
                    return {"ok": True, "message": "连接成功", "models_count": None}
                return {"ok": False, "error": f"模型 '{MODEL_NAME}' 不可用（{resp2.status_code}）"}

            data = resp.json()
            models = data.get("data", [])
            model_ids = [m.get("id", "") for m in models]
            return {
                "ok": True,
                "message": "连接成功，模型可用",
                "models_count": len(model_ids),
                "model_list": model_ids[:20]  # 最多返回 20 个
            }
    except httpx.ConnectError:
        return {"ok": False, "error": f"无法连接到 {OPENAI_BASE_URL}，请检查 base_url"}
    except httpx.TimeoutException:
        return {"ok": False, "error": "连接超时，请检查网络或 base_url"}
    except Exception as e:
        return {"ok": False, "error": f"连接测试失败: {str(e)[:100]}"}


@app.get("/models")
async def list_models():
    """列出可用的 AI 模型"""
    if not OPENAI_API_KEY:
        return {"ok": False, "error": "API Key 未配置"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{OPENAI_BASE_URL}/models",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"}
            )
            if resp.status_code != 200:
                return {"ok": False, "error": f"获取模型列表失败（{resp.status_code}）"}
            data = resp.json()
            models = data.get("data", [])
            return {
                "ok": True,
                "count": len(models),
                "models": [{"id": m.get("id", ""), "owned_by": m.get("owned_by", "")} for m in models]
            }
    except Exception as e:
        return {"ok": False, "error": str(e)[:100]}


if __name__ == "__main__":
    import uvicorn
    print("\n  PhishGuard-Vision 后端启动中...")
    ai_ready = USE_AI_TEXT and bool(OPENAI_API_KEY)
    print(f"  AI 引擎: {'已启用' if ai_ready else '未启用'}")
    print(f"  模型: {MODEL_NAME}  @  {OPENAI_BASE_URL}")
    print(f"  安全鉴权: {'已配置' if PHISHGUARD_TOKEN else '未配置（开发模式，建议设置 PHISHGUARD_TOKEN）'}")
    if PHISHGUARD_TOKEN:
        print(f"  Token: {PHISHGUARD_TOKEN[:8]}...{PHISHGUARD_TOKEN[-4:]}")
    print(f"  监听地址: http://127.0.0.1:8000")
    print(f"  连接测试: http://127.0.0.1:8000/test")
    print(f"  模型列表: http://127.0.0.1:8000/models\n")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

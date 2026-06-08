import os, json, re
from urllib.parse import urlparse
from datetime import datetime
import Levenshtein
import whois
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
from bs4 import BeautifulSoup
from pathlib import Path

# 加载 .env 文件
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com/v1")
USE_AI_TEXT = os.getenv("USE_AI_TEXT", "false").lower() == "true"

class CheckRequest(BaseModel):
    url: str = ""
    title: str = ""
    html: str = ""

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
}

SUSPICIOUS_KEYWORDS = [
    "verify your account", "login now", "urgent", "update your information",
    "security alert", "account suspended", "unusual activity", "confirm your password",
    "立即验证", "账户冻结", "异常活动", "确认密码", "信用卡号",
    "立即登录", "账户异常", "安全警报", "验证您的身份", "恭喜中奖",
    "您的账户已被锁定", "请更新您的信息", "紧急通知", "解锁账户"
]

def parse_html(html: str):
    soup = BeautifulSoup(html, 'html.parser')
    page_text = soup.get_text(separator=' ', strip=True)[:2000]
    links = []
    for a in soup.find_all('a', href=True):
        href = a['href'].strip()
        if href and not href.startswith('javascript:'):
            links.append(href)
    forms = []
    for form in soup.find_all('form'):
        inputs = []
        for inp in form.find_all('input'):
            inputs.append({
                'type': inp.get('type', ''),
                'name': inp.get('name', '')
            })
        forms.append({
            'action': form.get('action', ''),
            'method': form.get('method', ''),
            'inputs': inputs
        })
    return page_text, links, forms

def rule_engine(url: str, html: str):
    reasons = []
    matched_brand = None
    parsed = urlparse(url)
    domain = parsed.netloc

    # 1. URL 基本检查
    if domain.replace('.', '').isdigit():
        reasons.append("域名是IP地址，高度可疑")
    if parsed.scheme != 'https':
        reasons.append("未使用 HTTPS")
    if len(domain) > 30:
        reasons.append("域名长度异常")
    if '@' in url:
        reasons.append("URL中包含@符号，可能用于混淆")

    # 2. 品牌相似度
    for brand_domain, brand_name in BRANDS.items():
        ratio = Levenshtein.ratio(domain, brand_domain)
        if 0.85 <= ratio < 1.0:
            reasons.append(f"域名与{brand_name}官方域名高度相似 (相似度{ratio:.2f})")
            matched_brand = brand_name

    # 3. WHOIS
    try:
        w = whois.whois(domain)
        creation_date = w.creation_date
        if creation_date:
            if isinstance(creation_date, list):
                creation_date = creation_date[0]
            days = (datetime.now() - creation_date).days
            if days < 30:
                reasons.append(f"域名注册仅{days}天，常见于钓鱼攻击")
    except:
        pass

    # 4. 解析 HTML
    page_text, links, forms = parse_html(html)

    # 5. 外部链接分析
    suspicious_links = 0
    for link in links:
        try:
            link_domain = urlparse(link).netloc
            if link_domain and link_domain != domain:
                suspicious_links += 1
        except:
            pass
    if suspicious_links > 0:
        reasons.append(f"页面包含 {suspicious_links} 个外链，部分可能指向恶意网站")

    # 6. 表单分析
    for form in forms:
        form_action = form.get('action', '')
        has_password = any(inp.get('type') == 'password' for inp in form.get('inputs', []))
        has_card = any('card' in (inp.get('name', '') + inp.get('placeholder', '')).lower() for inp in form.get('inputs', []))

        if form_action:
            try:
                action_domain = urlparse(form_action).netloc
                if action_domain and action_domain != domain:
                    reasons.append(f"表单提交至外部域名: {action_domain}")
            except:
                pass
        if has_password and parsed.scheme != 'https':
            reasons.append("包含密码输入框但页面未使用HTTPS")
        if has_card:
            reasons.append("表单要求输入信用卡号，高度可疑")

    # 7. 文本关键词
    lower_text = page_text.lower()
    found_keywords = []
    for kw in SUSPICIOUS_KEYWORDS:
        if kw.lower() in lower_text:
            found_keywords.append(kw)
    if found_keywords:
        reasons.append(f"页面文本包含可疑词汇: {', '.join(found_keywords)}")

    # 去重
    reasons = list(dict.fromkeys(reasons))

    # 判定
    is_phishing = len(reasons) >= 2
    if is_phishing:
        confidence = min(0.6 + len(reasons) * 0.1, 1.0)
    else:
        confidence = 0.5 + len(reasons) * 0.1
        if reasons:
            confidence = min(confidence, 0.7)

    return is_phishing, confidence, reasons, matched_brand

async def ai_text_analysis(url: str, page_text: str):
    if not OPENAI_API_KEY:
        return False, 0.5, ["AI Key未配置，使用规则引擎结果"]
    
    system_prompt = """你是一个专业的网络安全分析师，请根据URL和页面文本判断是否为钓鱼网站。
请以JSON返回：{"is_phishing": bool, "confidence": float, "reasons": ["理由1", "理由2"]}"""
    user_message = f"URL: {url}\n页面文本: {page_text[:800]}"
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 300
                }
            )
        if resp.status_code != 200:
            print(f"AI API错误状态码: {resp.status_code}, 响应: {resp.text}")
            return False, 0.5, [f"AI API错误: {resp.status_code}"]
        
        data = resp.json()
        content = data['choices'][0]['message']['content']
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start == -1 or json_end <= 0:
            print(f"AI返回的不是JSON: {content}")
            return False, 0.5, ["AI分析结果格式错误"]
        result = json.loads(content[json_start:json_end])
        return result.get('is_phishing', False), result.get('confidence', 0.5), result.get('reasons', [])
    except Exception as e:
        print(f"AI分析失败: {type(e).__name__}: {e}")
        return False, 0.5, ["AI分析暂时不可用"]

async def ai_search_official_site(url: str, page_text: str):
    """让 AI 推断被仿冒的官方网站地址"""
    if not OPENAI_API_KEY:
        return None

    prompt = f"""你是一个网络安全专家。当前网页疑似钓鱼网站，请根据以下信息推断它仿冒的是哪个官方网站，并返回该官方网站的完整 URL（以 https:// 开头）。

当前页面 URL: {url}
页面文本片段: {page_text[:500]}

请严格以 JSON 格式返回，不要包含任何额外内容：
{{"brand_name": "品牌名称", "official_url": "https://官方网站完整地址"}}

如果无法确定，返回：
{{"brand_name": null, "official_url": null}}"""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 200
                }
            )
        if resp.status_code != 200:
            print(f"AI官网搜索错误: {resp.status_code} {resp.text}")
            return None

        data = resp.json()
        content = data['choices'][0]['message']['content']
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start == -1 or json_end <= 0:
            print(f"AI官网搜索返回非JSON: {content}")
            return None

        result = json.loads(content[json_start:json_end])
        return result.get('official_url')
    except Exception as e:
        print(f"AI官网搜索失败: {type(e).__name__}: {e}")
        return None

@app.post("/check")
async def check_url(req: CheckRequest):
    print("收到请求 URL:", req.url)
    rule_is_phish, rule_conf, rule_reasons, rule_brand = rule_engine(req.url, req.html)

    final_is_phish = rule_is_phish
    final_conf = rule_conf
    final_reasons = rule_reasons.copy()
    final_brand = rule_brand
    ai_official_url = None

    if USE_AI_TEXT:
        page_text, _, _ = parse_html(req.html)
        ai_is_phish, ai_conf, ai_reasons = await ai_text_analysis(req.url, page_text)
        print("AI 返回:", ai_is_phish, ai_conf, ai_reasons)

        # ★ 修改点：AI 可用时，以 AI 判定为最终结论
        final_is_phish = ai_is_phish
        final_conf = ai_conf
        # 合并规则引擎的理由（去重）
        for r in rule_reasons:
            if r not in final_reasons:
                final_reasons.append(r)
        for r in ai_reasons:
            if r not in final_reasons:
                final_reasons.append(r)

        # 如果 AI 判定为钓鱼但没找到品牌，尝试用 AI 搜索官网
        if final_is_phish and not final_brand:
            ai_url = await ai_search_official_site(req.url, page_text)
            if ai_url:
                ai_official_url = ai_url
                print(f"AI 推断官方网站: {ai_url}")
    else:
        # 未启用 AI，仅使用规则引擎结果
        pass

    return {
        "is_phishing": final_is_phish,
        "confidence": final_conf,
        "reasons": final_reasons,
        "brand_name": final_brand,
        "ai_official_url": ai_official_url
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
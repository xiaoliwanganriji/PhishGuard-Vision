// PhishGuard-Vision 弹出层主流程
// 设计原则：
//   - 永远先展示本地引擎结果（不消耗网络/不暴露数据）
//   - 只有用户点"申请 AI 审查"才会请求后端（通过 background 中转，统一 token 管理）
//   - 渲染时只用 DOM API（textContent），避免 XSS
// 加载顺序：brands -> urlUtils -> levenshtein -> tlds -> ruleEngine -> popup

// ---------- DOM 工具（安全渲染） ----------
function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text != null) node.textContent = String(opts.text);
    if (opts.style) Object.assign(node.style, opts.style);
    if (opts.attrs) {
        for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
    }
    return node;
}

function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}

function renderSkeletons() {
    const result = document.getElementById("result");
    clear(result);
    result.appendChild(el("div", {
        className: "status checking",
        text: "正在加载本地检测结果…"
    }));
    result.appendChild(el("div", { className: "skeleton", style: { width: "85%" } }));
    result.appendChild(el("div", { className: "skeleton", style: { width: "60%" } }));
}

function renderUnsupported(reason) {
    const result = document.getElementById("result");
    clear(result);
    result.appendChild(el("div", { className: "status", text: reason }));
}

function renderLocalResult(local) {
    const result = document.getElementById("result");
    clear(result);

    const sig = local.significance || "SAFE";
    const aiWorthy = !!local.aiWorthy;
    const accuracyPct = Math.round((local.accuracy || 0) * 100);

    // 本地引擎永不判定钓鱼，只展示安全 / 可疑两种状态
    const headline = sig === "SUSPECT"
        ? "🔍 检测到可疑特征"
        : "✅ 网站看起来安全";
    const status = el("div", {
        className: "status " + (sig === "SUSPECT" ? "phishing" : "safe"),
        text: headline + " (准确率 " + accuracyPct + "%)"
    });
    const tag = el("span", {
        className: "tag " + (sig === "SUSPECT" ? "tag-pending" : "tag-offline"),
        text: sig === "SUSPECT" ? "AI 分析中" : "本地引擎"
    });
    status.appendChild(document.createTextNode(" "));
    status.appendChild(tag);
    result.appendChild(status);

    if (local.reasons && local.reasons.length) {
        const wrap = el("div", { className: "reason" });
        wrap.appendChild(el("strong", { text: "检测到的可疑特征：" }));
        const ul = el("ul");
        local.reasons.forEach(r => ul.appendChild(el("li", { text: r })));
        wrap.appendChild(ul);
        result.appendChild(wrap);
    } else {
        result.appendChild(el("div", {
            className: "reason",
            text: "未发现明显风险特征。"
        }));
    }

    // 可疑区域提示：准确率低于 50%，自动触发 AI
    if (sig === "SUSPECT" && aiWorthy) {
        result.appendChild(el("div", {
            className: "reason",
            style: { color: "#735c0f", fontStyle: "italic" },
            text: "准确率低于 50%，已自动启动 AI 深度分析，请稍候…"
        }));
    }

    const actions = el("div", { className: "actions" });
    const retry = el("button", {
        className: "secondary",
        text: "重新检测当前页"
    });
    retry.addEventListener("click", () => runFullDetection());
    actions.appendChild(retry);
    result.appendChild(actions);
}

function renderAiResult(ai, local) {
    const result = document.getElementById("result");
    clear(result);

    const isPhish = !!ai.is_phishing;
    const status = el("div", {
        className: "status " + (isPhish ? "phishing" : "safe"),
        text: (isPhish ? "⚠️ 钓鱼网站" : "✅ 安全网站") +
              " (准确率 " + Math.round((ai.accuracy || 0) * 100) + "%)"
    });
    const tag = el("span", { className: "tag tag-ai", text: "AI 增强" });
    status.appendChild(document.createTextNode(" "));
    status.appendChild(tag);
    result.appendChild(status);

    const reasons = [...new Set([...(ai.reasons || []), ...(local?.reasons || [])])];
    if (reasons.length) {
        const wrap = el("div", { className: "reason" });
        wrap.appendChild(el("strong", { text: "综合判断理由：" }));
        const ul = el("ul");
        reasons.forEach(r => ul.appendChild(el("li", { text: r })));
        wrap.appendChild(ul);
        result.appendChild(wrap);
    }

    // 官方跳转：AI 推断的 URL 必须过白名单
    let officialUrl = null;
    let officialName = "";
    if (ai.ai_official_url) {
        const safe = sanitizeOfficialUrl(ai.ai_official_url);
        if (safe.url) { officialUrl = safe.url; officialName = safe.name; }
    }
    if (!officialUrl && (ai.brand_name || local?.matchedBrand)) {
        const fb = fallbackOfficialUrl(ai.brand_name || local.matchedBrand);
        officialUrl = fb.url;
        officialName = fb.name;
    }

    const actions = el("div", { className: "actions" });
    if (isPhish && officialUrl) {
        const btn = el("button", {
            className: "official-btn",
            text: "🔒 前往 " + (officialName || "官方网站")
        });
        btn.addEventListener("click", () => chrome.tabs.create({ url: officialUrl }));
        actions.appendChild(btn);
    }
    const back = el("button", { className: "secondary", text: "返回本地结果" });
    back.addEventListener("click", () => local && renderLocalResult(local));
    actions.appendChild(back);
    result.appendChild(actions);
}

function renderAiError(err) {
    const result = document.getElementById("result");
    clear(result);
    result.appendChild(el("div", {
        className: "status error",
        text: "AI 审查失败：" + err
    }));
    const back = el("button", { className: "secondary", text: "返回" });
    back.addEventListener("click", () => runFullDetection());
    const actions = el("div", { className: "actions" });
    actions.appendChild(back);
    result.appendChild(actions);
}

// ---------- 官网白名单（防 AI 幻觉） ----------
function sanitizeOfficialUrl(aiUrl) {
    if (!aiUrl) return { url: null, name: "" };
    let host = "";
    try {
        host = new URL(aiUrl).hostname.toLowerCase().replace(/^www\./, "");
    } catch { return { url: null, name: "" }; }
    const sites = self.OFFICIAL_SITES || {};
    for (const [name, site] of Object.entries(sites)) {
        try {
            const h = new URL(site).hostname.toLowerCase().replace(/^www\./, "");
            if (host === h || host.endsWith("." + h)) {
                return { url: site, name };
            }
        } catch { /* ignore */ }
    }
    return { url: null, name: "" };
}

function fallbackOfficialUrl(brandName) {
    if (!brandName) return { url: null, name: "" };
    const site = (self.OFFICIAL_SITES || {})[brandName];
    return site ? { url: site, name: brandName } : { url: null, name: "" };
}

// ---------- 与 background / content script 通信 ----------
async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function getLocalResult(tabId) {
    try {
        const resp = await chrome.runtime.sendMessage({
            type: "PHISHGUARD_GET_RESULT", tabId
        });
        return resp?.result || null;
    } catch {
        return null;
    }
}

async function requestContentCheck(tabId) {
    try {
        return await chrome.tabs.sendMessage(tabId, { type: "PHISHGUARD_CHECK" });
    } catch {
        return null;
    }
}

async function runFullDetection() {
    renderSkeletons();
    const tab = await getActiveTab();
    if (!tab || !/^https?:\/\//i.test(tab.url || "")) {
        renderUnsupported("当前页面不支持检测（" + ((tab?.url || "").split(":")[0] || "未知") + "）");
        return;
    }

    // 1) 优先用 content script 已有结果
    let data = await getLocalResult(tab.id);
    let source = "cache";

    // 2) content script 还没跑完，或缓存里没有新字段（accuracy）→ 主动让它跑一次
    if (!data || data.accuracy === undefined) {
        data = await requestContentCheck(tab.id);
        source = "live";
    }

    // 3) 仍没有 → 兜底：自己抓取 + 引擎分析
    if (!data) {
        // 确保规则引擎已加载（兜底检查）
        const engine = (typeof self !== "undefined" && self.PhishGuardEngine) ||
                       (typeof window !== "undefined" && window.PhishGuardEngine);
        if (!engine) {
            renderUnsupported("规则引擎加载失败。请检查：\n1. 扩展是否完整安装（所有文件齐全）\n2. 点击扩展详情页的「错误」按钮查看具体报错");
            return;
        }
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const pageText = (document.body?.innerText ||
                        document.documentElement?.innerText || "").substring(0, 2000);
                    const links = Array.from(document.querySelectorAll("a[href]"))
                        .map(a => a.href.trim())
                        .filter(href => href && !href.startsWith("javascript:"));
                    const forms = Array.from(document.querySelectorAll("form")).map(form => ({
                        action: form.action || "",
                        method: form.method || "",
                        inputs: Array.from(form.querySelectorAll("input")).map(inp => ({
                            type: inp.type || "",
                            name: inp.name || "",
                            placeholder: inp.placeholder || ""
                        }))
                    }));
                    const htmlSnippet = (document.documentElement?.outerHTML || "").substring(0, 3000);
                    return { pageText, links, forms, htmlSnippet };
                }
            });
            const r = results[0]?.result || { pageText: "", links: [], forms: [], htmlSnippet: "" };
            const local = engine.analyze({
                url: tab.url, pageText: r.pageText, links: r.links,
                forms: r.forms, html: r.htmlSnippet
            });
            data = {
                url: tab.url, title: tab.title,
                accuracy: local.accuracy,
                score: local.score, significance: local.significance,
                aiWorthy: local.aiWorthy,
                reasons: local.reasons, matchedBrand: local.matchedBrand
            };
            source = "fallback";
        } catch (e) {
            renderUnsupported("无法读取页面内容：" + (e.message || e));
            return;
        }
    }

    // 适配到渲染需要的字段
    const localForUi = {
        accuracy: data.accuracy,
        score: data.score,
        significance: data.significance,
        aiWorthy: data.aiWorthy,
        reasons: data.reasons,
        matchedBrand: data.matchedBrand
    };
    renderLocalResult(localForUi);
    // 保存最近一次本地结果供 AI 审查使用
    runFullDetection._lastLocal = { ...data, _ui: localForUi };

    // 准确率低于 50%（AI_REVIEW_LINE）时自动触发 AI 分析
    if (localForUi.aiWorthy) {
        requestAiReview();
    }

    return localForUi;
}

async function requestAiReview() {
    const last = runFullDetection._lastLocal;
    if (!last) {
        renderAiError("尚未完成本地检测");
        return;
    }

    const result = document.getElementById("result");
    clear(result);
    result.appendChild(el("div", {
        className: "status checking",
        text: "正在向 AI 后端申请审查…"
    }));
    result.appendChild(el("div", { className: "skeleton", style: { width: "70%" } }));
    result.appendChild(el("div", { className: "skeleton", style: { width: "50%" } }));

    // 通过 background.js 中转 AI 请求（统一管理 token，避免泄露）
    try {
        const tab = await getActiveTab();
        const resp = await chrome.runtime.sendMessage({
            type: "PHISHGUARD_AI_OPTIN",
            tabId: tab.id
        });
        if (!resp || resp.error) {
            renderAiError(resp?.error || "AI 后端不可用");
            return;
        }
        const ai = resp.ai;
        if (!ai || typeof ai.is_phishing !== "boolean") {
            renderAiError("后端返回格式错误");
            return;
        }

        // 通知 background 更新 badge（AI 判定结果）
        chrome.runtime.sendMessage({
            type: "PHISHGUARD_AI_RESULT",
            payload: ai
        });

        renderAiResult(ai, last._ui || null);
    } catch (e) {
        renderAiError(e.message === "Extension context invalidated."
            ? "扩展已更新，请刷新页面"
            : "AI 后端不可用，请确认已启动后端服务");
    }
}

// ---------- 入口 ----------
document.addEventListener("DOMContentLoaded", async () => {
    await runFullDetection();
});

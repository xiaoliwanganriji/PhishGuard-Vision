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

<<<<<<< HEAD
    // 可疑区域提示：准确率低于 50%，自动触发 AI
=======
    // 可疑区域提示：准确率低于 70%，自动触发 AI
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
    if (sig === "SUSPECT" && aiWorthy) {
        result.appendChild(el("div", {
            className: "reason",
            style: { color: "#735c0f", fontStyle: "italic" },
<<<<<<< HEAD
            text: "准确率低于 50%，已自动启动 AI 深度分析，请稍候…"
=======
            text: "准确率低于 70%，已自动启动 AI 深度分析，请稍候…"
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
        }));
    }

    const actions = el("div", { className: "actions" });
<<<<<<< HEAD
=======
    // 手动 AI 检测按钮：用户可随时主动触发 AI 审查
    const aiBtn = el("button", {
        className: "ai-btn",
        text: "🤖 手动 AI 深度检测"
    });
    aiBtn.addEventListener("click", () => requestAiReview());
    actions.appendChild(aiBtn);
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
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
<<<<<<< HEAD
    const status = el("div", {
        className: "status " + (isPhish ? "phishing" : "safe"),
        text: (isPhish ? "⚠️ 钓鱼网站" : "✅ 安全网站") +
              " (准确率 " + Math.round((ai.accuracy || 0) * 100) + "%)"
    });
    const tag = el("span", { className: "tag tag-ai", text: "AI 增强" });
    status.appendChild(document.createTextNode(" "));
    status.appendChild(tag);
    result.appendChild(status);
=======
    const accuracyPct = Math.round((ai.accuracy || 0) * 100);

    if (isPhish) {
        // === 钓鱼警告弹窗：醒目红色警告 ===
        const alert = el("div", { className: "phish-alert" });
        alert.appendChild(el("div", {
            className: "alert-title",
            text: "⚠️ 警告：钓鱼网站！"
        }));
        alert.appendChild(el("div", {
            text: "AI 判定当前页面为钓鱼网站（置信度 " + accuracyPct + "%）",
            style: { color: "#cb2431", fontSize: "13px" }
        }));
        result.appendChild(alert);
    } else {
        const status = el("div", {
            className: "status safe",
            text: "✅ AI 判定安全 (置信度 " + accuracyPct + "%)"
        });
        const tag = el("span", { className: "tag tag-ai", text: "AI 增强" });
        status.appendChild(document.createTextNode(" "));
        status.appendChild(tag);
        result.appendChild(status);
    }
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)

    const reasons = [...new Set([...(ai.reasons || []), ...(local?.reasons || [])])];
    if (reasons.length) {
        const wrap = el("div", { className: "reason" });
<<<<<<< HEAD
        wrap.appendChild(el("strong", { text: "综合判断理由：" }));
=======
        wrap.appendChild(el("strong", { text: isPhish ? "判断理由：" : "综合判断理由：" }));
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
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
<<<<<<< HEAD
=======
        // 钓鱼网站：显示醒目的官网跳转按钮
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
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
<<<<<<< HEAD
    result.appendChild(el("div", {
        className: "status error",
        text: "AI 审查失败：" + err
    }));
=======

    // 401 错误：引导用户配置 token
    if (err && err.includes("401")) {
        result.appendChild(el("div", {
            className: "status error",
            text: "AI 审查失败：后端拒绝访问（401）"
        }));
        const hint = el("div", { className: "reason" });
        hint.appendChild(el("strong", { text: "原因：" }));
        hint.appendChild(document.createTextNode("你的后端设置了访问 Token，但插件中未配置或 Token 不匹配。"));
        result.appendChild(hint);

        const fix = el("div", { className: "reason" });
        fix.appendChild(el("strong", { text: "解决方法：" }));
        const ol = document.createElement("ol");
        ol.style.paddingLeft = "18px";
        ol.style.margin = "4px 0";
        ol.appendChild(el("li", { text: "点击右上角 ⚙ 设置图标" }));
        ol.appendChild(el("li", { text: "将后端 .env 中的 PHISHGUARD_TOKEN 粘贴到输入框" }));
        ol.appendChild(el("li", { text: "点击「保存」，然后重新检测" }));
        fix.appendChild(ol);
        result.appendChild(fix);
    } else {
        result.appendChild(el("div", {
            className: "status error",
            text: "AI 审查失败：" + err
        }));
    }

>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
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
<<<<<<< HEAD
                reasons: local.reasons, matchedBrand: local.matchedBrand
=======
                reasons: local.reasons, matchedBrand: local.matchedBrand,
                pageText: r.pageText || ""
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
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

<<<<<<< HEAD
    // 准确率低于 50%（AI_REVIEW_LINE）时自动触发 AI 分析
=======
    // 同步到 background 缓存，确保 AI 请求时能拿到完整数据（含 pageText）
    try {
        await chrome.runtime.sendMessage({
            type: "PHISHGUARD_RESULT",
            payload: {
                url: data.url,
                title: data.title || "",
                accuracy: data.accuracy,
                score: data.score,
                significance: data.significance,
                aiWorthy: data.aiWorthy,
                reasons: data.reasons,
                matchedBrand: data.matchedBrand,
                pageText: data.pageText || "",
                ts: Date.now()
            }
        });
    } catch (e) { /* 忽略，contentScript 会自动上报 */ }

    // 准确率低于 70%（AI_REVIEW_LINE）时自动触发 AI 分析
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
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

<<<<<<< HEAD
// ---------- 入口 ----------
document.addEventListener("DOMContentLoaded", async () => {
=======
// ---------- 设置面板（Token 配置） ----------
const STORAGE_KEY_OPTIONS = "phishguard_options";

async function loadToken() {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY_OPTIONS);
        const opts = data[STORAGE_KEY_OPTIONS] || {};
        return opts.aiToken || "";
    } catch { return ""; }
}

async function saveToken(token) {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY_OPTIONS);
        const opts = data[STORAGE_KEY_OPTIONS] || {};
        opts.aiToken = token;
        await chrome.storage.local.set({ [STORAGE_KEY_OPTIONS]: opts });
        return true;
    } catch { return false; }
}

function initSettingsPanel() {
    const icon = document.getElementById("settingsIcon");
    const panel = document.getElementById("settingsPanel");
    const input = document.getElementById("tokenInput");
    const saveBtn = document.getElementById("saveTokenBtn");
    const clearBtn = document.getElementById("clearTokenBtn");
    const status = document.getElementById("tokenStatus");

    // 切换显示
    icon.addEventListener("click", async () => {
        if (panel.style.display === "none") {
            panel.style.display = "block";
            const token = await loadToken();
            input.value = token;
            status.textContent = token ? "" : "";
        } else {
            panel.style.display = "none";
        }
    });

    // 保存 token
    saveBtn.addEventListener("click", async () => {
        const val = input.value.trim();
        const ok = await saveToken(val);
        if (ok) {
            status.textContent = val ? "✓ Token 已保存" : "✓ 已清除 Token";
            status.className = "token-saved";
        } else {
            status.textContent = "保存失败";
            status.className = "token-error";
        }
        setTimeout(() => { status.textContent = ""; }, 3000);
    });

    // 清除 token
    clearBtn.addEventListener("click", async () => {
        input.value = "";
        await saveToken("");
        status.textContent = "✓ 已清除 Token";
        status.className = "token-saved";
        setTimeout(() => { status.textContent = ""; }, 3000);
    });
}

// ---------- 入口 ----------
document.addEventListener("DOMContentLoaded", async () => {
    initSettingsPanel();
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
    await runFullDetection();
});

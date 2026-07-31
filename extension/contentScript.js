// PhishGuard-Vision content script
// 默认只在本地用规则引擎做检测，绝不上传任何数据
// 检测到可疑站点时通过 message 通知 background 更新 badge

(function () {
    "use strict";

    // 只在 http/https 页面跑
    if (!/^https?:$/i.test(location.protocol)) return;

    // 防止重复注入
    if (window.__phishguardContentInjected) return;
    window.__phishguardContentInjected = true;

    // 采集页面数据用于本地规则引擎分析
    function pickData() {
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
        // 截取 HTML 头部用于检测 meta refresh / JS 跳转（纯本地，不外发）
        const htmlSnippet = (document.documentElement?.outerHTML || "").substring(0, 3000);
        return { pageText, links, forms, html: htmlSnippet };
    }

    function runDetection() {
        if (!self.PhishGuardEngine) return null;
        const data = pickData();
        const result = self.PhishGuardEngine.analyze({
            url: location.href,
            pageText: data.pageText,
            links: data.links,
            forms: data.forms,
            html: data.html
        });
        return {
            url: location.href,
            title: document.title,
            isPhishing: result.isPhishing,       // 本地始终 false（由 AI 判定）
            accuracy: result.accuracy,
            score: result.score,
            significance: result.significance,   // SAFE | SUSPECT
            aiWorthy: result.aiWorthy,           // 准确率 < 50% 时为 true
            reasons: result.reasons,
            matchedBrand: result.matchedBrand,
            ts: Date.now()
        };
    }

    function report(reason) {
        const result = runDetection();
        if (!result) return;
        try {
            chrome.runtime.sendMessage({
                type: "PHISHGUARD_RESULT",
                payload: result,
                trigger: reason  // "load" | "nav" | "request"
            });
        } catch (e) {
            // 扩展被禁用/重新加载时静默
        }
    }

    // 首次检测：DOMContentLoaded 之后
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(() => report("load"), 50);
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(() => report("load"), 50);
        }, { once: true });
    }

    // SPA 路由检测：劫持 history API（覆盖 pushState/replaceState 场景）
    let lastUrl = location.href;
    function onNav() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(() => report("nav"), 200);
        }
    }

    const _pushState = history.pushState;
    const _replaceState = history.replaceState;
    history.pushState = function () {
        _pushState.apply(this, arguments);
        onNav();
    };
    history.replaceState = function () {
        _replaceState.apply(this, arguments);
        onNav();
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);

    // MutationObserver 作为兜底（hash 路由或 DOM 驱动导航）
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(() => report("nav"), 200);
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // 监听来自 popup 的"立即检测"请求
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg && msg.type === "PHISHGUARD_CHECK") {
            const r = runDetection();
            sendResponse(r || null);
            return true;
        }
    });
})();

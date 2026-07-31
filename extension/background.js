// PhishGuard-Vision Service Worker
// 职责：
//   1) 接收 content script 的本地检测结果，更新工具栏 badge 与缓存
//   2) 接收 popup 的"申请 AI 审查"消息，按需调用后端
//   3) 不在后台做任何定时检测 / 不主动访问网络

const STORAGE_KEY_RESULTS = "phishguard_results";   // { tabId: result }
const STORAGE_KEY_OPTIONS = "phishguard_options";   // { enabled, aiToken }

// 工具：根据检测结果设置 badge
async function setBadgeForTab(tabId, result) {
    if (!tabId || !result) return;
    try {
        const sig = result.significance;
        const isAiPhish = result.aiIsPhishing;  // AI 判定结果（如有）

        if (isAiPhish === true) {
            // AI 判定为钓鱼：红色 + "!"
            await chrome.action.setBadgeBackgroundColor({ tabId, color: "#dc3545" });
            await chrome.action.setBadgeText({ tabId, text: "!" });
            await chrome.action.setTitle({
                tabId,
                title: "PhishGuard：AI 判定为钓鱼网站"
            });
        } else if (sig === "SUSPECT") {
            // 本地检测到可疑特征，AI 分析中：橙色
            await chrome.action.setBadgeBackgroundColor({ tabId, color: "#fd7e14" });
            await chrome.action.setBadgeText({ tabId, text: "?" });
            await chrome.action.setTitle({
                tabId,
                title: "PhishGuard：检测到可疑特征（AI 分析中）"
            });
        } else if (result.score > 0) {
            // 有少量异常特征但未触发 AI：灰色
            await chrome.action.setBadgeBackgroundColor({ tabId, color: "#6c757d" });
            await chrome.action.setBadgeText({ tabId, text: "·" });
            await chrome.action.setTitle({
                tabId,
                title: "PhishGuard：有少量异常特征"
            });
        } else {
            // 安全：绿色
            await chrome.action.setBadgeBackgroundColor({ tabId, color: "#28a745" });
            await chrome.action.setBadgeText({ tabId, text: "✓" });
            await chrome.action.setTitle({
                tabId,
                title: "PhishGuard：当前页面安全"
            });
        }
    } catch (e) {
        // tab 可能已关闭
    }
}

async function clearBadge(tabId) {
    try {
        await chrome.action.setBadgeText({ tabId, text: "" });
        await chrome.action.setTitle({ tabId, title: "PhishGuard-Vision" });
    } catch { /* 忽略 */ }
}

async function saveResult(tabId, result) {
    if (!tabId || !result) return;
    const data = await chrome.storage.local.get(STORAGE_KEY_RESULTS);
    const map = data[STORAGE_KEY_RESULTS] || {};
    map[tabId] = result;
    // 只保留最近 50 条
    const keys = Object.keys(map);
    if (keys.length > 50) {
        keys.slice(0, keys.length - 50).forEach(k => delete map[k]);
    }
    await chrome.storage.local.set({ [STORAGE_KEY_RESULTS]: map });
}

async function getResult(tabId) {
    const data = await chrome.storage.local.get(STORAGE_KEY_RESULTS);
    return (data[STORAGE_KEY_RESULTS] || {})[tabId] || null;
}

// 调用后端做 AI 审查（用户主动触发）
async function callAiBackend({ url, title, pageText, token }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const resp = await fetch("http://127.0.0.1:8000/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-PhishGuard-Token": token || ""
            },
            body: JSON.stringify({ url, title, page_text: pageText }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!resp.ok) {
            return { error: "AI 后端返回 " + resp.status };
        }
        return await resp.json();
    } catch (e) {
        clearTimeout(timeout);
        return { error: e.name === "AbortError" ? "AI 后端超时" : "AI 后端不可用" };
    }
}

// 监听 content script 推送
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
        if (msg?.type === "PHISHGUARD_RESULT" && sender.tab?.id != null) {
            await saveResult(sender.tab.id, msg.payload);
            await setBadgeForTab(sender.tab.id, msg.payload);
            sendResponse({ ok: true });
            return;
        }
        if (msg?.type === "PHISHGUARD_GET_RESULT") {
            const tabId = msg.tabId;
            const r = await getResult(tabId);
            sendResponse({ result: r });
            return;
        }
        if (msg?.type === "PHISHGUARD_AI_OPTIN") {
            const tabId = msg.tabId;
            const r = await getResult(tabId);
            if (!r) {
                sendResponse({ error: "本地检测尚未完成，请稍候" });
                return;
            }
            const opts = (await chrome.storage.local.get(STORAGE_KEY_OPTIONS))[STORAGE_KEY_OPTIONS] || {};
            const ai = await callAiBackend({
                url: r.url, title: r.title || "", pageText: r.reasons.join("\n"),
                token: opts.aiToken || ""
            });
            if (ai.error) {
                sendResponse({ error: ai.error });
            } else {
                sendResponse({ ai });
            }
            return;
        }
        if (msg?.type === "PHISHGUARD_AI_RESULT" && sender.tab?.id != null) {
            // AI 结果回传：更新缓存和 badge
            const local = await getResult(sender.tab.id);
            const merged = {
                ...(local || {}),
                aiIsPhishing: msg.payload?.is_phishing,
                aiAccuracy: msg.payload?.accuracy,
                aiReasons: msg.payload?.reasons,
                aiOfficialUrl: msg.payload?.ai_official_url,
                aiBrandName: msg.payload?.brand_name,
            };
            await saveResult(sender.tab.id, merged);
            await setBadgeForTab(sender.tab.id, merged);
            sendResponse({ ok: true });
            return;
        }
        sendResponse({ ok: false });
    })();
    return true;  // 异步 sendResponse
});

// 切到新 tab / 关闭 tab 时清理
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const r = await getResult(tabId);
    if (r) await setBadgeForTab(tabId, r);
    else await clearBadge(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, info) => {
    if (info.status === "loading") {
        await clearBadge(tabId);
        // 不主动删除缓存，等新结果覆盖
    }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    const data = await chrome.storage.local.get(STORAGE_KEY_RESULTS);
    const map = data[STORAGE_KEY_RESULTS] || {};
    delete map[tabId];
    await chrome.storage.local.set({ [STORAGE_KEY_RESULTS]: map });
});

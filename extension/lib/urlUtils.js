// URL 工具函数
(function () {
const LOCAL_DOMAINS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);
const SUPPORTED_SCHEMES = ["http:", "https:"];

function isLocalDomain(domain) {
    return LOCAL_DOMAINS.has((domain || "").toLowerCase());
}

function isIPAddress(domain) {
    if (!domain) return false;
    return /^\d+\.\d+\.\d+\.\d+$/.test(domain) || domain === "[::1]";
}

function extractDomain(url) {
    if (!url) return "";
    try {
        if (url.startsWith("http")) return new URL(url).hostname;
        const m = url.match(/^(?:https?:\/\/)?([^\/:?#]+)/);
        return m ? m[1] : "";
    } catch {
        return "";
    }
}

function isSupportedUrl(url) {
    if (!url) return false;
    return SUPPORTED_SCHEMES.some(s => url.startsWith(s));
}

function getTld(domain) {
    if (!domain || isLocalDomain(domain) || isIPAddress(domain)) return "";
    const parts = domain.toLowerCase().split(".");
    if (parts.length < 2) return "";
    // 处理 .co.uk / .com.cn 这类二级 TLD
    const last2 = parts.slice(-2).join(".");
    if (last2.length <= 7 && parts.length >= 3) {
        const sld = parts[parts.length - 2];
        if (["co", "com", "net", "org", "gov", "edu", "ac"].includes(sld)) {
            return last2;
        }
    }
    return parts[parts.length - 1];
}

// 域名是否匹配某品牌官方域（含子域匹配）
function isOfficialDomain(domain, brandDomain) {
    const d = (domain || "").toLowerCase();
    const b = brandDomain.toLowerCase();
    return d === b || d.endsWith("." + b);
}

// 通用导出
const api = {
    LOCAL_DOMAINS, isLocalDomain, isIPAddress, extractDomain,
    isSupportedUrl, getTld, isOfficialDomain
};
if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
}
if (typeof self !== "undefined") {
    Object.assign(self, api);
}
})();

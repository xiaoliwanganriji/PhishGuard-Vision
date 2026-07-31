// 常见 TLD 列表（IANA 公开列表的精简版）
// 注意：.xyz / .top / .icu / .vip / .lol / .shop 等价格低、滥用多，刻意未列入"常见"
(function () {
const COMMON_TLDS = new Set([
    "com", "net", "org", "edu", "gov", "mil", "int",
    "cn", "com.cn", "net.cn", "org.cn", "edu.cn", "gov.cn",
    "uk", "co.uk", "org.uk", "ac.uk",
    "de", "fr", "it", "es", "nl", "se", "no", "fi", "dk", "pl",
    "ru", "jp", "kr", "tw", "hk", "sg", "in", "au", "nz", "ca", "mx", "br",
    "io", "co", "me", "info", "biz", "tv", "app", "dev", "ai", "cloud",
    "site", "online", "tech", "cc", "ws", "fm", "bz", "to", "gl", "gd", "gs",
    "us", "ag", "lc", "vc", "tt", "ky", "vg", "vi", "pr",
    "aero", "coop", "museum", "name", "pro", "travel", "jobs", "mobi", "cat", "tel",
    "asia", "xxx", "gov.cn", "mil.cn", "net.cn", "org.cn", "com.cn",
    "com.hk", "edu.hk", "gov.hk", "idv.hk", "net.hk", "org.hk",
    "com.tw", "edu.tw", "gov.tw", "idv.tw", "net.tw", "org.tw"
]);

// 高风险 TLD：钓鱼网站高发域名后缀
// 这些域名注册门槛低，被大量滥用
const HIGH_RISK_TLDS = new Set([
    "xyz", "top", "club", "icu", "vip", "shop", "store", "buzz", "lol", "loan",
    "click", "download", "zip", "country", "stream", "gq", "ml", "cf", "ga", "pw",
    "tk", "work", "date", "faith", "review", "bid", "trade", "accountant", "online",
    "site", "world", "click", "finance", "cricket", "exchange", "promo",
    "science", "party", "investments", "camera", "sale", "agency", "market",
    "cards", "gmbh", "holdings", "company", "ltd", "group"
]);

function isCommonTld(tld) {
    if (!tld) return true;
    return COMMON_TLDS.has(tld.toLowerCase());
}

function isHighRiskTld(tld) {
    if (!tld) return false;
    return HIGH_RISK_TLDS.has(tld.toLowerCase());
}

// 通用导出
if (typeof module !== "undefined" && module.exports) {
    module.exports = { COMMON_TLDS, HIGH_RISK_TLDS, isCommonTld, isHighRiskTld };
}
if (typeof self !== "undefined") {
    self.COMMON_TLDS = COMMON_TLDS;
    self.HIGH_RISK_TLDS = HIGH_RISK_TLDS;
    self.isCommonTld = isCommonTld;
    self.isHighRiskTld = isHighRiskTld;
}
})();

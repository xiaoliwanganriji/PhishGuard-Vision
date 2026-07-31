// 品牌库：key 为官方主域（不含子域），value 为展示名
// 顺序敏感：更长的域名优先匹配，避免 paypal.com.cn 漏判
(function () {
const BRAND_DOMAINS = [
    ["paypal.com", "PayPal"],
    ["apple.com", "Apple"],
    ["amazon.com", "Amazon"],
    ["google.com", "Google"],
    ["facebook.com", "Facebook"],
    ["microsoft.com", "Microsoft"],
    ["alipay.com", "支付宝"],
    ["taobao.com", "淘宝"],
    ["jd.com", "京东"],
    ["qq.com", "腾讯"],
    ["baidu.com", "百度"]
];

const BRANDS = Object.fromEntries(BRAND_DOMAINS);

// 官网跳转表
const OFFICIAL_SITES = {
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
    "百度": "https://www.baidu.com"
};

// 可疑关键词：只保留钓鱼/欺诈场景的特异性词汇
// 泛化的"登录""安全""验证"等正常网站常用词已移除，避免误报
const SUSPICIOUS_KEYWORDS = [
    "verify your account", "confirm your password", "account suspended",
    "信用卡号", "银行卡号", "身份证号", "有效期", "CVV", "安全码",
    "恭喜中奖", "您的账户已被锁定", "解锁账户",
];

// 通用导出：同时支持 CommonJS 与浏览器 global
const api = { BRANDS, OFFICIAL_SITES, BRAND_DOMAINS, SUSPICIOUS_KEYWORDS };
if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
}
if (typeof self !== "undefined") {
    Object.assign(self, api);
}
})();

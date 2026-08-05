// 品牌库：key 为官方主域（不含子域），value 为展示名
<<<<<<< HEAD
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
=======
// 同一品牌可能有多个域名（如 Microsoft 有 microsoft.com 和 live.com）
(function () {
const BRAND_DOMAINS = [
    // 支付 / 电商
    ["paypal.com", "PayPal"],
    ["alipay.com", "支付宝"],
    ["taobao.com", "淘宝"],
    ["jd.com", "京东"],
    ["amazon.com", "Amazon"],
    ["ebay.com", "eBay"],
    ["stripe.com", "Stripe"],
    ["shopify.com", "Shopify"],
    ["allegro.pl", "Allegro"],
    ["allegro.com", "Allegro"],
    // 科技 / 邮箱
    ["google.com", "Google"],
    ["microsoft.com", "Microsoft"],
    ["apple.com", "Apple"],
    ["facebook.com", "Facebook"],
    ["instagram.com", "Instagram"],
    ["twitter.com", "Twitter"],
    ["linkedin.com", "LinkedIn"],
    ["yahoo.com", "Yahoo"],
    ["outlook.com", "Outlook"],
    ["office.com", "Office 365"],
    ["live.com", "Microsoft"],
    // 社交 / 通讯
    ["qq.com", "腾讯"],
    ["weibo.com", "微博"],
    ["telegram.org", "Telegram"],
    ["whatsapp.com", "WhatsApp"],
    ["discord.com", "Discord"],
    ["tiktok.com", "TikTok"],
    ["snapchat.com", "Snapchat"],
    // 银行 / 金融
    ["chase.com", "Chase"],
    ["bankofamerica.com", "Bank of America"],
    ["wellsfargo.com", "Wells Fargo"],
    ["citibank.com", "Citibank"],
    ["hsbc.com", "HSBC"],
    ["santander.com", "Santander"],
    ["barclays.com", "Barclays"],
    ["bradesco.com.br", "Bradesco"],
    ["nab.com.au", "NAB"],
    // 加密货币
    ["coinbase.com", "Coinbase"],
    ["binance.com", "Binance"],
    ["metamask.io", "MetaMask"],
    ["crypto.com", "Crypto.com"],
    ["kraken.com", "Kraken"],
    ["trezor.io", "Trezor"],
    ["ledger.com", "Ledger"],
    // 快递 / 物流
    ["dhl.com", "DHL"],
    ["fedex.com", "FedEx"],
    ["ups.com", "UPS"],
    ["usps.com", "USPS"],
    // 流媒体 / 娱乐
    ["netflix.com", "Netflix"],
    ["spotify.com", "Spotify"],
    ["disney.com", "Disney"],
    // 电信 / 服务
    ["comcast.net", "Comcast"],
    ["xfinity.com", "Xfinity"],
    ["verizon.com", "Verizon"],
    ["att.com", "AT&T"],
    ["optus.com.au", "Optus"],
    // 政务 / 税务
    ["irs.gov", "IRS"],
    // 其他
    ["baidu.com", "百度"],
    ["dropbox.com", "Dropbox"],
    ["adobe.com", "Adobe"],
    ["github.com", "GitHub"]
];

// 构建 品牌名 -> [官方域名列表] 的反向映射，用于正确判断品牌域名匹配
const BRAND_NAME_TO_DOMAINS = {};
for (const [domain, name] of BRAND_DOMAINS) {
    if (!BRAND_NAME_TO_DOMAINS[name]) BRAND_NAME_TO_DOMAINS[name] = [];
    BRAND_NAME_TO_DOMAINS[name].push(domain);
}

const BRANDS = Object.fromEntries(BRAND_DOMAINS);

// 官网跳转表（高频仿冒品牌）
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
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
<<<<<<< HEAD
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
=======
    "百度": "https://www.baidu.com",
    "Instagram": "https://www.instagram.com",
    "Coinbase": "https://www.coinbase.com",
    "MetaMask": "https://metamask.io",
    "DHL": "https://www.dhl.com",
    "Chase": "https://www.chase.com",
    "Comcast": "https://www.xfinity.com",
    "Xfinity": "https://www.xfinity.com",
    "Netflix": "https://www.netflix.com",
    "Office 365": "https://www.office.com"
};

// 可疑关键词：钓鱼/欺诈场景的特异性词汇（扩充版）
const SUSPICIOUS_KEYWORDS = [
    // 英文诱导词
    "verify your account", "confirm your password", "account suspended",
    "account locked", "update your payment", "confirm your identity",
    "suspended immediately", "unusual activity", "security alert",
    "click here to claim", "you have won", "congratulations winner",
    "limited time offer", "act now", "urgent action required",
    "verify your email", "confirm your account", "reset your password",
    "login expired", "security check", "validate your account",
    // 英文敏感信息词
    "credit card number", "card number", "cvv", "ssn", "social security",
    "bank routing", "account number", "pin code",
    // 中文诱导词
    "恭喜中奖", "您的账户已被锁定", "解锁账户", "立即验证", "账户异常",
    "限时领取", "点击领取", "密码过期", "安全验证", "身份认证",
    // 中文敏感信息词
    "信用卡号", "银行卡号", "身份证号", "有效期", "安全码", "CVV",
    "验证码", "支付密码", "网银密码"
];

// 免费托管平台域名后缀（钓鱼网站高频使用）
const FREE_HOSTING_DOMAINS = [
    "vercel.app", "netlify.app", "gitbook.io", "weebly.com",
    "webflow.io", "framer.app", "framer.website", "replit.app",
    "edgeone.dev", "ukit.me", "dothome.co.kr", "square.site",
    "github.io", "herokuapp.com", "surge.sh", "render.com",
    "pages.dev", "fly.dev", "railroad.app", "deno.dev",
    "beam.pm", "onrender.com", "pythonanywhere.com",
    "godaddysites.com", "weeblysite.com", "wixsite.com",
    "wixstudio.com", "carrd.co", "notion.site", "strikingly.com",
    "webnode.com", "weebly.net", "yolasite.com", "mobileweb.me",
    "sitey.me", "framer.ai", "bolt.host", "tave.com",
    "r2.dev", "namecheap.website", "awsstatic.com",
    "glitch.me", "firebaseapp.com", "web.app", "ellitic.ai"
];

// 短链接服务（钓鱼网站常用于隐藏真实 URL）
const SHORT_URL_SERVICES = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly",
    "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at",
    "qrco.de", "q-r.to", "l.ead.me", "lnkd.in", "shorte.st",
    "adb.ly", "bc.vc", "soo.gd", "tiny.cc", "rb.gy",
    "s.id", "short.link", "v.gd", "qr.ae", "x.co",
    "shorturl.net", "clck.ru", "vk.cc", "t.ly",
    "bl.ink", "snip.ly", "yourls.org", "duck.co",
    "link.edgepilot.com", "page.link", "firebase.app"
];

// URL 路径中的敏感词（钓鱼网站常见路径）
const SENSITIVE_URL_PATHS = [
    "/login", "/signin", "/sign-in", "/signup", "/register",
    "/verify", "/validation", "/authenticate", "/auth",
    "/account/update", "/account/verify", "/account/login",
    "/password/reset", "/password/change", "/recover",
    "/wallet", "/connect", "/unlock", "/confirm",
    "/secure", "/update", "/activate"
];

// 域名中的敏感词（钓鱼网站常用于子域名）
const SENSITIVE_DOMAIN_KEYWORDS = [
    "login", "signin", "log-in", "sign-in", "verify", "verification",
    "secure", "security", "account", "update", "confirm",
    "wallet", "connect", "unlock", "recover", "reset",
    "support", "service", "alert", "notification",
    "bank", "pay", "payment", "billing",
    "auth", "sso", "oauth", "token"
];

// 通用导出：同时支持 CommonJS 与浏览器 global
const api = { BRANDS, OFFICIAL_SITES, BRAND_DOMAINS, BRAND_NAME_TO_DOMAINS,
              SUSPICIOUS_KEYWORDS, FREE_HOSTING_DOMAINS, SHORT_URL_SERVICES,
              SENSITIVE_URL_PATHS, SENSITIVE_DOMAIN_KEYWORDS };
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
}
if (typeof self !== "undefined") {
    Object.assign(self, api);
}
})();

// PhishGuard-Vision 规则引擎单元测试
// 运行：node tests/test_ruleEngine.js
// 不依赖任何测试框架，原生 assert 即可
// 注意：本地引擎永不判定钓鱼（isPhishing 始终为 false），只负责检测特征和计算准确率
<<<<<<< HEAD
//       准确率 < 50% 时 aiWorthy=true，自动触发 AI 分析
=======
//       准确率 < 70%（AI_REVIEW_LINE）时 aiWorthy=true，自动触发 AI 分析
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)

const assert = require("assert");
const path = require("path");

const engine = require(path.resolve(__dirname, "..", "lib", "ruleEngine.js"));
const { levenshteinRatio } = require(path.resolve(__dirname, "..", "lib", "levenshtein.js"));
const { extractDomain, isLocalDomain, isIPAddress } = require(path.resolve(__dirname, "..", "lib", "urlUtils.js"));
const { isCommonTld } = require(path.resolve(__dirname, "..", "lib", "tlds.js"));

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); console.log("  ✓ " + name); passed++; }
    catch (e) { console.log("  ✗ " + name + "\n     " + e.message); failed++; }
}

console.log("\n=== Levenshtein ===");
test("相同字符串相似度=1", () => {
    assert.strictEqual(levenshteinRatio("paypal.com", "paypal.com"), 1);
});
test("完全不同相似度=0", () => {
    assert.strictEqual(levenshteinRatio("abc", "xyz"), 0);
});
test("长度差超过 MAX_DIFF 时返回 0", () => {
    assert.strictEqual(levenshteinRatio("a", "abcdefghij"), 0);
});
test("1 字符差异相似度>0.8", () => {
    const r = levenshteinRatio("paypal.com", "paypa1.com");
    assert.ok(r > 0.8 && r < 1, "expected ~0.9, got " + r);
});

console.log("\n=== URL Utils ===");
test("extractDomain 提取主机名", () => {
    assert.strictEqual(extractDomain("https://www.example.com/path"), "www.example.com");
});
test("isLocalDomain 识别 127.0.0.1", () => {
    assert.ok(isLocalDomain("127.0.0.1"));
    assert.ok(!isLocalDomain("evil.com"));
});
test("isIPAddress 识别 IP", () => {
    assert.ok(isIPAddress("192.168.1.1"));
    assert.ok(!isIPAddress("google.com"));
});

console.log("\n=== TLDs ===");
test("isCommonTld 常见 TLD", () => {
    assert.ok(isCommonTld("com"));
    assert.ok(isCommonTld("com.cn"));
    assert.ok(!isCommonTld("tk"));
    assert.ok(!isCommonTld("xyz"));
});

console.log("\n=== 基本判定（本地永不判定钓鱼） ===");
test("正常 Google → SAFE", () => {
    const r = engine.analyze({
        url: "https://www.google.com",
        pageText: "search the world",
        links: ["https://www.google.com/about"],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
    assert.strictEqual(r.significance, "SAFE");
    assert.strictEqual(r.aiWorthy, false);
    assert.strictEqual(r.score, 0);
});

test("正常百度不误报", () => {
    const r = engine.analyze({
        url: "https://www.baidu.com",
        pageText: "百度一下，你就知道",
        links: ["https://www.baidu.com/"],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
    assert.strictEqual(r.significance, "SAFE");
    assert.strictEqual(r.score, 0);
});

console.log("\n=== 强特征（单独触发 AI） ===");
test("paypa1.com 仿冒 → SUSPECT，触发 AI", () => {
    const r = engine.analyze({
        url: "https://paypa1.com/login",
        pageText: "PayPal verify your account",
        links: [],
        forms: [{
            action: "https://paypa1.com/login",
            method: "post",
            inputs: [{ type: "text", name: "email", placeholder: "邮箱" }]
        }],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);  // 本地永不判定钓鱼
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.aiWorthy, "BRAND_TYPOSQUAT(-55%) 应触发 AI");
    assert.ok(r.accuracy < 0.50, "准确率应 < 50%");
    assert.ok(r.reasons.some(s => s.includes("PayPal")));
});

test("IP 域名 + 信用卡表单 → SUSPECT，触发 AI", () => {
    const r = engine.analyze({
        url: "http://192.168.1.100/login",
        pageText: "verify your account",
        links: [],
        forms: [{
            action: "http://evil.com/steal",
            method: "post",
            inputs: [
                { type: "text", name: "email", placeholder: "邮箱" },
                { type: "password", name: "pwd", placeholder: "密码" },
                { type: "text", name: "card", placeholder: "信用卡号" }
            ]
        }],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.aiWorthy, "IP+信用卡+密码等多特征应触发 AI");
});

test("CARD_INPUT 单独 → SUSPECT，触发 AI", () => {
    const r = engine.analyze({
        url: "https://normal-site.com/form",
        pageText: "enter your card",
        links: [],
        forms: [{
            action: "https://normal-site.com/submit",
            method: "post",
            inputs: [
                { type: "text", name: "card", placeholder: "信用卡号" }
            ]
        }],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
    assert.ok(r.aiWorthy, "CARD_INPUT(-50%) 单独应触发 AI");
});

console.log("\n=== 中等特征（需组合触发 AI） ===");
<<<<<<< HEAD
test("单条 FORM_EXTERNAL → SAFE（准确率 74%）", () => {
=======
test("单条 FORM_EXTERNAL → SUSPECT（准确率 69%）", () => {
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
    const r = engine.analyze({
        url: "https://safe.com/form",
        pageText: "submit form",
        links: [],
        forms: [{
            action: "https://evil.com/steal",
            method: "post",
            inputs: [{ type: "text", name: "x", placeholder: "" }]
        }],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
<<<<<<< HEAD
    // FORM_EXTERNAL 扣 0.25 → accuracy = 0.74
    assert.strictEqual(r.significance, "SAFE");
    assert.strictEqual(r.aiWorthy, false, "单条中等特征不应触发 AI");
});

test("HIGH_RISK_TLD + NO_HTTPS → SAFE（准确率 67%）", () => {
=======
    // FORM_EXTERNAL 扣 0.30 → accuracy = 0.69 < 0.70 → SUSPECT
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.aiWorthy, "FORM_EXTERNAL(-30%) 单独即触发 AI（70% 阈值）");
});

test("HIGH_RISK_TLD + NO_HTTPS → SUSPECT（准确率 61%）", () => {
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
    const r = engine.analyze({
        url: "http://example.tk/page",
        pageText: "welcome",
        links: [],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
<<<<<<< HEAD
    // HIGH_RISK_TLD(-0.25) + NO_HTTPS(-0.08) = 0.33 → accuracy = 0.67
    assert.strictEqual(r.significance, "SAFE");
    assert.strictEqual(r.aiWorthy, false);
=======
    // HIGH_RISK_TLD(-0.30) + NO_HTTPS(-0.08) = 0.38 → accuracy = 0.61 < 0.70
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.aiWorthy, "HIGH_RISK_TLD + NO_HTTPS 组合应触发 AI");
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
});

test("AT_SYMBOL + HIGH_RISK_TLD → SUSPECT，触发 AI", () => {
    const r = engine.analyze({
        url: "http://safe.com@evil.tk/login",
        pageText: "login",
        links: [],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
<<<<<<< HEAD
    // AT_SYMBOL(-0.25) + HIGH_RISK_TLD(-0.25) + NO_HTTPS(-0.08) = 0.58 → accuracy = 0.41
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.aiWorthy, "AT_SYMBOL + HIGH_RISK_TLD + NO_HTTPS 组合应触发 AI");
=======
    // AT_SYMBOL(-0.25) + HIGH_RISK_TLD(-0.30) + NO_HTTPS(-0.08) + SENSITIVE_PATH(-0.25) → SUSPECT
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.aiWorthy, "多特征组合应触发 AI");
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
});

console.log("\n=== 误报抑制 ===");
test("仅 HTTP 的合法页 → SAFE", () => {
    const r = engine.analyze({
<<<<<<< HEAD
        url: "http://a.b.c.example.com/some/long/path",
=======
        url: "http://example.com/some/long/path",
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
        pageText: "Welcome to our blog",
        links: [],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
    assert.strictEqual(r.significance, "SAFE");
    assert.strictEqual(r.aiWorthy, false);
});

<<<<<<< HEAD
test("普通网站有登录表单不应被标记", () => {
=======
test("普通网站有登录表单 + /login 路径 → SUSPECT（宁可误报）", () => {
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
    const r = engine.analyze({
        url: "https://normal-site.com/login",
        pageText: "Welcome, please login",
        links: [],
        forms: [{
            action: "https://normal-site.com/login",
            method: "post",
            inputs: [
                { type: "text", name: "username", placeholder: "" },
                { type: "password", name: "pwd", placeholder: "" },
                { type: "hidden", name: "csrf_token", placeholder: "" }
            ]
        }],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
<<<<<<< HEAD
    assert.strictEqual(r.significance, "SAFE");
=======
    // LOGIN_FORM(-0.35) + SENSITIVE_PATH(-0.25) = 0.60 → accuracy = 0.39 < 0.70
    // 宁可误报：登录表单+敏感路径组合触发 AI 审查
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.aiWorthy, "登录表单+敏感路径应触发 AI（宁可误报不漏报）");
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
});

test("SPA 中的 JS location 跳转不误报", () => {
    const r = engine.analyze({
        url: "https://app.example.com/dashboard",
        pageText: "Dashboard",
        links: [],
        forms: [],
        html: '<script>window.location.href = "/login";</script>'
    });
    assert.strictEqual(r.isPhishing, false);
    assert.strictEqual(r.significance, "SAFE");
});

test("品牌词出现在不含表单的普通网页上不误报", () => {
    const r = engine.analyze({
        url: "https://techblog.com/article",
        pageText: "百度最近发布了新的 AI 模型",
        links: [],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
    assert.strictEqual(r.significance, "SAFE");
});

<<<<<<< HEAD
test("可疑关键词不计分（INFO 级别）", () => {
    const r = engine.analyze({
        url: "https://normal-bbs.com/login",
=======
test("可疑关键词单独触发 SUSPECT（已计入扣分）", () => {
    const r = engine.analyze({
        url: "https://normal-bbs.com/article",
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
        pageText: "恭喜中奖 您的账户已被锁定 请尽快解锁",
        links: [],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
<<<<<<< HEAD
    assert.strictEqual(r.score, 0, "INFO 级别不计分");
    assert.ok(r.reasons.some(s => s.includes("恭喜") || s.includes("提及")), "应展示信息项");
=======
    // SUSPICIOUS_WORDS(-0.35) → accuracy = 0.64 < 0.70 → SUSPECT
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.reasons.some(s => s.includes("恭喜") || s.includes("锁定")), "应展示可疑关键词");
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
});

console.log("\n=== 重定向检测 ===");
test("meta refresh 跳转到外部域：触发 META_REDIRECT", () => {
    const r = engine.analyze({
        url: "http://test.com/",
        pageText: "",
        links: [],
        forms: [],
        html: '<meta http-equiv="refresh" content="0;url=http://evil.com/">'
    });
    assert.ok(r.reasons.some(s => s.includes("跳转")), "应检测到外部跳转");
});

test("meta refresh 同域跳转不触发", () => {
    const r = engine.analyze({
        url: "http://test.com/old",
        pageText: "",
        links: [],
        forms: [],
        html: '<meta http-equiv="refresh" content="0;url=http://test.com/new">'
    });
    const hasRedirect = r.reasons.some(s => s.includes("跳转"));
    assert.strictEqual(hasRedirect, false, "同域跳转不应触发");
});

console.log("\n=== 边界情况 ===");
test("localhost 不误判", () => {
    const r = engine.analyze({
        url: "http://localhost:8080/fake_paypal.html",
        pageText: "fake paypal test",
        links: [],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.score, 0);
    assert.strictEqual(r.isPhishing, false);
});

<<<<<<< HEAD
test("URL @ 符号：触发 AT_SYMBOL", () => {
    const r = engine.analyze({
        url: "https://safe.com@evil.com/login",
        pageText: "login",
=======
test("URL @ 符号：触发 AT_SYMBOL，单独不触发 AI", () => {
    const r = engine.analyze({
        url: "https://safe.com@evil.com/page",
        pageText: "some content",
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
        links: [],
        forms: [],
        html: ""
    });
    assert.ok(r.reasons.some(s => s.includes("@")));
<<<<<<< HEAD
    // AT_SYMBOL(-25%) 单独扣 → accuracy 74%，不触发 AI
=======
    // AT_SYMBOL(-0.25) 单独扣 → accuracy 74% > 70% → SAFE
>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
    assert.strictEqual(r.aiWorthy, false, "AT_SYMBOL 单独扣 25%，不应触发 AI");
    assert.strictEqual(r.significance, "SAFE");
});

<<<<<<< HEAD
=======
test("短链接服务 → SUSPECT，触发 AI", () => {
    const r = engine.analyze({
        url: "https://bit.ly/abc123",
        pageText: "click here",
        links: [],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
    // SHORT_URL(-0.30) → accuracy = 0.69 < 0.70 → SUSPECT
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.aiWorthy, "短链接服务应触发 AI");
});

test("免费托管平台 → SUSPECT，触发 AI", () => {
    const r = engine.analyze({
        url: "https://my-site.vercel.app/login",
        pageText: "welcome",
        links: [],
        forms: [],
        html: ""
    });
    assert.strictEqual(r.isPhishing, false);
    // FREE_HOSTING(-0.35) + SENSITIVE_PATH(-0.25) → SUSPECT
    assert.strictEqual(r.significance, "SUSPECT");
    assert.ok(r.aiWorthy, "免费托管平台应触发 AI");
});

>>>>>>> 3e8931f (v1.2.0: 三层防御体系 + 短链接检测 + PhishTank 65.5% Recall)
console.log(`\n=== 结果: ${passed} 通过, ${failed} 失败 ===`);
process.exit(failed > 0 ? 1 : 0);

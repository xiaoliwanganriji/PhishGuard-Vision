// 规则引擎：无罪推定模型
// 设计原则：
//   - 默认准确率 99%（假设网站安全）
//   - 每发现一个钓鱼特征，按特异性扣减准确率
//   - 只有钓鱼网站才有的特征 → 大扣分
//   - 钓鱼常见但正常也可能有的特征 → 小扣分
//   - 准确率低于 50% → 自动触发 AI 分析，由 AI 做最终判定
//   - 准确率低于 45% → 本地直接判定为钓鱼（证据确凿）
//   - 45%~50% 之间 → 可疑区域，交由 AI 裁决
const { BRANDS, BRAND_DOMAINS, SUSPICIOUS_KEYWORDS } = (() => {
    if (typeof require !== "undefined") return require("./brands.js");
    return {
        BRANDS: self.BRANDS || {},
        BRAND_DOMAINS: self.BRAND_DOMAINS || [],
        SUSPICIOUS_KEYWORDS: self.SUSPICIOUS_WORDS || []
    };
})();

const { levenshteinRatio } = (() => {
    if (typeof require !== "undefined") return require("./levenshtein.js");
    return { levenshteinRatio: self.levenshteinRatio };
})();

const {
    isLocalDomain, isIPAddress, extractDomain, getTld, isOfficialDomain
} = (() => {
    if (typeof require !== "undefined") return require("./urlUtils.js");
    return {
        isLocalDomain: self.isLocalDomain,
        isIPAddress: self.isIPAddress,
        extractDomain: self.extractDomain,
        getTld: self.getTld,
        isOfficialDomain: self.isOfficialDomain
    };
})();

const { isCommonTld, isHighRiskTld } = (() => {
    if (typeof require !== "undefined") return require("./tlds.js");
    return { isCommonTld: self.isCommonTld, isHighRiskTld: self.isHighRiskTld };
})();

// =============================================================================
// 扣分权重表：从 99% 中扣除
// 权重越大 = 该特征越特异于钓鱼网站
// 本地引擎不判定钓鱼，只负责：
//   - 展示检测到的可疑特征
//   - 计算准确率
//   - 准确率 < 50% 时自动触发 AI 分析（由 AI 判定是否钓鱼）
// =============================================================================
const DEDUCTION_WEIGHTS = {
    // === 极强特征：几乎只有钓鱼网站才有（单独即可触发 AI） ===
    IP_DOMAIN:         { weight: 0.55, label: "域名是 IP 地址" },
    BRAND_TYPOSQUAT:   { weight: 0.55, label: "域名与品牌官方域名高度相似" },

    // === 强特征：钓鱼网站常见（单独即可触发 AI） ===
    BRAND_MISMATCH:    { weight: 0.50, label: "页面文本提及品牌但当前域名并非其官方域名" },
    PASSWORD_NO_HTTPS: { weight: 0.50, label: "包含密码输入框但页面未使用 HTTPS" },
    CARD_INPUT:        { weight: 0.50, label: "表单要求输入信用卡/银行卡号" },

    // === 中等特征：钓鱼常见，正常网站较少（需组合触发 AI） ===
    FORM_EXTERNAL:     { weight: 0.25, label: "表单提交至外部域名" },
    AT_SYMBOL:         { weight: 0.25, label: "URL 中包含 @ 符号" },
    HIGH_RISK_TLD:     { weight: 0.25, label: "顶级域名为高风险域名" },
    LINK_IP:           { weight: 0.18, label: "外链使用 IP 地址" },
    LINK_BRAND_IMPER:  { weight: 0.18, label: "外链域名模仿品牌" },
    META_REDIRECT:     { weight: 0.15, label: "页面存在可疑跳转" },

    // === 弱特征：轻微可疑，正常网站也可能有 ===
    UNCOMMON_TLD:      { weight: 0.08, label: "顶级域名不常见" },
    NO_HTTPS:          { weight: 0.08, label: "未使用 HTTPS" },
    LONG_DOMAIN:       { weight: 0.03, label: "域名长度异常" },
    LONG_LINK_DOMAIN:  { weight: 0.03, label: "外链域名长度异常" },
    AT_IN_LINK:        { weight: 0.03, label: "外链包含 @ 符号" },

    // === INFO：信息项，不计分，仅供参考 ===
    SUSPICIOUS_WORDS:  { weight: 0.00, label: "页面文本包含可疑词汇" }
};

// 阈值设定
const INITIAL_ACCURACY = 0.99;   // 默认从 99% 开始
const AI_REVIEW_LINE   = 0.50;   // AI 线：低于 50% 自动触发 AI 分析

// =============================================================================
// 特征检测
// =============================================================================
function detectReasons({ url, pageText, links, forms, html }) {
    const reasons = [];
    const domain = extractDomain(url);
    const isHttps = url.startsWith("https://");
    const isLocal = isLocalDomain(domain);
    const lowerText = (pageText || "").toLowerCase();

    // 1. URL 基本检查
    if (isIPAddress(domain) && !isLocal) {
        reasons.push({ id: "IP_DOMAIN", meta: { domain } });
    }
    if (!isHttps && !isLocal) {
        reasons.push({ id: "NO_HTTPS" });
    }
    if (domain.length > 30 && !isLocal) {
        reasons.push({ id: "LONG_DOMAIN", meta: { domain } });
    }
    if (url.includes("@")) {
        reasons.push({ id: "AT_SYMBOL" });
    }
    const tld = getTld(domain);
    if (tld && !isLocal) {
        if (isHighRiskTld(tld)) {
            reasons.push({ id: "HIGH_RISK_TLD", meta: { tld } });
        } else if (!isCommonTld(tld)) {
            reasons.push({ id: "UNCOMMON_TLD", meta: { tld } });
        }
    }

    // 2. 域名仿冒
    let matchedBrand = null;
    if (!isLocal) {
        for (const [brandDomain, brandName] of BRAND_DOMAINS) {
            const ratio = levenshteinRatio(domain, brandDomain);
            if (ratio >= 0.85 && ratio < 1.0) {
                reasons.push({ id: "BRAND_TYPOSQUAT", meta: { brandName, ratio: ratio.toFixed(2) } });
                if (!matchedBrand) matchedBrand = brandName;
            }
        }
    }

    // 3. 外链分析
    const seenLinkReasons = new Set();
    (links || []).forEach(link => {
        const linkDomain = extractDomain(link);
        if (!linkDomain || linkDomain === domain) return;
        if (isIPAddress(linkDomain) && !isLocalDomain(linkDomain)) {
            const k = "LINK_IP:" + linkDomain;
            if (!seenLinkReasons.has(k)) {
                seenLinkReasons.add(k);
                reasons.push({ id: "LINK_IP", meta: { linkDomain } });
            }
            return;
        }
        for (const [brandDomain, brandName] of BRAND_DOMAINS) {
            const ratio = levenshteinRatio(linkDomain, brandDomain);
            if (ratio >= 0.85 && ratio < 1.0) {
                const k = "LINK_BRAND:" + brandName + ":" + linkDomain;
                if (!seenLinkReasons.has(k)) {
                    seenLinkReasons.add(k);
                    reasons.push({ id: "LINK_BRAND_IMPER", meta: { brandName, linkDomain } });
                }
                return;
            }
        }
        if (linkDomain.length > 30) {
            const k = "LONG_LINK:" + linkDomain;
            if (!seenLinkReasons.has(k)) {
                seenLinkReasons.add(k);
                reasons.push({ id: "LONG_LINK_DOMAIN", meta: { linkDomain } });
            }
            return;
        }
        if (link.includes("@")) {
            reasons.push({ id: "AT_IN_LINK", meta: { link } });
        }
    });

    // 4. 表单分析
    let hasAnyForm = false;
    (forms || []).forEach(form => {
        const formAction = form.action || "";
        const hasPassword = form.inputs.some(i => i.type === "password");
        const hasCard = form.inputs.some(i =>
            /card|信用卡|银行卡/.test((i.name || "") + (i.placeholder || "")));

        hasAnyForm = true;

        if (formAction) {
            const actionDomain = extractDomain(formAction);
            if (actionDomain && actionDomain !== domain) {
                reasons.push({ id: "FORM_EXTERNAL", meta: { actionDomain } });
            }
        }
        if (hasPassword && !isHttps && !isLocal) {
            reasons.push({ id: "PASSWORD_NO_HTTPS" });
        }
        if (hasCard) reasons.push({ id: "CARD_INPUT" });
    });

    // 5. 重定向（仅当跳转至外部域名时才标记）
    const metaMatch = (html || "").match(/<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["']\d*\s*;?\s*url\s*=\s*(\S+?)["'][^>]*>/i);
    if (metaMatch) {
        const target = metaMatch[1] || "";
        const targetDomain = extractDomain(target);
        if (targetDomain && targetDomain !== domain && !isLocalDomain(targetDomain)) {
            reasons.push({ id: "META_REDIRECT", meta: { target: targetDomain } });
        }
    }

    // 6. 关键词（仅作为信息展示，不计入评分）
    const foundKeywords = SUSPICIOUS_KEYWORDS.filter(kw => lowerText.includes(kw.toLowerCase()));
    if (foundKeywords.length > 0) {
        reasons.push({ id: "SUSPICIOUS_WORDS", meta: { keywords: foundKeywords } });
    }

    // 7. 品牌词域名不符（需结合表单或其他信号才有效）
    if (!isLocal) {
        for (const [brandDomain, brandName] of BRAND_DOMAINS) {
            if (lowerText.includes(brandName.toLowerCase()) &&
                !isOfficialDomain(domain, brandDomain)) {
                if (hasAnyForm || isIPAddress(domain) || (tld && !isCommonTld(tld))) {
                    reasons.push({ id: "BRAND_MISMATCH", meta: { brandName, brandDomain } });
                    if (!matchedBrand) matchedBrand = brandName;
                }
            }
        }
    }

    return { reasons, matchedBrand };
}

// =============================================================================
// 把结构化 reason 翻译成中文文案
// =============================================================================
function renderReasonText(r) {
    const cfg = DEDUCTION_WEIGHTS[r.id];
    if (!cfg) return "未知风险";
    const m = r.meta || {};
    const w = cfg.weight;
    const badge = w >= 0.30 ? "【-" + Math.round(w * 100) + "%】" :
                  w >= 0.15 ? "【-" + Math.round(w * 100) + "%】" :
                  w > 0     ? "【-" + Math.round(w * 100) + "%】" : "";
    switch (r.id) {
        case "IP_DOMAIN":         return `域名是 IP 地址（${m.domain}）${badge}`;
        case "BRAND_TYPOSQUAT":   return `域名与 ${m.brandName} 官方域名高度相似（相似度 ${m.ratio}）${badge}`;
        case "FORM_EXTERNAL":     return `表单提交至外部域名：${m.actionDomain} ${badge}`;
        case "PASSWORD_NO_HTTPS": return `包含密码输入框但页面未使用 HTTPS ${badge}`;
        case "CARD_INPUT":        return `表单要求输入信用卡/银行卡号 ${badge}`;
        case "BRAND_MISMATCH":    return `页面文本提及"${m.brandName}"，但当前域名并非其官方域名（${m.brandDomain}）${badge}`;
        case "AT_SYMBOL":         return `URL 中包含 @ 符号，可能用于混淆 ${badge}`;
        case "LINK_IP":           return `外链使用 IP 地址：${m.linkDomain} ${badge}`;
        case "LINK_BRAND_IMPER":  return `外链域名模仿 ${m.brandName}：${m.linkDomain} ${badge}`;
        case "META_REDIRECT":     return `页面存在跳转至外部域名：${m.target} ${badge}`;
        case "HIGH_RISK_TLD":     return `顶级域名 .${m.tld} 为高风险域名（钓鱼网站高发）${badge}`;
        case "UNCOMMON_TLD":      return `顶级域名 .${m.tld} 不常见 ${badge}`;
        case "SUSPICIOUS_WORDS":  return `页面文本提及：${(m.keywords || []).join("、")}（仅供参考，不影响准确率）`;
        case "NO_HTTPS":          return `未使用 HTTPS ${badge}`;
        case "LONG_DOMAIN":       return `域名长度异常：${m.domain} ${badge}`;
        case "LONG_LINK_DOMAIN":  return `外链域名长度异常：${m.linkDomain} ${badge}`;
        case "AT_IN_LINK":        return `外链包含 @ 符号：${m.link} ${badge}`;
        default:                  return cfg.label;
    }
}

// =============================================================================
// 核心分析函数：从 99% 开始扣分，本地不判定钓鱼，只触发 AI
// =============================================================================
function analyze(input) {
    const { reasons, matchedBrand } = detectReasons(input);

    // 计算总扣分（INFO 级别不计分）
    let totalDeduction = 0;
    for (const r of reasons) {
        const cfg = DEDUCTION_WEIGHTS[r.id] || { weight: 0 };
        if (cfg.weight === 0) continue;
        totalDeduction += cfg.weight;
    }

    // 准确率 = 初始值 - 总扣分（最低 0%）
    let accuracy = Math.max(0, INITIAL_ACCURACY - totalDeduction);

    // 本地引擎不判定钓鱼，isPhishing 始终为 false
    // 只有 AI 才能判定是否为钓鱼网站

    // 显著性等级：
    //   SAFE：准确率 >= 50%，无需 AI
    //   SUSPECT：准确率 < 50%，自动触发 AI 裁决
    const significance = accuracy < AI_REVIEW_LINE ? "SUSPECT" : "SAFE";

    // 是否需要 AI 审查：准确率低于 50% 自动触发
    const aiWorthy = accuracy < AI_REVIEW_LINE;

    return {
        isPhishing: false,       // 本地永不判定钓鱼
        accuracy,                // 0.0 ~ 0.99
        score: totalDeduction,   // 兼容旧字段，等效于总扣分
        initialAccuracy: INITIAL_ACCURACY,
        aiReviewLine: AI_REVIEW_LINE,
        totalDeduction,          // 总扣分（用于调试）
        highCount: 0,            // 兼容旧字段
        significance,            // SAFE | SUSPECT
        aiWorthy,                // 是否需要 AI 审查（< 50% 自动触发）
        matchedBrand,
        reasons: reasons.map(renderReasonText),
        structuredReasons: reasons
    };
}

const PhishGuardEngine = {
    analyze,
    renderReasonText,
    DEDUCTION_WEIGHTS,
    INITIAL_ACCURACY,
    AI_REVIEW_LINE
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = PhishGuardEngine;
}
if (typeof self !== "undefined") {
    self.PhishGuardEngine = PhishGuardEngine;
}

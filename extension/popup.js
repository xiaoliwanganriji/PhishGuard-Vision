// ========== PhishGuard-Vision 最终版（AI优先 + 低误报离线规则） ==========

const BRANDS = {
    "paypal.com": "PayPal",
    "google.com": "Google",
    "facebook.com": "Facebook",
    "apple.com": "Apple",
    "amazon.com": "Amazon",
    "microsoft.com": "Microsoft",
    "alipay.com": "支付宝",
    "taobao.com": "淘宝",
    "jd.com": "京东",
    "qq.com": "腾讯",
    "baidu.com": "百度",
};

const SUSPICIOUS_KEYWORDS = [
    "verify your account", "login now", "urgent", "update your information",
    "security alert", "account suspended", "unusual activity", "confirm your password",
    "立即验证", "账户冻结", "异常活动", "确认密码", "信用卡号",
    "立即登录", "账户异常", "安全警报", "验证您的身份", "恭喜中奖",
    "您的账户已被锁定", "请更新您的信息", "紧急通知", "解锁账户",
    "身份证号", "银行卡号", "有效期", "CVV", "安全码"
];

const LOCAL_DOMAINS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];

function isLocalDomain(domain) {
    return LOCAL_DOMAINS.includes(domain.toLowerCase());
}

function levenshteinRatio(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    const maxLen = Math.max(m, n);
    return maxLen === 0 ? 1 : (1 - dp[m][n] / maxLen);
}

function extractDomain(url) {
    try {
        if (url.startsWith('http')) return new URL(url).hostname;
        const match = url.match(/^(?:https?:\/\/)?([^\/:]+)/);
        return match ? match[1] : '';
    } catch { return ''; }
}

function isIPAddress(domain) {
    return /^\d+\.\d+\.\d+\.\d+$/.test(domain) || domain === "[::1]";
}

function getTLD(domain) {
    if (isLocalDomain(domain) || isIPAddress(domain)) return "";
    const parts = domain.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : "";
}

// 风险评分（降低低风险项的分数）
function getRiskScore(reason) {
    // 高风险（3分）
    if (reason.includes("域名是IP地址") && !reason.includes("127.0.0.1")) return 3;
    if (reason.includes("域名与") && reason.includes("官方域名高度相似")) return 3;
    if (reason.includes("表单提交至外部域名")) return 3;
    if (reason.includes("包含密码输入框但页面未使用HTTPS")) return 3;
    if (reason.includes("表单要求输入信用卡/银行卡号")) return 3;
    if (reason.includes("页面文本提及") && reason.includes("但当前域名并非其官方域名")) return 3;
    // 中风险（2分）
    if (reason.includes("URL中包含@符号")) return 2;
    if (reason.includes("外链使用IP地址") || reason.includes("外链域名模仿")) return 2;
    if (reason.includes("表单包含隐藏字段")) return 2;
    if (reason.includes("页面存在") && reason.includes("跳转")) return 2;
    if (reason.includes("顶级域名") && reason.includes("不常见")) return 2;
    if (reason.includes("页面文本包含可疑词汇")) return 2;
    // 低风险（0.5分，不再单独形成威胁）
    if (reason.includes("未使用 HTTPS")) return 0.5;
    if (reason.includes("域名长度异常")) return 0.5;
    if (reason.includes("外链域名长度异常")) return 0.5;
    if (reason.includes("外链包含@符号")) return 0.5;
    // 未知风险默认0.5分
    return 0.5;
}

function localRuleEngine(url, pageText, links, forms, html) {
    const reasons = [];
    let matchedBrand = null;
    const domain = extractDomain(url);
    const isHttps = url.startsWith('https://');
    const isLocal = isLocalDomain(domain);

    // 1. URL 异常
    if (isIPAddress(domain) && !isLocal) {
        reasons.push("域名是IP地址，高度可疑");
    }
    if (!isHttps && !isLocal) {
        reasons.push("未使用 HTTPS");
    }
    if (domain.length > 30 && !isLocal) {
        reasons.push("域名长度异常");
    }
    if (url.includes('@')) {
        reasons.push("URL中包含@符号，可能用于混淆");
    }
    const tld = getTLD(domain);
    if (tld && tld.length > 4) {
        reasons.push(`顶级域名 .${tld} 不常见，可疑`);
    }

    // 2. 域名仿冒
    if (!isLocal) {
        for (const [brandDomain, brandName] of Object.entries(BRANDS)) {
            const ratio = levenshteinRatio(domain, brandDomain);
            if (ratio >= 0.85 && ratio < 1.0) {
                reasons.push(`域名与${brandName}官方域名高度相似 (相似度${ratio.toFixed(2)})`);
                matchedBrand = brandName;
            }
        }
    }

    // 3. 外链（仅标记真正可疑的）
    links.forEach(link => {
        const linkDomain = extractDomain(link);
        if (!linkDomain || linkDomain === domain) return;
        if (isIPAddress(linkDomain) && !isLocalDomain(linkDomain)) {
            reasons.push(`外链使用IP地址: ${linkDomain}`);
            return;
        }
        for (const [brandDomain, brandName] of Object.entries(BRANDS)) {
            const ratio = levenshteinRatio(linkDomain, brandDomain);
            if (ratio >= 0.85 && ratio < 1.0) {
                reasons.push(`外链域名模仿${brandName}: ${linkDomain}`);
                return;
            }
        }
        if (linkDomain.length > 30) {
            reasons.push(`外链域名长度异常: ${linkDomain}`);
            return;
        }
        if (link.includes('@')) {
            reasons.push(`外链包含@符号: ${link}`);
            return;
        }
    });

    // 4. 表单
    forms.forEach(form => {
        const formAction = form.action || '';
        const hasPassword = form.inputs.some(inp => inp.type === 'password');
        const hasCard = form.inputs.some(inp => /card|信用卡|银行卡/.test((inp.name || '') + (inp.placeholder || '')));
        const hasHidden = form.inputs.some(inp => inp.type === 'hidden');

        if (formAction) {
            const actionDomain = extractDomain(formAction);
            if (actionDomain && actionDomain !== domain) {
                reasons.push(`表单提交至外部域名: ${actionDomain}`);
            }
        }
        if (hasPassword && !isHttps && !isLocal) {
            reasons.push("包含密码输入框但页面未使用HTTPS");
        }
        if (hasCard) reasons.push("表单要求输入信用卡/银行卡号，高度可疑");
        if (hasHidden) reasons.push("表单包含隐藏字段，可能用于窃取额外信息");
    });

    // 5. 重定向
    if (/<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*>/i.test(html)) {
        reasons.push("页面存在 meta refresh 跳转，可疑");
    }
    if (/window\.location\s*=\s*["']/i.test(html) || /document\.location\s*=\s*["']/i.test(html)) {
        reasons.push("页面存在 JavaScript 跳转，可疑");
    }

    // 6. 关键词
    const lowerText = pageText.toLowerCase();
    const foundKeywords = SUSPICIOUS_KEYWORDS.filter(kw => lowerText.includes(kw.toLowerCase()));
    if (foundKeywords.length > 0) reasons.push(`页面文本包含可疑词汇: ${foundKeywords.join(', ')}`);

    // 7. 品牌词域名不符
    if (!isLocal) {
        for (const [brandDomain, brandName] of Object.entries(BRANDS)) {
            if (lowerText.includes(brandName.toLowerCase())) {
                if (!domain.endsWith(brandDomain) && domain !== brandDomain) {
                    reasons.push(`页面文本提及“${brandName}”，但当前域名并非其官方域名 (${brandDomain})`);
                    if (!matchedBrand) matchedBrand = brandName;
                }
            }
        }
    }

    const uniqueReasons = [...new Set(reasons)];

    // 加权总分
    let totalScore = 0;
    uniqueReasons.forEach(r => { totalScore += getRiskScore(r); });

    const isPhishing = totalScore >= 2.5; // 阈值调低一点，但低风险项分数已降至0.5
    let confidence;
    if (isPhishing) {
        confidence = Math.min(0.7 + (totalScore - 2.5) * 0.1, 1.0);
    } else {
        confidence = 0.5 + totalScore * 0.1;
        if (confidence > 0.7) confidence = 0.69;
    }

    return { isPhishing, confidence, reasons: uniqueReasons, matchedBrand };
}

// ------------------- 主流程 -------------------
document.getElementById('checkBtn').addEventListener('click', async () => {
    const resultDiv = document.getElementById('result');
    resultDiv.className = 'status checking';
    resultDiv.textContent = '正在分析中...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const html = document.documentElement.outerHTML;
                const pageText = (document.body?.innerText || document.documentElement?.innerText || '').substring(0, 2000);
                const links = Array.from(document.querySelectorAll('a[href]'))
                    .map(a => a.href.trim())
                    .filter(href => href && !href.startsWith('javascript:'));
                const forms = Array.from(document.querySelectorAll('form')).map(form => ({
                    action: form.action || '',
                    method: form.method || '',
                    inputs: Array.from(form.querySelectorAll('input')).map(inp => ({
                        type: inp.type || '',
                        name: inp.name || '',
                        placeholder: inp.placeholder || ''
                    }))
                }));
                return { html, pageText, links, forms };
            }
        });

        const { html, pageText, links, forms } = results[0].result;
        const url = tab.url;
        const title = tab.title;

        // 尝试 AI 增强
        let aiData = null;
        let useLocal = true;
        try {
            const resp = await fetch('http://127.0.0.1:8000/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, title, html })
            });
            if (resp.ok) {
                aiData = await resp.json();
                useLocal = false;
            }
        } catch (e) { }

        let finalResult;
        if (aiData) {
            // AI 增强模式：以 AI 判定为主，离线理由仅做展示补充
            const local = localRuleEngine(url, pageText, links, forms, html);
            // 合并理由（去重）
            const combinedReasons = [...new Set([...aiData.reasons, ...local.reasons])];
            finalResult = {
                is_phishing: aiData.is_phishing,
                confidence: aiData.confidence,
                reasons: combinedReasons,
                brand_name: aiData.brand_name || local.matchedBrand,
                ai_official_url: aiData.ai_official_url || null
            };
        } else {
            const local = localRuleEngine(url, pageText, links, forms, html);
            finalResult = {
                is_phishing: local.isPhishing,
                confidence: local.confidence,
                reasons: local.reasons,
                brand_name: local.matchedBrand,
                ai_official_url: null
            };
        }

        const data = finalResult;

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

        let officialUrl = data.ai_official_url || null;
        let officialName = '';

        if (!officialUrl && data.brand_name && OFFICIAL_SITES[data.brand_name]) {
            officialUrl = OFFICIAL_SITES[data.brand_name];
            officialName = data.brand_name;
        } else if (officialUrl) {
            try { officialName = new URL(officialUrl).hostname.replace('www.', ''); }
            catch { officialName = '官方网站'; }
        } else if (data.is_phishing) {
            const allText = data.reasons.join(' ') + ' ' + url + ' ' + title;
            for (const [brand, site] of Object.entries(OFFICIAL_SITES)) {
                if (allText.toLowerCase().includes(brand.toLowerCase())) {
                    officialUrl = site;
                    officialName = brand;
                    break;
                }
            }
        }

        let btnHTML = '';
        if (data.is_phishing && officialUrl) {
            btnHTML = `
                <div style="margin-top:12px;text-align:center;">
                    <button id="officialBtn" style="background:white;color:#0070ba;border:2px solid #0070ba;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:bold;">
                        🔒 前往 ${officialName || '官方网站'}
                    </button>
                </div>`;
        }

        resultDiv.innerHTML = `
            <div class="status ${data.is_phishing ? 'phishing' : 'safe'}">
                ${data.is_phishing ? '⚠️ 钓鱼网站' : '✅ 安全网站'} (置信度: ${(data.confidence * 100).toFixed(0)}%)
                ${!useLocal ? ' <span style="font-size:12px;color:#007bff;">(AI增强)</span>' : ' <span style="font-size:12px;color:#888;">(离线模式)</span>'}
            </div>
            <div class="reason">
                <strong>判断理由：</strong>
                <ul>${data.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
            </div>
            ${btnHTML}
        `;

        if (data.is_phishing && officialUrl) {
            document.getElementById('officialBtn').addEventListener('click', () => {
                chrome.tabs.create({ url: officialUrl });
            });
        }

    } catch (e) {
        resultDiv.textContent = '分析失败: ' + e.message;
        resultDiv.className = 'status';
    }
});
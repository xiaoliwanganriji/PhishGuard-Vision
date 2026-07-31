# 🛡️ PhishGuard-Vision — 你的智能钓鱼网站识别助手

**PhishGuard-Vision** 是一个免费、开源的浏览器插件，可以帮你**自动识别正在访问的网页是不是钓鱼网站**。  
它不只能告诉你"危险"，还会用**大白话解释为什么危险**，并**提供一键跳转到真正官方网站的按钮**。

> 🎓 本项目也是**网络空间安全专业毕业设计作品**，追求实用、可解释、易上手。

---

## ✨ 能做什么？

- 🔍 **自动检测**：浏览网页时无需点击，工具栏 badge 即可看到当前页面风险等级。
- 🤖 **AI 自动增强**：本地引擎准确率低于 50% 时自动触发 AI 深度分析，由 AI 做最终判定，无需手动操作。
- 📋 **详细理由**：用中文列出一条条具体原因，例如"域名模仿 PayPal 官方"或"表单要求输入信用卡号"。
- 🏃 **一键跳转官网**：检测到钓鱼时显示按钮，跳转前会做白名单校验，确保不会跳到另一个钓鱼站。
- 🛡️ **隐私优先**：默认 100% 本地运行；只有准确率低于 50% 时才会自动发送 URL + 标题 + 理由摘要给后端 AI，**绝不发送原始页面 HTML**。
- 🧠 **AI 加持（可选）**：配置 DeepSeek API Key 后启用大模型语义分析。
- 📦 **开箱即用**：不启动任何后端也能用，核心检测能力全部内置在插件里。

---

## 📸 效果截图

![钓鱼网站检测效果](screenshots/钓鱼网站识别效果图.png)
![安全网站检测效果](screenshots/正常网站识别效果图.png)

---

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────────┐
│                       Chrome 浏览器                          │
│  ┌────────────────────┐   ┌─────────────────────────────┐  │
│  │  content_script.js │──▶│  本地规则引擎（ruleEngine）   │  │
│  │  (自动检测+badge)  │   │  URL / 品牌 / 关键词 / 表单   │  │
│  └────────────────────┘   └─────────────────────────────┘  │
│           │                          │                      │
│           ▼                          ▼                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  background.js (Service Worker)                      │   │
│  │   · 保存最近一次本地结果                              │   │
│  │   · 更新工具栏 badge（绿✓ / 橙? / 红!）              │   │
│  │   · 仅在用户点击"申请 AI 审查"时调用后端              │   │
│  └─────────────────────────────────────────────────────┘   │
│           │                                                 │
│           ▼                                                 │
│  ┌────────────────────┐                                     │
│  │  popup.html / .js  │  ◀── 用户主动打开时展示            │
│  │  默认展示本地结果    │                                     │
│  │  显著风险时显示     │                                     │
│  │  "申请 AI 审查"按钮 │                                     │
│  └────────────────────┘                                     │
└──────────────────────│──────────────────────────────────────┘
                       │ POST /check
                       │ (URL + title + 理由摘要，**不含 HTML**)
                       ▼
        ┌────────────────────────────────────┐
        │  FastAPI 后端 (127.0.0.1:8000)       │
        │  · token 鉴权 + 速率限制             │
        │  · 规则引擎辅助                       │
        │  · 调用 DeepSeek 语义分析（可选）     │
        │  · 官网白名单校验                     │
        └──────────────│──────────────────────┘
                       ▼
                DeepSeek API
```

---

## 🚀 怎么安装和使用？（小白版）

### 第一步：安装插件

1. 下载本项目 `extension` 文件夹到电脑任意位置。
2. 打开 Chrome 浏览器，地址栏输入 `chrome://extensions/` 并回车。
3. 打开右上角的 **"开发者模式"** 开关。
4. 点击左上角 **"加载已解压的扩展程序"**，选择 `extension` 文件夹。
5. 插件图标会出现在浏览器右上角，建议把它**固定到工具栏**。
6. （可选）如需自定义图标，运行 `python extension/generate_icons.py` 可重新生成。

### 第二步：开始使用

- 浏览任何网页时，工具栏图标会自动变化：
  - 🟢 绿色 ✓ — 当前页面安全
  - ⚪ 灰色 · — 有少量异常特征
  - 🟠 橙色 ? — 检测到可疑特征，AI 分析中
  - 🔴 红色 ! — AI 判定为钓鱼网站
- 点击插件图标查看详细判断理由。
- 准确率低于 50% 时会**自动触发 AI 深度分析**，无需手动操作。

**就这么简单！不需要安装任何软件，也不需要写代码。**

---

## 🤖 想用 AI 增强功能？（可选）

如果你希望启用 AI 深度审查：

1. 安装 Python 3.10+。
2. 进入 `backend` 文件夹，双击运行 `一键启动ai增强版.bat`（自动安装依赖并启动）。
3. 去 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册并获取 API Key（有免费额度）。
4. 复制 `backend/.env.example` 为 `backend/.env`，填入：
   - `OPENAI_API_KEY=你的API-Key`
   - `USE_AI_TEXT=true`
   - `PHISHGUARD_TOKEN=一个随机长字符串`（**强烈建议设置**，防止被刷额度）
5. 浏览可疑网站时，插件会自动连接后端进行 AI 分析，无需手动操作。

> 💡 即使不启动后端，插件依然可以正常工作（本地引擎），所有基础检测都在本地完成。

---

## 🔐 隐私与安全设计

我们把"**默认不上传、最小必要**"作为第一原则：

| 数据 | 是否上传 | 触发条件 |
|------|----------|----------|
| URL | ✅ | 准确率 < 50% 时自动触发 AI 分析 |
| 页面标题 | ✅ | 同上 |
| 页面**完整 HTML** | ❌ 永远不上传 | — |
| 页面**纯文本**（2000 字） | ❌ 永远不上传 | — |
| 本地检测出的"理由摘要" | ✅ | 准确率 < 50% 自动触发时附带 |
| 表单输入内容（密码、卡号等） | ❌ | 永远不读取、不外发 |

后端安全措施：
- CORS 收紧到 `chrome-extension://*` 与本地回环
- 可选 `PHISHGUARD_TOKEN` 共享密钥鉴权
- 简单内存级速率限制（60 秒 / 30 次）
- AI 推断的"官网"必须经过**内置白名单校验**，避免 AI 幻觉跳到另一个钓鱼站

---

## ⚖️ 评分模型与 AI 触发策略

采用**无罪推定模型**：默认准确率 99%，每发现一个钓鱼特征按特异性扣分。

| 显著性 | 准确率 | UI 行为 |
|--------|--------|---------|
| **SAFE** | ≥ 50% | 显示绿色 ✅，网站安全 |
| **SUSPECT** | < 50% | 显示橙色 🔍，**自动触发 AI 深度分析**，由 AI 判定是否为钓鱼 |

特征权重按"只有钓鱼网站才有的特征大扣分"原则分 4 档：

| 等级 | 权重 | 特征 | 说明 |
|------|------|------|------|
| 极强 | 0.55 | IP 域名、品牌仿冒 | 几乎只有钓鱼网站才有，单独即触发 AI |
| 强 | 0.50 | 品牌不符、密码无 HTTPS、信用卡表单 | 钓鱼网站极常见，单独即触发 AI |
| 中等 | 0.15~0.25 | 表单外提、@符号、高风险 TLD | 钓鱼常见但正常也可能有，需组合触发 |
| 弱 | 0.03~0.08 | 无 HTTPS、域名过长、不常见 TLD | 轻微可疑，正常网站也有 |

**本地引擎永不判定钓鱼**，只负责检测特征和计算准确率。准确率 < 50% 时自动将数据送往 AI 后端，由 AI 做最终判定。

> 调整阈值：见 `extension/lib/ruleEngine.js` 顶部的 `AI_REVIEW_LINE`。

---

## 🧪 测试与评估

### 内置测试页面
项目自带两个测试页（`test_pages/`）：
- `fake_paypal.html` — 典型钓鱼页（IP 提交 + 信用卡输入 + 品牌词）
- `safe_site.html` — 正常博客

启动方式（任选其一）：
```bash
# Python
cd test_pages && python -m http.server 8080
# 或直接用浏览器打开
```

### 规则引擎单元测试
```bash
cd extension
node lib/ruleEngine.js  # 自检
# 详见 tests/test_ruleEngine.js
```

### 端到端评估
```bash
cd evaluate
python run_eval.py
```
会输出 Precision / Recall / F1 等指标，可用于毕业答辩。

#### 使用 PhishTank 真实数据集
1. 浏览器打开 https://phishtank.com/developer_info.php
2. 点击 "Download" 下载 "Online valid phishing URLs"（CSV）
3. 解压后把 `online-valid.csv` 重命名为 `phishtank_online-valid.csv`，放到 `evaluate/` 目录
4. 运行：
   ```bash
   cd evaluate
   python download_phishtank.py --limit 200 --replace
   python run_eval.py
   ```
   `download_phishtank.py` 会自动合并内置正常样本 + PhishTank 钓鱼样本。

---

## 📁 项目结构

```
PhishGuard-Vision-main/
├── extension/                     # 浏览器插件
│   ├── manifest.json              # MV3 配置
│   ├── popup.html / popup.js      # 弹出层
│   ├── contentScript.js           # 自动检测（注入到每个 http/https 页）
│   ├── background.js              # Service Worker（badge + 消息路由）
│   ├── generate_icons.py          # 图标生成脚本
│   ├── icons/                     # 自动生成的 4 个尺寸 PNG
│   └── lib/                       # 规则引擎模块
│       ├── brands.js              #   · 品牌库
│       ├── urlUtils.js            #   · URL 工具
│       ├── levenshtein.js         #   · 字符串相似度
│       ├── tlds.js                #   · 常见 TLD
│       └── ruleEngine.js          #   · 规则引擎主逻辑
├── backend/                       # Python FastAPI（可选）
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   └── 一键启动ai增强版.bat
├── test_pages/                    # 演示用钓鱼/正常页面
├── evaluate/                      # 评估脚本
├── screenshots/                   # 效果截图
└── README.md
```

---

## ⚙️ 配置选项

| 环境变量 | 默认 | 说明 |
|----------|------|------|
| `OPENAI_API_KEY` | 空 | DeepSeek API Key（必填才能用 AI） |
| `OPENAI_BASE_URL` | `https://api.deepseek.com/v1` | API base |
| `USE_AI_TEXT` | `false` | 是否启用 AI 审查 |
| `PHISHGUARD_TOKEN` | 空 | 共享鉴权 token，**强烈建议设置** |

---

## 🛡️ 安全注意事项

1. **PHISHGUARD_TOKEN 必须设置**：仅靠 CORS 不能阻止恶意网页直接 fetch 你的后端。
2. **AI 推断的官网不直接信任**：插件会做白名单校验，失败时回退到本地品牌库。
3. **永不直接执行 HTML**：所有 UI 渲染都用 `textContent`，避免 XSS。
4. **WHOIS 隔离**：`safe_whois()` 在线程池跑且 4 秒超时，永不阻塞 API。

---

## 📜 License

MIT（仅供学习与毕设演示使用，请勿用于商业钓鱼攻击相关场景）。

---

## ✉️ 致谢

- 灵感与品牌库参考自 PhishTank、OpenPhish
- 评估数据可使用 [PhishTank 公开数据集](https://phishtank.org/developer_info.php)
- AI 模型：[DeepSeek](https://platform.deepseek.com/)

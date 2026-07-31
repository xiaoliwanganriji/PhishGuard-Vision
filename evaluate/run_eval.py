"""
PhishGuard-Vision 端到端评估脚本（毕设/答辩用）

输入：evaluate/dataset.json（label 字段：1=钓鱼, 0=正常）
输出：本地引擎的 Precision / Recall / F1 / 显著性分布 / 误报样本

用法：
    cd evaluate
    python run_eval.py
"""
import json
import os
import sys
from pathlib import Path

# 让脚本能 import 同级目录的扩展规则引擎（Node 调用）
HERE = Path(__file__).parent
ROOT = HERE.parent
EXT_LIB = ROOT / "extension" / "lib"
ENGINE_PATH = str((EXT_LIB / "ruleEngine.js").resolve()).replace("\\", "/")

# 通过 Node 跑 ruleEngine（这样保证评估用的是浏览器真实代码，不是 Python 重写）
NODE_RUNNER = HERE / "_run_engine.js"
RUNNER_SRC = """
const engine = require(__ENGINE_PATH__);
process.stdin.setEncoding("utf-8");
let buf = "";
process.stdin.on("data", c => buf += c);
process.stdin.on("end", () => {
    const cases = JSON.parse(buf);
    const out = cases.map(c => engine.analyze(c));
    process.stdout.write(JSON.stringify(out));
});
""".replace("__ENGINE_PATH__", json.dumps(ENGINE_PATH))
NODE_RUNNER.write_text(RUNNER_SRC, encoding="utf-8")

DATASET = HERE / "dataset.json"


def load_dataset():
    if not DATASET.exists():
        print(f"未找到 {DATASET}，使用内置 demo 数据。")
        return _builtin_dataset()
    with open(DATASET, encoding="utf-8") as f:
        return json.load(f)


def _builtin_dataset():
    """内置 demo 数据，方便无 dataset.json 时直接跑出结果"""
    return [
        # 钓鱼样本
        {"label": 1, "url": "http://192.168.1.100/login",
         "pageText": "verify your account urgent login now",
         "links": [], "forms": [
             {"action": "http://evil.com/steal", "method": "post",
              "inputs": [
                  {"type": "text", "name": "email", "placeholder": "邮箱"},
                  {"type": "password", "name": "pwd", "placeholder": "密码"},
                  {"type": "text", "name": "card", "placeholder": "信用卡号"}
              ]}
         ], "html": ""},
        {"label": 1, "url": "https://paypa1.com/login",
         "pageText": "PayPal verify your account", "links": [], "forms": [], "html": ""},
        {"label": 1, "url": "http://login-alipay.tk/account",
         "pageText": "您的账户已被锁定，立即验证身份",
         "links": [], "forms": [], "html": ""},
        {"label": 1, "url": "https://secure-appleid.com.phishing.xyz/signin",
         "pageText": "Apple ID security alert confirm your password",
         "links": [], "forms": [], "html": ""},
        {"label": 1, "url": "https://accounts-google.verify-mail.support/signin",
         "pageText": "Google unusual activity security alert", "links": [], "forms": [], "html": ""},
        # 正常样本
        {"label": 0, "url": "https://www.google.com",
         "pageText": "search the world", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://github.com/explore",
         "pageText": "Explore GitHub", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://www.baidu.com",
         "pageText": "百度一下，你就知道", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://www.apple.com/shop",
         "pageText": "Buy iPhone Mac iPad", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://www.taobao.com",
         "pageText": "淘宝淘 我喜欢", "links": [], "forms": [], "html": ""},
    ]


def run_engine(cases):
    import subprocess
    proc = subprocess.run(
        ["node", str(NODE_RUNNER)],
        input=json.dumps(cases, ensure_ascii=False),
        capture_output=True, text=True, encoding="utf-8"
    )
    if proc.returncode != 0:
        print("Node 评估失败：", proc.stderr)
        sys.exit(1)
    return json.loads(proc.stdout)


def metric(tp, fp, fn):
    precision = tp / (tp + fp) if (tp + fp) else 0
    recall = tp / (tp + fn) if (tp + fn) else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
    return precision, recall, f1


def main():
    dataset = load_dataset()
    print(f"数据集大小: {len(dataset)}")

    # 评估用 input（去掉 label 字段）
    inputs = [{k: v for k, v in c.items() if k != "label"} for c in dataset]
    results = run_engine(inputs)

    # 新模型评估：本地引擎不判定钓鱼，只判断"是否会触发 AI 审查"
    # pred = 1 表示会触发 AI（aiWorthy=true），交给 AI 裁决
    tp = fp = fn = tn = 0
    fp_samples = []
    fn_samples = []
    sig_dist = {"SAFE": 0, "SUSPECT": 0}

    for case, r in zip(dataset, results):
        pred = 1 if r["aiWorthy"] else 0
        sig_dist[r["significance"]] += 1
        if case["label"] == 1 and pred == 1: tp += 1
        elif case["label"] == 0 and pred == 1:
            fp += 1
            fp_samples.append((case["url"], r["reasons"][:3]))
        elif case["label"] == 1 and pred == 0:
            fn += 1
            fn_samples.append((case["url"], r["reasons"][:3]))
        else:
            tn += 1

    p, r, f1 = metric(tp, fp, fn)

    print("\n========== 评估结果（本地引擎 → AI 触发能力） ==========")
    print("说明：本地引擎不判定钓鱼，准确率 <50% 时自动触发 AI 深度分析")
    print("评估指标：是否正确地将钓鱼样本送往 AI，同时避免将正常样本误送 AI")
    print(f"  真阳性 TP (钓鱼→AI)  : {tp}")
    print(f"  假阳性 FP (正常→AI)  : {fp}")
    print(f"  假阴性 FN (钓鱼→安全): {fn}")
    print(f"  真阴性 TN (正常→安全): {tn}")
    print(f"  ----------------------------")
    print(f"  Precision : {p:.3f}  (被送 AI 的确实是钓鱼的比例)")
    print(f"  Recall    : {r:.3f}  (钓鱼样本被送 AI 的比例)")
    print(f"  F1        : {f1:.3f}")
    print(f"  显著性分布: {sig_dist}")

    # AI 触发率
    phish = [c for c, res in zip(dataset, results) if c["label"] == 1]
    if phish:
        ai_count = sum(
            1 for c, res in zip(dataset, results)
            if c["label"] == 1 and res["aiWorthy"]
        )
        print(f"  钓鱼样本 AI 触发率: {ai_count}/{len(phish)} = {ai_count/len(phish):.2%}")

    if fp_samples:
        print("\n[误送 AI 的正常样本]")
        for url, reasons in fp_samples:
            print(f"  - {url}")
            for rs in reasons: print(f"      {rs}")

    if fn_samples:
        print("\n[未触发 AI 的钓鱼样本]")
        for url, reasons in fn_samples:
            print(f"  - {url}")
            for rs in reasons: print(f"      {rs}")

    print("\n评估完成。")


if __name__ == "__main__":
    main()

"""
PhishGuard-Vision PhishTank 数据集批量测试脚本

从 PhishTank verified_online.csv 中抽样钓鱼 URL，
配合已知安全 URL，测试本地规则引擎的检出能力。

用法：
    cd evaluate
    python test_phishtank.py
"""
import csv
import json
import os
import random
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).parent
ROOT = HERE.parent
EXT_LIB = ROOT / "extension" / "lib"
ENGINE_PATH = str((EXT_LIB / "ruleEngine.js").resolve()).replace("\\", "/")

# Node runner：通过 stdin 传入 JSON 数组，stdout 返回分析结果
NODE_RUNNER = HERE / "_run_engine_pt.js"
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

# PhishTank CSV 路径
PHISHTANK_CSV = r"D:\Chrome\verified_online.csv\verified_online.csv"

# 抽样数量
SAMPLE_SIZE = 200

# 已知安全网站（用于测试误报率）
SAFE_SITES = [
    {"label": 0, "url": "https://www.google.com", "pageText": "Google Search", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.github.com", "pageText": "GitHub: Let's build from here", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.baidu.com", "pageText": "百度一下，你就知道", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.apple.com", "pageText": "Apple iPhone Mac iPad", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.amazon.com", "pageText": "Amazon Online Shopping", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.microsoft.com", "pageText": "Microsoft Cloud PC Office", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.taobao.com", "pageText": "淘宝淘我喜欢", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.jd.com", "pageText": "京东多快好省", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.wikipedia.org", "pageText": "Wikipedia The Free Encyclopedia", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.youtube.com", "pageText": "YouTube Share your videos", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.stackoverflow.com", "pageText": "Stack Overflow Where developers learn", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.reddit.com", "pageText": "Reddit Dive into anything", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.netflix.com", "pageText": "Netflix Watch TV shows online", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.spotify.com", "pageText": "Spotify Music for everyone", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.adobe.com", "pageText": "Adobe Creative Cloud", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.linkedin.com", "pageText": "LinkedIn Professional network", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.twitter.com", "pageText": "Twitter X", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.instagram.com", "pageText": "Instagram Photos and videos", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.paypal.com", "pageText": "PayPal Send Shop", "links": [], "forms": [], "html": ""},
    {"label": 0, "url": "https://www.ebay.com", "pageText": "eBay Electronics Cars Fashion", "links": [], "forms": [], "html": ""},
]


def load_phishtank_urls(sample_size=SAMPLE_SIZE):
    """从 PhishTank CSV 中随机抽样钓鱼 URL"""
    if not os.path.exists(PHISHTANK_CSV):
        print(f"[ERROR] PhishTank CSV 未找到: {PHISHTANK_CSV}")
        sys.exit(1)

    urls = []
    targets = {}
    with open(PHISHTANK_CSV, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            url = row.get("url", "").strip()
            target = row.get("target", "Other").strip()
            if url and url.startswith("http"):
                urls.append((url, target))
                targets[target] = targets.get(target, 0) + 1

    print(f"PhishTank 总 URL 数: {len(urls)}")
    print(f"品牌分布 (Top 10):")
    for t, c in sorted(targets.items(), key=lambda x: -x[1])[:10]:
        print(f"  {t}: {c}")

    # 随机抽样
    if len(urls) > sample_size:
        random.seed(42)
        urls = random.sample(urls, sample_size)

    return urls


def run_engine(cases):
    """通过 Node.js 运行规则引擎"""
    proc = subprocess.run(
        ["node", str(NODE_RUNNER)],
        input=json.dumps(cases, ensure_ascii=False),
        capture_output=True, text=True, encoding="utf-8"
    )
    if proc.returncode != 0:
        print("[ERROR] Node 评估失败：", proc.stderr)
        sys.exit(1)
    return json.loads(proc.stdout)


def main():
    print("=" * 60)
    print("PhishGuard-Vision PhishTank 数据集测试")
    print("=" * 60)

    # 1. 加载钓鱼 URL
    print(f"\n[1] 从 PhishTank 加载钓鱼 URL (抽样 {SAMPLE_SIZE} 条)...")
    phish_urls = load_phishtank_urls()

    # 2. 构建测试数据
    phish_cases = []
    for url, target in phish_urls:
        phish_cases.append({
            "label": 1,
            "url": url,
            "pageText": "",  # PhishTank 只提供 URL，无页面内容
            "links": [],
            "forms": [],
            "html": ""
        })

    all_cases = phish_cases + SAFE_SITES
    print(f"\n[2] 测试数据集: {len(phish_cases)} 钓鱼 + {len(SAFE_SITES)} 安全 = {len(all_cases)} 条")

    # 3. 运行规则引擎
    print(f"\n[3] 运行本地规则引擎...")
    inputs = [{k: v for k, v in c.items() if k != "label"} for c in all_cases]
    results = run_engine(inputs)

    # 4. 统计指标
    tp = fp = fn = tn = 0
    phish_triggered = 0
    safe_triggered = 0
    fn_samples = []
    fp_samples = []
    accuracy_buckets = {"0-20%": 0, "20-40%": 0, "40-70%": 0, "70-99%": 0, "99%": 0}

    for case, r in zip(all_cases, results):
        label = case["label"]
        ai_worthy = r.get("aiWorthy", False)
        accuracy = r.get("accuracy", 0.99)
        significance = r.get("significance", "SAFE")
        reasons = r.get("reasons", [])

        # 准确率分布（仅钓鱼样本）
        if label == 1:
            if accuracy < 0.20:
                accuracy_buckets["0-20%"] += 1
            elif accuracy < 0.40:
                accuracy_buckets["20-40%"] += 1
            elif accuracy < 0.70:
                accuracy_buckets["40-70%"] += 1
            elif accuracy < 0.99:
                accuracy_buckets["70-99%"] += 1
            else:
                accuracy_buckets["99%"] += 1

        # pred=1 表示触发 AI（aiWorthy=true）
        pred = 1 if ai_worthy else 0

        if label == 1 and pred == 1:
            tp += 1
            phish_triggered += 1
        elif label == 0 and pred == 1:
            fp += 1
            safe_triggered += 1
            fp_samples.append((case["url"], accuracy, reasons[:3]))
        elif label == 1 and pred == 0:
            fn += 1
            fn_samples.append((case["url"], accuracy, reasons[:3]))
        else:
            tn += 1

    # 5. 输出报告
    precision = tp / (tp + fp) if (tp + fp) else 0
    recall = tp / (tp + fn) if (tp + fn) else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0

    print(f"\n{'=' * 60}")
    print(f"测试结果")
    print(f"{'=' * 60}")
    print(f"\n--- 混淆矩阵 ---")
    print(f"  真阳性 TP (钓鱼→触发AI) : {tp}")
    print(f"  假阳性 FP (安全→触发AI) : {fp}")
    print(f"  假阴性 FN (钓鱼→未触发) : {fn}")
    print(f"  真阴性 TN (安全→未触发) : {tn}")
    print(f"  ---------------------------")
    print(f"  Precision : {precision:.3f}  (触发AI的确实是钓鱼的比例)")
    print(f"  Recall    : {recall:.3f}  (钓鱼样本被正确触发的比例)")
    print(f"  F1        : {f1:.3f}")

    print(f"\n--- 钓鱼样本 AI 触发率 ---")
    print(f"  {phish_triggered}/{len(phish_cases)} = {phish_triggered/len(phish_cases):.2%}")

    print(f"\n--- 安全样本误报率 ---")
    print(f"  {safe_triggered}/{len(SAFE_SITES)} = {safe_triggered/len(SAFE_SITES):.2%}")

    print(f"\n--- 钓鱼样本准确率分布 ---")
    for bucket, count in accuracy_buckets.items():
        bar = "#" * (count * 40 // max(1, len(phish_cases)))
        print(f"  {bucket:>8}: {count:>4}  {bar}")

    # 6. 输出漏报样本（钓鱼但未触发 AI）
    if fn_samples:
        print(f"\n--- 漏报样本 ({len(fn_samples)} 条钓鱼未触发 AI) ---")
        for url, acc, reasons in fn_samples[:10]:
            print(f"  [{acc*100:.0f}%] {url}")
            for r in reasons:
                print(f"      {r}")

    # 7. 输出误报样本（安全但触发了 AI）
    if fp_samples:
        print(f"\n--- 误报样本 ({len(fp_samples)} 条安全触发了 AI) ---")
        for url, acc, reasons in fp_samples:
            print(f"  [{acc*100:.0f}%] {url}")
            for r in reasons:
                print(f"      {r}")

    # 8. 输出前 20 条钓鱼样本详细检测结果
    print(f"\n--- 前 20 条钓鱼样本详细检测 ---")
    for i, (case, r) in enumerate(zip(phish_cases[:20], results[:20])):
        url = case["url"]
        acc = r.get("accuracy", 0.99)
        sig = r.get("significance", "SAFE")
        ai = "触发AI" if r.get("aiWorthy") else "未触发"
        reasons = r.get("reasons", [])
        print(f"\n  [{i+1}] {url}")
        print(f"      准确率: {acc*100:.0f}% | {sig} | {ai}")
        for rsn in reasons[:3]:
            print(f"      - {rsn}")

    print(f"\n{'=' * 60}")
    print(f"测试完成")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

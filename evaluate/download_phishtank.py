"""
PhishTank 公开数据集下载脚本

PhishTank 提供实时钓鱼 URL 列表：
  - JSON: https://data.phishtank.com/data/online-valid.json
  - CSV : https://data.phishtank.com/data/online-valid.csv.gz

本脚本下载 JSON 并转换为 evaluate/dataset.json 格式（仅钓鱼样本）。
正常样本需要用户自己准备（或使用内置 demo）。

用法：
    cd evaluate
    python download_phishtank.py           # 下载最新在线钓鱼 URL
    python download_phishtank.py --limit 100  # 只取前 100 条
"""

import argparse
import gzip
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

try:
    import httpx
except ImportError:
    print("缺少 httpx，正在安装...")
    os.system("pip install httpx")
    import httpx

HERE = Path(__file__).parent
CACHE_FILE = HERE / "phishtank_online-valid.json"
DATASET_OUT = HERE / "dataset.json"

PHISHTANK_JSON_URL = "https://data.phishtank.com/data/online-valid.json"
PHISHTANK_CSV_URL = "https://data.phishtank.com/data/online-valid.csv.gz"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"


def download_csv(limit: int = 0) -> list:
    """下载 PhishTank gzipped CSV，返回解析后的列表"""
    print("正在从 PhishTank 下载 online-valid.csv.gz ...")
    headers = {"User-Agent": USER_AGENT}
    try:
        resp = httpx.get(PHISHTANK_CSV_URL, headers=headers, timeout=60, follow_redirects=True)
        resp.raise_for_status()
        raw = gzip.decompress(resp.content).decode("utf-8")
    except Exception as e:
        print(f"  下载失败: {e}")
        print("  提示: 如果持续失败，请手动下载:")
        print(f"        {PHISHTANK_CSV_URL}")
        print("        解压后放到 evaluate/phishtank_online-valid.csv")
        sys.exit(1)

    # 解析 CSV
    import csv
    from io import StringIO
    f = StringIO(raw)
    reader = csv.DictReader(f)
    rows = list(reader)
    print(f"  解析成功，共 {len(rows)} 条记录")

    if limit > 0:
        rows = rows[:limit]
        print(f"  截取前 {limit} 条用于评估")

    return rows


def load_local_csv_if_exists() -> list | None:
    """如果本地有手动下载的 CSV，直接加载"""
    local_path = HERE / "phishtank_online-valid.csv"
    if not local_path.exists():
        return None
    import csv
    with open(local_path, encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    print(f"  从本地 CSV 加载 {len(rows)} 条记录: {local_path}")
    return rows


def download_json(limit: int = 0) -> list:
    """尝试下载 PhishTank JSON，失败时回退到 CSV 或本地文件"""
    # 优先用本地 CSV（如果用户已手动下载）
    local = load_local_csv_if_exists()
    if local:
        if limit > 0:
            local = local[:limit]
            print(f"  截取前 {limit} 条用于评估")
        return local

    print("正在从 PhishTank 下载 online-valid.json ...")
    headers = {"User-Agent": USER_AGENT}
    try:
        resp = httpx.get(PHISHTANK_JSON_URL, headers=headers, timeout=30, follow_redirects=True)
        resp.raise_for_status()
        data = resp.json()
        print(f"  JSON 下载成功，共 {len(data)} 条记录")
        if limit > 0:
            data = data[:limit]
            print(f"  截取前 {limit} 条用于评估")
        return data
    except Exception as e:
        print(f"  JSON 下载失败({e})，尝试 CSV ...")
        return download_csv(limit)


def phishtank_to_dataset(records: list) -> list:
    """把 PhishTank JSON/CSV 转成 evaluate/dataset.json 格式"""
    out = []
    for r in records:
        # JSON 字段名
        url = r.get("url", "") or r.get("phish_detail_url", "")
        # CSV 字段名
        if not url:
            url = r.get("url", "")
        if not url:
            continue

        # 构建 dataset 条目（label=1 表示钓鱼）
        item = {
            "label": 1,
            "url": url,
            "pageText": r.get("target", "") or "",
            "links": [],
            "forms": [],
            "html": "",
            "_meta": {
                "phish_id": r.get("phish_id"),
                "submission_time": r.get("submission_time") or r.get("submit_time", ""),
                "verified": r.get("verified"),
                "verification_time": r.get("verification_time") or r.get("verify_time", ""),
                "online": r.get("online"),
            }
        }
        out.append(item)
    return out


def load_existing_dataset() -> list:
    """加载已有的 dataset.json（如果存在），用于追加或合并"""
    if DATASET_OUT.exists():
        with open(DATASET_OUT, encoding="utf-8") as f:
            return json.load(f)
    return []


def main():
    parser = argparse.ArgumentParser(description="下载 PhishTank 数据集")
    parser.add_argument("--limit", type=int, default=0, help="仅下载前 N 条（用于快速测试）")
    parser.add_argument("--merge", action="store_true", help="与已有 dataset.json 合并")
    parser.add_argument("--replace", action="store_true", help="覆盖已有 dataset.json")
    parser.add_argument("--sample-normal", type=int, default=5, help="内置正常样本数量（用于混合）")
    args = parser.parse_args()

    records = download_json(limit=args.limit)
    dataset = phishtank_to_dataset(records)

    # 添加一些内置正常样本（来自 demo）
    normal_samples = [
        {"label": 0, "url": "https://www.google.com", "pageText": "search the world", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://github.com/explore", "pageText": "Explore GitHub", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://www.baidu.com", "pageText": "百度一下，你就知道", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://www.apple.com/shop", "pageText": "Buy iPhone Mac iPad", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://www.taobao.com", "pageText": "淘宝淘 我喜欢", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://www.amazon.com", "pageText": "Shop Online", "links": [], "forms": [], "html": ""},
        {"label": 0, "url": "https://www.microsoft.com", "pageText": "Microsoft Official", "links": [], "forms": [], "html": ""},
    ]
    dataset.extend(normal_samples[: args.sample_normal])

    # 合并或覆盖
    existing = []
    if args.merge and DATASET_OUT.exists():
        existing = load_existing_dataset()
        # 简单去重（按 URL）
        seen = {r["url"] for r in existing}
        for r in dataset:
            if r["url"] not in seen:
                existing.append(r)
        dataset = existing

    if args.replace or not DATASET_OUT.exists():
        with open(DATASET_OUT, "w", encoding="utf-8") as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)
        print(f"\n✅ 已写入 {DATASET_OUT}，共 {len(dataset)} 条")
    else:
        print(f"\n⚠️  {DATASET_OUT} 已存在，请使用 --replace 覆盖或 --merge 合并")

    # 统计
    phish = sum(1 for r in dataset if r["label"] == 1)
    normal = len(dataset) - phish
    print(f"   钓鱼样本: {phish}")
    print(f"   正常样本: {normal}")
    print("\n下一步: python run_eval.py")


if __name__ == "__main__":
    main()
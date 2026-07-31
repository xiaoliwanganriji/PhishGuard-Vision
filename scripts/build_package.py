# PhishGuard-Vision Chrome Web Store 打包脚本
# 用法：在项目根目录运行 python scripts/build_package.py
# 生成：dist/phishguard-vision-v1.1.0.zip

import os
import zipfile
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT_DIR = ROOT / "extension"
DIST_DIR = ROOT / "dist"

# 需要包含的文件/目录（相对于 extension/）
INCLUDE_PATTERNS = [
    "manifest.json",
    "popup.html",
    "popup.js",
    "background.js",
    "contentScript.js",
    "generate_icons.py",  # 可选，方便用户自定义
    "icons",
    "lib",
]

# 明确排除的文件/目录（绝不上传）
EXCLUDE_FILES = {
    ".env", ".env.local", ".env.*",
    "*.pem", "*.key", "*.secret",
    "test_*", "tests",
    "*.log", "*.pyc", "__pycache__",
    ".git", ".gitignore", ".DS_Store", "Thumbs.db",
    "node_modules",
    "*.map",
}

# 版本号（从 manifest.json 读取）
def get_version():
    import json
    manifest_path = EXT_DIR / "manifest.json"
    with open(manifest_path, encoding="utf-8") as f:
        m = json.load(f)
    return m.get("version", "1.0.0")

def should_include(rel_path: str) -> bool:
    """判断文件是否应该包含在包内"""
    parts = rel_path.replace("\\", "/").split("/")
    # 排除特定文件
    for part in parts:
        for excl in EXCLUDE_FILES:
            if "*" in excl:
                import fnmatch
                if fnmatch.fnmatch(part, excl):
                    return False
            elif part == excl:
                return False
    return True

def main():
    version = get_version()
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = DIST_DIR / f"phishguard-vision-v{version}.zip"

    print(f"📦 正在打包 PhishGuard-Vision v{version}...")
    print(f"   源目录: {EXT_DIR}")
    print(f"   输出文件: {zip_path}")

    file_count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for item in INCLUDE_PATTERNS:
            src = EXT_DIR / item
            if src.is_file():
                rel = item
                if should_include(rel):
                    zf.write(src, rel)
                    file_count += 1
                    print(f"   + {rel}")
            elif src.is_dir():
                for root, dirs, files in os.walk(src):
                    # 过滤目录
                    dirs[:] = [d for d in dirs if should_include(d)]
                    for f in files:
                        full = Path(root) / f
                        rel = full.relative_to(EXT_DIR).as_posix()
                        if should_include(rel):
                            zf.write(full, rel)
                            file_count += 1
                            print(f"   + {rel}")
                        else:
                            print(f"   - 跳过(排除): {rel}")
            else:
                print(f"   ! 未找到: {item}")

    size_kb = zip_path.stat().st_size / 1024
    print(f"\n✅ 打包完成！共 {file_count} 个文件，大小 {size_kb:.1f} KB")
    print(f"   路径: {zip_path}")
    print("\n下一步:")
    print("   1. 登录 Chrome Web Store 开发者控制台")
    print("   2. 点击「打包扩展」上传 zip")
    print("   3. 填写商店详情后发布\n")

if __name__ == "__main__":
    main()
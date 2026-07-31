"""生成 PhishGuard-Vision 扩展图标

依赖：Pillow（已在 backend/requirements.txt 中）

运行：python generate_icons.py
生成：icons/icon-16.png / icon-32.png / icon-48.png / icon-128.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT, exist_ok=True)

# 颜色：蓝紫渐变（与 popup 头部 logo 风格一致）
C_TOP = (0, 112, 186)      # #0070ba
C_BOTTOM = (0, 198, 255)   # #00c6ff
C_SHIELD = (255, 255, 255)
C_CHECK = (34, 134, 58)    # #22863a

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def make_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 渐变背景（圆形）
    for y in range(size):
        t = y / max(size - 1, 1)
        color = lerp(C_TOP, C_BOTTOM, t) + (255,)
        draw.line([(0, y), (size, y)], fill=color)

    # 圆形蒙版
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((0, 0, size - 1, size - 1), fill=255)
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg.paste(img, (0, 0), mask)
    img = bg
    draw = ImageDraw.Draw(img)

    # 盾牌形状（白色）
    cx, cy = size / 2, size / 2
    s = size * 0.62
    top = cy - s / 2
    bot = cy + s / 2
    left = cx - s / 2
    right = cx + s / 2
    # 简化盾牌路径
    shield = [
        (cx, top),
        (right, top + s * 0.12),
        (right, top + s * 0.45),
        (cx, bot),
        (left, top + s * 0.45),
        (left, top + s * 0.12),
    ]
    draw.polygon(shield, fill=C_SHIELD)

    # 内部打勾
    if size >= 32:
        line_w = max(2, int(size * 0.08))
        # 勾的三个点
        p1 = (left + s * 0.22, cy)
        p2 = (cx - s * 0.05, cy + s * 0.22)
        p3 = (right - s * 0.18, cy - s * 0.22)
        draw.line([p1, p2], fill=C_CHECK, width=line_w)
        draw.line([p2, p3], fill=C_CHECK, width=line_w)

    out_path = os.path.join(OUT, f"icon-{size}.png")
    img.save(out_path, "PNG")
    print(f"  生成 {out_path}")

if __name__ == "__main__":
    for s in (16, 32, 48, 128):
        make_icon(s)
    print("完成。")

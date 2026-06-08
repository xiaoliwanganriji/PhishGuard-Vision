@echo off
chcp 65001 >nul
title PhishGuard-Vision 后端启动

echo ==========================================
echo   PhishGuard-Vision AI 增强后端
echo ==========================================
echo.

:: 检查 Python 是否可用
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.10+。
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b
)

:: 进入脚本所在目录（即 backend 文件夹）
cd /d "%~dp0"

:: 如果虚拟环境不存在，自动创建
if not exist "venv\Scripts\python.exe" (
    echo [提示] 正在创建 Python 虚拟环境...
    python -m venv venv
)

:: 激活虚拟环境
call venv\Scripts\activate.bat

:: 安装依赖（使用清华镜像加速，静默安装）
echo [提示] 正在检查并安装依赖...
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn -q

:: 检查 .env 配置文件
if not exist ".env" (
    echo [警告] 未找到 .env 文件，AI 功能将不会启用。
    echo 如需使用 AI 增强，请复制 .env.example 为 .env 并填入你的 DeepSeek API Key。
    echo.
)

:: 启动后端
echo [提示] 正在启动后端服务...
echo 服务地址：http://127.0.0.1:8000
echo 按 Ctrl+C 可停止服务。
echo ==========================================
python app.py

pause
@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion
cd /d "%~dp0"

title PhishGuard-Vision Backend Manager

REM ============================================================
REM  PhishGuard-Vision 后端 一键管理脚本
REM  功能：安装依赖 / 启动 / 停止 / 重启 / 状态检查
REM  用法：双击运行，按菜单选择
REM ============================================================

:MENU
cls
echo.
echo   ╔══════════════════════════════════════════════════╗
echo   ║     PhishGuard-Vision 后端管理工具 v2.0         ║
echo   ╚══════════════════════════════════════════════════╝
echo.
echo   1) 启动后端（首次会自动安装依赖）
echo   2) 停止后端
echo   3) 重启后端
echo   4) 查看后端状态
echo   5) 配置 AI 模型（API Key 等）
echo   6) 运行健康检查
echo   7) 重置配置
echo   0) 退出
echo.
echo   当前目录: %~dp0
echo.

choice /c 12345670 /n /m "  请选择操作: "
set CHOICE=%errorlevel%

if "%CHOICE%"=="8" goto ACTION_START
if "%CHOICE%"=="7" goto ACTION_RESET
if "%CHOICE%"=="6" goto ACTION_CHECK
if "%CHOICE%"=="5" goto ACTION_CONFIG
if "%CHOICE%"=="4" goto ACTION_STATUS
if "%CHOICE%"=="3" goto ACTION_RESTART
if "%CHOICE%"=="2" goto ACTION_STOP
if "%CHOICE%"=="1" goto ACTION_START
if "%CHOICE%"=="0" goto END
goto MENU

REM ============================================================
REM  启动后端
REM ============================================================
:ACTION_START
cls
echo.
echo   ═══════════════════════════════════════════════════
echo   启动 PhishGuard-Vision 后端...
echo   ═══════════════════════════════════════════════════
echo.

REM --- Step 0: 检查端口占用 ---
echo   [0/6] 检查端口 8000 是否被占用...
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [WARN] 端口 8000 已被占用！
    echo.
    echo   正在尝试停止占用进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1
        echo     已终止进程 PID=%%a
    )
    timeout /t 2 /nobreak >nul
    echo.
)
echo         端口可用 ✓

REM --- Step 1: 检查是否已在运行 ---
echo   [1/6] 检查后端是否已在运行...
if exist ".backend_pid" (
    set /p EXIST_PID=<.backend_pid
    if defined EXIST_PID (
        tasklist /FI "PID eq !EXIST_PID!" 2>nul | findstr "!EXIST_PID!" >nul
        if !errorlevel!==0 (
            echo   [INFO] 后端已在运行 ^(PID: !EXIST_PID!^)
            echo.
            goto SHOW_STATUS
        )
    )
    del ".backend_pid" >nul 2>&1
)
echo         后端未运行 ✓

REM --- Step 2: 检查 Python ---
echo   [2/6] 检查 Python 环境...
set PY=
python --version >nul 2>&1
if %errorlevel%==0 (
    set PY=python
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PYVER=%%v
)
if not defined PY (
    py -3 --version >nul 2>&1
    if %errorlevel%==0 (
        set PY=py -3
        for /f "tokens=*" %%v in ('py -3 --version 2^>^&1') do set PYVER=%%v
    )
)
if not defined PY (
    echo.
    echo   [ERROR] 未检测到 Python！
    echo   请安装 Python 3.10+：https://www.python.org/downloads/
    echo   安装时请勾选 "Add Python to PATH"
    echo.
    pause
    goto MENU
)
echo         检测到 %PYVER% ✓

REM --- Step 3: 创建虚拟环境 ---
echo   [3/6] 准备虚拟环境...
set "VPY=%~dp0venv\Scripts\python.exe"
if not exist "%VPY%" (
    echo         创建虚拟环境 venv/ ...
    %PY% -m venv venv
    if errorlevel 1 (
        echo.
        echo   [ERROR] 虚拟环境创建失败！
        echo   可能原因：Python 未正确安装或权限不足
        echo.
        pause
        goto MENU
    )
    echo         虚拟环境创建完成 ✓
) else (
    echo         虚拟环境已存在 ✓
)

REM --- Step 4: 安装/检查依赖 ---
echo   [4/6] 检查 Python 依赖...
"%VPY%" -c "import fastapi,httpx,uvicorn,dotenv,pydantic,PIL" >nul 2>&1
if %errorlevel%==0 (
    echo         依赖已就绪 ✓
) else (
    echo         安装依赖（使用清华镜像加速）...
    "%VPY%" -m pip install fastapi uvicorn httpx python-dotenv pydantic Pillow -i https://pypi.tuna.tsinghua.edu.cn/simple -q
    if errorlevel 1 (
        echo         镜像源失败，尝试默认源...
        "%VPY%" -m pip install fastapi uvicorn httpx python-dotenv pydantic Pillow -q
        if errorlevel 1 (
            echo.
            echo   [ERROR] 依赖安装失败！
            echo   请检查网络连接后重试
            echo.
            pause
            goto MENU
        )
    )
    echo         依赖安装完成 ✓
)

REM --- Step 5: 检查/创建 .env 配置 ---
echo   [5/6] 检查配置文件...
if not exist ".env" (
    echo.
    echo   [INFO] 未检测到 .env 配置文件
    echo.
    echo   是否现在配置 AI 模型？
    echo   - 输入 Y 立即配置（推荐）
    echo   - 输入 N 跳过，后端将以离线模式启动
    echo.
    choice /c YN /n /m "  是否配置: "
    if !errorlevel!==1 goto CONFIG_NOW
    goto CREATE_ENV_TEMPLATE
) else (
    echo         .env 已存在 ✓
)
goto READ_ENV

:CONFIG_NOW
call :DO_CONFIG
goto READ_ENV

:CREATE_ENV_TEMPLATE
echo.
echo   [INFO] 创建默认 .env 模板...
(
    echo # PhishGuard-Vision 后端配置
    echo OPENAI_API_KEY=
    echo OPENAI_BASE_URL=https://api.deepseek.com/v1
    echo MODEL_NAME=deepseek-chat
    echo USE_AI_TEXT=false
    echo PHISHGUARD_TOKEN=
) > .env
echo         已创建 .env（AI 模式未启用）
echo.
echo   如需启用 AI 审查，请运行 "5) 配置 AI 模型"
echo.

:READ_ENV
REM --- Step 6: 启动后端 ---
echo   [6/6] 启动后端服务...
echo.

REM 启动后端，捕获 PID
start "PhishGuard-Vision Backend" /D "%~dp0" "%VPY%" app.py

REM 等待启动
timeout /t 3 /nobreak >nul

REM 检查是否成功启动
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
        echo %%a > ".backend_pid"
    )
    echo.
    echo   ╔══════════════════════════════════════════════════╗
    echo   ║  ✅ 后端启动成功！                                ║
    echo   ╚══════════════════════════════════════════════════╝
    echo.
    echo   地址: http://127.0.0.1:8000
    echo   健康检查: http://127.0.0.1:8000/health
    echo   API 测试: http://127.0.0.1:8000/test
    echo   模型列表: http://127.0.0.1:8000/models
    echo.
    echo   AI 模式:
    "%VPY%" -c "from dotenv import load_dotenv; load_dotenv(); import os; print('    已启用' if os.getenv('USE_AI_TEXT')=='true' and os.getenv('OPENAI_API_KEY') else '    未启用（离线模式）')"
    echo.
    echo   提示：保持此窗口打开，关闭窗口将停止后端服务
    echo         如需后台运行，可使用 "nssm" 或 Windows 任务计划
    echo.
) else (
    echo.
    echo   [ERROR] 后端启动失败！
    echo   端口 8000 未被监听，可能是启动过程中出错
    echo.
    echo   请检查：
    echo     1. Python 版本是否为 3.10+
    echo     2. 依赖是否完整安装
    echo     3. .env 配置是否正确
    echo     4. 查看是否有错误弹窗
    echo.
)
echo.
pause
goto MENU

REM ============================================================
REM  停止后端
REM ============================================================
:ACTION_STOP
cls
echo.
echo   ═══════════════════════════════════════════════════
echo   停止 PhishGuard-Vision 后端...
echo   ═══════════════════════════════════════════════════
echo.

if not exist ".backend_pid" (
    echo   [INFO] 无后端进程记录
    goto FORCE_STOP
)

set /p EXIST_PID=<.backend_pid 2>nul
if not defined EXIST_PID goto FORCE_STOP

tasklist /FI "PID eq %EXIST_PID%" 2>nul | findstr "%EXIST_PID%" >nul
if %errorlevel%==0 (
    echo   正在终止后端进程 (PID: %EXIST_PID%)...
    taskkill /PID %EXIST_PID% /F >nul 2>&1
    if %errorlevel%==0 (
        echo   [OK] 后端已停止
    ) else (
        echo   [WARN] 进程终止失败，尝试强制停止所有后端...
        goto FORCE_STOP
    )
    del ".backend_pid" >nul 2>&1
) else (
    echo   [INFO] 记录的进程已不存在
    del ".backend_pid" >nul 2>&1
    goto FORCE_STOP
)

echo.
pause
goto MENU

:FORCE_STOP
echo.
echo   正在搜索所有 PhishGuard 相关进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    echo     终止 PID %%a ...
    taskkill /PID %%a /F >nul 2>&1
)
echo.
echo   [OK] 所有后端进程已停止
echo   清理 PID 记录...
del ".backend_pid" >nul 2>&1
echo.
pause
goto MENU

REM ============================================================
REM  重启后端
REM ============================================================
:ACTION_RESTART
cls
echo.
echo   ═══════════════════════════════════════════════════
echo   重启 PhishGuard-Vision 后端...
echo   ═══════════════════════════════════════════════════
echo.

echo   第 1 步：停止现有后端...
call :ACTION_STOP_SILENT

echo.
echo   第 2 步：等待 2 秒...
timeout /t 2 /nobreak >nul

echo.
echo   第 3 步：启动后端...
call :ACTION_START_SILENT
goto MENU

:ACTION_STOP_SILENT
if exist ".backend_pid" (
    set /p EXIST_PID=<.backend_pid 2>nul
    if defined EXIST_PID (
        taskkill /PID %EXIST_PID% /F >nul 2>&1
    )
    del ".backend_pid" >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
goto :eof

:ACTION_START_SILENT
set "VPY=%~dp0venv\Scripts\python.exe"
if not exist "%VPY%" goto :eof
start "PhishGuard-Vision Backend" /D "%~dp0" "%VPY%" app.py
timeout /t 3 /nobreak >nul
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
        echo %%a > ".backend_pid"
    )
    echo   [OK] 重启成功
) else (
    echo   [WARN] 重启可能失败，请检查
)
goto :eof

REM ============================================================
REM  查看状态
REM ============================================================
:ACTION_STATUS
cls
echo.
echo   ═══════════════════════════════════════════════════
echo   PhishGuard-Vision 后端状态
echo   ═══════════════════════════════════════════════════
echo.

set STATUS_RUNNING=No
set STATUS_PORT=Free

netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    set STATUS_RUNNING=Yes
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do set STATUS_PID=%%a
    set STATUS_PORT=Occupied
)

echo   运行状态: !STATUS_RUNNING!
if defined STATUS_PID echo   进程 PID: !STATUS_PID!
echo   端口状态: !STATUS_PORT!

echo.
if exist ".env" (
    echo   配置状态: 已配置
    echo   配置文件: .env
) else (
    echo   配置状态: 未配置
)

echo.
echo   配置详情：
if exist ".env" (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        set "KEY=%%a"
        set "VAL=%%b"
        if "!KEY!"=="OPENAI_API_KEY" (
            if defined VAL (
                echo     API Key: 已设置 ^(隐藏^)
            ) else (
                echo     API Key: 未设置
            )
        ) else if "!KEY!"=="USE_AI_TEXT" (
            echo     AI 模式: !VAL!
        ) else if "!KEY!"=="PHISHGUARD_TOKEN" (
            if defined VAL (
                echo     Token: 已配置 ^(隐藏^)
            ) else (
                echo     Token: 未配置
            )
        ) else (
            echo     !KEY!=!VAL!
        )
    )
) else (
    echo     (无 .env 文件)
)

echo.
if "!STATUS_RUNNING!"=="Yes" (
    echo   访问地址:
    echo     http://127.0.0.1:8000/health
    echo     http://127.0.0.1:8000/test
    echo     http://127.0.0.1:8000/docs
)
echo.
pause
goto MENU

REM ============================================================
REM  配置 AI
REM ============================================================
:ACTION_CONFIG
cls
echo.
echo   ═══════════════════════════════════════════════════
echo   配置 PhishGuard-Vision AI 模型
echo   ═══════════════════════════════════════════════════
echo.
echo   当前配置：
if exist ".env" (
    type .env
) else (
    echo     （无 .env 文件）
)
echo.
echo   请按提示输入（直接回车使用默认值）
echo.
call :DO_CONFIG
echo.
echo   配置已更新！
echo   如需重启后端，请选择 "3) 重启后端"
echo.
pause
goto MENU

:DO_CONFIG
set /p IN_KEY="  API Key (输入你的 DeepSeek API Key): "
if "!IN_KEY!"=="" (
    for /f "tokens=1,* delims==" %%a in ('type .env 2^>nul') do (
        if "%%a"=="OPENAI_API_KEY" set IN_KEY=%%b
    )
)

set /p IN_URL="  API Base URL [https://api.deepseek.com/v1]: "
if "!IN_URL!"=="" set IN_URL=https://api.deepseek.com/v1

set /p IN_MODEL="  模型名称 [deepseek-chat]: "
if "!IN_MODEL!"=="" set IN_MODEL=deepseek-chat

echo.
echo   是否启用 AI 审查功能？(需要付费 API Key)
choice /c YN /n /m "   启用 AI: "
set IN_USE=!errorlevel!==1

set /p IN_TOKEN="  安全 Token [留空自动生成]: "
if "!IN_TOKEN!"=="" (
    for /f "delims=" %%a in ('powershell -Command "[guid]::NewGuid().ToString('N')"') do set IN_TOKEN=%%a
)

(
    echo OPENAI_API_KEY=!IN_KEY!
    echo OPENAI_BASE_URL=!IN_URL!
    echo MODEL_NAME=!IN_MODEL!
    echo USE_AI_TEXT=!IN_USE!
    echo PHISHGUARD_TOKEN=!IN_TOKEN!
) > .env
echo.
echo   配置已保存到 .env
goto :eof

REM ============================================================
REM  健康检查
REM ============================================================
:ACTION_CHECK
cls
echo.
echo   ═══════════════════════════════════════════════════
echo   健康检查
echo   ═══════════════════════════════════════════════════
echo.

set "VPY=%~dp0venv\Scripts\python.exe"
if not exist "%VPY%" (
    echo   [WARN] 虚拟环境未创建，请先启动后端
    echo.
    pause
    goto MENU
)

echo   检查 1: 后端健康接口 (/health)...
"%VPY%" -c "import urllib.request,json,sys;r=urllib.request.urlopen('http://127.0.0.1:8000/health',timeout=5);d=json.loads(r.read());print('     [OK] 后端运行中, ai_enabled='+str(d.get('ai_enabled'))+', model='+str(d.get('model')))"
if errorlevel 1 (
    echo     [FAIL] 后端未运行或无法访问
    echo     请先启动后端再测试
    echo.
    pause
    goto MENU
)

echo.
echo   检查 2: AI 连接测试 (/test)...
echo     （需要有效 API Key，否则会失败）
"%VPY%" -c "import urllib.request,json,sys;r=urllib.request.urlopen('http://127.0.0.1:8000/test',timeout=15);d=json.loads(r.read());print('     [OK] 连接测试成功' if d.get('ok') else '     [FAIL] '+str(d.get('error','未知错误')))" 2>&1
if errorlevel 1 (
    echo     [INFO] AI 连接测试超时或失败
    echo     这是正常的（如果你未配置 API Key 或网络受限）
    echo.
)

echo.
echo   检查 3: 依赖完整性...
"%VPY%" -c "import fastapi,httpx,uvicorn,dotenv,pydantic;print('     [OK] 所有依赖已安装')" 2>&1
if errorlevel 1 (
    echo     [FAIL] 部分依赖缺失，请重新启动后端
)

echo.
pause
goto MENU

REM ============================================================
REM  重置配置
REM ============================================================
:ACTION_RESET
cls
echo.
echo   ═══════════════════════════════════════════════════
echo   重置配置
echo   ═══════════════════════════════════════════════════
echo.
echo   这将删除 .env 配置文件（不影响代码和依赖）
echo.
choice /c YN /n /m "  确认删除 .env: "
if !errorlevel!==1 (
    if exist ".env" (
        del ".env"
        echo   [OK] .env 已删除
    ) else (
        echo   [INFO] .env 不存在
    )
) else (
    echo   已取消
)
echo.
pause
goto MENU

:END
endlocal
exit /b 0
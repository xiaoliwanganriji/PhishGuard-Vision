@echo off
<<<<<<< HEAD
chcp 65001 >nul 2>&1
=======
chcp 936 >nul 2>&1
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
setlocal enabledelayedexpansion
cd /d "%~dp0"

title PhishGuard-Vision Backend Manager

REM ============================================================
<<<<<<< HEAD
REM  PhishGuard-Vision åŽç«¯ ä¸€é”®ç®¡ç†è„šæœ¬
REM  åŠŸèƒ½ï¼šå®‰è£…ä¾èµ– / å¯åŠ¨ / åœæ­¢ / é‡å¯ / çŠ¶æ€æ£€æŸ¥
REM  ç”¨æ³•ï¼šåŒå‡»è¿è¡Œï¼ŒæŒ‰èœå•é€‰æ‹©
=======
REM  PhishGuard-Vision ºó¶Ë Ò»¼ü¹ÜÀí½Å±¾
REM  ¹¦ÄÜ£º°²×°ÒÀÀµ / Æô¶¯ / Í£Ö¹ / ÖØÆô / ×´Ì¬¼ì²é
REM  ÓÃ·¨£ºË«»÷ÔËÐÐ£¬°´²Ëµ¥Ñ¡Ôñ
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
REM ============================================================

:MENU
cls
echo.
<<<<<<< HEAD
echo   â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
echo   â•‘     PhishGuard-Vision åŽç«¯ç®¡ç†å·¥å…· v2.0         â•‘
echo   â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
echo   1) å¯åŠ¨åŽç«¯ï¼ˆé¦–æ¬¡ä¼šè‡ªåŠ¨å®‰è£…ä¾èµ–ï¼‰
echo   2) åœæ­¢åŽç«¯
echo   3) é‡å¯åŽç«¯
echo   4) æŸ¥çœ‹åŽç«¯çŠ¶æ€
echo   5) é…ç½® AI æ¨¡åž‹ï¼ˆAPI Key ç­‰ï¼‰
echo   6) è¿è¡Œå¥åº·æ£€æŸ¥
echo   7) é‡ç½®é…ç½®
echo   0) é€€å‡º
echo.
echo   å½“å‰ç›®å½•: %~dp0
echo.

choice /c 12345670 /n /m "  è¯·é€‰æ‹©æ“ä½œ: "
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
REM  å¯åŠ¨åŽç«¯
=======
echo   +==================================================+
echo   ^|     PhishGuard-Vision ºó¶Ë¹ÜÀí¹¤¾ß v2.0         ^|
echo   +==================================================+
echo.
echo   1) Æô¶¯ºó¶Ë£¨Ê×´Î»á×Ô¶¯°²×°ÒÀÀµ£©
echo   2) Í£Ö¹ºó¶Ë
echo   3) ÖØÆôºó¶Ë
echo   4) ²é¿´ºó¶Ë×´Ì¬
echo   5) ÅäÖÃ AI Ä£ÐÍ£¨API Key µÈ£©
echo   6) ÔËÐÐ½¡¿µ¼ì²é
echo   7) ÖØÖÃÅäÖÃ
echo   0) ÍË³ö
echo.
echo   µ±Ç°Ä¿Â¼: %~dp0
echo.

choice /c 12345670 /n /m "  ÇëÑ¡Ôñ²Ù×÷: "
set CHOICE=%errorlevel%

if "%CHOICE%"=="1" goto ACTION_START
if "%CHOICE%"=="2" goto ACTION_STOP
if "%CHOICE%"=="3" goto ACTION_RESTART
if "%CHOICE%"=="4" goto ACTION_STATUS
if "%CHOICE%"=="5" goto ACTION_CONFIG
if "%CHOICE%"=="6" goto ACTION_CHECK
if "%CHOICE%"=="7" goto ACTION_RESET
if "%CHOICE%"=="8" goto END
goto MENU

REM ============================================================
REM  Æô¶¯ºó¶Ë
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
REM ============================================================
:ACTION_START
cls
echo.
<<<<<<< HEAD
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo   å¯åŠ¨ PhishGuard-Vision åŽç«¯...
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.

REM --- Step 0: æ£€æŸ¥ç«¯å£å ç”¨ ---
echo   [0/6] æ£€æŸ¥ç«¯å£ 8000 æ˜¯å¦è¢«å ç”¨...
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [WARN] ç«¯å£ 8000 å·²è¢«å ç”¨ï¼
    echo.
    echo   æ­£åœ¨å°è¯•åœæ­¢å ç”¨è¿›ç¨‹...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1
        echo     å·²ç»ˆæ­¢è¿›ç¨‹ PID=%%a
=======
echo   ===================================================
echo   Æô¶¯ PhishGuard-Vision ºó¶Ë...
echo   ===================================================
echo.

REM --- Step 0: ¼ì²é¶Ë¿ÚÕ¼ÓÃ ---
echo   [0/6] ¼ì²é¶Ë¿Ú 8000 ÊÇ·ñ±»Õ¼ÓÃ...
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [WARN] ¶Ë¿Ú 8000 ÒÑ±»Õ¼ÓÃ£¡
    echo.
    echo   ÕýÔÚ³¢ÊÔÍ£Ö¹Õ¼ÓÃ½ø³Ì...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1
        echo     ÒÑÖÕÖ¹½ø³Ì PID=%%a
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    )
    timeout /t 2 /nobreak >nul
    echo.
)
<<<<<<< HEAD
echo         ç«¯å£å¯ç”¨ âœ“

REM --- Step 1: æ£€æŸ¥æ˜¯å¦å·²åœ¨è¿è¡Œ ---
echo   [1/6] æ£€æŸ¥åŽç«¯æ˜¯å¦å·²åœ¨è¿è¡Œ...
=======
echo         ¶Ë¿Ú¿ÉÓÃ ?

REM --- Step 1: ¼ì²éÊÇ·ñÒÑÔÚÔËÐÐ ---
echo   [1/6] ¼ì²éºó¶ËÊÇ·ñÒÑÔÚÔËÐÐ...
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
if exist ".backend_pid" (
    set /p EXIST_PID=<.backend_pid
    if defined EXIST_PID (
        tasklist /FI "PID eq !EXIST_PID!" 2>nul | findstr "!EXIST_PID!" >nul
        if !errorlevel!==0 (
<<<<<<< HEAD
            echo   [INFO] åŽç«¯å·²åœ¨è¿è¡Œ ^(PID: !EXIST_PID!^)
=======
            echo   [INFO] ºó¶ËÒÑÔÚÔËÐÐ ^(PID: !EXIST_PID!^)
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
            echo.
            goto SHOW_STATUS
        )
    )
    del ".backend_pid" >nul 2>&1
)
<<<<<<< HEAD
echo         åŽç«¯æœªè¿è¡Œ âœ“

REM --- Step 2: æ£€æŸ¥ Python ---
echo   [2/6] æ£€æŸ¥ Python çŽ¯å¢ƒ...
=======
echo         ºó¶ËÎ´ÔËÐÐ ?

REM --- Step 2: ¼ì²é Python ---
echo   [2/6] ¼ì²é Python »·¾³...
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
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
<<<<<<< HEAD
    echo   [ERROR] æœªæ£€æµ‹åˆ° Pythonï¼
    echo   è¯·å®‰è£… Python 3.10+ï¼šhttps://www.python.org/downloads/
    echo   å®‰è£…æ—¶è¯·å‹¾é€‰ "Add Python to PATH"
=======
    echo   [ERROR] Î´¼ì²âµ½ Python£¡
    echo   Çë°²×° Python 3.10+£ºhttps://www.python.org/downloads/
    echo   °²×°Ê±Çë¹´Ñ¡ "Add Python to PATH"
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    echo.
    pause
    goto MENU
)
<<<<<<< HEAD
echo         æ£€æµ‹åˆ° %PYVER% âœ“

REM --- Step 3: åˆ›å»ºè™šæ‹ŸçŽ¯å¢ƒ ---
echo   [3/6] å‡†å¤‡è™šæ‹ŸçŽ¯å¢ƒ...
set "VPY=%~dp0venv\Scripts\python.exe"
if not exist "%VPY%" (
    echo         åˆ›å»ºè™šæ‹ŸçŽ¯å¢ƒ venv/ ...
    %PY% -m venv venv
    if errorlevel 1 (
        echo.
        echo   [ERROR] è™šæ‹ŸçŽ¯å¢ƒåˆ›å»ºå¤±è´¥ï¼
        echo   å¯èƒ½åŽŸå› ï¼šPython æœªæ­£ç¡®å®‰è£…æˆ–æƒé™ä¸è¶³
=======
echo         ¼ì²âµ½ %PYVER% ?

REM --- Step 3: ´´½¨ÐéÄâ»·¾³ ---
echo   [3/6] ×¼±¸ÐéÄâ»·¾³...
set "VPY=%~dp0venv\Scripts\python.exe"
if not exist "%VPY%" (
    echo         ´´½¨ÐéÄâ»·¾³ venv/ ...
    %PY% -m venv venv
    if errorlevel 1 (
        echo.
        echo   [ERROR] ÐéÄâ»·¾³´´½¨Ê§°Ü£¡
        echo   ¿ÉÄÜÔ­Òò£ºPython Î´ÕýÈ·°²×°»òÈ¨ÏÞ²»×ã
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
        echo.
        pause
        goto MENU
    )
<<<<<<< HEAD
    echo         è™šæ‹ŸçŽ¯å¢ƒåˆ›å»ºå®Œæˆ âœ“
) else (
    echo         è™šæ‹ŸçŽ¯å¢ƒå·²å­˜åœ¨ âœ“
)

REM --- Step 4: å®‰è£…/æ£€æŸ¥ä¾èµ– ---
echo   [4/6] æ£€æŸ¥ Python ä¾èµ–...
"%VPY%" -c "import fastapi,httpx,uvicorn,dotenv,pydantic,PIL" >nul 2>&1
if %errorlevel%==0 (
    echo         ä¾èµ–å·²å°±ç»ª âœ“
) else (
    echo         å®‰è£…ä¾èµ–ï¼ˆä½¿ç”¨æ¸…åŽé•œåƒåŠ é€Ÿï¼‰...
    "%VPY%" -m pip install fastapi uvicorn httpx python-dotenv pydantic Pillow -i https://pypi.tuna.tsinghua.edu.cn/simple -q
    if errorlevel 1 (
        echo         é•œåƒæºå¤±è´¥ï¼Œå°è¯•é»˜è®¤æº...
        "%VPY%" -m pip install fastapi uvicorn httpx python-dotenv pydantic Pillow -q
        if errorlevel 1 (
            echo.
            echo   [ERROR] ä¾èµ–å®‰è£…å¤±è´¥ï¼
            echo   è¯·æ£€æŸ¥ç½‘ç»œè¿žæŽ¥åŽé‡è¯•
=======
    echo         ÐéÄâ»·¾³´´½¨Íê³É ?
) else (
    echo         ÐéÄâ»·¾³ÒÑ´æÔÚ ?
)

REM --- Step 4: °²×°/¼ì²éÒÀÀµ ---
echo   [4/6] ¼ì²é Python ÒÀÀµ...
"%VPY%" -c "import fastapi,httpx,uvicorn,dotenv,pydantic,PIL" >nul 2>&1
if %errorlevel%==0 (
    echo         ÒÀÀµÒÑ¾ÍÐ÷ ?
) else (
    echo         °²×°ÒÀÀµ£¨Ê¹ÓÃÇå»ª¾µÏñ¼ÓËÙ£©...
    "%VPY%" -m pip install fastapi uvicorn httpx python-dotenv pydantic Pillow -i https://pypi.tuna.tsinghua.edu.cn/simple -q
    if errorlevel 1 (
        echo         ¾µÏñÔ´Ê§°Ü£¬³¢ÊÔÄ¬ÈÏÔ´...
        "%VPY%" -m pip install fastapi uvicorn httpx python-dotenv pydantic Pillow -q
        if errorlevel 1 (
            echo.
            echo   [ERROR] ÒÀÀµ°²×°Ê§°Ü£¡
            echo   Çë¼ì²éÍøÂçÁ¬½ÓºóÖØÊÔ
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
            echo.
            pause
            goto MENU
        )
    )
<<<<<<< HEAD
    echo         ä¾èµ–å®‰è£…å®Œæˆ âœ“
)

REM --- Step 5: æ£€æŸ¥/åˆ›å»º .env é…ç½® ---
echo   [5/6] æ£€æŸ¥é…ç½®æ–‡ä»¶...
if not exist ".env" (
    echo.
    echo   [INFO] æœªæ£€æµ‹åˆ° .env é…ç½®æ–‡ä»¶
    echo.
    echo   æ˜¯å¦çŽ°åœ¨é…ç½® AI æ¨¡åž‹ï¼Ÿ
    echo   - è¾“å…¥ Y ç«‹å³é…ç½®ï¼ˆæŽ¨èï¼‰
    echo   - è¾“å…¥ N è·³è¿‡ï¼ŒåŽç«¯å°†ä»¥ç¦»çº¿æ¨¡å¼å¯åŠ¨
    echo.
    choice /c YN /n /m "  æ˜¯å¦é…ç½®: "
    if !errorlevel!==1 goto CONFIG_NOW
    goto CREATE_ENV_TEMPLATE
) else (
    echo         .env å·²å­˜åœ¨ âœ“
=======
    echo         ÒÀÀµ°²×°Íê³É ?
)

REM --- Step 5: ¼ì²é/´´½¨ .env ÅäÖÃ ---
echo   [5/6] ¼ì²éÅäÖÃÎÄ¼þ...
if not exist ".env" (
    echo.
    echo   [INFO] Î´¼ì²âµ½ .env ÅäÖÃÎÄ¼þ
    echo.
    echo   ÊÇ·ñÏÖÔÚÅäÖÃ AI Ä£ÐÍ£¿
    echo   - ÊäÈë Y Á¢¼´ÅäÖÃ£¨ÍÆ¼ö£©
    echo   - ÊäÈë N Ìø¹ý£¬ºó¶Ë½«ÒÔÀëÏßÄ£Ê½Æô¶¯
    echo.
    choice /c YN /n /m "  ÊÇ·ñÅäÖÃ: "
    if !errorlevel!==1 goto CONFIG_NOW
    goto CREATE_ENV_TEMPLATE
) else (
    echo         .env ÒÑ´æÔÚ ?
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
)
goto READ_ENV

:CONFIG_NOW
call :DO_CONFIG
goto READ_ENV

:CREATE_ENV_TEMPLATE
echo.
<<<<<<< HEAD
echo   [INFO] åˆ›å»ºé»˜è®¤ .env æ¨¡æ¿...
(
    echo # PhishGuard-Vision åŽç«¯é…ç½®
=======
echo   [INFO] ´´½¨Ä¬ÈÏ .env Ä£°å...
(
    echo # PhishGuard-Vision ºó¶ËÅäÖÃ
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    echo OPENAI_API_KEY=
    echo OPENAI_BASE_URL=https://api.deepseek.com/v1
    echo MODEL_NAME=deepseek-chat
    echo USE_AI_TEXT=false
    echo PHISHGUARD_TOKEN=
) > .env
<<<<<<< HEAD
echo         å·²åˆ›å»º .envï¼ˆAI æ¨¡å¼æœªå¯ç”¨ï¼‰
echo.
echo   å¦‚éœ€å¯ç”¨ AI å®¡æŸ¥ï¼Œè¯·è¿è¡Œ "5) é…ç½® AI æ¨¡åž‹"
echo.

:READ_ENV
REM --- Step 6: å¯åŠ¨åŽç«¯ ---
echo   [6/6] å¯åŠ¨åŽç«¯æœåŠ¡...
echo.

REM å¯åŠ¨åŽç«¯ï¼Œæ•èŽ· PID
start "PhishGuard-Vision Backend" /D "%~dp0" "%VPY%" app.py

REM ç­‰å¾…å¯åŠ¨
timeout /t 3 /nobreak >nul

REM æ£€æŸ¥æ˜¯å¦æˆåŠŸå¯åŠ¨
=======
echo         ÒÑ´´½¨ .env£¨AI Ä£Ê½Î´ÆôÓÃ£©
echo.
echo   ÈçÐèÆôÓÃ AI Éó²é£¬ÇëÔËÐÐ "5) ÅäÖÃ AI Ä£ÐÍ"
echo.

:READ_ENV
REM --- Step 6: Æô¶¯ºó¶Ë ---
echo   [6/6] Æô¶¯ºó¶Ë·þÎñ...
echo.

REM Æô¶¯ºó¶Ë£¬²¶»ñ PID
start "PhishGuard-Vision Backend" /D "%~dp0" "%VPY%" app.py

REM µÈ´ýÆô¶¯
timeout /t 3 /nobreak >nul

REM ¼ì²éÊÇ·ñ³É¹¦Æô¶¯
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
        echo %%a > ".backend_pid"
    )
    echo.
<<<<<<< HEAD
    echo   â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
    echo   â•‘  âœ… åŽç«¯å¯åŠ¨æˆåŠŸï¼                                â•‘
    echo   â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    echo.
    echo   åœ°å€: http://127.0.0.1:8000
    echo   å¥åº·æ£€æŸ¥: http://127.0.0.1:8000/health
    echo   API æµ‹è¯•: http://127.0.0.1:8000/test
    echo   æ¨¡åž‹åˆ—è¡¨: http://127.0.0.1:8000/models
    echo.
    echo   AI æ¨¡å¼:
    "%VPY%" -c "from dotenv import load_dotenv; load_dotenv(); import os; print('    å·²å¯ç”¨' if os.getenv('USE_AI_TEXT')=='true' and os.getenv('OPENAI_API_KEY') else '    æœªå¯ç”¨ï¼ˆç¦»çº¿æ¨¡å¼ï¼‰')"
    echo.
    echo   æç¤ºï¼šä¿æŒæ­¤çª—å£æ‰“å¼€ï¼Œå…³é—­çª—å£å°†åœæ­¢åŽç«¯æœåŠ¡
    echo         å¦‚éœ€åŽå°è¿è¡Œï¼Œå¯ä½¿ç”¨ "nssm" æˆ– Windows ä»»åŠ¡è®¡åˆ’
    echo.
) else (
    echo.
    echo   [ERROR] åŽç«¯å¯åŠ¨å¤±è´¥ï¼
    echo   ç«¯å£ 8000 æœªè¢«ç›‘å¬ï¼Œå¯èƒ½æ˜¯å¯åŠ¨è¿‡ç¨‹ä¸­å‡ºé”™
    echo.
    echo   è¯·æ£€æŸ¥ï¼š
    echo     1. Python ç‰ˆæœ¬æ˜¯å¦ä¸º 3.10+
    echo     2. ä¾èµ–æ˜¯å¦å®Œæ•´å®‰è£…
    echo     3. .env é…ç½®æ˜¯å¦æ­£ç¡®
    echo     4. æŸ¥çœ‹æ˜¯å¦æœ‰é”™è¯¯å¼¹çª—
=======
    echo   +==================================================+
    echo   ^|  ? ºó¶ËÆô¶¯³É¹¦£¡                                ^|
    echo   +==================================================+
    echo.
    echo   µØÖ·: http://127.0.0.1:8000
    echo   ½¡¿µ¼ì²é: http://127.0.0.1:8000/health
    echo   API ²âÊÔ: http://127.0.0.1:8000/test
    echo   Ä£ÐÍÁÐ±í: http://127.0.0.1:8000/models
    echo.
    echo   AI Ä£Ê½:
    "%VPY%" -c "from dotenv import load_dotenv; load_dotenv(); import os; print('    ÒÑÆôÓÃ' if os.getenv('USE_AI_TEXT')=='true' and os.getenv('OPENAI_API_KEY') else '    Î´ÆôÓÃ£¨ÀëÏßÄ£Ê½£©')"
    echo.
    echo   ÌáÊ¾£º±£³Ö´Ë´°¿Ú´ò¿ª£¬¹Ø±Õ´°¿Ú½«Í£Ö¹ºó¶Ë·þÎñ
    echo         ÈçÐèºóÌ¨ÔËÐÐ£¬¿ÉÊ¹ÓÃ "nssm" »ò Windows ÈÎÎñ¼Æ»®
    echo.
) else (
    echo.
    echo   [ERROR] ºó¶ËÆô¶¯Ê§°Ü£¡
    echo   ¶Ë¿Ú 8000 Î´±»¼àÌý£¬¿ÉÄÜÊÇÆô¶¯¹ý³ÌÖÐ³ö´í
    echo.
    echo   Çë¼ì²é£º
    echo     1. Python °æ±¾ÊÇ·ñÎª 3.10+
    echo     2. ÒÀÀµÊÇ·ñÍêÕû°²×°
    echo     3. .env ÅäÖÃÊÇ·ñÕýÈ·
    echo     4. ²é¿´ÊÇ·ñÓÐ´íÎóµ¯´°
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    echo.
)
echo.
pause
goto MENU

REM ============================================================
<<<<<<< HEAD
REM  åœæ­¢åŽç«¯
=======
REM  Í£Ö¹ºó¶Ë
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
REM ============================================================
:ACTION_STOP
cls
echo.
<<<<<<< HEAD
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo   åœæ­¢ PhishGuard-Vision åŽç«¯...
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.

if not exist ".backend_pid" (
    echo   [INFO] æ— åŽç«¯è¿›ç¨‹è®°å½•
=======
echo   ===================================================
echo   Í£Ö¹ PhishGuard-Vision ºó¶Ë...
echo   ===================================================
echo.

if not exist ".backend_pid" (
    echo   [INFO] ÎÞºó¶Ë½ø³Ì¼ÇÂ¼
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    goto FORCE_STOP
)

set /p EXIST_PID=<.backend_pid 2>nul
if not defined EXIST_PID goto FORCE_STOP

tasklist /FI "PID eq %EXIST_PID%" 2>nul | findstr "%EXIST_PID%" >nul
if %errorlevel%==0 (
<<<<<<< HEAD
    echo   æ­£åœ¨ç»ˆæ­¢åŽç«¯è¿›ç¨‹ (PID: %EXIST_PID%)...
    taskkill /PID %EXIST_PID% /F >nul 2>&1
    if %errorlevel%==0 (
        echo   [OK] åŽç«¯å·²åœæ­¢
    ) else (
        echo   [WARN] è¿›ç¨‹ç»ˆæ­¢å¤±è´¥ï¼Œå°è¯•å¼ºåˆ¶åœæ­¢æ‰€æœ‰åŽç«¯...
=======
    echo   ÕýÔÚÖÕÖ¹ºó¶Ë½ø³Ì (PID: %EXIST_PID%)...
    taskkill /PID %EXIST_PID% /F >nul 2>&1
    if %errorlevel%==0 (
        echo   [OK] ºó¶ËÒÑÍ£Ö¹
    ) else (
        echo   [WARN] ½ø³ÌÖÕÖ¹Ê§°Ü£¬³¢ÊÔÇ¿ÖÆÍ£Ö¹ËùÓÐºó¶Ë...
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
        goto FORCE_STOP
    )
    del ".backend_pid" >nul 2>&1
) else (
<<<<<<< HEAD
    echo   [INFO] è®°å½•çš„è¿›ç¨‹å·²ä¸å­˜åœ¨
=======
    echo   [INFO] ¼ÇÂ¼µÄ½ø³ÌÒÑ²»´æÔÚ
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    del ".backend_pid" >nul 2>&1
    goto FORCE_STOP
)

echo.
pause
goto MENU

:FORCE_STOP
echo.
<<<<<<< HEAD
echo   æ­£åœ¨æœç´¢æ‰€æœ‰ PhishGuard ç›¸å…³è¿›ç¨‹...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    echo     ç»ˆæ­¢ PID %%a ...
    taskkill /PID %%a /F >nul 2>&1
)
echo.
echo   [OK] æ‰€æœ‰åŽç«¯è¿›ç¨‹å·²åœæ­¢
echo   æ¸…ç† PID è®°å½•...
=======
echo   ÕýÔÚËÑË÷ËùÓÐ PhishGuard Ïà¹Ø½ø³Ì...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    echo     ÖÕÖ¹ PID %%a ...
    taskkill /PID %%a /F >nul 2>&1
)
echo.
echo   [OK] ËùÓÐºó¶Ë½ø³ÌÒÑÍ£Ö¹
echo   ÇåÀí PID ¼ÇÂ¼...
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
del ".backend_pid" >nul 2>&1
echo.
pause
goto MENU

REM ============================================================
<<<<<<< HEAD
REM  é‡å¯åŽç«¯
=======
REM  ÖØÆôºó¶Ë
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
REM ============================================================
:ACTION_RESTART
cls
echo.
<<<<<<< HEAD
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo   é‡å¯ PhishGuard-Vision åŽç«¯...
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.

echo   ç¬¬ 1 æ­¥ï¼šåœæ­¢çŽ°æœ‰åŽç«¯...
call :ACTION_STOP_SILENT

echo.
echo   ç¬¬ 2 æ­¥ï¼šç­‰å¾… 2 ç§’...
timeout /t 2 /nobreak >nul

echo.
echo   ç¬¬ 3 æ­¥ï¼šå¯åŠ¨åŽç«¯...
=======
echo   ===================================================
echo   ÖØÆô PhishGuard-Vision ºó¶Ë...
echo   ===================================================
echo.

echo   µÚ 1 ²½£ºÍ£Ö¹ÏÖÓÐºó¶Ë...
call :ACTION_STOP_SILENT

echo.
echo   µÚ 2 ²½£ºµÈ´ý 2 Ãë...
timeout /t 2 /nobreak >nul

echo.
echo   µÚ 3 ²½£ºÆô¶¯ºó¶Ë...
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
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
<<<<<<< HEAD
    echo   [OK] é‡å¯æˆåŠŸ
) else (
    echo   [WARN] é‡å¯å¯èƒ½å¤±è´¥ï¼Œè¯·æ£€æŸ¥
=======
    echo   [OK] ÖØÆô³É¹¦
) else (
    echo   [WARN] ÖØÆô¿ÉÄÜÊ§°Ü£¬Çë¼ì²é
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
)
goto :eof

REM ============================================================
<<<<<<< HEAD
REM  æŸ¥çœ‹çŠ¶æ€
=======
REM  ²é¿´×´Ì¬
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
REM ============================================================
:ACTION_STATUS
cls
echo.
<<<<<<< HEAD
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo   PhishGuard-Vision åŽç«¯çŠ¶æ€
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
=======
echo   ===================================================
echo   PhishGuard-Vision ºó¶Ë×´Ì¬
echo   ===================================================
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
echo.

set STATUS_RUNNING=No
set STATUS_PORT=Free

netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    set STATUS_RUNNING=Yes
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do set STATUS_PID=%%a
    set STATUS_PORT=Occupied
)

<<<<<<< HEAD
echo   è¿è¡ŒçŠ¶æ€: !STATUS_RUNNING!
if defined STATUS_PID echo   è¿›ç¨‹ PID: !STATUS_PID!
echo   ç«¯å£çŠ¶æ€: !STATUS_PORT!

echo.
if exist ".env" (
    echo   é…ç½®çŠ¶æ€: å·²é…ç½®
    echo   é…ç½®æ–‡ä»¶: .env
) else (
    echo   é…ç½®çŠ¶æ€: æœªé…ç½®
)

echo.
echo   é…ç½®è¯¦æƒ…ï¼š
=======
echo   ÔËÐÐ×´Ì¬: !STATUS_RUNNING!
if defined STATUS_PID echo   ½ø³Ì PID: !STATUS_PID!
echo   ¶Ë¿Ú×´Ì¬: !STATUS_PORT!

echo.
if exist ".env" (
    echo   ÅäÖÃ×´Ì¬: ÒÑÅäÖÃ
    echo   ÅäÖÃÎÄ¼þ: .env
) else (
    echo   ÅäÖÃ×´Ì¬: Î´ÅäÖÃ
)

echo.
echo   ÅäÖÃÏêÇé£º
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
if exist ".env" (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        set "KEY=%%a"
        set "VAL=%%b"
        if "!KEY!"=="OPENAI_API_KEY" (
            if defined VAL (
<<<<<<< HEAD
                echo     API Key: å·²è®¾ç½® ^(éšè—^)
            ) else (
                echo     API Key: æœªè®¾ç½®
            )
        ) else if "!KEY!"=="USE_AI_TEXT" (
            echo     AI æ¨¡å¼: !VAL!
        ) else if "!KEY!"=="PHISHGUARD_TOKEN" (
            if defined VAL (
                echo     Token: å·²é…ç½® ^(éšè—^)
            ) else (
                echo     Token: æœªé…ç½®
=======
                echo     API Key: ÒÑÉèÖÃ ^(Òþ²Ø^)
            ) else (
                echo     API Key: Î´ÉèÖÃ
            )
        ) else if "!KEY!"=="USE_AI_TEXT" (
            echo     AI Ä£Ê½: !VAL!
        ) else if "!KEY!"=="PHISHGUARD_TOKEN" (
            if defined VAL (
                echo     Token: ÒÑÅäÖÃ ^(Òþ²Ø^)
            ) else (
                echo     Token: Î´ÅäÖÃ
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
            )
        ) else (
            echo     !KEY!=!VAL!
        )
    )
) else (
<<<<<<< HEAD
    echo     (æ—  .env æ–‡ä»¶)
=======
    echo     (ÎÞ .env ÎÄ¼þ)
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
)

echo.
if "!STATUS_RUNNING!"=="Yes" (
<<<<<<< HEAD
    echo   è®¿é—®åœ°å€:
=======
    echo   ·ÃÎÊµØÖ·:
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    echo     http://127.0.0.1:8000/health
    echo     http://127.0.0.1:8000/test
    echo     http://127.0.0.1:8000/docs
)
echo.
pause
goto MENU

REM ============================================================
<<<<<<< HEAD
REM  é…ç½® AI
=======
REM  ÅäÖÃ AI
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
REM ============================================================
:ACTION_CONFIG
cls
echo.
<<<<<<< HEAD
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo   é…ç½® PhishGuard-Vision AI æ¨¡åž‹
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
echo   å½“å‰é…ç½®ï¼š
if exist ".env" (
    type .env
) else (
    echo     ï¼ˆæ—  .env æ–‡ä»¶ï¼‰
)
echo.
echo   è¯·æŒ‰æç¤ºè¾“å…¥ï¼ˆç›´æŽ¥å›žè½¦ä½¿ç”¨é»˜è®¤å€¼ï¼‰
echo.
call :DO_CONFIG
echo.
echo   é…ç½®å·²æ›´æ–°ï¼
echo   å¦‚éœ€é‡å¯åŽç«¯ï¼Œè¯·é€‰æ‹© "3) é‡å¯åŽç«¯"
=======
echo   ===================================================
echo   ÅäÖÃ PhishGuard-Vision AI Ä£ÐÍ
echo   ===================================================
echo.
echo   µ±Ç°ÅäÖÃ£º
if exist ".env" (
    type .env
) else (
    echo     £¨ÎÞ .env ÎÄ¼þ£©
)
echo.
echo   Çë°´ÌáÊ¾ÊäÈë£¨Ö±½Ó»Ø³µÊ¹ÓÃÄ¬ÈÏÖµ£©
echo.
call :DO_CONFIG
echo.
echo   ÅäÖÃÒÑ¸üÐÂ£¡
echo   ÈçÐèÖØÆôºó¶Ë£¬ÇëÑ¡Ôñ "3) ÖØÆôºó¶Ë"
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
echo.
pause
goto MENU

:DO_CONFIG
<<<<<<< HEAD
set /p IN_KEY="  API Key (è¾“å…¥ä½ çš„ DeepSeek API Key): "
=======
set /p IN_KEY="  API Key (ÊäÈëÄãµÄ DeepSeek API Key): "
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
if "!IN_KEY!"=="" (
    for /f "tokens=1,* delims==" %%a in ('type .env 2^>nul') do (
        if "%%a"=="OPENAI_API_KEY" set IN_KEY=%%b
    )
)

set /p IN_URL="  API Base URL [https://api.deepseek.com/v1]: "
if "!IN_URL!"=="" set IN_URL=https://api.deepseek.com/v1

<<<<<<< HEAD
set /p IN_MODEL="  æ¨¡åž‹åç§° [deepseek-chat]: "
if "!IN_MODEL!"=="" set IN_MODEL=deepseek-chat

echo.
echo   æ˜¯å¦å¯ç”¨ AI å®¡æŸ¥åŠŸèƒ½ï¼Ÿ(éœ€è¦ä»˜è´¹ API Key)
choice /c YN /n /m "   å¯ç”¨ AI: "
set IN_USE=!errorlevel!==1

set /p IN_TOKEN="  å®‰å…¨ Token [ç•™ç©ºè‡ªåŠ¨ç”Ÿæˆ]: "
=======
set /p IN_MODEL="  Ä£ÐÍÃû³Æ [deepseek-chat]: "
if "!IN_MODEL!"=="" set IN_MODEL=deepseek-chat

echo.
echo   ÊÇ·ñÆôÓÃ AI Éó²é¹¦ÄÜ£¿(ÐèÒª¸¶·Ñ API Key)
choice /c YN /n /m "   ÆôÓÃ AI: "
set IN_USE=!errorlevel!==1

set /p IN_TOKEN="  °²È« Token [Áô¿Õ×Ô¶¯Éú³É]: "
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
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
<<<<<<< HEAD
echo   é…ç½®å·²ä¿å­˜åˆ° .env
goto :eof

REM ============================================================
REM  å¥åº·æ£€æŸ¥
=======
echo   ÅäÖÃÒÑ±£´æµ½ .env
goto :eof

REM ============================================================
REM  ½¡¿µ¼ì²é
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
REM ============================================================
:ACTION_CHECK
cls
echo.
<<<<<<< HEAD
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo   å¥åº·æ£€æŸ¥
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
=======
echo   ===================================================
echo   ½¡¿µ¼ì²é
echo   ===================================================
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
echo.

set "VPY=%~dp0venv\Scripts\python.exe"
if not exist "%VPY%" (
<<<<<<< HEAD
    echo   [WARN] è™šæ‹ŸçŽ¯å¢ƒæœªåˆ›å»ºï¼Œè¯·å…ˆå¯åŠ¨åŽç«¯
=======
    echo   [WARN] ÐéÄâ»·¾³Î´´´½¨£¬ÇëÏÈÆô¶¯ºó¶Ë
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    echo.
    pause
    goto MENU
)

<<<<<<< HEAD
echo   æ£€æŸ¥ 1: åŽç«¯å¥åº·æŽ¥å£ (/health)...
"%VPY%" -c "import urllib.request,json,sys;r=urllib.request.urlopen('http://127.0.0.1:8000/health',timeout=5);d=json.loads(r.read());print('     [OK] åŽç«¯è¿è¡Œä¸­, ai_enabled='+str(d.get('ai_enabled'))+', model='+str(d.get('model')))"
if errorlevel 1 (
    echo     [FAIL] åŽç«¯æœªè¿è¡Œæˆ–æ— æ³•è®¿é—®
    echo     è¯·å…ˆå¯åŠ¨åŽç«¯å†æµ‹è¯•
=======
echo   ¼ì²é 1: ºó¶Ë½¡¿µ½Ó¿Ú (/health)...
"%VPY%" -c "import urllib.request,json,sys;r=urllib.request.urlopen('http://127.0.0.1:8000/health',timeout=5);d=json.loads(r.read());print('     [OK] ºó¶ËÔËÐÐÖÐ, ai_enabled='+str(d.get('ai_enabled'))+', model='+str(d.get('model')))"
if errorlevel 1 (
    echo     [FAIL] ºó¶ËÎ´ÔËÐÐ»òÎÞ·¨·ÃÎÊ
    echo     ÇëÏÈÆô¶¯ºó¶ËÔÙ²âÊÔ
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    echo.
    pause
    goto MENU
)

echo.
<<<<<<< HEAD
echo   æ£€æŸ¥ 2: AI è¿žæŽ¥æµ‹è¯• (/test)...
echo     ï¼ˆéœ€è¦æœ‰æ•ˆ API Keyï¼Œå¦åˆ™ä¼šå¤±è´¥ï¼‰
"%VPY%" -c "import urllib.request,json,sys;r=urllib.request.urlopen('http://127.0.0.1:8000/test',timeout=15);d=json.loads(r.read());print('     [OK] è¿žæŽ¥æµ‹è¯•æˆåŠŸ' if d.get('ok') else '     [FAIL] '+str(d.get('error','æœªçŸ¥é”™è¯¯')))" 2>&1
if errorlevel 1 (
    echo     [INFO] AI è¿žæŽ¥æµ‹è¯•è¶…æ—¶æˆ–å¤±è´¥
    echo     è¿™æ˜¯æ­£å¸¸çš„ï¼ˆå¦‚æžœä½ æœªé…ç½® API Key æˆ–ç½‘ç»œå—é™ï¼‰
=======
echo   ¼ì²é 2: AI Á¬½Ó²âÊÔ (/test)...
echo     £¨ÐèÒªÓÐÐ§ API Key£¬·ñÔò»áÊ§°Ü£©
"%VPY%" -c "import urllib.request,json,sys;r=urllib.request.urlopen('http://127.0.0.1:8000/test',timeout=15);d=json.loads(r.read());print('     [OK] Á¬½Ó²âÊÔ³É¹¦' if d.get('ok') else '     [FAIL] '+str(d.get('error','Î´Öª´íÎó')))" 2>&1
if errorlevel 1 (
    echo     [INFO] AI Á¬½Ó²âÊÔ³¬Ê±»òÊ§°Ü
    echo     ÕâÊÇÕý³£µÄ£¨Èç¹ûÄãÎ´ÅäÖÃ API Key »òÍøÂçÊÜÏÞ£©
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
    echo.
)

echo.
<<<<<<< HEAD
echo   æ£€æŸ¥ 3: ä¾èµ–å®Œæ•´æ€§...
"%VPY%" -c "import fastapi,httpx,uvicorn,dotenv,pydantic;print('     [OK] æ‰€æœ‰ä¾èµ–å·²å®‰è£…')" 2>&1
if errorlevel 1 (
    echo     [FAIL] éƒ¨åˆ†ä¾èµ–ç¼ºå¤±ï¼Œè¯·é‡æ–°å¯åŠ¨åŽç«¯
=======
echo   ¼ì²é 3: ÒÀÀµÍêÕûÐÔ...
"%VPY%" -c "import fastapi,httpx,uvicorn,dotenv,pydantic;print('     [OK] ËùÓÐÒÀÀµÒÑ°²×°')" 2>&1
if errorlevel 1 (
    echo     [FAIL] ²¿·ÖÒÀÀµÈ±Ê§£¬ÇëÖØÐÂÆô¶¯ºó¶Ë
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
)

echo.
pause
goto MENU

REM ============================================================
<<<<<<< HEAD
REM  é‡ç½®é…ç½®
=======
REM  ÖØÖÃÅäÖÃ
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
REM ============================================================
:ACTION_RESET
cls
echo.
<<<<<<< HEAD
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo   é‡ç½®é…ç½®
echo   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
echo.
echo   è¿™å°†åˆ é™¤ .env é…ç½®æ–‡ä»¶ï¼ˆä¸å½±å“ä»£ç å’Œä¾èµ–ï¼‰
echo.
choice /c YN /n /m "  ç¡®è®¤åˆ é™¤ .env: "
if !errorlevel!==1 (
    if exist ".env" (
        del ".env"
        echo   [OK] .env å·²åˆ é™¤
    ) else (
        echo   [INFO] .env ä¸å­˜åœ¨
    )
) else (
    echo   å·²å–æ¶ˆ
=======
echo   ===================================================
echo   ÖØÖÃÅäÖÃ
echo   ===================================================
echo.
echo   Õâ½«É¾³ý .env ÅäÖÃÎÄ¼þ£¨²»Ó°Ïì´úÂëºÍÒÀÀµ£©
echo.
choice /c YN /n /m "  È·ÈÏÉ¾³ý .env: "
if !errorlevel!==1 (
    if exist ".env" (
        del ".env"
        echo   [OK] .env ÒÑÉ¾³ý
    ) else (
        echo   [INFO] .env ²»´æÔÚ
    )
) else (
    echo   ÒÑÈ¡Ïû
>>>>>>> 3e8931f (v1.2.0: ä¸‰å±‚é˜²å¾¡ä½“ç³» + çŸ­é“¾æŽ¥æ£€æµ‹ + PhishTank 65.5% Recall)
)
echo.
pause
goto MENU

:END
endlocal
exit /b 0
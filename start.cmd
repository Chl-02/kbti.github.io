@echo off
REM Local dev launcher for ktestone (KBTI clone).
REM Loads .env.local automatically (CRA), avoids OpenSSL crash on Node 17+,
REM and uses port 3010 to avoid clashing with other dev servers.

set NODE_OPTIONS=--openssl-legacy-provider
set PORT=3010
set BROWSER=none
set CI=false

npm run start

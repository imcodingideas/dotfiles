#!/bin/bash

# Kill any existing instances for this app
pkill -f "user-data-dir.*WebApps/__APP_NAME__" 2>/dev/null || true

# Wait a moment for the process to die
sleep 0.5

# Launch Chrome in app mode
exec "__CHROME_PATH__" \
    --new-window \
    --app="__APP_URL__" \
    --class="__APP_NAME__" \
    --user-data-dir="$HOME/Library/Application Support/Google/Chrome/WebApps/__APP_NAME__"__CHROME_FLAGS__ \
    "$@" 2>/dev/null
#!/bin/bash

USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome/WebApps/__APP_NAME__"

mkdir -p "$USER_DATA_DIR"

# Launch Chrome in app mode
exec "__CHROME_PATH__" \
    --new-window \
    --app="__APP_URL__" \
    --class="__APP_NAME__" \
    --user-data-dir="$USER_DATA_DIR"__CHROME_FLAGS__ \
    "$@" 2>/dev/null
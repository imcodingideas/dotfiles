#!/bin/bash
# __APP_NAME__ Web App Launcher
# Created by Joseph Chambers

USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome/WebApps/__APP_NAME__"

if [ ! -d "$USER_DATA_DIR" ]; then
    mkdir -p "$USER_DATA_DIR/Default"
    # Create minimal preferences to skip first-run setup
    echo '{"browser":{"check_default_browser":false},"profile":{"default_content_setting_values":{"notifications":2}}}' > "$USER_DATA_DIR/Default/Preferences"
fi

# Launch Chrome in app mode
exec "__CHROME_PATH__" \
    --new-window \
    --app="__APP_URL__" \
    --class="__APP_NAME__" \
    --user-data-dir="$USER_DATA_DIR" \
    --no-first-run \
    --no-default-browser-check __CHROME_FLAGS__ \
    "$@" 2>/dev/null
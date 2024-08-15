# Store 1Password session tokens in a cache
SESSION_FILE="$HOME/.op_session"

# Sign in and save the session token
op_signin() {
    OP_SESSION=$(op signin --raw)
    echo "$OP_SESSION" > "$SESSION_FILE"
    eval $(echo "$OP_SESSION" | awk '{print "export OP_SESSION_"$1"="$2}')
}

source_op_session() {
    if [[ -f "$SESSION_FILE" ]]; then
        OP_SESSION=$(cat "$SESSION_FILE")
        eval $(echo "$OP_SESSION" | awk '{print "export OP_SESSION_"$1"="$2}')
    fi
}

# Source the session token if it exists, otherwise sign in
if [[ -f "$SESSION_FILE" ]]; then
    source_op_session
else
    op_signin
fi

# Fetch tokens from 1Password
NPM_TOKEN=$(op item get "ACCESS_TOKENS" --field "NPM_TOKEN")
ALLE_ELEMENTS_TOKEN=$(op item get "ACCESS_TOKENS" --field "ALLE_ELEMENTS_TOKEN")
GITHUB_PACKAGES_TOKEN=$(op item get "ACCESS_TOKENS" --field "github_packages_token")

# Export tokens only if they are not empty
if [[ -n "$NPM_TOKEN" ]]; then
    export NPM_TOKEN
fi

if [[ -n "$ALLE_ELEMENTS_TOKEN" ]]; then
    export ALLE_ELEMENTS_TOKEN
fi

if [[ -n "$GITHUB_PACKAGES_TOKEN" ]]; then
    export GITHUB_PACKAGES_TOKEN
fi

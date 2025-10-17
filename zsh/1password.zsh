export OP_ACCOUNT="${OP_ACCOUNT:-my.1password.com}"

fetch_op_token() {
  local field="$1"
  op item get "ACCESS_TOKENS" --field "$field" 2>/dev/null || echo ""
}

if command -v op &>/dev/null; then
  if op account list &>/dev/null 2>&1; then
    NPM_TOKEN=$(fetch_op_token "NPM_TOKEN")
    [[ -n "$NPM_TOKEN" ]] && export NPM_TOKEN

    GITHUB_PACKAGES_TOKEN=$(fetch_op_token "github_packages_token")
    [[ -n "$GITHUB_PACKAGES_TOKEN" ]] && export GITHUB_PACKAGES_TOKEN
  else
    echo "1Password CLI not authenticated. Enable desktop app integration or run 'op signin'."
  fi
else
  echo "1Password CLI (op) not installed. Run 'brew install --cask 1password-cli'."
fi
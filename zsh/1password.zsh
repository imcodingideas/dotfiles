export OP_ACCOUNT="${OP_ACCOUNT:-my.1password.com}"

fetch_op_token() {
  local field="$1"
  op item get "ACCESS_TOKENS" --field "$field" 2>/dev/null || echo ""
}

get_from_tmux() {
  local var="$1"
  tmux show-environment "$var" 2>/dev/null | cut -d= -f2
}

if command -v op &>/dev/null; then
  # If in tmux, try to get tokens from tmux environment first
  if [[ -n "$TMUX" ]]; then
    [[ -z "$NPM_TOKEN" ]] && NPM_TOKEN=$(get_from_tmux "NPM_TOKEN")
    [[ -z "$GITHUB_PACKAGES_TOKEN" ]] && GITHUB_PACKAGES_TOKEN=$(get_from_tmux "GITHUB_PACKAGES_TOKEN")
  fi
  
  # Only fetch from 1Password if we don't have the tokens yet
  if [[ -z "$NPM_TOKEN" ]] || [[ -z "$GITHUB_PACKAGES_TOKEN" ]]; then
    if op account get &>/dev/null 2>&1; then
      [[ -z "$NPM_TOKEN" ]] && NPM_TOKEN=$(fetch_op_token "NPM_TOKEN")
      [[ -z "$GITHUB_PACKAGES_TOKEN" ]] && GITHUB_PACKAGES_TOKEN=$(fetch_op_token "github_packages_token")
      
      # Store in tmux environment for other panes
      if [[ -n "$TMUX" ]]; then
        [[ -n "$NPM_TOKEN" ]] && tmux set-environment NPM_TOKEN "$NPM_TOKEN"
        [[ -n "$GITHUB_PACKAGES_TOKEN" ]] && tmux set-environment GITHUB_PACKAGES_TOKEN "$GITHUB_PACKAGES_TOKEN"
      fi
    fi
  fi
  
  # Export the tokens
  [[ -n "$NPM_TOKEN" ]] && export NPM_TOKEN
  [[ -n "$GITHUB_PACKAGES_TOKEN" ]] && export GITHUB_PACKAGES_TOKEN
fi
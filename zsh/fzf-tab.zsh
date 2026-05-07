#!/usr/bin/env zsh
#
# fzf-tab configuration
# https://github.com/Aloxaf/fzf-tab/wiki/Configuration

# Enable group support and descriptions
zstyle ':completion:*:descriptions' format '[%d]'
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}

# Don't sort branches/tags by name in git completions
zstyle ':completion:*:git-checkout:*' sort false

# Switch between completion groups with < and >
zstyle ':fzf-tab:*' switch-group '<' '>'

# Accept current selection with Enter (default), and continue with Tab
zstyle ':fzf-tab:*' continuous-trigger 'tab'

# Previews ----------------------------------------------------------------

# Directory listings — eza when completing cd / ls / etc.
zstyle ':fzf-tab:complete:cd:*' fzf-preview 'eza -1 --color=always --icons --group-directories-first $realpath'
zstyle ':fzf-tab:complete:(ls|eza|bat|cat|nvim|vim|nano|less|cp|mv|rm):*' fzf-preview \
  'if [[ -d $realpath ]]; then eza -1 --color=always --icons --group-directories-first $realpath; else bat --color=always --line-range=:100 --style=numbers $realpath 2>/dev/null; fi'

# Environment variables — show current values
zstyle ':fzf-tab:complete:(-command-|-parameter-|-brace-parameter-|export|unset|expand):*' \
  fzf-preview 'echo ${(P)word}'

# Process completion — show command line for kill / ps
zstyle ':fzf-tab:complete:(kill|ps):argument-rest' fzf-preview \
  '[[ $group == "[process ID]" ]] && ps -p $word -o command= 2>/dev/null'
zstyle ':fzf-tab:complete:(kill|ps):argument-rest' fzf-flags --preview-window=down:3:wrap

# Git previews
zstyle ':fzf-tab:complete:git-(add|diff|restore):*' fzf-preview \
  'git diff --color=always $word | diff-so-fancy 2>/dev/null || git diff --color=always $word'
zstyle ':fzf-tab:complete:git-log:*' fzf-preview \
  'git log --color=always --oneline --graph --decorate $word'
zstyle ':fzf-tab:complete:git-(checkout|switch|merge|rebase|cherry-pick):*' fzf-preview \
  'git log --color=always --oneline --graph --decorate -20 $word 2>/dev/null'
zstyle ':fzf-tab:complete:git-show:*' fzf-preview \
  'case "$group" in
    "modified file") git diff --color=always $word | diff-so-fancy ;;
    "recent commit object name") git show --color=always $word | diff-so-fancy ;;
    *) git log --color=always --oneline --graph --decorate -20 $word ;;
  esac'

# Manpages — render the page itself
zstyle ':fzf-tab:complete:(\\|*/|)man:*' fzf-preview 'MANPAGER=cat man $word 2>/dev/null'

# SSH hosts — print the matching ~/.ssh/config block
zstyle ':fzf-tab:complete:ssh:*' fzf-preview \
  'awk -v h=$word "/^Host / {p=0} \$1==\"Host\" && \$2==h {p=1} p" ~/.ssh/config 2>/dev/null'

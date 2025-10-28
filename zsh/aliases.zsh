#!/usr/bin/env zsh
#
# zsh Aliases

# File system
alias ls='eza -lh --group-directories-first --icons=auto'
alias lsa='ls -a'
alias lt='eza --tree --level=2 --long --icons --git'
alias lta='lt -a'
alias ff="fzf --preview 'bat --style=numbers --color=always {}'"
alias ll="eza --git --time-style relative -al"

# Directories
alias h="cd ~/"
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'

alias zs="source ~/.zshrc"
alias restore-from="git restore --source"

# tmux
alias tm="tmux"
alias tml="tmux ls"
alias tma="tmux attach -t \$(tmux ls -F '#{session_name}' | fzf)"
alias tmpl="tmuxp load ." # tmuxp load session

# Tools
alias d='docker'
n() { if [ "$#" -eq 0 ]; then nvim .; else nvim "$@"; fi; }

# Homebrew maintenance
alias brewdump='brew bundle dump --describe --force'
alias brewup='brew update && brew bundle && brew bundle cleanup --force && brew autoremove && brew cleanup --prune=all'
alias brewcheck='brew doctor && brew missing'

# Run dotfiles installer
alias dotinstall="~/.dotfiles/install"


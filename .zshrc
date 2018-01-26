# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

# Path to my oh-my-zsh installation.
export ZSH=/Users/joseph/.oh-my-zsh

ZSH_THEME="cobalt2"

# plugins https://github.com/robbyrussell/oh-my-zsh/wiki/Plugins
plugins=(git cloud app node npm bower osx extract virtualenv pip python)

source $ZSH/oh-my-zsh.sh

# ssh
export SSH_KEY_PATH="~/.ssh/rsa_id"

export ANDROID_HOME=${HOME}/Library/Android/sdk
export PATH=${PATH}:${ANDROID_HOME}/tools
export PATH=${PATH}:${ANDROID_HOME}/platform-tool

## Basic Aliases
alias db="cd ~/Dropbox/"
alias h="cd ~/"
alias ll='ls -FGlAhp' # Preferred 'ls' implementation

alias zs="source ~/.zshrc"

alias gum="git pull upstream master"
gac() { git add . && git commit -m "$*" }
gaf() { git add . && git commit -am "fixup! $*" }

alias dsclean='find . -type f -name .DS_Store -print0 | xargs -0 rm' #recursively eliminate .DS_Store files
alias startpg='brew services start postgresql'
alias stoppg='brew services stop postgresql'
alias startmysql='brew services start mysql' #To connect run: mysql -uroot
alias stopmysq='brew services stop mysql'
alias sdd='docker stop $(docker ps -a -q)' # Shut down docker
alias nr='npm run'

## Network stuff
alias netCons='lsof -i' # netCons: Show all open TCP/IP sockets
alias localip='ifconfig en0 | grep inet | grep -v inet6'
alias flush="dscacheutil -flushcache && killall -HUP mDNSResponder" # Flush Directory Service cache

# myIP address
function myip() {
	ifconfig lo0 | grep 'inet ' | sed -e 's/:/ /' | awk '{print "lo0       : " $2}'
	ifconfig en0 | grep 'inet ' | sed -e 's/:/ /' | awk '{print "en0 (IPv4): " $2 " " $3 " " $4 " " $5 " " $6}'
	ifconfig en0 | grep 'inet6 ' | sed -e 's/ / /' | awk '{print "en0 (IPv6): " $2 " " $3 " " $4 " " $5 " " $6}'
	ifconfig en1 | grep 'inet ' | sed -e 's/:/ /' | awk '{print "en1 (IPv4): " $2 " " $3 " " $4 " " $5 " " $6}'
	ifconfig en1 | grep 'inet6 ' | sed -e 's/ / /' | awk '{print "en1 (IPv6): " $2 " " $3 " " $4 " " $5 " " $6}'
}

# Find and kill port. i.e. kp 3000
function kp() { lsof -i TCP:$1 | grep LISTEN | awk '{print $2}' | xargs kill -9 }

# turn hidden files on/off in Finder
function hiddenOn() { defaults write com.apple.Finder AppleShowAllFiles YES ; }
function hiddenOff() { defaults write com.apple.Finder AppleShowAllFiles NO ; }

# include Z, yo
. /usr/local/etc/profile.d/z.sh

# include thefuck
# $(thefuck --alias)

# tree from @wesbos
function t() {
  # Defaults to 3 levels deep, do more with `t 5` or `t 1`
  # pass additional args after
  tree -I '.cache|__pycache__|.git|node_modules|.vagrant|.DS_Store' --dirsfirst --filelimit 100 -L ${1:-3} -aC $2
}

# Get macOS Software Updates, and update installed Ruby gems, Homebrew, npm, and their installed packages
alias update='sudo softwareupdate -i -a; brew update; brew upgrade; brew cleanup; npm install npm -g; npm update -g; sudo gem update --system; sudo gem update; sudo gem cleanup'

# simple server
alias sv='open http://localhost:8000 && python -m SimpleHTTPServer'
alias serve='python -m SimpleHTTPServer'
# tabtab source for serverless package
# uninstall by removing these lines or running `tabtab uninstall serverless`
[[ -f /usr/local/lib/node_modules/serverless/node_modules/tabtab/.completions/serverless.zsh ]] && . /usr/local/lib/node_modules/serverless/node_modules/tabtab/.completions/serverless.zsh
# tabtab source for sls package
# uninstall by removing these lines or running `tabtab uninstall sls`
[[ -f /usr/local/lib/node_modules/serverless/node_modules/tabtab/.completions/sls.zsh ]] && . /usr/local/lib/node_modules/serverless/node_modules/tabtab/.completions/sls.zsh
eval "$(rbenv init -)"

eval $(thefuck --alias)

export PATH="$HOME/.yarn/bin:$PATH"

# Add RVM to PATH for scripting. Make sure this is the last PATH variable change.
export PATH="$PATH:$HOME/.rvm/bin"

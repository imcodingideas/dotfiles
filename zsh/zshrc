export ZSH="/Users/joseph/.oh-my-zsh"

ZSH_THEME="robbyrussell"

plugins=(git brew rails node osx nvm zsh-autosuggestions)

source $ZSH/oh-my-zsh.sh
source ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh

auto-switch-node-version() {
  NVMRC_PATH=$(nvm_find_nvmrc)
  CURRENT_NODE_VERSION=$(nvm version)

  if [[ ! -z "$NVMRC_PATH" ]]; then
    # .nvmrc file found!

    # Read the file
    REQUESTED_NODE_VERSION=$(head -n 1 $NVMRC_PATH)

    # Find an installed Node version that satisfies the .nvmrc
    MATCHED_NODE_VERSION=$(nvm_match_version $REQUESTED_NODE_VERSION)

    if [[ ! -z "$MATCHED_NODE_VERSION" && $MATCHED_NODE_VERSION != "N/A" ]]; then
      # A suitable version is already installed.

      # Clear any warning suppression
      unset AUTOSWITCH_NODE_SUPPRESS_WARNING

      # Switch to the matched version ONLY if necessary
      if [[ $CURRENT_NODE_VERSION != $MATCHED_NODE_VERSION ]]; then
        nvm use $REQUESTED_NODE_VERSION
      fi
    else
      # No installed Node version satisfies the .nvmrc.

      # Quit silently if we already just warned about this exact .nvmrc file, so you
      # only get spammed once while navigating around within a single project.
      if [[ $AUTOSWITCH_NODE_SUPPRESS_WARNING == $NVMRC_PATH ]]; then
        return
      fi

      # Convert the .nvmrc path to a relative one (if possible) for readability
      RELATIVE_NVMRC_PATH="$(realpath --relative-to=$(pwd) $NVMRC_PATH 2> /dev/null || echo $NVMRC_PATH)"

      # Print a clear warning message
      echo ""
      echo "WARNING"
      echo "  Found file: $RELATIVE_NVMRC_PATH"
      echo "  specifying: $REQUESTED_NODE_VERSION"
      echo "  ...but no installed Node version satisfies this."
      echo "  "
      echo "  Current node version: $CURRENT_NODE_VERSION"
      echo "  "
      echo "  You might want to run \"nvm install\""

      # Record that we already warned about this unsatisfiable .nvmrc file
      export AUTOSWITCH_NODE_SUPPRESS_WARNING=$NVMRC_PATH
    fi
  else
    # No .nvmrc file found.

    # Clear any warning suppression
    unset AUTOSWITCH_NODE_SUPPRESS_WARNING

    # Revert to default version, unless that's already the current version.
    if [[ $CURRENT_NODE_VERSION != $(nvm version default)  ]]; then
      nvm use default
    fi
  fi
}

# Run the above function in ZSH whenever you change directory
autoload -U add-zsh-hook
add-zsh-hook chpwd auto-switch-node-version
auto-switch-node-version

export LANG=en_US.UTF-8

export SSH_KEY_PATH="~/.ssh/rsa_id"

# Aliases 
[ -f ~/.zsh_aliases ] && source ~/.zsh_aliases

# Find and kill port. i.e. kp 3000
function kp() { lsof -i TCP:$1 | grep LISTEN | awk '{print $2}' | xargs kill -9 }

export PATH="/usr/local/opt/qt/bin:$PATH"
export PATH=$PATH:$HOME/.composer/vendor/bin

if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi

export PATH="$PATH:$HOME/.rvm/bin"
eval "$(rbenv init -)"

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"export PATH=/Users/joseph/.rbenv/shims:/Users/joseph/.rbenv/shims:~/.composer/vendor/bin:/usr/local/opt/qt/bin:/Users/joseph/.rbenv/shims:/Users/joseph/.rbenv/shims:/usr/local/opt/qt/bin:/Users/joseph/.rbenv/shims:/Users/joseph/.rbenv/shims:/usr/local/opt/qt/bin:/Users/joseph/.rbenv/shims:/Users/joseph/.rbenv/shims:/usr/local/opt/qt/bin:/Users/joseph/.rbenv/shims:/Users/joseph/.rbenv/shims:/usr/local/opt/qt/bin:/Users/joseph/.nvm/versions/node/v12.22.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Library/Apple/usr/bin:/Users/joseph/.rvm/bin:/usr/local/opt/fzf/bin:/Users/joseph/.rvm/bin:/Users/joseph/.rvm/bin:/Users/joseph/.rvm/bin:/Users/joseph/.rvm/bin:/Users/joseph/.composer/vendor/bin

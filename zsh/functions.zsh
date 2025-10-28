#!/usr/bin/env zsh
#
# Defines environment variables.

# Find and kill port. i.e. kp 3000
function kp() { lsof -i TCP:$1 | grep LISTEN | awk '{print $2}' | xargs kill -9 }

# Usage: 
#   compress folder_name    - creates folder_name.tar.gz
#   decompress file.tar.gz  - extracts the archive
compress() { tar -czf "${1%/}.tar.gz" "${1%/}"; }
alias decompress="tar -xzf"

# Docker

# Usage: docker:start:services redis mysql
docker:start:services() {
  services=("$@")
  docker compose -f docker-compose.yml up -d "${services[@]}"
}

# Usage: docker:stop:services redis mysql
docker:stop:services() {
  services=("$@")
  docker compose -f docker-compose.yml stop "${services[@]}"
}

# Usage: docker:logs redis
docker:logs() {
  service="$1"
  docker compose -f docker-compose.yml logs "$service"
}

# Usage: docker:exec redis bash
docker:exec() {
  service="$1"
  shift
  container_id="$(docker ps -q -f name="$service")"
  if [ -n "$container_id" ]; then
    docker exec -it "$container_id" "$@"
  else
    echo "Service $service not running."
  fi
}

docker:prune:all() {
  docker:stop:all
  docker:cleanup:containers
  docker:cleanup:images
  docker:cleanup:networks
  docker:cleanup:volumes
  docker:cleanup:system
}

docker:stop:all() {
  docker stop $(docker ps -a -q) || true
}

docker:cleanup:images() {
  docker image prune -a -f
}

docker:cleanup:volumes() {
  docker volume prune -a -f
}

docker:cleanup:containers() {
  docker container prune -f
}

docker:cleanup:networks() {
  docker network prune -f
}

docker:cleanup:system() {
  docker system prune -a -f
}

# Tmux utility
t() {
  name=$(basename `pwd` | sed -e 's/\.//g')
  if tmux ls 2>&1 | grep "$name"
  then
    tmux attach -t "$name"
  elif [ -f .envrc ]
  then
    direnv exec / tmux new-session -s "$name"
  else
    tmux new-session -s "$name"
  fi
}

# Transcode a video to a good-balance 1080p that's great for sharing online
# Usage: transcode-video-1080p input.mp4
transcode-video-1080p() {
  ffmpeg -i $1 -vf scale=1920:1080 -c:v libx264 -preset fast -crf 23 -c:a copy ${1%.*}-1080p.mp4
}

# Transcode a video to a good-balance 4K that's great for sharing online
# Usage: transcode-video-4K input.mp4
transcode-video-4K() {
  ffmpeg -i $1 -c:v libx265 -preset slow -crf 24 -c:a aac -b:a 192k ${1%.*}-optimized.mp4
}

set-wallpaper() {
  osascript -e 'tell application "System Events" to tell every desktop to set picture to "~/Pictures/wallpaper.png" as POSIX file'
}

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

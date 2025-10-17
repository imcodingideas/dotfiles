# dotfiles
My shell configuration and development environment setup.

This repository is personal and highly customized for my workflow. Feel free to browse for inspiration, but I don't recommend forking or cloning directly. If you spot issues or have questions, please open an issue.

> **Note:** Yes, this might be overengineered. But it's my house, and I'm all for a bit of overengineering when I feel like it! 😅

## Fresh macOS Setup

### 1. Install Command Line Tools
```zsh
xcode-select --install
```

### 2. Clone this repository
```zsh
# SSH (recommended if already configured)
git clone git@github.com:imcodingideas/dotfiles.git ~/.dotfiles
```

### 3. Create symlinks
```zsh
cd ~/.dotfiles
./install
```

### 4. Install Homebrew
```zsh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 5. Install applications and tools
```zsh
cd ~/.dotfiles
brew bundle
```

## Maintenance

### Update Brewfile

Generate a fresh Brewfile from currently installed packages:
```zsh
brew bundle dump --describe --force
```

### Install/update from Brewfile
```zsh
brew bundle --file=Brewfile
```

### Clean up unused dependencies
```zsh
brew bundle cleanup --force
```

## What's Inside

- **Zsh configuration** - Custom aliases, functions, and prompt
- **Development tools** - Node, Python, and more via Homebrew
- **Applications** - Curated list of productivity and development apps
- **1Password integration** - Secure token management for CLI tools

## Requirements

- macOS (tested on latest version)
- Xcode Command Line Tools
- 1Password app (for CLI integration)
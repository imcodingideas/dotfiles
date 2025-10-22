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
git clone git@github.com:imcodingideas/dotfiles.git ~/.dotfiles
cd ~/.dotfiles
```

### 3. Create symlinks
```zsh
./install
```

### 4. Install Homebrew
```zsh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 5. Install applications and tools
```zsh
brew bundle
```

## Maintenance

### Update Brewfile

Generate a fresh Brewfile from currently installed packages:
```zsh
brewdump
```

### Daily/Weekly Maintenance

Update Homebrew, sync with Brewfile, and cleanup:
```zsh
brewup
```

This command:
- Updates Homebrew itself
- Installs/updates packages from your Brewfile
- Removes packages not in your Brewfile
- Removes unused dependencies
- Cleans up old versions and cache

### Check System Health

Check for Homebrew issues:
```zsh
brewcheck
```

---

### Manual Brewfile Operations

Install/update from Brewfile only:
```zsh
brew bundle --file=Brewfile
```

Clean up packages not in Brewfile:
```zsh
brew bundle cleanup --force
```

**Workflow:** Install new packages normally with `brew install`, then run `brewdump` to add them to your Brewfile. Run `brewup` regularly to keep your system in sync.

## What's Inside

- **Zsh configuration** - Custom aliases, functions, and prompt
- **Development tools** - Node, Python, PHP, and more via Homebrew
- **Applications** - Curated list of productivity and development apps
- **macOS tweaks** - Performance optimizations and system preferences
- **1Password integration** - Secure token management for CLI tools

## Requirements

- macOS (tested on latest version)
- Xcode Command Line Tools
- 1Password app (for CLI integration)
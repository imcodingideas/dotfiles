# dotfiles
My shell is my castle and here are my dotfiles

Please refrain from forking or cloning this repository. It's designed for personal use and inspiration, rather than full replication. If you notice anything unusual or incorrect, please open an issue instead.

NOTE: I might be going a bit overboard with this, but it’s my house, and I’m all for a bit of overengineering if I feel like it! 😅

## Steps to bootstrap a new Mac

1. Install Apple's Command Line Tools, which are prerequisites for Git and Homebrew.

```zsh
xcode-select --install
```

2. Clone repo into new hidden directory.

```zsh
# Use SSH (if set up)...
git clone git@github.com:imcodingideas/dotfiles.git ~/.dotfiles

# ...or use HTTPS and switch remotes later.
git clone https://github.com/imcodingideas/dotfiles.git ~/.dotfiles
```

3. Create symlinks in the Home directory to the real files in the repo.

```zsh
./install
```

4. Install Homebrew, followed by the software listed in the Brewfile.

```zsh
# These could also be in an install script.

# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then pass in the Brewfile location...
brew bundle --file ~/.dotfiles/Brewfile

# ...or move to the directory first.
cd ~/.dotfiles && brew bundle
```

5. To maintain a healthy Brewfile
```zsh
# The describe flag adds comments above the brew name
brew bundle dump --describe --force

# Update the lock file and install
brew bundle --file=Brewfile
```

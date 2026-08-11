#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Apache JMeter installer for macOS
# Usage:  bash install-jmeter.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

say()  { printf "\n\033[1;34m==>\033[0m %s\n" "$1"; }
ok()   { printf "\033[1;32m  ✓\033[0m %s\n" "$1"; }
warn() { printf "\033[1;33m  !\033[0m %s\n" "$1"; }

# ── 1. Homebrew ──────────────────────────────────────────────
say "Checking for Homebrew"
if command -v brew >/dev/null 2>&1; then
  ok "Homebrew found: $(brew --version | head -1)"
else
  warn "Homebrew not found — installing it first."
  warn "You will be prompted for your Mac password."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Apple Silicon installs to /opt/homebrew, Intel to /usr/local
  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
  ok "Homebrew installed"
fi

# ── 2. Java ──────────────────────────────────────────────────
say "Checking for Java (JMeter 5.6.3 needs Java 8+, 17+ recommended)"
if java -version >/dev/null 2>&1; then
  ok "Java found: $(java -version 2>&1 | head -1)"
else
  warn "Java not found — installing OpenJDK 17."
  brew install openjdk@17
  sudo ln -sfn "$(brew --prefix)/opt/openjdk@17/libexec/openjdk.jdk" \
    /Library/Java/JavaVirtualMachines/openjdk-17.jdk
  ok "OpenJDK 17 installed"
fi

# ── 3. JMeter ────────────────────────────────────────────────
say "Installing Apache JMeter"
if command -v jmeter >/dev/null 2>&1; then
  ok "JMeter already installed: $(jmeter --version 2>&1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)"
  warn "Run 'brew upgrade jmeter' if you want the newest build."
else
  brew install jmeter
  ok "JMeter installed"
fi

# ── 4. Verify ────────────────────────────────────────────────
say "Verifying"
if command -v jmeter >/dev/null 2>&1; then
  jmeter --version 2>&1 | head -5
  echo
  ok "Done. Launch the GUI with:   jmeter"
  echo
  warn "For real load runs, use headless mode — the GUI skews results:"
  echo "      jmeter -n -t test.jmx -l results.jtl -e -o report/"
else
  warn "Something went wrong — 'jmeter' is not on your PATH."
  warn "Try opening a new terminal window, then run: jmeter --version"
  exit 1
fi

#!/bin/zsh
cd "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  bfit_node_bin="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
  if [[ -x "$bfit_node_bin/node" ]]; then
    export PATH="$bfit_node_bin:$PATH"
  else
    echo 'Install Node.js 24 LTS from https://nodejs.org, then reopen this launcher.'
    read '?Press Return to close.'
    exit 1
  fi
fi
if [[ ! -d node_modules ]]; then
  echo 'First run: open this folder in Terminal and run npm ci.'
  read '?Press Return to close.'
  exit 1
fi
node scripts/run-framework.mjs dev

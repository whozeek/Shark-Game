#!/bin/sh
# Builds the game from src/ into one self-contained page.
#   index.html          standalone page (open it in a browser)
#   $1 (optional)       also write the bare fragment used for the claude.ai artifact here
set -e
cd "$(dirname "$0")"
frag=$(mktemp)
{
  cat src/head.html
  for f in src/motions.js src/motions-*.js src/engine.js; do
    printf '<script>\n'; cat "$f"; printf '</script>\n'
  done
} > "$frag"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  cat "$frag"
  printf '</html>\n'
} > index.html
[ -n "$1" ] && cp "$frag" "$1"
rm -f "$frag"

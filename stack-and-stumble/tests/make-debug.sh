#!/bin/sh
# Test build: index.html plus window.__S / window.__dbg hooks for the Playwright scripts in this folder.
set -e
cd "$(dirname "$0")/.."
./build.sh
sed 's#  window.claude?.hot?.snapshot#  window.__S = () => S; window.__dbg = { planStack: () => planStack(), planDig: () => planDig(), boxFree: (x, y) => boxFree(x, y), G: () => G };\n  window.claude?.hot?.snapshot#' index.html > tests/debug.html

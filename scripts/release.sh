#!/usr/bin/env bash
# Ship a version of SDSB.
#
#   npm run release            # 1.0.0 -> 1.0.1  (a fix or small change)
#   npm run release minor      # 1.0.1 -> 1.1.0  (a new feature)
#   npm run release major      # 1.1.0 -> 2.0.0  (a big rework)
#
# Bumps package.json, tags the commit, pushes both, and publishes a GitHub
# release whose notes list the commits since the last one. Vercel deploys from
# the push, and the new number shows at the bottom of Settings.
set -euo pipefail
cd "$(dirname "$0")/.."

LEVEL=${1:-patch}

if [ -n "$(git status --porcelain)" ]; then
  echo "There are uncommitted changes — commit them first, then release."
  git status --short
  exit 1
fi

git fetch -q origin
if [ -n "$(git log origin/main..HEAD --oneline)" ] || [ -n "$(git log HEAD..origin/main --oneline)" ]; then
  echo "main and origin/main differ — push or pull first, then release."
  exit 1
fi

PREVIOUS=$(git describe --tags --abbrev=0 2>/dev/null || true)
npm version "$LEVEL" --message "Release v%s" > /dev/null
VERSION=$(node -p "require('./package.json').version")
git push -q origin main --follow-tags
echo "Released v$VERSION"

if command -v gh > /dev/null; then
  if [ -n "$PREVIOUS" ]; then
    NOTES=$(git log --pretty='- %s' "$PREVIOUS..v$VERSION^")
  else
    NOTES=$(git log --pretty='- %s' -20)
  fi
  gh release create "v$VERSION" --title "v$VERSION" --notes "${NOTES:-No changes listed.}" > /dev/null
  echo "GitHub release: https://github.com/Steve-Plancher/sdsb/releases/tag/v$VERSION"
else
  echo "gh CLI not found — the tag is pushed, but no GitHub release was created."
fi

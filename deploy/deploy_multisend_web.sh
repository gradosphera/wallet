#!/usr/bin/env bash

set -e

npm run multisend:build:production

rm -rf docs/multisend
mkdir -p docs/multisend

cp -R dist/multisend/* docs/multisend/

git add docs/multisend

git diff --cached --quiet && echo "No changes to commit" || git commit -m "build(multisend): deploy multisend to docs/multisend"

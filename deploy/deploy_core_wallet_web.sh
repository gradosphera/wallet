#!/usr/bin/env bash

set -e

git fetch upstream;
git rebase upstream/master;
git reset --hard HEAD^;
npm install;
npm run core:build:production;
rm -rf docs/;
mv dist/ docs/;
git add -A;
git commit -a -m '[Build]'
git push --force;

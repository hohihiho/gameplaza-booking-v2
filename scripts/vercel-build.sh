#!/bin/bash

# Git 설정 (에러 무시)
export GIT_AUTHOR_NAME="hohihu"
export GIT_AUTHOR_EMAIL="ndz5496@gmail.com"
export GIT_COMMITTER_NAME="hohihu"
export GIT_COMMITTER_EMAIL="ndz5496@gmail.com"

# Git config 설정 (에러 무시)
git config --global user.name "hohihu" 2>/dev/null || true
git config --global user.email "ndz5496@gmail.com" 2>/dev/null || true
git config --global init.defaultBranch main 2>/dev/null || true

# Next.js 빌드
npm run build
#!/bin/bash
set -euo pipefail

echo "🚀 Deploying samarthrealty.properties..."

########################################
# GO TO PROJECT DIRECTORY
########################################

cd /home/samarthrealty.properties/public_html/properties || {
  echo "❌ Project directory not found!"
  exit 1
}

########################################
# CHECK NODE
########################################

if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed!"
  exit 1
fi

########################################
# CHECK NPM
########################################

if ! command -v npm &> /dev/null; then
  echo "❌ npm is not installed!"
  exit 1
fi

########################################
# CHECK PM2
########################################

if ! command -v pm2 &> /dev/null; then
  echo "⚡ PM2 not found. Installing..."
  npm install -g pm2
fi

########################################
# DETERMINE TARGET BRANCH
########################################

TARGET_BRANCH="${TARGET_BRANCH:-feat/prefill-projectid}"
CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"

if [[ -z "${CURRENT_BRANCH}" ]]; then
  CURRENT_BRANCH="${TARGET_BRANCH}"
fi

########################################
# PULL LATEST CODE
########################################

echo "📥 Fetching latest code from origin..."
git fetch origin

echo "📥 Deploying branch: ${TARGET_BRANCH}"

if git show-ref --verify --quiet "refs/remotes/origin/${TARGET_BRANCH}"; then
  git checkout -B "${TARGET_BRANCH}" "origin/${TARGET_BRANCH}"
  git pull --ff-only origin "${TARGET_BRANCH}"
else
  echo "⚠️ Branch ${TARGET_BRANCH} not found on origin. Falling back to current branch: ${CURRENT_BRANCH}"
  git checkout -B "${CURRENT_BRANCH}" "origin/${CURRENT_BRANCH}" 2>/dev/null || true
  git pull --ff-only origin "${CURRENT_BRANCH}"
fi

########################################
# INSTALL DEPENDENCIES
########################################

echo "📦 Installing dependencies..."
npm install

########################################
# BUILD NEXT.JS APP
########################################

echo "🏗 Building project..."
npm run build

########################################
# START / RESTART PM2
########################################

echo "🔁 Restarting PM2..."

if pm2 describe samarthrealty > /dev/null 2>&1; then
  pm2 restart samarthrealty
else
  pm2 start npm --name "samarthrealty" -- start -- -p 3003
fi

########################################
# SAVE PM2
########################################

echo "💾 Saving PM2 process list..."
pm2 save

########################################
# DONE
########################################

echo "✅ Deployment complete!"

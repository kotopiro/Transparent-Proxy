#!/bin/bash
# scripts/deploy.sh
# Transparent Proxy デプロイスクリプト

set -e  # エラー時に停止

echo "🚀 =========================================="
echo "🚀 Transparent Proxy - Deploy Script"
echo "🚀 =========================================="
echo ""

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# デプロイ先選択
echo -e "${BLUE}📋 Select deployment target:${NC}"
echo "  1) Render"
echo "  2) Railway"
echo "  3) Vercel"
echo "  4) Netlify"
echo "  5) Git push only"
echo ""
read -p "Enter choice [1-5]: " DEPLOY_CHOICE

# Git確認
echo ""
echo -e "${YELLOW}📦 Checking git status...${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓ Git repository found${NC}"
else
    echo -e "${RED}✗ Not a git repository${NC}"
    exit 1
fi

# 変更確認
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}! Uncommitted changes found${NC}"
    git status --short
    echo ""
    read -p "Commit changes? [y/N]: " COMMIT_CHOICE
    
    if [ "$COMMIT_CHOICE" = "y" ] || [ "$COMMIT_CHOICE" = "Y" ]; then
        read -p "Commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✓ Changes committed${NC}"
    fi
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi

# ビルド実行
echo ""
echo -e "${YELLOW}🔧 Running build...${NC}"
bash scripts/build.sh

# Git push
echo ""
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
git push origin $CURRENT_BRANCH
echo -e "${GREEN}✓ Pushed to $CURRENT_BRANCH${NC}"

# デプロイ先別処理
case $DEPLOY_CHOICE in
    1)
        echo ""
        echo -e "${BLUE}🎨 Deploying to Render...${NC}"
        echo "Render will auto-deploy from GitHub push"
        echo "Check: https://dashboard.render.com"
        ;;
    2)
        echo ""
        echo -e "${BLUE}🚂 Deploying to Railway...${NC}"
        echo "Railway will auto-deploy from GitHub push"
        echo "Check: https://railway.app"
        ;;
    3)
        echo ""
        echo -e "${BLUE}▲ Deploying to Vercel...${NC}"
        if command -v vercel &> /dev/null; then
            vercel --prod
            echo -e "${GREEN}✓ Deployed to Vercel${NC}"
        else
            echo -e "${RED}✗ Vercel CLI not found${NC}"
            echo "Install: npm install -g vercel"
        fi
        ;;
    4)
        echo ""
        echo -e "${BLUE}🌐 Deploying to Netlify...${NC}"
        if command -v netlify &> /dev/null; then
            netlify deploy --prod
            echo -e "${GREEN}✓ Deployed to Netlify${NC}"
        else
            echo -e "${RED}✗ Netlify CLI not found${NC}"
            echo "Install: npm install -g netlify-cli"
        fi
        ;;
    5)
        echo ""
        echo -e "${GREEN}✓ Git push only completed${NC}"
        ;;
    *)
        echo -e "${RED}✗ Invalid choice${NC}"
        exit 1
        ;;
esac

# 完了
echo ""
echo -e "${GREEN}🎉 =========================================="
echo -e "${GREEN}🎉 Deployment completed!"
echo -e "${GREEN}🎉 ==========================================${NC}"
echo ""
echo "🔗 Check your deployment:"
case $DEPLOY_CHOICE in
    1) echo "   Render: https://dashboard.render.com" ;;
    2) echo "   Railway: https://railway.app" ;;
    3) echo "   Vercel: https://vercel.com/dashboard" ;;
    4) echo "   Netlify: https://app.netlify.com" ;;
esac
echo ""

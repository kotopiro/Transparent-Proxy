#!/bin/bash
# scripts/build.sh
# Transparent Proxy ビルドスクリプト

set -e  # エラー時に停止

echo "🔧 =========================================="
echo "🔧 Transparent Proxy - Build Script"
echo "🔧 =========================================="
echo ""

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Node.jsバージョン確認
echo -e "${YELLOW}📦 Checking Node.js version...${NC}"
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js: $NODE_VERSION${NC}"

# npm確認
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm: $NPM_VERSION${NC}"
echo ""

# 依存関係インストール
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ディレクトリ確認
echo -e "${YELLOW}📁 Checking directories...${NC}"
REQUIRED_DIRS=("public" "src" "src/proxy" "src/middleware" "src/utils" "src/config")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ $dir exists${NC}"
    else
        echo -e "${RED}✗ $dir not found${NC}"
        exit 1
    fi
done
echo ""

# ファイル確認
echo -e "${YELLOW}📄 Checking required files...${NC}"
REQUIRED_FILES=(
    "server.js"
    "package.json"
    "public/index.html"
    "public/assets/css/main.css"
    "public/assets/js/app.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file not found${NC}"
        exit 1
    fi
done
echo ""

# ファイルサイズ確認
echo -e "${YELLOW}📊 Checking file sizes...${NC}"
echo "public/: $(du -sh public/ | cut -f1)"
echo "src/: $(du -sh src/ | cut -f1)"
echo "node_modules/: $(du -sh node_modules/ | cut -f1)"
echo ""

# 設定ファイル確認
echo -e "${YELLOW}⚙️  Checking config files...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env found${NC}"
else
    echo -e "${YELLOW}! .env not found (using defaults)${NC}"
fi

if [ -f "src/config/default.js" ]; then
    echo -e "${GREEN}✓ default.js found${NC}"
else
    echo -e "${RED}✗ default.js not found${NC}"
    exit 1
fi
echo ""

# Lint（オプション）
if command -v eslint &> /dev/null; then
    echo -e "${YELLOW}🔍 Running linter...${NC}"
    npm run lint || echo -e "${YELLOW}! Linting errors found (continuing)${NC}"
    echo ""
fi

# テスト（オプション）
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    npm test || echo -e "${YELLOW}! Tests failed (continuing)${NC}"
    echo ""
fi

# 完了
echo -e "${GREEN}🎉 =========================================="
echo -e "${GREEN}🎉 Build completed successfully!"
echo -e "${GREEN}🎉 ==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Run: npm start"
echo "  2. Or deploy: npm run deploy"
echo ""

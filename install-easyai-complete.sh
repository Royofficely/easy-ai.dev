#!/bin/bash

# EasyAI Complete Installation Script
# This script installs the EasyAI SDK and sets up the development environment

set -e

echo "🤖 EasyAI Installation Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}Error: This script should not be run as root${NC}"
   exit 1
fi

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo -e "${GREEN}✓ Detected OS: ${MACHINE}${NC}"

# Check for required tools
check_requirement() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is required but not installed${NC}"
        exit 1
    fi
}

echo "🔍 Checking requirements..."
check_requirement "node"
check_requirement "npm"
check_requirement "git"
check_requirement "curl"

# Get Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 16 ]; then
    echo -e "${RED}Error: Node.js 16 or higher is required (found v$NODE_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js v$NODE_VERSION${NC}"

# Check if EasyAI is already installed
if command -v easyai &> /dev/null; then
    echo -e "${YELLOW}⚠ EasyAI is already installed. Updating...${NC}"
    UPDATE_MODE=true
else
    echo "📦 Installing EasyAI for the first time..."
    UPDATE_MODE=false
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "⬇️ Downloading EasyAI..."
git clone https://github.com/Royofficely/easyai.git
cd easyai

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building EasyAI..."
npm run build

# Install globally
echo "🌍 Installing EasyAI globally..."
npm install -g .

# Verify installation
if command -v easyai &> /dev/null; then
    echo -e "${GREEN}✅ EasyAI installed successfully!${NC}"
    echo "Version: $(easyai --version)"
else
    echo -e "${RED}❌ Installation failed${NC}"
    exit 1
fi

# Clean up
cd ~
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
echo "Next steps:"
echo "1. Get your API key from https://easy-ai.dev"
echo "2. Initialize a new project: easyai init"
echo "3. Set your API key: export EASYAI_API_KEY=your_key_here"
echo "4. Start building with AI!"
echo ""
echo "Documentation: https://docs.easyai.dev"
echo "Support: https://github.com/Royofficely/easyai/issues"
echo ""
echo -e "${GREEN}Happy coding with EasyAI! 🚀${NC}"
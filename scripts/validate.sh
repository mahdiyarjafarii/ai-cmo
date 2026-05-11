#!/bin/bash

# Validation script to check project setup and configuration

set -e

echo "=================================================="
echo "AI Competitor Analysis Engine - Setup Validator"
echo "=================================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
  echo "  ✗ Node.js not found. Please install Node.js 18+."
  exit 1
fi
NODE_VERSION=$(node -v)
echo "  ✓ Node.js ${NODE_VERSION}"

# Check npm
echo "✓ Checking npm..."
NPM_VERSION=$(npm -v)
echo "  ✓ npm ${NPM_VERSION}"

# Check .env file
echo "✓ Checking .env configuration..."
if [ ! -f ".env" ]; then
  echo "  ✗ .env file not found"
  echo "  Creating .env from .env.example..."
  if [ ! -f ".env.example" ]; then
    echo "  ✗ .env.example not found"
    exit 1
  fi
  cp .env.example .env
  echo "  ✓ .env created. Please edit with your API keys."
fi

# Check required env variables
echo "✓ Checking required environment variables..."
source .env || true

MISSING=()

if [ -z "$OPENAI_API_KEY" ] && [ -z "$CLAUDE_API_KEY" ]; then
  MISSING+=("OPENAI_API_KEY or CLAUDE_API_KEY")
fi

if [ -z "$FIRECRAWL_API_KEY" ]; then
  MISSING+=("FIRECRAWL_API_KEY")
fi

if [ -z "$TAVILY_API_KEY" ]; then
  MISSING+=("TAVILY_API_KEY")
fi

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "  ✓ All required environment variables are set"
else
  echo "  ✗ Missing environment variables:"
  for var in "${MISSING[@]}"; do
    echo "    - $var"
  done
  echo ""
  echo "  Please edit .env and add these values:"
  echo "  - FIRECRAWL_API_KEY: https://firecrawl.dev"
  echo "  - TAVILY_API_KEY: https://tavily.com"
  echo "  - OPENAI_API_KEY or CLAUDE_API_KEY"
  exit 1
fi

# Check node_modules
echo "✓ Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies..."
  npm install
else
  echo "  ✓ Dependencies installed"
fi

# Check TypeScript
echo "✓ Checking TypeScript..."
if ! npx tsc --version &> /dev/null; then
  echo "  ✗ TypeScript not found"
  exit 1
fi
echo "  ✓ TypeScript $(npx tsc --version)"

# Check source files
echo "✓ Checking source files..."
REQUIRED_FILES=(
  "src/main.ts"
  "src/config.ts"
  "src/agent/analyzer.ts"
  "src/services/crawler.ts"
  "src/services/llm.ts"
  "src/services/search.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ✗ Missing $file"
    exit 1
  fi
done
echo "  ✓ All source files present"

# Type checking
echo "✓ Running type checking..."
if npm run type-check > /dev/null 2>&1; then
  echo "  ✓ No TypeScript errors"
else
  echo "  ✗ TypeScript errors found. Run 'npm run type-check' to see details."
  npm run type-check || true
  exit 1
fi

# Build
echo "✓ Building project..."
if npm run build > /dev/null 2>&1; then
  echo "  ✓ Build successful"
else
  echo "  ✗ Build failed. Run 'npm run build' to see details."
  npm run build || true
  exit 1
fi

# Summary
echo ""
echo "=================================================="
echo "✓ Setup validation complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Edit .env if you haven't already"
echo "2. Run your first analysis:"
echo "   npm run analyze -- --url=https://example.com"
echo "3. Check output/ directory for results"
echo ""
echo "Documentation:"
echo "- Quick start: cat QUICKSTART.md"
echo "- Main docs: cat README.md"
echo "- Development: cat DEVELOPMENT.md"
echo ""

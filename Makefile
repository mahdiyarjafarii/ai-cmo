.PHONY: help install build dev start analyze type-check clean

help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make build         - Build TypeScript to JavaScript"
	@echo "  make dev           - Run in development mode with watch"
	@echo "  make start         - Run built project"
	@echo "  make analyze       - Run analysis (requires URL argument: URL=https://...)"
	@echo "  make type-check    - Check TypeScript types"
	@echo "  make clean         - Remove build artifacts"
	@echo "  make setup         - Initial setup (install + configure)"

install:
	npm install

build:
	npm run build

dev:
	npm run dev

start:
	npm start

analyze:
	@if [ -z "$(URL)" ]; then \
		echo "Error: URL not specified. Usage: make analyze URL=https://example.com"; \
		exit 1; \
	fi
	npm run analyze -- --url=$(URL)

type-check:
	npm run type-check

clean:
	npm run clean
	rm -rf output/
	rm -f .env

setup: install
	@echo ""
	@echo "Setup complete! Next steps:"
	@echo ""
	@echo "1. Get API keys from:"
	@echo "   - Firecrawl: https://firecrawl.dev/signup"
	@echo "   - Tavily: https://tavily.com/signup"
	@echo "   - OpenAI: https://platform.openai.com/api-keys"
	@echo ""
	@echo "2. Create .env file:"
	@echo "   cp .env.example .env"
	@echo ""
	@echo "3. Edit .env with your API keys"
	@echo ""
	@echo "4. Run your first analysis:"
	@echo "   make analyze URL=https://slack.com"
	@echo ""

.SILENT: help

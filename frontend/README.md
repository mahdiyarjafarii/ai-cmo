# Frontend - Competitor Analysis Dashboard

Modern React + Vite frontend for the AI Competitor Analysis Engine.

## Features

- ✨ Real-time progress tracking with Server-Sent Events
- 🎨 Dark theme with Tailwind CSS
- 🚀 Smooth animations with Framer Motion
- 📊 Interactive dashboard with multiple views
- 💾 Export results as JSON or Markdown
- 📱 Responsive design

## Quick Start

### Prerequisites
- Node.js 18+
- Backend running on http://localhost:3000

### Setup

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── InputPanel.tsx          # URL input form
│   │   ├── ProgressTerminal.tsx    # Live progress display
│   │   ├── CompanyInfoPanel.tsx    # Company details
│   │   ├── CompetitorsPanel.tsx    # Competitors list
│   │   ├── AnalysisPanel.tsx       # Analysis tabs
│   │   └── AnalysisView.tsx        # Main dashboard
│   ├── pages/
│   ├── services/
│   │   └── api.ts                  # API integration
│   ├── store/
│   │   └── analysisStore.ts        # Zustand state
│   ├── types.ts                    # TypeScript types
│   ├── App.tsx                     # Main component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Available Scripts

### Development
```bash
npm run dev          # Start dev server with hot reload
npm run type-check   # Run TypeScript type checking
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build locally
```

## Configuration

### API URL
Update in `vite.config.ts` or set `VITE_API_URL` environment variable:

```bash
VITE_API_URL=https://api.example.com npm run dev
```

### Styling
- **Framework:** Tailwind CSS
- **Theme:** Dark (slate-950 base)
- **Animations:** Framer Motion
- **Config:** `tailwind.config.js`

## Components

### InputPanel
Entry point where users input company URL to analyze.

**Props:**
- `onSubmit: (url: string) => void`
- `isLoading: boolean`
- `error?: string | null`

### ProgressTerminal
Displays real-time streaming messages from backend.

**Features:**
- Auto-scroll to latest message
- Typing animations
- Status indicators
- Timestamp tracking

### CompanyInfoPanel
Displays analyzed company information.

**Shows:**
- Company name and industry
- Description and ICP
- Value proposition
- Pricing details
- Key features
- Visit website link

### CompetitorsPanel
Lists identified competitors with relevance scores.

**Features:**
- Scrollable list
- Relevance scores
- Company profiles
- Direct links to competitor sites

### AnalysisPanel
Tabbed interface for different analysis perspectives.

**Tabs:**
- **Overview:** Positioning and differentiation
- **SWOT:** Strengths, weaknesses, opportunities, threats
- **Feature Gaps:** Missing and unique features
- **Recommendations:** Strategic advice

### AnalysisView
Main dashboard layout combining all panels.

**Features:**
- Three-column responsive layout
- Download options (JSON/Markdown)
- New analysis button
- Progress history

## State Management

Using Zustand for simple, efficient state management:

```typescript
const { result, loading, messages, error } = useAnalysisStore();
```

### Store Actions
- `setUrl(url)` - Set target URL
- `setLoading(bool)` - Set loading state
- `addMessage(message)` - Add progress message
- `setError(error)` - Set error
- `setResult(result)` - Set analysis result
- `reset()` - Clear all state

## API Integration

### Starting Analysis
```typescript
const { analysisId } = await startAnalysis(url);
```

### Subscribing to Events
```typescript
const unsubscribe = await subscribeToAnalysis(
  analysisId,
  (message) => { /* handle progress */ },
  (error) => { /* handle error */ },
  () => { /* handle complete */ }
);
```

### Getting Results
```typescript
const result = await getAnalysisResult(analysisId);
```

## Styling

### Colors (Dark Theme)
- **Background:** `#0f172a` (slate-950)
- **Surface:** `#1e293b` (slate-800)
- **Border:** `#475569` (slate-700)
- **Text:** `#e2e8f0` (slate-100)
- **Accent:** `#3b82f6` (blue-500)

### Key Classes
```css
.bg-slate-950  /* Main background */
.bg-slate-800  /* Card/panel background */
.text-slate-100 /* Main text */
.text-slate-400 /* Secondary text */
.border-slate-700 /* Borders */
```

## Performance

### Optimizations
- Tree shaking with Vite
- Lazy component loading
- Image optimization
- CSS splitting
- Production minification

### Build Output
- **Dev:** ~500KB (with sourcemaps)
- **Prod:** ~150KB (gzipped)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliant

## Troubleshooting

### Backend Not Connected
```
Error: Failed to connect to backend

Solution:
1. Verify backend is running: curl http://localhost:3000/health
2. Check VITE_API_URL matches backend address
3. Check browser console for CORS errors
```

### Styling Issues
```
If Tailwind styles don't appear:

1. Rebuild: npm run build
2. Clear cache: rm -rf node_modules/.vite
3. Restart dev server
```

### Type Errors
```
Run type checking:
npm run type-check

Fix issues in TypeScript files
```

## Development Tips

### Adding a New Component
```typescript
// src/components/MyComponent.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface MyComponentProps {
  // Define props
}

export const MyComponent: React.FC<MyComponentProps> = (props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Component content */}
    </motion.div>
  );
};
```

### Adding a Custom Hook
```typescript
// src/hooks/useCustom.ts
import { useState } from 'react';

export function useCustom() {
  const [state, setState] = useState(null);
  // Hook logic
  return { state };
}
```

### Using State Store
```typescript
import { useAnalysisStore } from '@/store/analysisStore';

const { result, setResult } = useAnalysisStore();
```

## Dependencies

### Key Libraries
- **react** - UI framework
- **react-dom** - React DOM rendering
- **vite** - Build tool
- **typescript** - Type safety
- **tailwindcss** - Utility CSS framework
- **framer-motion** - Animation library
- **zustand** - State management
- **axios** - HTTP client

## Scripts Reference

```bash
# Development
npm run dev          # Hot reload dev server
npm run type-check   # TypeScript validation

# Production
npm run build        # Optimized production build
npm run preview      # Preview production locally

# Maintenance
rm -rf node_modules  # Clean node_modules
npm install          # Reinstall dependencies
npm cache clean --force  # Clear npm cache
```

## Environment Variables

Create `.env.local` for local development:

```env
VITE_API_URL=http://localhost:3000
```

Create `.env.production` for production:

```env
VITE_API_URL=https://api.yourcompany.com
```

## Deployment

### Vercel
```bash
# Vercel automatically detects Vite
# Just push to git and deploy
```

### Netlify
```bash
# Create netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[env]
  VITE_API_URL = "https://api.yourcompany.com"
```

### Self-Hosted
```bash
# Build
npm run build

# Serve dist/ folder with nginx, Apache, etc.
# Point API requests to your backend
```

## Contributing

1. Create feature branch
2. Make changes
3. Run type-check: `npm run type-check`
4. Build: `npm run build`
5. Test in production: `npm run preview`
6. Create PR

## License

MIT

---

**Ready to analyze?** Start the backend and run `npm run dev` 🚀

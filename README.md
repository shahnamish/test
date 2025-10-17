# Portfolio Starter (React + Vite + TypeScript)

A modern starter template for building a personal portfolio using React, Vite,
and TypeScript. The project is pre-configured with React Router, Styled
Components, ESLint, and Prettier so you can focus on crafting your story and
showcasing your work.

## Features

- ⚡️ Blazing-fast development with Vite
- ⚛️ Latest React (with JSX runtime) and TypeScript support
- 🧭 Client-side routing via `react-router-dom`
- 🎨 Component styling powered by `styled-components`
- 🛠️ Code quality tools: ESLint (with Prettier integration) and Prettier
- ✅ Ready-to-use testing setup with Vitest and Testing Library
- 🗂️ Opinionated folder structure for pages, components, data, and assets

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended) or higher
- npm 9+ (comes bundled with Node.js)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173` by default.

### Available Scripts

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the Vite development server         |
| `npm run build`        | Type-check and create a production build  |
| `npm run preview`      | Preview the production build locally      |
| `npm run lint`         | Run ESLint                                |
| `npm run lint:fix`     | Run ESLint and automatically fix issues   |
| `npm run format`       | Format all source files with Prettier     |
| `npm run format:check` | Check formatting without applying changes |
| `npm run test`         | Run unit tests with Vitest                |
| `npm run test:watch`   | Run tests in watch mode                   |

## Project Structure

```
├── public
├── src
│   ├── assets          # Static assets
│   ├── components      # Reusable UI components
│   ├── data            # Structured data (projects, navigation, etc.)
│   ├── pages           # Route-based page components
│   ├── test            # Test utilities and setup files
│   ├── App.tsx         # Route configuration
│   └── main.tsx        # Application entry point
├── eslint.config.js
├── vitest.config.ts
├── tsconfig*.json
└── README.md
```

## Customization Tips

- Update the data files in `src/data` to reflect your projects, skills, and
  navigation preferences.
- Add new pages under `src/pages` and register them in `src/App.tsx`.
- Tailor the global look and feel with Styled Components, or add a theme provider
  that better suits your brand.

Happy building!

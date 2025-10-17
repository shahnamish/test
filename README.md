# Portfolio Application

A modern, responsive portfolio website built with React, TypeScript, styled-components, and React Router.

## Features

- **Global Theming**: Comprehensive theme system using styled-components with customizable colors, typography, spacing, and more
- **Responsive Layout**: Mobile-first design with responsive header, footer, and layout wrapper
- **Navigation**: 
  - Desktop navigation with smooth hover effects and active state indicators
  - Mobile-responsive burger menu with smooth animations
- **Routing**: React Router configuration with the following pages:
  - Home/About
  - Projects
  - Blog
  - Resume
  - Contact

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **styled-components** - CSS-in-JS with theming support
- **React Router v6** - Client-side routing
- **Vite** - Fast build tool and dev server

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Header.tsx    # Main header with logo
│   ├── Nav.tsx       # Navigation links component
│   ├── BurgerMenu.tsx # Mobile burger menu
│   ├── Footer.tsx    # Page footer
│   └── Layout.tsx    # Layout wrapper component
├── pages/            # Page components
│   ├── Home.tsx
│   ├── About.tsx
│   ├── Projects.tsx
│   ├── Blog.tsx
│   ├── Resume.tsx
│   └── Contact.tsx
├── theme/            # Theme configuration
│   ├── theme.ts      # Theme values
│   ├── GlobalStyles.ts # Global CSS styles
│   └── styled.d.ts   # TypeScript definitions
├── App.tsx           # Main app with router
└── main.tsx          # Application entry point
```

## Customization

### Theme

Edit `src/theme/theme.ts` to customize colors, fonts, spacing, breakpoints, and other design tokens.

### Navigation Links

Modify the `navLinks` array in `src/components/Nav.tsx` to add, remove, or update navigation links.

### Pages

Add new pages in `src/pages/` and configure routes in `src/App.tsx`.

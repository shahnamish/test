# React Frontend - Security Platform

A modern React application with authentication, secure token handling, and protected routes for the Security, Compliance, and Auditing Framework.

## Features

- **Authentication Flows**: Sign up, login, and multi-factor authentication (MFA)
- **State Management**: Redux Toolkit for predictable state management
- **Secure Token Handling**: Encrypted storage for access and refresh tokens
- **Protected Routes**: Role-based access control with redirect logic
- **Component Library**: Chakra UI for consistent, accessible design
- **Testing**: Jest for unit/integration tests, Cypress for E2E tests
- **Type Safety**: Full TypeScript support

## Tech Stack

- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **React Router v6** for routing
- **Chakra UI** for component library
- **Vite** for fast development and builds
- **Jest** for unit testing
- **Cypress** for E2E testing
- **Axios** for API communication

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Configure the backend API URL:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Testing

### Unit & Integration Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests

```bash
# Open Cypress UI
npm run cypress:open

# Run Cypress headlessly
npm run cypress:run
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                # Redux store configuration
│   ├── components/         # Reusable UI components
│   │   ├── layout/        # Layout components
│   │   └── common/        # Shared components
│   ├── features/          # Feature-based modules
│   │   └── auth/          # Authentication feature
│   │       ├── api/       # API services
│   │       ├── components/# Auth-specific components
│   │       ├── hooks/     # Auth hooks
│   │       └── authSlice.ts
│   ├── pages/             # Page components
│   ├── providers/         # Context providers
│   ├── routes/            # Routing configuration
│   ├── styles/            # Global styles
│   ├── theme/             # Chakra UI theme customization
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main app component
│   └── main.tsx           # App entry point
├── cypress/               # E2E tests
└── public/               # Static assets
```

## Authentication Flow

1. **Sign Up**: User creates an account
2. **Login**: User submits credentials
3. **MFA**: User completes multi-factor authentication
4. **Token Storage**: Secure storage of access/refresh tokens
5. **Session Management**: Automatic token refresh
6. **Logout**: Token cleanup and redirect

## Security Features

- **Encrypted Token Storage**: Tokens encrypted in browser storage
- **Automatic Token Refresh**: Seamless session extension
- **Protected Routes**: Unauthorized access prevention
- **MFA Enforcement**: Optional second-factor authentication
- **Session Persistence**: Remember device option
- **Secure Communication**: API requests with bearer tokens

## Build for Production

```bash
npm run build
```

The build output will be in the `build/` directory.

## Preview Production Build

```bash
npm run preview
```

## Integration with Backend

This frontend expects a REST API backend at the configured `VITE_API_BASE_URL`.

### Required API Endpoints

- `POST /auth/signup` - Create new account
- `POST /auth/login` - Authenticate user
- `POST /auth/verify-mfa` - Complete MFA
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Invalidate session

## Contributing

Please read the main CONTRIBUTING.md in the project root.

## License

Copyright (c) 2024. All rights reserved.

# Authentication Service

A comprehensive Go microservice for user authentication and authorization with JWT, MFA, session management, and role-based access control.

## Features

- **User Registration**: Secure user registration with password hashing (bcrypt)
- **Authentication**: Email/password-based authentication
- **JWT Tokens**: Access and refresh token management
- **Multi-Factor Authentication (MFA)**: TOTP-based 2FA support
- **Session Management**: Persistent session storage with refresh token rotation
- **Role-Based Authorization**: RBAC scaffolding for access control
- **PostgreSQL Integration**: Full database persistence
- **OpenAPI Specification**: Complete API documentation
- **Unit & Integration Tests**: Comprehensive test coverage

## Architecture

```
.
├── cmd/
│   └── server/         # Application entry point
├── internal/
│   ├── auth/           # Authentication utilities (JWT, password, MFA)
│   ├── config/         # Configuration management
│   ├── database/       # Database connection and migrations
│   ├── http/
│   │   ├── handlers/   # HTTP request handlers
│   │   └── middleware/ # HTTP middleware (auth, CORS)
│   ├── models/         # Data models
│   ├── repository/     # Data access layer
│   ├── service/        # Business logic
│   └── testutil/       # Test utilities
└── docs/
    └── openapi.yaml    # OpenAPI 3.0 specification
```

## Prerequisites

- Go 1.21 or higher
- PostgreSQL 12 or higher

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd authservice
```

2. Install dependencies:
```bash
go mod download
```

3. Set up PostgreSQL database:
```bash
createdb authservice
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run migrations (automatic on startup)

## Configuration

Configure the service using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | HTTP server port | 8080 |
| `SERVER_HOST` | HTTP server host | 0.0.0.0 |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_USER` | PostgreSQL user | postgres |
| `DB_PASSWORD` | PostgreSQL password | postgres |
| `DB_NAME` | PostgreSQL database | authservice |
| `DB_SSLMODE` | PostgreSQL SSL mode | disable |
| `JWT_SECRET` | JWT signing secret | (required in production) |
| `JWT_ACCESS_TTL` | Access token TTL | 15m |
| `JWT_REFRESH_TTL` | Refresh token TTL | 168h (7 days) |
| `JWT_ISSUER` | JWT issuer name | authservice |
| `MFA_ENABLED` | Enable MFA support | false |
| `MFA_ISSUER` | MFA issuer name | AuthService |

## Running the Service

### Development
```bash
go run cmd/server/main.go
```

### Production Build
```bash
go build -o bin/authservice cmd/server/main.go
./bin/authservice
```

### With Docker
```bash
docker build -t authservice .
docker run -p 8080:8080 --env-file .env authservice
```

## API Endpoints

### Public Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email/password (and optional MFA code)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke refresh token
- `GET /health` - Health check

### Protected Endpoints (requires JWT)

- `GET /api/auth/me` - Get current user information
- `POST /api/auth/mfa/enable` - Enable MFA for current user
- `POST /api/auth/mfa/verify` - Verify MFA code and activate MFA
- `POST /api/auth/mfa/disable` - Disable MFA for current user

See [OpenAPI specification](docs/openapi.yaml) for detailed API documentation.

## Testing

Run all tests:
```bash
go test ./...
```

Run tests with coverage:
```bash
go test -cover ./...
```

Run specific test packages:
```bash
go test ./internal/auth/...
go test ./internal/service/...
```

## Authentication Flow

### Standard Login
1. User submits email and password to `/api/auth/login`
2. Service validates credentials
3. If valid, returns access token and refresh token
4. Client stores tokens and includes access token in `Authorization: Bearer <token>` header

### Login with MFA
1. User submits email and password
2. If MFA is enabled, service returns `{"mfaRequired": true}`
3. User submits email, password, and MFA code
4. Service validates credentials and MFA code
5. Returns access token and refresh token

### Token Refresh
1. Access token expires after 15 minutes (configurable)
2. Client submits refresh token to `/api/auth/refresh`
3. Service validates refresh token and issues new token pair
4. Old refresh token is revoked

### MFA Setup
1. User authenticates and calls `/api/auth/mfa/enable`
2. Service generates TOTP secret and returns QR code URL
3. User scans QR code with authenticator app
4. User submits TOTP code to `/api/auth/mfa/verify`
5. Service validates code and enables MFA for the user

## Security Features

- **Password Hashing**: bcrypt with default cost
- **JWT Signing**: HMAC-SHA256
- **Session Management**: Refresh token rotation
- **MFA Support**: TOTP (Time-based One-Time Password)
- **CORS**: Configurable CORS middleware
- **SQL Injection Protection**: Parameterized queries
- **Active Session Revocation**: Logout invalidates refresh tokens

## Role-Based Authorization

The service includes RBAC scaffolding. To protect endpoints by role:

```go
handler.RequireRole("admin")(http.HandlerFunc(adminHandler))
```

Default roles:
- `user` - Standard user
- `admin` - Administrator

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `role` - User role
- `mfa_enabled` - MFA status
- `mfa_secret` - TOTP secret (encrypted)
- `is_active` - Account status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Sessions Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `refresh_token` - Refresh token hash
- `expires_at` - Expiration timestamp
- `created_at` - Creation timestamp
- `is_revoked` - Revocation status

## Development

### Adding New Endpoints

1. Define handler in `internal/http/handlers/`
2. Register route in `cmd/server/main.go`
3. Add middleware for authentication/authorization
4. Update OpenAPI specification

### Running Migrations

Migrations run automatically on startup. To add new migrations, update `internal/database/migrations.go`.

## License

MIT License - See LICENSE file for details

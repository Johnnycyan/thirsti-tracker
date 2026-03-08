# BlankApp

A full-stack web application template with React frontend and Go backend.

## Features

- **React Frontend**: TypeScript, PrimeReact with Lara theme, Material You color sync
- **Go Backend**: Gin framework, GORM with MySQL, JWT authentication, WebSocket support
- **Docker**: Multi-stage build, docker-compose with MySQL service

## Development

### Prerequisites

- Node.js 18+
- Go 1.21+
- Docker & Docker Compose (for production)

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:3000 and proxies API requests to the backend.

### Backend Development

```bash
cd backend
go mod download
go run main.go
```

The backend runs on http://localhost:8080.

## Production Deployment

### Build Frontend

```bash
cd frontend
npm run build
# Copy dist/* to backend/static/
```

### Deploy with Docker

```bash
docker-compose up -d
```

## Configuration

Environment variables (set in docker-compose.yml or .env):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_USER` | MySQL user | root |
| `DB_PASSWORD` | MySQL password | - |
| `DB_NAME` | Database name | blankapp |
| `JWT_SECRET` | JWT signing secret | (change this!) |
| `DISABLE_REGISTRATION` | Block new registrations | false |

## Material You Color Sync

Users can sync their Android Material You colors to the website:

1. Open the Android app on your phone
2. Go to Settings > Sync Theme
3. Colors will be sent to the server and applied to the website

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Theme (Authenticated)
- `GET /api/theme/colors` - Get user's theme colors
- `POST /api/theme/colors` - Set user's theme colors

### WebSocket
- `GET /ws` - WebSocket connection (requires auth token)

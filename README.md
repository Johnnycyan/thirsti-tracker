# Thirsti Tracker

A full-stack web application designed to track and visualize the usage of a Ninja Thirsti machine. It monitors CO2 tank levels, flavor pod usage, and provides advanced analytics on dispensing habits.

## Features

- **Automated Tracking**: Logs every dispense including size (6oz-24oz), sparkle level, and flavor intensity.
- **Visual Dashboard**: Features a dynamic dashboard showing the real-time status of installed CO2 tanks and Flavor Pods.
- **Predictive Analytics**: Calculates estimated remaining doses for tanks and pods based on historical consumption averages.
- **Inventory Management**: Keeps track of full/empty CO2 tanks and extra flavor pods stored in reserve.
- **Admin Control Panel**: A secure interface to purchase new stock, install tanks/pods, and generate one-time submission codes.
- **REST API**: Built with Go and Gin, utilizing a SQLite database for fast, lightweight data storage.
- **Responsive UI**: A highly polished, custom-styled frontend built with React and Material UI.

## Tech Stack

- **Frontend**: React, TypeScript, Material UI, Recharts
- **Backend**: Go, Gin Framework, GORM
- **Database**: SQLite
- **Deployment**: Docker, GitHub Actions (GHCR)

## Development

### Prerequisites

- Node.js 18+
- Go 1.21+
- Docker & Docker Compose (for containerized deployment)

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

This project includes a fully automated CI/CD pipeline.

- High-level changes pushed to the `main` branch or tagged with `v*.*.*` automatically trigger a GitHub Action.
- The action builds a multi-stage Docker container encompassing the React frontend and Go backend.
- The compiled image is seamlessly published to `ghcr.io`.

### Deploy with Docker Compose

```yaml
version: '3.8'

services:
  thirsti:
    image: ghcr.io/YOUR_GITHUB_USERNAME/thirsti-tracker:latest
    ports:
      - "8080:8080"
    environment:
      - JWT_SECRET=change-this-to-a-secure-secret-in-production
      - DISABLE_REGISTRATION=false # Set to 'true' after creating the first admin account
```

# CLAUDE.md

日本語で回答してください。

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

『東京都 災害避難 Guide』 - A disaster evacuation guidance application for Tokyo residents and visitors. Provides evacuation route navigation and displays critical infrastructure (fire hydrants, water supplies, evacuation centers, WiFi points, temporary shelters) on interactive maps.

## Architecture

### Service Architecture
- **Frontend** (Port 3222): React 19 + Vite + TypeScript application
- **System Server** (Port 3777): Hono framework API server with PostgreSQL/Prisma
- **AI Agent Server**: FastAPI Python server for AI features (read-only DB access)
- **Database** (Port 8777): PostgreSQL with Prisma ORM

### Key Technologies
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, Jotai state management, React-Leaflet maps
- **Backend**: Hono, Prisma ORM, Zod validation, TypeScript
- **Authentication**: Google OAuth integration

## Essential Commands

### Full Stack Development
```bash
# Start all services
docker compose up --build

# Start database only
docker compose up db --build
```

### Frontend Development
```bash
cd frontend
npm run dev      # Development server (port 3222)
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend Development
```bash
cd server
npm run dev      # Development with hot reload
npm run dev:prod # Production mode with hot reload
```

### Data Processing Scripts
```bash
# Geocoding addresses to coordinates
cd scripts/geocoding && npm run geocode

# Download map tiles for offline use
cd scripts/map-downloader && npm run quick-start
```

## Project Structure

```
/frontend/         - React Vite application
  /src/
    /components/   - UI components (shadcn/ui based)
    /hooks/        - Custom React hooks
    /lib/          - Utilities and helpers
    /pages/        - Route components
    /stores/       - Jotai state atoms

/server/          - Hono API server
  /src/
    /routes/      - API endpoints
    /services/    - Business logic
  /prisma/        - Database schema and migrations

/ai-agent-server/ - FastAPI AI service

/data-source/     - CSV data files for Tokyo facilities
/scripts/         - Data processing utilities
```

## Database Schema

Primary entity is `User` with:
- UUID v7 for user IDs
- Google OAuth integration fields
- Standard timestamp tracking (createdAt, updatedAt)

## Development Guidelines

1. **TypeScript**: Strict mode enabled across all projects
2. **State Management**: Use Jotai atoms for global state in frontend
3. **API Communication**: System server handles all database writes; AI server has read-only access
4. **Map Data**: Use React-Leaflet for map interactions
5. **Styling**: Tailwind CSS with shadcn/ui components
6. **Validation**: Use Zod schemas for type-safe validation

## Important Notes

- All documentation and comments are in Japanese
- Focus on disaster response and evacuation scenarios
- Map tiles can be pre-downloaded for offline access
- Geocoding supports multiple APIs (GSI, Google Maps, OpenStreetMap)
- Frontend uses port 3222, backend uses port 3777, database uses port 8777
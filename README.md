# Mustody SaaS Platform - Frontend

English SaaS application frontend built with React, TypeScript, and Tailwind CSS.

## Project Structure

- **Frontend**: This repository (mustody-project-frontend)
- **Backend**: ../mustody-project-backend (Go backend)
- **Design System**: Inherits CSS and components from ../mustody/client

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Wouter (routing)
- Axios (API calls)
- Radix UI components
- Framer Motion (animations)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your backend URL
# VITE_API_URL=http://localhost:8080/api
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Backend Connection

The frontend connects to the Go backend at `../mustody-project-backend`.

API configuration is in `src/lib/api.ts`:
- Base URL: `VITE_API_URL` from .env
- Auth: JWT token in localStorage
- Auto-redirect to /login on 401

## Features

- Multi-tenant SaaS architecture
- Role-based access control (Admin, Tenant Admin, User)
- Payment link management
- User authentication & authorization
- Responsive design
- Dark mode support
- Modern UI components

## Environment Variables

```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=Mustody SaaS Platform
VITE_APP_VERSION=1.0.0
```

## Project Links

- Backend: `../mustody-project-backend`
- Design Reference: `../mustody/client`

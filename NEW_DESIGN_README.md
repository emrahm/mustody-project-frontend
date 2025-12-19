# Mustody Project Frontend - New Design

A modern, elegant frontend for the Mustody crypto custody platform built with React, TypeScript, and Tailwind CSS using the Mustody design system.

## 🎨 New Features

This updated frontend includes:

- **Authentication Pages**: Login and Register with elegant forms
- **Dashboard**: Comprehensive overview with stats, transactions, and quick actions  
- **API Key Management**: Full CRUD operations for API keys with security features
- **Responsive Design**: Mobile-first approach with elegant animations
- **Modern UI**: Based on the Mustody design system with consistent styling

## 📱 Pages

### Authentication
- `/login` - User login with email/password
- `/register` - User registration with company details

### Dashboard
- `/dashboard` - Main dashboard with stats and overview
- `/api-keys` - API key management interface

## 🎨 Design System

The frontend uses the Mustody design system with:
- **Color Palette**: Blue-based theme with elegant gradients
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Reusable UI components with consistent styling
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design that works on all devices

## 🔧 Key Components

### Layout Component
Shared layout with sidebar navigation, user profile, and responsive mobile menu.

### Authentication Forms
- Email/password validation
- Show/hide password functionality
- Form validation and error handling
- Loading states

### Dashboard Features
- Real-time statistics cards
- Recent transactions list
- Quick action buttons
- Security status indicators

### API Key Management
- Create new API keys with permissions
- View/hide sensitive key data
- Copy to clipboard functionality
- Delete with confirmation
- Usage statistics and security events

## 🚀 Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Shadcn/ui components
│   └── Layout.tsx    # Shared layout component
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   └── ApiKeyManagement.tsx
├── contexts/
│   └── ThemeContext.tsx
└── index.css         # Mustody design system
```

## 🛠 Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Vite** - Build tool
- **Wouter** - Lightweight routing
- **Lucide React** - Icon library
- **Shadcn/ui** - Component library

## 🎯 Design System Classes

The project includes custom CSS classes for consistent styling:

```css
/* Buttons */
.btn-primary, .btn-secondary, .btn-outline, .btn-danger

/* Cards */
.card, .card-header, .card-title, .card-description

/* Forms */
.input, .form-group, .form-label, .form-error

/* Badges */
.badge-primary, .badge-success, .badge-warning, .badge-danger

/* Stats */
.stat-card, .stat-value, .stat-label
```

## 🔗 Backend Connection

The frontend is designed to connect to the Go backend at `../mustody-project-backend`.

API configuration is in `src/lib/api.ts`:
- Base URL: `VITE_API_URL` from .env
- Auth: JWT token in localStorage
- Auto-redirect to /login on 401

## 📄 License

© 2026 Mustody. All rights reserved.

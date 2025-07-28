# replit.md

## Overview

This project is an educational AI Factory Simulator built with React and Express.js. It's designed to teach users about generative AI development factors through an interactive game where players manage the three core pillars of AI advancement: Compute, Data, and Algorithms. The goal is to progress through AI eras (GNT-2 through GNT-7) by completing training runs and achieving artificial general intelligence.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom theme configuration
- **UI Components**: Radix UI component library for accessible, unstyled primitives
- **State Management**: React hooks with custom game engine logic
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple

### Deployment Strategy
- **Development**: TSX for running TypeScript server directly
- **Production**: ESBuild for server bundling, Vite for frontend
- **Database Migrations**: Drizzle Kit for schema management

## Key Components

### Game Engine (`useGameEngine.ts`)
The core game logic handles:
- Resource production and consumption (Compute, Data, Algorithms)
- Training run mechanics with era progression
- Revenue generation from B2B/B2C customers
- Compute capacity management (total capacity vs. usage)
- Algorithm research progress tracking

### Factory System
Three main resource factories:
1. **Compute Factory**: Manages computational resources through infrastructure investments
2. **Data Factory**: Handles data quality and quantity improvements
3. **Algorithm Lab**: Research and development of AI algorithms

### Training Run System
- Discrete events that advance AI eras
- Requires meeting specific thresholds for compute, data, and algorithm levels
- 10x scaling requirement for compute between generations
- 30-day in-game duration with compute reservation

## Data Flow

1. **Resource Investment**: Players spend money to upgrade infrastructure inputs
2. **Capacity Building**: Investments increase maximum compute capacity and production rates
3. **Customer Usage**: B2B/B2C customers consume compute resources and generate revenue
4. **Training Runs**: Players initiate era advancement by reserving compute for training
5. **Research Progress**: Free compute automatically contributes to algorithm research
6. **Era Advancement**: Successful training runs unlock new capabilities and content

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL for production data persistence
- **Drizzle ORM**: Type-safe database queries and migrations
- **Connection**: Via DATABASE_URL environment variable

### UI Framework
- **Radix UI**: Comprehensive component library for accessible interfaces
- **Tailwind CSS**: Utility-first CSS framework with custom theming
- **React Query**: Server state management and caching

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast build tool with HMR and plugin ecosystem
- **ESBuild**: Server bundling for production deployments

## Deployment Strategy

### Development Environment
- Frontend: Vite dev server with HMR
- Backend: TSX for direct TypeScript execution
- Database: Drizzle Kit for schema pushing and migrations

### Production Environment
- Frontend: Static build served from `dist/public`
- Backend: ESBuild-bundled Node.js application
- Database: Neon Database with connection pooling

### Build Process
1. `npm run build` - Builds both frontend (Vite) and backend (ESBuild)
2. `npm run start` - Runs production server
3. `npm run db:push` - Applies database schema changes

## Changelog

- January 28, 2025. Major attached assets cleanup: Moved 40 outdated files to archive folder, retained 7 essential reference documents. Added README.md guide for future developers.
- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
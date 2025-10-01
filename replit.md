# replit.md

## Overview

This project is an educational AI Factory Simulator built with React and Express.js. It aims to teach users about the factors influencing generative AI development through an interactive game. Players manage Compute, Data, and Algorithms to advance through AI eras (GNT-2 to GNT-7), complete training runs, and ultimately achieve artificial general intelligence. The game simulates the business vision and market potential of an AI company, providing insights into the economic realities and technical challenges of AI development.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React with TypeScript for a robust and type-safe user interface.
- **Styling**: Tailwind CSS with a custom theme for a utility-first and consistent design.
- **UI Components**: Radix UI for accessible, unstyled primitives, ensuring high customizability and accessibility standards.
- **Animations and Character**: Integration of a Lottie-animated AI advisor character "Spark" for engaging guidance and notifications, enhancing user experience and educational value.
- **Responsive Design**: Mobile-first approach with responsive grid layouts and always-visible labels for tab navigation, ensuring usability across various devices.
- **Theming**: Purple gradient styling for the Training tab and yellow styling for the Leaderboard button to ensure key features stand out.

### Technical Implementations
- **Game Engine**: A custom React hook (`useGameEngine.ts`) manages core game logic, including resource production, consumption, training runs, revenue generation, and research progression.
- **Factory System**: Three core factory systems (Compute, Data, Algorithms) represent the pillars of AI advancement, allowing players to invest in and manage infrastructure.
- **Training Run System**: Discrete events that advance AI eras, requiring specific thresholds of compute, data, and algorithms, with significant scaling requirements for compute between generations.
- **Tutorial System**: A comprehensive, unified tutorial system combines modal explanations with interactive UI element spotlighting, guiding players through game mechanics and educational content.
- **State Management**: React hooks are used for state management, with an emphasis on immutable patterns for reliable UI updates.
- **Backend**: Node.js with Express.js provides a robust API layer.
- **Database**: PostgreSQL with Drizzle ORM for type-safe data persistence, utilizing Neon Database for serverless deployment.
- **Session Management**: PostgreSQL-based sessions with `connect-pg-simple` ensure secure user sessions.

### Feature Specifications
- **Cost Consistency**: All UI-displayed costs and messages are dynamically linked to backend logic, ensuring accuracy and preventing player confusion.
- **Platform Unlocks**: Visual highlighting (pulsing rings, shadows, notification dots) for new platform features (API, Chatbot) to ensure discoverability.
- **Leaderboard**: An always-accessible leaderboard with game pause functionality to motivate players and showcase achievements, including a detailed reset confirmation.
- **Dedicated Training Tab**: A centralized "Training" tab with comprehensive information on training runs, prerequisites, and era progression to improve discoverability and guidance.

### System Design Choices
- **Development Environment**: Vite for frontend development with Hot Module Reloading (HMR) and TSX for direct TypeScript server execution.
- **Production Environment**: ESBuild for server bundling and Vite for optimized frontend builds, ensuring efficient deployment.
- **Database Migrations**: Drizzle Kit is used for schema management and migrations, maintaining database integrity.

## External Dependencies

- **Neon Database**: Serverless PostgreSQL for production data persistence.
- **Drizzle ORM**: Type-safe ORM for interacting with PostgreSQL.
- **Radix UI**: A library of accessible, unstyled React components.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **React Query**: For server state management and caching.
- **TypeScript**: Used across both frontend and backend for type safety.
- **Vite**: A fast build tool for frontend development and bundling.
- **ESBuild**: A rapid JavaScript bundler used for backend production builds.
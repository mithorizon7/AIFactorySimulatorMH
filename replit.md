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

- September 30, 2025. **ALWAYS-ACCESSIBLE LEADERBOARD WITH GAME PAUSE COMPLETE**: Implemented motivational leaderboard system accessible anytime with automatic game pause and reset confirmation:
  1. **LeaderboardModal Component**: Created standalone modal displaying top 20 AGI achievers with rank medals (🥇🥈🥉), player stats (intelligence, time, money, users), strategy badges (B2B/B2C/Speed Run), and empty state messaging
  2. **GameHeader Integration**: Added Trophy button in top-right corner for instant leaderboard access, yellow styling to stand out, responsive labels (hidden on mobile for space)
  3. **Game Pause System**: Integrated with GamePauseContext to automatically pause game time when leaderboard opens, resume on close - prevents time loss during competitive viewing
  4. **Reset Confirmation**: Implemented AlertDialog with detailed progress summary (intelligence level, time elapsed, money, resources) requiring explicit confirmation before reset - prevents accidental data loss
  5. **Educational Design**: Leaderboard serves as motivation by showing other players' achievements and strategies, tip section encourages AGI completion for Hall of Fame entry
  6. **Complete Testing**: Verified leaderboard access, pause/resume functionality, reset confirmation flow, and state persistence - 100% test pass rate with all features working correctly
- September 30, 2025. **MOBILE-RESPONSIVE TAB NAVIGATION COMPLETE**: Implemented comprehensive mobile-first responsive design for main game tab navigation:
  1. **Responsive Grid Layout**: Changed from fixed 6-column layout to adaptive `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` (2 columns mobile → 3 columns tablet → 6 columns desktop)
  2. **Always-Visible Labels**: Removed `hidden sm:inline` pattern - all tab labels (Dashboard, Training, Resources, Economy, Breakthroughs, Progression) now always visible for improved mobile UX
  3. **Proper Touch Targets**: Added `min-h-[44px]` to meet Apple's minimum touch target recommendation, ensuring tabs are easily tappable on mobile devices
  4. **Z-Index Stacking Fix**: Added `relative z-20` to wrapper and `relative z-10` to TabsList to prevent tab content from overlapping and blocking tab triggers on mobile
  5. **Enhanced Spacing**: Increased bottom margin from `mb-4` to `mb-6` for better visual separation between tabs and content
  6. **Comprehensive Testing**: Two Playwright test suites passed with 100% success rate across mobile (375x667), tablet (768x1024), and desktop (1440x900) viewports - verified responsive layouts, label visibility, touch targets, and direct click functionality
- September 30, 2025. **TRAINING INTEGRATION COMPLETE**: Implemented dedicated Training tab for improved training run discoverability and educational guidance:
  1. **TrainingTab.tsx Component**: Created comprehensive training interface with prominent "Start Training" CTA, training progress visualization, era advancement pathway, and detailed prerequisites display (compute level, data quality/quantity/formats, algorithm architectures, research progress)
  2. **Final-Era Logic**: Fixed `getNextEra` function to properly return null when player reaches GNT-7, displaying "training complete" message instead of showing unavailable training controls
  3. **MainGameTabs Integration**: Added Training tab between Dashboard and Resources with purple gradient styling, updated tab grid from 5 to 6 columns, proper gameState and trainModel props connection
  4. **Dashboard Migration**: Updated "Era Advancement" Priority Action to navigate to Training tab instead of directly calling trainModel(), enhanced educational messaging to guide players to dedicated training interface
  5. **Educational Design**: Training tab includes "Why Training Matters" section explaining the importance of training runs, 10x compute scaling visualization, era progression timeline (GNT-2 through AGI)
  6. **Comprehensive Testing**: Verified all UI elements, navigation flow, prerequisites display, era progression timeline, and Start Training button states - 100% test pass rate
- July 28, 2025. **SPARK CHARACTER INTEGRATION COMPLETE**: Implemented animated AI advisor character "Spark" throughout the educational game system:
  1. **SparkCharacter Component**: Created Lottie-animated character with play-once animation, corner positioning, and inline message display modes
  2. **Tutorial System Integration**: Spark appears in modal tutorials with corner positioning and character-driven educational dialogue
  3. **Narrative Notification System**: Enhanced notifications to display Spark for strategic advice, achievements, and breakthrough celebrations
  4. **Enhanced User Experience**: Spark provides personalized guidance with friendly AI advisor persona, making learning more engaging
  5. **Character Positioning**: Optimized corner placement for dialogs and notifications to maintain content readability while showing character presence
  6. **Complete Testing Suite**: Achieved 100% integration success with comprehensive test coverage across all system components
- January 28, 2025. **UNIFIED TUTORIAL SYSTEM COMPLETE & VERIFIED**: Implemented comprehensive tutorial system that preserves all educational content while creating seamless player experience:
  1. **UnifiedTutorialSystem.tsx**: Combines modal explanations with interactive UI element spotlighting, supporting 4 phases and 13 total steps with dynamic content from narrativeContent.ts
  2. **Enhanced narrativeContent.ts**: Unified all tutorial content into single source with phase-based organization, rich educational context, and strategic advice triggers
  3. **Dynamic Narrative Triggers**: Created useNarrativeTriggers.ts for contextual warnings, achievements, and strategic advice based on game state
  4. **Tutorial CSS Animations**: Added highlight animations, spotlight effects, and smooth transitions for enhanced visual feedback
  5. **Complete Integration**: Tutorial system fully integrated with game engine, supporting progression tracking, skip functionality, and seamless transition to gameplay
  6. **Comprehensive Testing**: Built and executed complete testing battery (20 total tests) with 100% pass rate across structural, functional, and integration tests
- January 28, 2025. **CRITICAL FIXES**: Fixed two game-breaking progression blockers that made the game unwinnable:
  1. **Compute Scaling Fix**: Upgraded maxCapacity formula from Math.pow(1.8, level) to Math.pow(3.0, level) with significantly increased hardware bonuses (2000→5000) and money investment bonuses (800→2000). This enables reaching the required compute thresholds for all training runs (GNT-4: 10,000, GNT-5: 100,000, GNT-6: 1,000,000).
  2. **Breakthrough System Fix**: Added missing checkBreakthroughs() calls to all 9 infrastructure upgrade functions (allocateMoneyToElectricity, allocateMoneyToHardware, allocateMoneyToRegulations, allocateMoneyToDataQuantity, allocateMoneyToDataFormats, hireResearchEngineer, improveDeveloperTools, improveChatbot). The breakthrough system now properly unlocks as players invest in upgrades.
- January 28, 2025. Major attached assets cleanup: Moved 40 outdated files to archive folder, retained 7 essential reference documents. Added README.md guide for future developers.
- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
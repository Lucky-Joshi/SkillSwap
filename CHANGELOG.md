# Changelog

All notable changes to SkillSwap will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-08-25

### Added
- Admin dashboard with detailed system statistics and health monitoring (`e12d835`)
- Admin System Health page for real-time infrastructure visibility (`37c3113`)
- Admin Users page for user management and administration (`37c3113`)
- Admin service modules: certificates, reports, AI monitor, system health, analytics (`3277af5`)
- API documentation for additional user and privacy endpoints (`beeea9e`)
- AI service documentation covering health endpoint and caching strategies (`3b56412`)
- Security documentation on rate limiting, RBAC, and admin management (`0d84e7c`)
- Architecture documentation for admin portal, frontend structure, and backend enhancements (`58724e6`)
- Database schema documentation covering user roles, field descriptions, and reporting (`d0a9f47`)
- Deployment documentation for admin account creation, NPM scripts, and env variables (`9e7ed6f`)
- Admin moderation system with comprehensive audit logging (`a110a91`)
- `PUBLIC_URL` environment variable and build script for public folder deployment (`a419049`)

### Changed
- Simplified `PublicNavbar` component for cleaner navigation (`fd136fa`)
- Refactored auth routes, created admin script, and streamlined seeding (`53096d2`)
- Updated README and documentation across all service modules (`be49a56`)
- Removed unused `isTest` parameter from codebase (`d7d2249`)
- Removed demo mode configuration and environment example references (`a419049`, `07ccb80`)

### Fixed
- Post-login redirect now correctly navigates to the landing page (`9d6402c`)
- Modal focus management stabilization for improved accessibility (`8f70411`)
- `models_cache` entry in `.gitignore` (`445c9e4`)
- Removed unused `psutil` import from AI service (`aeb6c8b`)

## [0.4.0] - 2026-08-20

### Added
- Enhanced user profile features including endorsements system (`3d1051a`)
- `VirtualList` component for performant rendering of large lists (`b8fae8d`)
- `Input` and `Modal` accessibility improvements (`189a115`)
- `PageSkeleton` loading component for consistent page transitions (`189a115`)
- Additional user service functions for extended profile operations (`189a115`)
- Profile components: `ProfileHeader`, `ReviewsSection`, `RoadmapProgress`, `SkillShowcase`, `SocialLinksBar` (`cc42248`)
- AI client metrics tracking and error logging (`45cd31c`)
- Enhanced filtering for conversations, notifications, sessions, and user search (`c971926`)

### Changed
- UI component refactoring for consistency and maintainability (`d394d1c`)
- Applied `React.memo` optimization across components to reduce unnecessary re-renders (`d394d1c`)
- Enhanced filtering for chat, discover, mentorships, notifications, recommendations, and sessions (`f963f66`)

### Fixed
- Profile feature rendering and accessibility improvements (`6c5f018`)

## [0.3.0] - 2026-08-15

### Added
- Mentorship relationship management and session tracking (`3acbf1d`)
- AI-driven next-step recommendations for learning progression (`27afcb5`)
- Enhanced AI and chat system capabilities (`27afcb5`)
- Mentorship functionalities with relationship lifecycle management (`b65d6d7`)
- Calendar page for session and mentorship scheduling (`aa55c4c`)
- Mentorships management page for viewing and managing relationships (`aa55c4c`)
- Mentorships and sessions management with AI-driven next steps (`b65d6d7`)
- `Connection` model replacing the previous `Match` model (`fc7b435`)
- System architecture diagram and AI service documentation (`4967ed8`)
- Architecture and API documentation with Socket.IO event descriptions (`492f483`)
- About, Contact, FAQ, Features, Home, and HowItWorks pages (`07464b4`)
- Search and filter functionality for Chat, Discover, Mentorships, Notifications, Recommendations, and Sessions (`f963f66`)

### Changed
- Replaced `Match` model with `Connection` model for improved relationship tracking (`fc7b435`)
- Enhanced README and API documentation with connection model details and database schema (`5651615`)

### Fixed
- Session reminders now fire reliably (`27afcb5`)

## [0.2.0] - 2026-08-10

### Added
- Environment configuration, database connection, and core controllers (`f16dab2`)
- Controllers for leaderboard, match, notification, recommendation, review, session, skill, and user (`0cf0395`)
- User deletion functionality (`208bde6`)
- Review and session data models (`208bde6`)
- Admin and AI route definitions (`208bde6`)
- Enhanced user registration with validation (`5fb52c3`)
- Routes for badges, certificates, chat, dashboard, institutions, leaderboard, match, and recommendations (`5fb52c3`)
- Roadmap and skill graph services (`7067ba9`)
- Utility functions for common operations (`d8b3b5a`)
- Pagination support and user search with skill filtering (`3708466`)
- Reset Password, Roadmap, Sessions, Settings, and Verify Email pages (`7c5ee94`)
- Service layer files for backend logic separation (`456ba96`)

### Changed
- Expanded core documentation (`5a526c5`)

## [0.1.0] - 2026-08-01

### Added
- Initial `.gitignore` configuration (`8b1f4ad`)
- Docker Compose setup for service orchestration (`27ea1d2`)
- Project README with overview and setup instructions (`de953e7`)
- AI service Dockerfile for Python FastAPI container (`5ea4c09`)
- FastAPI service endpoints for AI recommendations (`79a9ad5`)
- AI service `requirements.txt` with Python dependencies (`447701c`)
- Embedding utilities using SBERT (`747e5b6`)
- Core recommendation engine with TF-IDF and semantic similarity (`0304dc6`)
- Resume parser for extracting skills from PDFs (`b0d901a`)
- Learning roadmap generator (`f300857`)
- Semantic similarity helpers for skill matching (`a9e22b9`)
- Backend Dockerfile for Node.js Express server (`526f48d`)
- Skill knowledge graph using NetworkX (`6d821c4`)
- Express server setup with middleware (`baad650`)
- Backend `package.json` with Node.js dependencies (`8d558fa`)

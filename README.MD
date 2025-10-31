# Boss Respawn Tracker API

A comprehensive API system for tracking boss respawn times in MMORPG games, built with PocketBase JS backend.

## 🎯 Overview

This API provides a centralized system for MMORPG players to track, manage, and share boss respawn information. Players can create, update, and delete boss records while keeping track of respawn timers to optimize their farming strategies.

## ✨ Core Features

### Boss Management
- **Create Boss Records**: Add new bosses with initial spawn information
- **Update Boss Data**: Modify boss details, spawn locations, and respawn patterns
- **Delete Boss Records**: Remove bosses that are no longer relevant
- **Bulk Operations**: Manage multiple bosses simultaneously

### Respawn Tracking
- **Real-time Timer Updates**: Track current respawn status and countdown timers
- **Spawn History**: Maintain logs of all spawn events for statistical analysis
- **Respawn Patterns**: Identify and predict boss spawn schedules
- **Multiple Server Support**: Track bosses across different game servers

### User Features
- **User Authentication**: Secure login and registration system
- **Personal Boss Lists**: Customize which bosses each user wants to track
- **Notifications**: Alert users when bosses are about to respawn
- **Favorites**: Mark frequently farmed bosses for quick access

### Social Features
- **Community Reports**: Allow users to report boss spawns for community verification
- **Leaderboards**: Track most active boss hunters and contributors
- **Comments System**: Discuss strategies and share tips about specific bosses
- **Guild Integration**: Share boss information within guilds

## 🏗️ Architecture

### Backend (PocketBase)
- **Collections**: Structured data models for bosses, users, spawns, and comments
- **Real-time Updates**: WebSocket connections for live timer updates
- **File Storage**: Boss images, screenshots, and documentation
- **Email System**: Notification delivery and account verification

### API Endpoints
- **Authentication**: `/api/auth/*` - Login, register, password reset
- **Boss Management**: `/api/bosses/*` - CRUD operations for boss records
- **Spawn Tracking**: `/api/spawns/*` - Spawn event management and timers
- **User Data**: `/api/users/*` - User profiles and preferences
- **Community**: `/api/community/*` - Reports, comments, and social features

### Data Models

#### Boss Collection
- `id`: Unique identifier
- `name`: Boss name
- `level`: Boss level/requirement
- `location`: Spawn area/coordinates
- `respawn_time`: Base respawn duration (minutes)
- `last_spawn`: Timestamp of last known spawn
- `next_spawn`: Predicted next spawn time
- `server`: Game server identifier
- `image`: Boss screenshot/image
- `description`: Boss details and drops
- `difficulty`: Boss difficulty rating
- `created_by`: User who added the boss
- `verified`: Community verification status

#### Spawn Event Collection
- `id`: Unique identifier
- `boss_id`: Reference to boss
- `spawn_time`: Actual spawn timestamp
- `reported_by`: User who reported the spawn
- `verified`: Confirmation status
- `server`: Server where spawn occurred
- `notes`: Additional spawn details

#### User Collection
- `id`: Unique identifier
- `username`: Display name
- `email`: Contact email
- `favorite_bosses`: Array of tracked boss IDs
- `notification_settings`: Alert preferences
- `guild`: Guild affiliation
- `stats`: User statistics (reports, accuracy, etc.)

## 🚀 Key Functionalities

### 1. Boss CRUD Operations
- Create new boss entries with comprehensive details
- Update boss information as game updates occur
- Delete obsolete or incorrect boss records
- Bulk import/export boss data

### 2. Respawn Time Management
- Calculate and update respawn timers in real-time
- Handle variable respawn times based on boss type
- Account for server maintenance and downtime
- Predict future spawn times using historical data

### 3. Notification System
- Email notifications for upcoming boss spawns
- In-app alerts and push notifications
- Customizable notification timing (5min, 1min, 30sec before spawn)
- Guild-wide boss alerts

### 4. Data Validation
- Community verification system for spawn reports
- Automatic detection of impossible spawn times
- Flag suspicious or duplicate reports
- Maintain data integrity and accuracy

### 5. Analytics & Reporting
- Boss spawn frequency statistics
- User activity and contribution metrics
- Server-specific spawn patterns
- Historical data analysis and trends

## 🔧 Technical Features

### Real-time Updates
- WebSocket connections for live timer updates
- Automatic timer synchronization across clients
- Push notifications for spawn alerts

### Data Synchronization
- Multi-server support with server-specific data
- Conflict resolution for simultaneous updates
- Offline capability with local data caching

### Security & Privacy
- User authentication and authorization
- Rate limiting to prevent spam
- Data encryption for sensitive information
- GDPR compliance for user data

### Performance Optimization
- Efficient database queries with indexing
- Caching for frequently accessed data
- Pagination for large result sets
- CDN integration for static assets

## 📱 Integration Possibilities

### Mobile Applications
- Native mobile apps for iOS/Android
- Progressive Web App (PWA) support
- Offline functionality for limited connectivity

### Game Integration
- Discord bot integration for guild notifications
- Twitch stream integration for live boss hunting
- Game client overlays for in-game timers

### Third-party Services
- Calendar integration for spawn schedules
- Social media sharing for rare spawns
- Analytics platforms for detailed insights

## 🎮 Use Cases

### Individual Players
- Track personal farming schedules
- Set up notifications for rare bosses
- Maintain personal boss kill logs
- Share spawn information with friends

### Guilds & Communities
- Coordinate guild boss hunting events
- Share spawn information within guild
- Plan raid schedules around boss spawns
- Maintain guild boss kill statistics

### Content Creators
- Stream boss hunting sessions
- Create educational content about boss mechanics
- Share spawn predictions with audience
- Collaborate with other creators

## 🔮 Future Enhancements

### Advanced Features
- Machine learning for spawn prediction
- Integration with game APIs (if available)
- Advanced analytics and reporting
- Cross-game boss tracking support

### Community Features
- Boss hunting tournaments
- Achievement system for contributors
- Reputation system for accurate reporters
- Marketplace for boss-related items

### Technical Improvements
- GraphQL API for flexible data queries
- Microservices architecture for scalability
- Advanced caching strategies
- Real-time collaboration features

## 📋 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm package manager
- PocketBase instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rotate-mmo-site
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

### Setup Steps

1. **Setup PocketBase**: Deploy PocketBase backend with required collections
2. **Configure Collections**: Set up boss, spawn, user, and community collections
3. **Environment Configuration**: Update `.env` file with your settings
4. **Database Setup**: Create required collections in PocketBase
5. **API Testing**: Test endpoints using your preferred API client
6. **Frontend Integration**: Connect web/mobile clients to the API
7. **Deployment**: Launch the system with monitoring and backup systems

## 📦 Package Management

This project uses **npm** as the package manager.

### npm Commands Reference

```bash
# Install dependencies
npm install

# Add a new dependency
npm install <package-name>

# Add a development dependency
npm install -D <package-name>

# Remove a dependency
npm uninstall <package-name>

# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Run scripts
npm run <script-name>

# Check npm version
npm --version
```

## 🤝 Contributing

This project welcomes contributions from the MMORPG community. Whether you're a developer, game enthusiast, or data analyst, there are opportunities to improve the boss tracking system for everyone's benefit.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature`
5. Make your changes and test them
6. Run linting: `npm run lint`
7. Format code: `npm run format`
8. Commit your changes: `git commit -m "Add your feature"`
9. Push to your fork: `git push origin feature/your-feature`
10. Create a Pull Request

---

*Built with ❤️ for the MMORPG community*

# Spritey Adventure Game - Backend API

This is the backend API for the Spritey Adventure Game, providing MongoDB Atlas database storage for player data and scores.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
The `.env` file is configured with MongoDB Atlas:
- Database: MongoDB Atlas (Cloud)
- Server Port: 3000
- CORS Origin: http://localhost:8080

**⚠️ Important**: Update the `<db_password>` in the `.env` file with your actual MongoDB Atlas password.

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 4. Test the API
Visit `http://localhost:3000/api/health` to verify the server is running and connected to MongoDB.

## 📊 Database Management

### View Database Statistics
```bash
node database.js stats
```

### View Current Leaderboard
```bash
node database.js leaderboard
```

### View Player Details
```bash
node database.js player <playerName>
```

### Clear All Data (DANGEROUS!)
```bash
node database.js clear
```

## 🔌 API Endpoints

### Health Check
- **GET** `/api/health` - Server health status

### Player Management
- **GET** `/api/player/:name` - Get player details
- **POST** `/api/player` - Create new player
  ```json
  {
    "name": "PlayerName"
  }
  ```

### Score Management
- **POST** `/api/score` - Save player score
  ```json
  {
    "playerName": "PlayerName",
    "score": 150
  }
  ```

### Leaderboard
- **GET** `/api/leaderboard` - Get full leaderboard
- **GET** `/api/player/:name/scores?limit=10` - Get player's score history

## 🗄️ Database Schema

### Players Collection
```javascript
{
    _id: ObjectId,
    name: String (unique, required),
    createdAt: Date,
    updatedAt: Date
}
```

### Scores Collection
```javascript
{
    _id: ObjectId,
    playerId: ObjectId (reference to Player),
    score: Number (required, min: 0),
    gameDate: Date
}
```

### Indexes
- `players.name` - Unique index for player names
- `scores.playerId` - Index for efficient player score queries
- `scores.score` - Index for leaderboard sorting

## 🔧 Configuration

### Environment Variables (.env)
```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://michaelsamuelpedro_db_user:<db_password>@cluster0.j4zp7cn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=spritey_game

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# API Configuration
API_VERSION=v1
```

**⚠️ Important**: Replace `<db_password>` with your actual MongoDB Atlas password.

## 📱 Frontend Integration

To integrate with your game frontend, you'll need to:

1. **Replace localStorage calls** with API calls
2. **Update player creation** to use `/api/player`
3. **Update score saving** to use `/api/score`
4. **Update leaderboard display** to use `/api/leaderboard`

### Example Frontend Integration
```javascript
// Create player
const createPlayer = async (name) => {
    const response = await fetch('http://localhost:3000/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    return response.json();
};

// Save score
const saveScore = async (playerName, score) => {
    const response = await fetch('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, score })
    });
    return response.json();
};

// Get leaderboard
const getLeaderboard = async () => {
    const response = await fetch('http://localhost:3000/api/leaderboard');
    return response.json();
};
```

## 🛠️ Development

### Project Structure
```
spritey-game/
├── server.js          # Main API server
├── database.js         # Database management utilities
├── package.json        # Dependencies and scripts
├── .env               # Environment configuration
├── database/          # SQLite database files
│   └── spritey_game.db
└── README.md          # This file
```

### Dependencies
- **express**: Web framework
- **mongoose**: MongoDB object modeling
- **mongodb**: MongoDB driver
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **body-parser**: Request parsing middleware

## 🚨 Important Notes

1. **Database**: MongoDB Atlas cloud database (no local files)
2. **CORS**: Configured for `http://localhost:8080` by default
3. **Port**: Server runs on port 3000 by default
4. **Data Persistence**: All data is stored in MongoDB Atlas cloud
5. **Security**: Update the password in `.env` file before running
6. **Backup**: MongoDB Atlas provides automatic backups

## 🔒 Security Considerations

- Input validation on all endpoints
- MongoDB injection protection via Mongoose
- CORS configuration for cross-origin requests
- Error handling without exposing sensitive information
- Password protection for database access

## 📈 Performance

- MongoDB indexes on frequently queried fields
- Efficient leaderboard queries with aggregation pipelines
- Connection pooling for MongoDB Atlas
- Optimized queries for player statistics
- Cloud-based scaling with MongoDB Atlas
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        process.env.CORS_ORIGIN || 'http://localhost:8080',
        'https://spritey-6rdcps903-sampeds-projects.vercel.app',
        'https://spritey-6rdcps903-sampeds-projects.vercel.app/'
    ],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'spritey_game';

// Mongoose schemas
const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 1,
        maxlength: 50
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const scoreSchema = new mongoose.Schema({
    playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0
    },
    gameDate: {
        type: Date,
        default: Date.now
    }
});

// Models
const Player = mongoose.model('Player', playerSchema);
const Score = mongoose.model('Score', scoreSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    dbName: DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${DB_NAME}`);
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});

// Middleware to update player's updatedAt field
playerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// API Routes

// Get all players with their best scores and game counts
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await Player.aggregate([
            {
                $lookup: {
                    from: 'scores',
                    localField: '_id',
                    foreignField: 'playerId',
                    as: 'scores'
                }
            },
            {
                $project: {
                    name: 1,
                    bestScore: { $max: '$scores.score' },
                    gamesPlayed: { $size: '$scores' },
                    lastPlayed: { $max: '$scores.gameDate' },
                    totalScore: { $sum: '$scores.score' }
                }
            },
            {
                $project: {
                    name: 1,
                    bestScore: { $ifNull: ['$bestScore', 0] },
                    gamesPlayed: 1,
                    lastPlayed: 1,
                    totalScore: { $ifNull: ['$totalScore', 0] }
                }
            },
            {
                $sort: { bestScore: -1, gamesPlayed: -1 }
            }
        ]);

        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get player by name
app.get('/api/player/:name', async (req, res) => {
    try {
        const { name } = req.params;
        
        const player = await Player.findOne({ name: name.trim() });
        
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const playerStats = await Player.aggregate([
            { $match: { _id: player._id } },
            {
                $lookup: {
                    from: 'scores',
                    localField: '_id',
                    foreignField: 'playerId',
                    as: 'scores'
                }
            },
            {
                $project: {
                    id: '$_id',
                    name: 1,
                    bestScore: { $max: '$scores.score' },
                    gamesPlayed: { $size: '$scores' },
                    totalScore: { $sum: '$scores.score' },
                    lastPlayed: { $max: '$scores.gameDate' }
                }
            },
            {
                $project: {
                    id: 1,
                    name: 1,
                    bestScore: { $ifNull: ['$bestScore', 0] },
                    gamesPlayed: 1,
                    totalScore: { $ifNull: ['$totalScore', 0] },
                    lastPlayed: 1
                }
            }
        ]);

        res.json(playerStats[0]);
    } catch (error) {
        console.error('Error fetching player:', error);
        res.status(500).json({ error: 'Failed to fetch player data' });
    }
});

// Create or get player
app.post('/api/player', async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Player name is required' });
        }

        const trimmedName = name.trim();

        // Try to find existing player or create new one
        let player = await Player.findOne({ name: trimmedName });
        
        if (!player) {
            player = new Player({ name: trimmedName });
            await player.save();
        }

        res.json({
            id: player._id,
            name: player.name,
            message: 'Player created successfully'
        });
    } catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({ error: 'Failed to create player' });
    }
});

// Save player score
app.post('/api/score', async (req, res) => {
    try {
        const { playerName, score } = req.body;
        
        if (!playerName || !score || score < 0) {
            return res.status(400).json({ error: 'Player name and valid score are required' });
        }

        // Find or create player
        let player = await Player.findOne({ name: playerName.trim() });
        
        if (!player) {
            player = new Player({ name: playerName.trim() });
            await player.save();
        }

        // Create new score
        const newScore = new Score({
            playerId: player._id,
            score: score
        });

        await newScore.save();

        res.json({
            message: 'Score saved successfully',
            scoreId: newScore._id,
            playerId: player._id,
            score: score
        });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Get player's score history
app.get('/api/player/:name/scores', async (req, res) => {
    try {
        const { name } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        const player = await Player.findOne({ name: name.trim() });
        
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const scores = await Score.find({ playerId: player._id })
            .sort({ gameDate: -1 })
            .limit(limit)
            .select('score gameDate');

        res.json(scores);
    } catch (error) {
        console.error('Error fetching player scores:', error);
        res.status(500).json({ error: 'Failed to fetch player scores' });
    }
});

// Get database statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalPlayers = await Player.countDocuments();
        const totalScores = await Score.countDocuments();
        const activePlayers = await Score.distinct('playerId').then(ids => ids.length);

        res.json({
            totalPlayers,
            totalScores,
            activePlayers
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        const dbState = mongoose.connection.readyState;
        const dbStatus = dbState === 1 ? 'Connected' : 'Disconnected';
        
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            database: dbStatus,
            mongodb: {
                state: dbState,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name
            }
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            timestamp: new Date().toISOString(),
            error: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Spritey Game API Server running on port ${PORT}`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
    console.log(`📅 Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
    process.exit(0);
});

module.exports = app;
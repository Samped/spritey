// This is a simple wrapper for Render deployment
// Render should use this as the entry point

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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Models
const Player = mongoose.model('Player', playerSchema);
const Score = mongoose.model('Score', scoreSchema);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
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
            status: 'Error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Create or get player
app.post('/api/player', async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Player name is required' });
        }

        // Check if player exists
        let player = await Player.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
        
        if (!player) {
            // Create new player
            player = new Player({
                name: name.trim()
            });
            await player.save();
        }

        res.json({
            id: player._id.toString(),
            name: player.name,
            createdAt: player.createdAt,
            updatedAt: player.updatedAt
        });
    } catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get player by name
app.get('/api/player/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const player = await Player.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Get player stats
        const scores = await Score.find({ playerId: player._id });
        const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
        const bestScore = Math.max(...scores.map(s => s.score), 0);
        
        res.json({
            id: player._id.toString(),
            name: player.name,
            createdAt: player.createdAt,
            updatedAt: player.updatedAt,
            gamesPlayed: scores.length,
            totalScore,
            bestScore
        });
    } catch (error) {
        console.error('Error getting player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save score
app.post('/api/score', async (req, res) => {
    try {
        const { playerName, score } = req.body;
        
        if (!playerName || score === undefined) {
            return res.status(400).json({ error: 'Player name and score are required' });
        }

        // Find player
        const player = await Player.findOne({ name: { $regex: new RegExp(`^${playerName}$`, 'i') } });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Save score
        const scoreData = new Score({
            playerId: player._id,
            score: parseInt(score)
        });
        
        await scoreData.save();

        res.json({ success: true, score: scoreData });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await Score.aggregate([
            {
                $lookup: {
                    from: 'players',
                    localField: 'playerId',
                    foreignField: '_id',
                    as: 'player'
                }
            },
            {
                $unwind: '$player'
            },
            {
                $group: {
                    _id: '$playerId',
                    name: { $first: '$player.name' },
                    gamesPlayed: { $sum: 1 },
                    totalScore: { $sum: '$score' },
                    bestScore: { $max: '$score' }
                }
            },
            {
                $sort: { bestScore: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json(leaderboard);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// Start server
async function startServer() {
    await connectToDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 Spritey Game API Server running on port ${PORT}`);
        console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
        console.log(`📅 Started at: ${new Date().toISOString()}`);
    });
}

startServer().catch(console.error);

module.exports = app;

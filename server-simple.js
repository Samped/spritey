const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for now
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple in-memory storage (for testing)
let players = [];
let scores = [];
let leaderboard = [];

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Create or get player
app.post('/api/player', async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Player name is required' });
        }

        // Check if player exists
        let player = players.find(p => p.name.toLowerCase() === name.toLowerCase());
        
        if (!player) {
            // Create new player
            player = {
                id: Date.now().toString(),
                name: name.trim(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            players.push(player);
        }

        res.json(player);
    } catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get player by name
app.get('/api/player/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const player = players.find(p => p.name.toLowerCase() === name.toLowerCase());
        
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Get player stats
        const playerScores = scores.filter(s => s.playerId === player.id);
        const totalScore = playerScores.reduce((sum, s) => sum + s.score, 0);
        const bestScore = Math.max(...playerScores.map(s => s.score), 0);
        
        const playerData = {
            ...player,
            gamesPlayed: playerScores.length,
            totalScore,
            bestScore
        };

        res.json(playerData);
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
        const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Save score
        const scoreData = {
            id: Date.now().toString(),
            playerId: player.id,
            playerName: player.name,
            score: parseInt(score),
            createdAt: new Date().toISOString()
        };
        
        scores.push(scoreData);
        
        // Update leaderboard
        updateLeaderboard();

        res.json({ success: true, score: scoreData });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        res.json(leaderboard);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update leaderboard
function updateLeaderboard() {
    const playerStats = {};
    
    // Calculate stats for each player
    scores.forEach(score => {
        if (!playerStats[score.playerName]) {
            playerStats[score.playerName] = {
                name: score.playerName,
                gamesPlayed: 0,
                totalScore: 0,
                bestScore: 0
            };
        }
        
        playerStats[score.playerName].gamesPlayed++;
        playerStats[score.playerName].totalScore += score.score;
        playerStats[score.playerName].bestScore = Math.max(
            playerStats[score.playerName].bestScore, 
            score.score
        );
    });
    
    // Convert to array and sort by best score
    leaderboard = Object.values(playerStats)
        .sort((a, b) => b.bestScore - a.bestScore)
        .slice(0, 10); // Top 10
}

// Serve static files (for development)
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static('.'));
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

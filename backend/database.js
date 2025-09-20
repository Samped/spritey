const mongoose = require('mongoose');
require('dotenv').config();

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

class DatabaseManager {
    constructor() {
        this.connected = false;
    }

    async connect() {
        try {
            await mongoose.connect(MONGODB_URI, {
                dbName: DB_NAME,
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            this.connected = true;
            console.log('✅ Connected to MongoDB Atlas');
            return true;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            return false;
        }
    }

    async disconnect() {
        try {
            await mongoose.connection.close();
            this.connected = false;
            console.log('✅ MongoDB connection closed');
            return true;
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error);
            return false;
        }
    }

    // Player management methods
    async createPlayer(name) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

        try {
            let player = await Player.findOne({ name: name.trim() });
            
            if (!player) {
                player = new Player({ name: name.trim() });
                await player.save();
            }
            
            return { id: player._id, name: player.name };
        } catch (error) {
            throw error;
        }
    }

    async getPlayer(name) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

        try {
            const player = await Player.findOne({ name: name.trim() });
            
            if (!player) {
                return null;
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

            return playerStats[0];
        } catch (error) {
            throw error;
        }
    }

    // Score management methods
    async saveScore(playerName, score) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

        try {
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

            return {
                scoreId: newScore._id,
                playerId: player._id,
                score: score
            };
        } catch (error) {
            throw error;
        }
    }

    async getLeaderboard() {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

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

            return leaderboard;
        } catch (error) {
            throw error;
        }
    }

    async getPlayerScores(playerName, limit = 10) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

        try {
            const player = await Player.findOne({ name: playerName.trim() });
            
            if (!player) {
                return null;
            }

            const scores = await Score.find({ playerId: player._id })
                .sort({ gameDate: -1 })
                .limit(limit)
                .select('score gameDate');

            return scores;
        } catch (error) {
            throw error;
        }
    }

    // Database maintenance methods
    async getDatabaseStats() {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

        try {
            const totalPlayers = await Player.countDocuments();
            const totalScores = await Score.countDocuments();
            const activePlayers = await Score.distinct('playerId').then(ids => ids.length);

            return {
                totalPlayers,
                totalScores,
                activePlayers
            };
        } catch (error) {
            throw error;
        }
    }

    async clearAllData() {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

        try {
            await Score.deleteMany({});
            await Player.deleteMany({});
            return { message: 'All data cleared successfully' };
        } catch (error) {
            throw error;
        }
    }

    async getTopPlayers(limit = 10) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

        try {
            const topPlayers = await Player.aggregate([
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
                        avgScore: { $avg: '$scores.score' }
                    }
                },
                {
                    $project: {
                        name: 1,
                        bestScore: { $ifNull: ['$bestScore', 0] },
                        gamesPlayed: 1,
                        avgScore: { $ifNull: ['$avgScore', 0] }
                    }
                },
                {
                    $sort: { bestScore: -1, avgScore: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            return topPlayers;
        } catch (error) {
            throw error;
        }
    }
}

// CLI interface for database management
if (require.main === module) {
    const dbManager = new DatabaseManager();
    
    const command = process.argv[2];
    const args = process.argv.slice(3);

    const runCommand = async () => {
        const connected = await dbManager.connect();
        if (!connected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }

        try {
            switch (command) {
                case 'stats':
                    const stats = await dbManager.getDatabaseStats();
                    console.log('📊 Database Statistics:');
                    console.log(`Total Players: ${stats.totalPlayers}`);
                    console.log(`Total Scores: ${stats.totalScores}`);
                    console.log(`Active Players: ${stats.activePlayers}`);
                    break;

                case 'leaderboard':
                    const leaderboard = await dbManager.getLeaderboard();
                    console.log('🏆 Leaderboard:');
                    leaderboard.forEach((player, index) => {
                        console.log(`${index + 1}. ${player.name} - ${player.bestScore} points (${player.gamesPlayed} games)`);
                    });
                    break;

                case 'top':
                    const limit = args[0] ? parseInt(args[0]) : 10;
                    const topPlayers = await dbManager.getTopPlayers(limit);
                    console.log(`🏆 Top ${limit} Players:`);
                    topPlayers.forEach((player, index) => {
                        console.log(`${index + 1}. ${player.name} - Best: ${player.bestScore}, Avg: ${player.avgScore.toFixed(1)}, Games: ${player.gamesPlayed}`);
                    });
                    break;

                case 'clear':
                    console.log('⚠️  This will delete ALL data!');
                    const result = await dbManager.clearAllData();
                    console.log('✅', result.message);
                    break;

                case 'player':
                    if (args.length === 0) {
                        console.log('Usage: node database.js player <playerName>');
                        process.exit(1);
                    }
                    const player = await dbManager.getPlayer(args[0]);
                    if (player) {
                        console.log(`👤 Player: ${player.name}`);
                        console.log(`🏆 Best Score: ${player.bestScore}`);
                        console.log(`🎮 Games Played: ${player.gamesPlayed}`);
                        console.log(`📊 Total Score: ${player.totalScore}`);
                        console.log(`📅 Last Played: ${player.lastPlayed}`);
                    } else {
                        console.log('❌ Player not found');
                    }
                    break;

                case 'scores':
                    if (args.length === 0) {
                        console.log('Usage: node database.js scores <playerName> [limit]');
                        process.exit(1);
                    }
                    const limitScores = args[1] ? parseInt(args[1]) : 10;
                    const scores = await dbManager.getPlayerScores(args[0], limitScores);
                    if (scores && scores.length > 0) {
                        console.log(`🎯 Recent scores for ${args[0]}:`);
                        scores.forEach((score, index) => {
                            console.log(`${index + 1}. ${score.score} points - ${score.gameDate}`);
                        });
                    } else {
                        console.log('❌ No scores found for this player');
                    }
                    break;

                default:
                    console.log('📚 Database Management Commands:');
                    console.log('  node database.js stats                    - Show database statistics');
                    console.log('  node database.js leaderboard             - Show current leaderboard');
                    console.log('  node database.js top [limit]             - Show top players with averages');
                    console.log('  node database.js player <name>            - Show player details');
                    console.log('  node database.js scores <name> [limit]    - Show player score history');
                    console.log('  node database.js clear                    - Clear all data (DANGEROUS!)');
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        } finally {
            await dbManager.disconnect();
        }
    };

    runCommand();
}

module.exports = DatabaseManager;
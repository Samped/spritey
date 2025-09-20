// API Integration for Spritey Adventure Game
// This file shows how to integrate the database API with your frontend

// Load environment variables
require('dotenv').config();

const API_BASE_URL = 'https://spriteyy.onrender.com/api';

// API Helper Functions
class GameAPI {
    static async createPlayer(name) {
        try {
            const response = await fetch(`${API_BASE_URL}/player`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name.trim() })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating player:', error);
            throw error;
        }
    }

    static async saveScore(playerName, score) {
        try {
            const response = await fetch(`${API_BASE_URL}/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    playerName: playerName.trim(), 
                    score: score 
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving score:', error);
            throw error;
        }
    }

    static async getLeaderboard() {
        try {
            const response = await fetch(`${API_BASE_URL}/leaderboard`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            throw error;
        }
    }

    static async getPlayer(playerName) {
        try {
            const response = await fetch(`${API_BASE_URL}/player/${encodeURIComponent(playerName)}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Player not found
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching player:', error);
            throw error;
        }
    }

    static async getPlayerScores(playerName, limit = 10) {
        try {
            const response = await fetch(`${API_BASE_URL}/player/${encodeURIComponent(playerName)}/scores?limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching player scores:', error);
            throw error;
        }
    }

    static async checkServerHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Server health check failed:', error);
            return null;
        }
    }
}

// Updated Functions to Replace localStorage with API calls

// Replace the savePlayerScore function in main.js
async function savePlayerScoreAPI() {
    if (!currentPlayer) {
        console.error('No current player to save score for');
        return;
    }

    try {
        // Ensure player exists in database
        await GameAPI.createPlayer(currentPlayer.name);
        
        // Save the current score
        await GameAPI.saveScore(currentPlayer.name, player.score);
        
        console.log(`Score ${player.score} saved for player ${currentPlayer.name}`);
        
        // Update local player data
        currentPlayer.gamesPlayed++;
        if (player.score > currentPlayer.bestScore) {
            currentPlayer.bestScore = player.score;
        }
        currentPlayer.totalScore += player.score;
        
    } catch (error) {
        console.error('Failed to save score to database:', error);
        // Fallback to localStorage if API fails
        savePlayerScoreLocalStorage();
    }
}

// Replace the initAuthSystem function in main.js
async function initAuthSystemAPI() {
    try {
        // Check if server is available
        const health = await GameAPI.checkServerHealth();
        if (!health) {
            console.warn('Database server unavailable, falling back to localStorage');
            initAuthSystemLocalStorage();
            return;
        }

        console.log('Database server connected, using API mode');
        
        // Check if there's a saved player in localStorage (for migration)
        const savedPlayer = localStorage.getItem('currentPlayer');
        if (savedPlayer) {
            try {
                const playerData = JSON.parse(savedPlayer);
                // Migrate to database
                await GameAPI.createPlayer(playerData.name);
                console.log(`Migrated player ${playerData.name} to database`);
            } catch (error) {
                console.error('Error migrating player to database:', error);
            }
        }
        
        showLoginScreen();
        
    } catch (error) {
        console.error('Error initializing auth system:', error);
        // Fallback to localStorage
        initAuthSystemLocalStorage();
    }
}

// Replace the showMainMenu function's leaderboard section in main.js
async function loadLeaderboardAPI() {
    try {
        const leaderboardData = await GameAPI.getLeaderboard();
        
        // Convert API format to expected format
        const formattedLeaderboard = leaderboardData.map(player => ({
            name: player.name,
            bestScore: player.bestScore,
            gamesPlayed: player.gamesPlayed,
            totalScore: player.totalScore || 0
        }));
        
        return formattedLeaderboard;
        
    } catch (error) {
        console.error('Failed to load leaderboard from database:', error);
        // Fallback to localStorage
        return loadLeaderboardLocalStorage();
    }
}

// Replace the showLoginScreen function's login button handler in main.js
async function handleLoginAPI(playerName) {
    if (!playerName || playerName.trim().length === 0) {
        alert('Please enter a valid player name');
        return;
    }

    try {
        // Create or get player from database
        const playerData = await GameAPI.createPlayer(playerName);
        
        // Get full player data including stats
        const fullPlayerData = await GameAPI.getPlayer(playerName);
        
        if (fullPlayerData) {
            currentPlayer = {
                name: fullPlayerData.name,
                bestScore: fullPlayerData.bestScore || 0,
                gamesPlayed: fullPlayerData.gamesPlayed || 0,
                totalScore: fullPlayerData.totalScore || 0
            };
            
            // Save to localStorage as backup
            localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
            
            console.log(`Player ${playerName} logged in successfully`);
            showMainMenu();
        } else {
            throw new Error('Failed to retrieve player data');
        }
        
    } catch (error) {
        console.error('Login failed:', error);
        alert('Failed to login. Please try again.');
    }
}

// Fallback functions for localStorage (keep existing functionality)
function savePlayerScoreLocalStorage() {
    // Keep your existing localStorage implementation here
    // This is the fallback when API is unavailable
}

function initAuthSystemLocalStorage() {
    // Keep your existing localStorage implementation here
    // This is the fallback when API is unavailable
}

function loadLeaderboardLocalStorage() {
    // Keep your existing localStorage implementation here
    // This is the fallback when API is unavailable
}

// Integration Instructions for main.js:

/*
To integrate this API with your main.js file, you need to:

1. Add this script to your HTML before main.js:
   <script src="api-integration.js"></script>

2. Replace these functions in main.js:

   OLD: savePlayerScore()
   NEW: savePlayerScoreAPI()

   OLD: initAuthSystem()
   NEW: initAuthSystemAPI()

   OLD: In showMainMenu(), replace the leaderboard loading logic
   NEW: Use loadLeaderboardAPI() instead of localStorage

   OLD: In showLoginScreen(), replace the login button handler
   NEW: Use handleLoginAPI(playerName) instead of localStorage

3. Make sure your server is running:
   npm start

4. Test the integration by:
   - Creating a new player
   - Playing the game
   - Checking if scores are saved to database
   - Verifying leaderboard shows data from database

5. Optional: Add error handling for offline mode
   - The API functions include fallbacks to localStorage
   - You can add a visual indicator when offline

6. Optional: Add loading states
   - Show loading spinners during API calls
   - Disable buttons during API operations
*/

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameAPI, savePlayerScoreAPI, initAuthSystemAPI, loadLeaderboardAPI, handleLoginAPI };
}

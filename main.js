// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
if (/Mobi|Android/i.test(navigator.userAgent)) {
    canvas.width = 1920;
    canvas.height = 1070; // 10px less for mobile
} else {
    canvas.width = 1920;
    canvas.height = 1080;
}

// Load images
const playerImage = new Image();
playerImage.src = 'assets/player.png';

const coinImage = new Image();
coinImage.src = 'assets/gain/spriteycoin.png';

// Add debugging for coin image loading
coinImage.onload = function() {
    console.log('Spriteycoin image loaded successfully');
};

coinImage.onerror = function() {
    console.error('Error loading spriteycoin image');
};

const gunEnemyImage = new Image();
gunEnemyImage.src = 'assets/enemies/gun.png';

const incoEnemyImage = new Image();
incoEnemyImage.src = 'assets/enemies/inco-enemy.png';

// Load multiple background images for progression
const backgroundImages = [];
const backgroundPaths = [
    'assets/backgrounds/Frame_48096685.webp',
    'assets/backgrounds/Frame_48096687.webp', 
    'assets/backgrounds/Frame_48096688.webp',
    'assets/backgrounds/Frame_48096691.webp'
];

// Initialize background images
backgroundPaths.forEach((path, index) => {
    const img = new Image();
    img.src = path;
    backgroundImages.push(img);
});

// Background transition variables
let currentBackgroundIndex = 0;
let backgroundTransitionProgress = 0;
let backgroundTransitionSpeed = 0.002; // Speed of transition
let backgroundChangeTrigger = 0; // Score threshold for background changes

const incomascot = new Image();
incomascot.src = 'assets/gain/incomascot.png';

// Load sound effects
const sounds = {
    jump: new Audio('assets/sounds/jump.mp3'),
    coin: new Audio('assets/sounds/coin.mp3'),
    shoot: new Audio('assets/sounds/shoot.mp3'),
    enemyHit: new Audio('assets/sounds/enemy-hit.mp3'),
    playerHit: new Audio('assets/sounds/player-hit.mp3'),
    gameOver: new Audio('assets/sounds/game-over.mp3'),
    win: new Audio('assets/sounds/win.mp3'),
    background: new Audio('assets/sounds/background-sound.mp3')
};

// Set background music to loop
sounds.background.loop = true;
sounds.background.volume = 0.5; // Set volume to 50%

// Function to draw animated background with smooth transitions
function drawAnimatedBackground() {
    if (backgroundImages.length === 0) {
        console.log('No background images loaded');
        return;
    }
    
    // Ensure we have valid background indices
    const currentBg = backgroundImages[currentBackgroundIndex];
    const nextBg = backgroundImages[(currentBackgroundIndex + 1) % backgroundImages.length];
    
    // Debug logging
    if (currentBackgroundIndex === 0 && !currentBg.complete) {
        console.log('Current background not loaded:', currentBg.src, 'complete:', currentBg.complete);
    }
    
    // Draw current background
    if (currentBg && currentBg.complete) {
        ctx.drawImage(currentBg, camera.x, 0, canvas.width, canvas.height);
    } else {
        // Fallback: draw a solid color background
        ctx.fillStyle = '#E0F7FF';
        ctx.fillRect(camera.x, 0, canvas.width, canvas.height);
    }
    
    // Draw next background with transition opacity if transitioning
    if (backgroundTransitionProgress > 0 && nextBg && nextBg.complete) {
        ctx.globalAlpha = backgroundTransitionProgress;
        ctx.drawImage(nextBg, camera.x, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0; // Reset alpha
    }
}

// Function to update background progression based on score
function updateBackgroundProgression() {
    const scoreThresholds = [0, 50, 100, 150]; // Score thresholds for each background
    
    // Check if we should start a new transition
    for (let i = 0; i < scoreThresholds.length; i++) {
        if (player.score >= scoreThresholds[i] && currentBackgroundIndex < i) {
            // Start transition to next background
            if (currentBackgroundIndex < backgroundImages.length - 1 && backgroundTransitionProgress === 0) {
                backgroundTransitionProgress = 0.001; // Start transition
                backgroundChangeTrigger = scoreThresholds[i];
            }
            break;
        }
    }
    
    // Update transition progress
    if (backgroundTransitionProgress > 0) {
        backgroundTransitionProgress += backgroundTransitionSpeed;
        
        // Complete transition
        if (backgroundTransitionProgress >= 1) {
            backgroundTransitionProgress = 0;
            currentBackgroundIndex = Math.min(currentBackgroundIndex + 1, backgroundImages.length - 1);
        }
    }
}

// Function to play background music
function playBackgroundMusic() {
    // Reset the audio to the beginning
    sounds.background.currentTime = 0;
    
    // Play the background music
    const playPromise = sounds.background.play();
    
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Autoplay started successfully
            console.log('Background music started playing');
        }).catch(error => {
            // Autoplay was prevented
            console.log('Error playing background music:', error);
            // Try to play on user interaction
            document.addEventListener('click', () => {
                sounds.background.play();
            }, { once: true });
        });
    }
}

// Start background music when game starts
window.addEventListener('load', () => {
    playBackgroundMusic();
});

// Set volume for all sounds
Object.values(sounds).forEach(sound => {
    sound.volume = 0.3; // Set volume to 30%
});

// Function to play sound with error handling
function playSound(soundName) {
    try {
        const sound = sounds[soundName];
        if (sound) {
            // Reset the sound to the beginning if it's already playing
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log('Error playing sound:', error);
            });
        }
    } catch (error) {
        console.log('Error with sound:', error);
    }
}

// Wait for images to load
let imagesLoaded = 0;
const totalImages = 9;  // Updated to include both enemy images + 4 background images

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        // Start game loop only after all images are loaded
        initGame();
    }
}

playerImage.onload = imageLoaded;
coinImage.onload = imageLoaded;
gunEnemyImage.onload = imageLoaded;
incoEnemyImage.onload = imageLoaded;
incomascot.onload = imageLoaded;

// Add onload handlers for background images
backgroundImages.forEach((img, index) => {
    img.onload = function() {
        console.log(`Background image ${index} loaded successfully:`, img.src);
        imageLoaded();
    };
    img.onerror = function() {
        console.error(`Error loading background image ${index}:`, img.src);
    };
});

// Load character image
const spritey = new Image();
spritey.src = 'assets/characters/spritey.webp';

// Add image loading verification
spritey.onload = function() {
    console.log('Character image loaded successfully');
};

spritey.onerror = function() {
    console.error('Error loading character image');
};

// Brick properties
const brickWidth = 60;    // Width of each brick
const brickHeight = 27;   // Height of each brick
const groundHeight = brickHeight * 2;  // Height of the ground platform (2 rows)

// Platform positions
const platforms = [
    // Initial ground platform
    { x: -100, y: canvas.height - groundHeight, width: 1000, height: groundHeight },
    
    // First section - Normal platforms (Easy)
    { x: 400, y: canvas.height - 100, width: brickWidth * 4, height: brickHeight * 2 },   // Low platform
    { x: 800, y: canvas.height - 550, width: brickWidth * 6, height: brickHeight * 3 },   // Mid-high platform
    { x: 1200, y: canvas.height - 150, width: brickWidth * 5, height: brickHeight * 2 },  // Mid platform
    { x: 1600, y: canvas.height - 400, width: brickWidth * 4, height: brickHeight * 2 },  // High platform
    { x: 2000, y: canvas.height - 200, width: brickWidth * 3, height: brickHeight * 2 },  // Mid platform
    { x: 2400, y: canvas.height - 350, width: brickWidth * 5, height: brickHeight * 2 },  // Highest platform
    { x: 3200, y: canvas.height - 280, width: brickWidth * 3, height: brickHeight * 2 },  // High platform
    
    // Ground platforms with gaps
    { x: 3500, y: canvas.height - groundHeight, width: 800, height: groundHeight },       // Ground platform 1
    { x: 4500, y: canvas.height - groundHeight, width: 600, height: groundHeight },       // Ground platform 2
    { x: 5300, y: canvas.height - groundHeight, width: 1000, height: groundHeight },      // Ground platform 3
    { x: 6500, y: canvas.height - groundHeight, width: 700, height: groundHeight },       // Ground platform 4
    { x: 7400, y: canvas.height - groundHeight, width: 900, height: groundHeight },       // Ground platform 5
    { x: 8500, y: canvas.height - groundHeight, width: 800, height: groundHeight },       // Ground platform 6
    { x: 9500, y: canvas.height - groundHeight, width: 600, height: groundHeight },       // Ground platform 7
    { x: 10300, y: canvas.height - groundHeight, width: 1000, height: groundHeight },     // Ground platform 8
    { x: 11500, y: canvas.height - groundHeight, width: 700, height: groundHeight },      // Ground platform 9
    { x: 12400, y: canvas.height - groundHeight, width: 900, height: groundHeight },      // Ground platform 10
    { x: 13500, y: canvas.height - groundHeight, width: 800, height: groundHeight },      // Ground platform 11

    // Second section - L-shaped structures (Medium)
    { x: 3600, y: canvas.height - 600, width: brickWidth * 2, height: brickHeight * 8 },  // Vertical part of L
    { x: 3600, y: canvas.height - 600, width: brickWidth * 4, height: brickHeight * 2 },  // Horizontal part of L
    { x: 4200, y: canvas.height - 400, width: brickWidth * 2, height: brickHeight * 6 },  // Vertical part of inverted L
    { x: 4200, y: canvas.height - 800, width: brickWidth * 4, height: brickHeight * 2 },  // Horizontal part of inverted L
    
    // Third section - Mixed structures (Medium-Hard)
    { x: 4800, y: canvas.height - 450, width: brickWidth * 3, height: brickHeight * 4 },  // Medium wall
    { x: 5100, y: canvas.height - 350, width: brickWidth * 5, height: brickHeight * 2 },  // Wide platform
    { x: 5600, y: canvas.height - 550, width: brickWidth * 2, height: brickHeight * 7 },  // Tall wall
    { x: 5800, y: canvas.height - 200, width: brickWidth * 4, height: brickHeight * 2 },  // Low platform
    
    // Fourth section - Complex L-shaped structures (Hard)
    { x: 6200, y: canvas.height - 400, width: brickWidth * 2, height: brickHeight * 5 },  // Vertical part of L
    { x: 6200, y: canvas.height - 400, width: brickWidth * 6, height: brickHeight * 2 },  // Horizontal part of L
    { x: 6800, y: canvas.height - 500, width: brickWidth * 2, height: brickHeight * 6 },  // Vertical part of inverted L
    { x: 6800, y: canvas.height - 600, width: brickWidth * 6, height: brickHeight * 2 },  // Horizontal part of inverted L
    
    // Fifth section - Challenge structures (Very Hard)
    { x: 7400, y: canvas.height - 600, width: brickWidth * 2, height: brickHeight * 8 },  // Tallest wall
    { x: 7600, y: canvas.height - 400, width: brickWidth * 3, height: brickHeight * 2 },  // Platform
    { x: 8000, y: canvas.height - 500, width: brickWidth * 2, height: brickHeight * 7 },  // Tall wall
    { x: 8200, y: canvas.height - 300, width: brickWidth * 5, height: brickHeight * 2 },  // Final platform

    // Sixth section - Advanced L-shaped structures (Expert)
    { x: 8600, y: canvas.height - 700, width: brickWidth * 2, height: brickHeight * 9 },  // Vertical part of L
    { x: 8600, y: canvas.height - 200, width: brickWidth * 8, height: brickHeight * 2 },  // Horizontal part of L
    { x: 9200, y: canvas.height - 600, width: brickWidth * 2, height: brickHeight * 8 },  // Vertical part of inverted L
    { x: 9200, y: canvas.height - 400, width: brickWidth * 8, height: brickHeight * 2 }, // Horizontal part of inverted L

    // Seventh section - Master structures (Master)
    { x: 9800, y: canvas.height - 500, width: brickWidth * 2, height: brickHeight * 7 },  // Wall
    { x: 10000, y: canvas.height - 300, width: brickWidth * 5, height: brickHeight * 2 }, // Wide platform
    { x: 10400, y: canvas.height - 650, width: brickWidth * 2, height: brickHeight * 9 }, // Super tall wall
    { x: 10600, y: canvas.height - 400, width: brickWidth * 4, height: brickHeight * 2 }, // Platform

    // Eighth section - Ultimate L-shaped structures (Ultimate)
    { x: 11000, y: canvas.height - 450, width: brickWidth * 2, height: brickHeight * 10 }, // Vertical part of L
    { x: 11000, y: canvas.height - 550, width: brickWidth * 10, height: brickHeight * 2 }, // Horizontal part of L
    { x: 11600, y: canvas.height - 600, width: brickWidth * 2, height: brickHeight * 8 },  // Vertical part of inverted L
    { x: 11600, y: canvas.height - 500, width: brickWidth * 10, height: brickHeight * 2 }, // Horizontal part of inverted L

    // Ninth section - Final challenge (Final)
    { x: 12200, y: canvas.height - 700, width: brickWidth * 2, height: brickHeight * 9 },  // Wall
    { x: 12400, y: canvas.height - 450, width: brickWidth * 4, height: brickHeight * 2 },  // Platform
    { x: 12800, y: canvas.height - 550, width: brickWidth * 2, height: brickHeight * 7 },  // Wall
    { x: 13000, y: canvas.height - 300, width: brickWidth * 6, height: brickHeight * 2 },  // Final platform

    // New sections - Additional 15 frames
    // Tenth section - Zigzag platforms (Advanced)
    { x: 13500, y: canvas.height - 400, width: brickWidth * 3, height: brickHeight * 2 },  // Low platform
    { x: 13900, y: canvas.height - 600, width: brickWidth * 3, height: brickHeight * 2 },  // High platform
    { x: 14300, y: canvas.height - 400, width: brickWidth * 3, height: brickHeight * 2 },  // Low platform
    { x: 14700, y: canvas.height - 600, width: brickWidth * 3, height: brickHeight * 2 },  // High platform

    // Eleventh section - Staircase (Advanced)
    { x: 15100, y: canvas.height - 300, width: brickWidth * 4, height: brickHeight * 2 },  // First step
    { x: 15500, y: canvas.height - 400, width: brickWidth * 4, height: brickHeight * 2 },  // Second step
    { x: 15900, y: canvas.height - 500, width: brickWidth * 4, height: brickHeight * 2 },  // Third step
    { x: 16300, y: canvas.height - 600, width: brickWidth * 4, height: brickHeight * 2 },  // Fourth step

    // Twelfth section - Floating islands (Expert)
    { x: 16700, y: canvas.height - 450, width: brickWidth * 5, height: brickHeight * 2 },  // First island
    { x: 17300, y: canvas.height - 550, width: brickWidth * 5, height: brickHeight * 2 },  // Second island
    { x: 17900, y: canvas.height - 250, width: brickWidth * 5, height: brickHeight * 2 },  // Third island
    { x: 18500, y: canvas.height - 350, width: brickWidth * 5, height: brickHeight * 2 },  // Fourth island

    // Thirteenth section - Complex L-shapes (Master)
    { x: 18900, y: canvas.height - 500, width: brickWidth * 2, height: brickHeight * 8 },  // Vertical part of L
    { x: 18900, y: canvas.height - 500, width: brickWidth * 6, height: brickHeight * 2 },  // Horizontal part of L
    { x: 19500, y: canvas.height - 350, width: brickWidth * 2, height: brickHeight * 9 },  // Vertical part of inverted L
    { x: 19500, y: canvas.height - 400, width: brickWidth * 6, height: brickHeight * 2 }, // Horizontal part of inverted L

    // Fourteenth section - Mixed challenges (Ultimate)
    { x: 20100, y: canvas.height - 300, width: brickWidth * 2, height: brickHeight * 10 }, // Tall wall
    { x: 20300, y: canvas.height - 400, width: brickWidth * 4, height: brickHeight * 2 },  // Platform
    { x: 20700, y: canvas.height - 600, width: brickWidth * 2, height: brickHeight * 8 },  // Wall
    { x: 20900, y: canvas.height - 300, width: brickWidth * 6, height: brickHeight * 2 },  // Wide platform

    // Fifteenth section - Final challenge (Legendary)
    { x: 21300, y: canvas.height - 350, width: brickWidth * 2, height: brickHeight * 11 }, // Super tall wall
    { x: 21500, y: canvas.height - 500, width: brickWidth * 5, height: brickHeight * 2 },  // Platform
    { x: 21900, y: canvas.height - 300, width: brickWidth * 2, height: brickHeight * 9 },  // Tall wall

    { x: 22100, y: canvas.height - 50, width: brickWidth * 7, height: brickHeight * 2 },  // Final platform

    // Frame 15 platforms
    { x: 19000, y: canvas.height - 400, width: 200, height: 20, moving: true, startY: canvas.height - 400, endY: canvas.height - 200, speed: 2, direction: -1 },
    { x: 19500, y: canvas.height - 600, width: 200, height: 20, moving: true, startY: canvas.height - 600, endY: canvas.height - 400, speed: 2, direction: -1 },
    { x: 20000, y: canvas.height - 800, width: 200, height: 20, moving: true, startY: canvas.height - 800, endY: canvas.height - 600, speed: 2, direction: -1 },

    // Frame 16 platforms
    { x: 21000, y: canvas.height - 400 - 100, width: 200, height: 20, speed: 4, direction: -1, startX: 21000, endX: 22000, platformY: canvas.height - 400 - 100, vertical: false },
    { x: 21150, y: canvas.height - 300 - 100, width: 200, height: 20 }, // Stable platform
    { x: 21450, y: canvas.height - 350 - 100, width: 200, height: 20 }, // Stable platform
    { x: 21600, y: canvas.height - 600 - 100, width: 200, height: 20, speed: 3, direction: 1, startX: 21600, endX: 22600, platformY: canvas.height - 600 - 100, vertical: false },
    { x: 21750, y: canvas.height - 500 - 100, width: 200, height: 20 }, // Stable platform
    { x: 22050, y: canvas.height - 450 - 100, width: 200, height: 20 }, // Stable platform
    { x: 22200, y: canvas.height - 800 - 100, width: 200, height: 20, speed: 5, direction: -1, startX: 22200, endX: 23200, platformY: canvas.height - 800 - 100, vertical: false },

    // Frame 17 platforms
    { x: 23000, y: canvas.height - 400 - 100, width: 200, height: 20, speed: 3, direction: 1, startX: 23000, endX: 24000, platformY: canvas.height - 400 - 100, vertical: false },
    { x: 23150, y: canvas.height - 300 - 100, width: 200, height: 20 }, // Stable platform
    { x: 23450, y: canvas.height - 350 - 100, width: 200, height: 20 }, // Stable platform
    { x: 23600, y: canvas.height - 600 - 100, width: 200, height: 20, speed: 5, direction: -1, startX: 23600, endX: 24600, platformY: canvas.height - 600 - 100, vertical: false },
    { x: 23750, y: canvas.height - 500 - 100, width: 200, height: 20 }, // Stable platform
    { x: 24050, y: canvas.height - 450 - 100, width: 200, height: 20 }, // Stable platform
    { x: 24200, y: canvas.height - 800 - 100, width: 200, height: 20, speed: 4, direction: 1, startX: 24200, endX: 25200, platformY: canvas.height - 800 - 100, vertical: false },

    // Frame 18 platforms
    { x: 25000, y: canvas.height - 400 - 100, width: 200, height: 20, speed: 5, direction: -1, startX: 25000, endX: 26000, platformY: canvas.height - 400 - 100, vertical: false },
    { x: 25150, y: canvas.height - 300 - 100, width: 200, height: 20 }, // Stable platform
    { x: 25450, y: canvas.height - 350 - 100, width: 200, height: 20 }, // Stable platform
    { x: 25600, y: canvas.height - 600 - 100, width: 200, height: 20, speed: 3, direction: 1, startX: 25600, endX: 26600, platformY: canvas.height - 600 - 100, vertical: false },
    { x: 25750, y: canvas.height - 500 - 100, width: 200, height: 20 }, // Stable platform
    { x: 26050, y: canvas.height - 450 - 100, width: 200, height: 20 }, // Stable platform
    { x: 26200, y: canvas.height - 800 - 100, width: 200, height: 20, speed: 4, direction: -1, startX: 26200, endX: 27200, platformY: canvas.height - 800 - 100, vertical: false },

    // Frame 19 platforms
    { x: 27000, y: canvas.height - 400 - 100, width: 200, height: 20, speed: 4, direction: 1, startX: 27000, endX: 28000, platformY: canvas.height - 400 - 100, vertical: false },
    { x: 27150, y: canvas.height - 300 - 100, width: 200, height: 20 }, // Stable platform
    { x: 27450, y: canvas.height - 350 - 100, width: 200, height: 20 }, // Stable platform
    { x: 27600, y: canvas.height - 600 - 100, width: 200, height: 20, speed: 5, direction: -1, startX: 27600, endX: 28600, platformY: canvas.height - 600 - 100, vertical: false },
    { x: 27750, y: canvas.height - 500 - 100, width: 200, height: 20 }, // Stable platform
    { x: 27900, y: canvas.height - 400 - 100, width: 200, height: 20 }, // Stable platform
    { x: 28050, y: canvas.height - 450 - 100, width: 200, height: 20 }, // Stable platform
    { x: 28200, y: canvas.height - 800 - 100, width: 200, height: 20, speed: 3, direction: 1, startX: 28200, endX: 29200, platformY: canvas.height - 800 - 100, vertical: false },

    // Frame 20 platforms
    { x: 29000, y: canvas.height - 400 - 100, width: 200, height: 20, speed: 5, direction: -1, startX: 29000, endX: 30000, platformY: canvas.height - 400 - 100, vertical: false },
    { x: 29150, y: canvas.height - 300 - 100, width: 200, height: 20 }, // Stable platformm
    { x: 29450, y: canvas.height - 350 - 100, width: 200, height: 20 }, // Stable platform
    { x: 29600, y: canvas.height - 600 - 100, width: 200, height: 20, speed: 4, direction: 1, startX: 29600, endX: 30600, platformY: canvas.height - 600 - 100, vertical: false },
    { x: 29750, y: canvas.height - 500 - 100, width: 200, height: 20 }, // Stable platform
    { x: 29900, y: canvas.height - 400 - 100, width: 200, height: 20 }, // Stable platform
    { x: 30050, y: canvas.height - 450 - 100, width: 200, height: 20 }, // Stable platform
    { x: 30200, y: canvas.height - 800 - 100, width: 200, height: 20, speed: 3, direction: -1, startX: 30200, endX: 31200, platformY: canvas.height - 800 - 100, vertical: false },

    // Frame 21 platforms
    { x: 31000, y: canvas.height - 400 - 100, width: 200, height: 20, speed: 3, direction: 1, startX: 31000, endX: 32000, platformY: canvas.height - 400 - 100, vertical: false },
    { x: 31150, y: canvas.height - 300 - 100, width: 200, height: 20 }, // Stable platform
    { x: 31450, y: canvas.height - 350 - 100, width: 200, height: 20 }, // Stable platform
    { x: 31600, y: canvas.height - 600 - 100, width: 200, height: 20, speed: 5, direction: -1, startX: 31600, endX: 32600, platformY: canvas.height - 600 - 100, vertical: false },
    { x: 31750, y: canvas.height - 500 - 100, width: 200, height: 20 }, // Stable platform
    { x: 31900, y: canvas.height - 400 - 100, width: 200, height: 20 }, // Stable platform
    { x: 32050, y: canvas.height - 450 - 100, width: 200, height: 20 }, // Stable platform
    { x: 32200, y: canvas.height - 800 - 100, width: 200, height: 20, speed: 4, direction: 1, startX: 32200, endX: 33200, platformY: canvas.height - 800 - 100, vertical: false },

    // Frame 22 platforms
    { x: 33000, y: canvas.height - 400 - 100, width: 200, height: 20, speed: 4, direction: -1, startX: 33000, endX: 34000, platformY: canvas.height - 400 - 100, vertical: false },
    { x: 33150, y: canvas.height - 300 - 100, width: 200, height: 20 }, // Stable platform
    { x: 33300, y: canvas.height - 200 - 100, width: 200, height: 20 }, // Stable platform
    { x: 33450, y: canvas.height - 350 - 100, width: 200, height: 20 }, // Stable platform
    { x: 33600, y: canvas.height - 600 - 100, width: 200, height: 20, speed: 3, direction: 1, startX: 33600, endX: 34600, platformY: canvas.height - 600 - 100, vertical: false },
    { x: 33750, y: canvas.height - 500 - 100, width: 200, height: 20 }, // Stable platform
    { x: 33900, y: canvas.height - 400 - 100, width: 200, height: 20 }, // Stable platform
    { x: 34050, y: canvas.height - 450 - 100, width: 200, height: 20 }, // Stable platform
    { x: 34200, y: canvas.height - 800 - 100, width: 200, height: 20, speed: 5, direction: -1, startX: 34200, endX: 34800, platformY: canvas.height - 800 - 100, vertical: false },
    { x: 34800, y: canvas.height - 500, width: brickWidth * 5, height: brickHeight * 18 }, // Tall wall
];


// Coin properties
const coins = [];
const coinSize = 80;  // maximum visibility
console.log('Coin size set to:', coinSize);
const coinColor = '#FFD700';  // Gold color
let coinFlip = 0;  // Track flip angle

// Create coins
function createCoins() {
    // First section coins (Easy)
    coins.push({ x: 400, y: canvas.height - 150 - coinSize, width: coinSize, height: coinSize, collected: false });  // Above low platform
    coins.push({ x: 800, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });  // Above mid-high platform
    coins.push({ x: 1200, y: canvas.height - 200 - coinSize, width: coinSize, height: coinSize, collected: false }); // Above mid platform
    coins.push({ x: 1600, y: canvas.height - 450 - coinSize, width: coinSize, height: coinSize, collected: false }); // Above high platform
    
    // Second section coins (Medium)
    coins.push({ x: 2000, y: canvas.height - 250 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 2200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 2400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Third section coins (Hard)
    coins.push({ x: 3000, y: canvas.height - 250 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 3200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 3400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Fourth section coins (Expert)
    coins.push({ x: 4000, y: canvas.height - 250 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 4200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 4400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Fifth section coins (Master)
    coins.push({ x: 5000, y: canvas.height - 250 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 5200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 5400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Sixth section coins (Ultimate)
    coins.push({ x: 6000, y: canvas.height - 650 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 6200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 6200, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Seventh section coins (Legendary)
    coins.push({ x: 7000, y: canvas.height - 250 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 7200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 7400, y: canvas.height - 650 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Eighth section coins (Mythic)
    coins.push({ x: 8000, y: canvas.height - 250 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 8200, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 8400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Ninth section coins (Divine)
    coins.push({ x: 9000, y: canvas.height - 250 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 9200, y: canvas.height - 650 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 9400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Tenth section coins (Celestial)
    coins.push({ x: 10000, y: canvas.height - 350 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 10200, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 10400, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Eleventh section coins (Cosmic)
    coins.push({ x: 11000, y: canvas.height - 100 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 11200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 11400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Twelfth section coins (Infinite)
    coins.push({ x: 12000, y: canvas.height - 150 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 12200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 12400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Thirteenth section coins (Eternal)
    coins.push({ x: 13000, y: canvas.height - 350 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 13200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 13400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Fourteenth section coins (Immortal)
    coins.push({ x: 14000, y: canvas.height - 350 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 14200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 14400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Fifteenth section coins (Final)
    coins.push({ x: 15000, y: canvas.height - 300 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 15200, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 15400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Additional coins for more coverage
    // Ground level coins
    coins.push({ x: 100, y: canvas.height - 100 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 300, y: canvas.height - 100 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 500, y: canvas.height - 100 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Platform coins
    coins.push({ x: 1800, y: canvas.height - 300 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 2600, y: canvas.height - 450 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 3800, y: canvas.height - 350 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // High platform coins
    coins.push({ x: 4600, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 5800, y: canvas.height - 500 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 6600, y: canvas.height - 650 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Final section coins
    coins.push({ x: 15800, y: canvas.height - 300 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 16000, y: canvas.height - 650 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 16200, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });
    
    // Additional coins for the end game - placed higher above platforms
    coins.push({ x: 16600, y: canvas.height - 450 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 16800, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 17000, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 17200, y: canvas.height - 500 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 17400, y: canvas.height - 650 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 17600, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 17800, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 18000, y: canvas.height - 700 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 18200, y: canvas.height - 450 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 18400, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 18600, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 18800, y: canvas.height - 500 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 19000, y: canvas.height - 650 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 19200, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 19400, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 19600, y: canvas.height - 700 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 19800, y: canvas.height - 450 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 20000, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 20200, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 20400, y: canvas.height - 500 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 20600, y: canvas.height - 650 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 20800, y: canvas.height - 400 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 21000, y: canvas.height - 550 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 21200, y: canvas.height - 700 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 21400, y: canvas.height - 450 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 21600, y: canvas.height - 600 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 21800, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, collected: false });
    coins.push({ x: 22000, y: canvas.height - 500 - coinSize, width: coinSize, height: coinSize, collected: false });

    // Frame 16 coins
    coins.push({ x: 21100, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 21200, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 21300, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 21400, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 21500, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 21600, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 21700, y: canvas.height - 1000 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 21800, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 22200, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });

    // Frame 17 coins
    coins.push({ x: 23100, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 23200, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 23300, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 23400, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 23500, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 23600, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 24100, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 24200, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });

    // Frame 18 coins
    coins.push({ x: 25100, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 25200, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 25300, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 25400, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 25500, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 26100, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 26200, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });

    // Frame 19 coins
    coins.push({ x: 27100, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 27200, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 27300, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 27400, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 27500, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 27600, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 28100, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 28200, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });

    // Frame 20 coins
    coins.push({ x: 29100, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 29200, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 29300, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 29400, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 29500, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 29600, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 30000, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 30100, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 30200, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });

    // Frame 21 coins
    coins.push({ x: 31100, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 31200, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 31300, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 31400, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 31900, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 32000, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 32100, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 32200, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });

    // Frame 22 coins
    coins.push({ x: 33100, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 33200, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 33300, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 33400, y: canvas.height - 750 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 33500, y: canvas.height - 800 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 33600, y: canvas.height - 850 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 33700, y: canvas.height - 1000 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 34100, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 34200, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 34400, y: canvas.height - 900 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 34600, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });    
    coins.push({ x: 34700, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });   
    coins.push({ x: 34800, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 35000, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 34800, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 34800, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 35000, y: canvas.height - 950 - coinSize, width: coinSize, height: coinSize, value: 1 });
    coins.push({ x: 34800, y: canvas.height - 650 - coinSize, width: coinSize, height: coinSize, value: 1, isSpecial: true });
}

// Player properties
const player = {
    x: 100,
    y: canvas.height - groundHeight - 50,
    width: 120,
    height: 120,
    velocityX: 0,
    velocityY: 0,
    speed: 8,
    jumpForce: -25,
    gravity: 0.8,
    isJumping: false,
    isMovingLeft: false,
    isMovingRight: false,
    facingRight: true,
    jumpCount: 0,
    lastSpacePress: 0,
    isDead: false,
    score: 0,
    lives: 3,  // Number of lives
    deaths: 0,  // Track number of deaths
    gameWon: false  // Add game won state
};

// Input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    Space: false,
    Enter: false
};

// Double jump timing
const DOUBLE_JUMP_WINDOW = 300; // Time window for double jump in milliseconds

// Event listeners for keyboard
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        const currentTime = Date.now();
        if (currentTime - player.lastSpacePress < DOUBLE_JUMP_WINDOW && player.jumpCount < 2) {
            // Double jump
            player.velocityY = player.jumpForce;
            player.jumpCount = 2;
            playSound('jump');
        } else if (player.jumpCount === 0) {
            // First jump
            player.velocityY = player.jumpForce;
            player.isJumping = true;
            player.jumpCount = 1;
            playSound('jump');
        }
        player.lastSpacePress = currentTime;
    }
    
    if (e.code in keys) {
        keys[e.code] = true;
    }
    
    // Add restart functionality
    if (e.code === 'KeyR' && player.gameWon) {
        resetGame();
        playSound('coin');
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

// Check collision with platforms
function checkPlatformCollision() {
    let onPlatform = false;
    
    for (const platform of platforms) {
        // Check if player is colliding with platform
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y < platform.y + platform.height) {
            
            // Calculate overlap on each side
            const overlapLeft = (player.x + player.width) - platform.x;
            const overlapRight = (platform.x + platform.width) - player.x;
            const overlapTop = (player.y + player.height) - platform.y;
            const overlapBottom = (platform.y + platform.height) - player.y;
            
            // Find the smallest overlap
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            // Resolve collision based on the smallest overlap
            if (minOverlap === overlapTop && player.velocityY > 0) {
                // Landing on top of platform
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                player.jumpCount = 0;
                onPlatform = true;
            } else if (minOverlap === overlapBottom && player.velocityY < 0) {
                // Hitting bottom of platform
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            } else if (minOverlap === overlapLeft && player.velocityX > 0) {
                // Hitting right side of platform
                player.x = platform.x - player.width;
                player.velocityX = 0;
            } else if (minOverlap === overlapRight && player.velocityX < 0) {
                // Hitting left side of platform
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    }
    
    // If not on any platform, player is falling
    if (!onPlatform && player.velocityY > 0) {
        player.isJumping = true;
    }
}

// Camera properties
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

// Update camera position
function updateCamera() {
    // Center camera on player with some offset
    const targetX = player.x - canvas.width * 0.3;
    camera.x = Math.max(0, Math.min(targetX, 35200 - canvas.width));
}

// Check if player is dead
function checkPlayerDeath() {
    if (player.y > canvas.height + 100) {  // Player has fallen off the screen
        player.deaths++;  // Increment death count
        if (player.deaths >= 3) {
            // Game over - reset everything
            resetGame();
        } else {
            // Reset player position
            resetPlayer();
        }
    }
}

// Reset player position
function resetPlayer() {
    player.x = 340;  // Changed from 100 to 300 to move player more forward
    player.y = 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.jumpCount = 0;
    player.facingRight = true;
}

// Reset game
function resetGame() {
    resetPlayer();
    player.deaths = 0;
    player.score = 0;
    player.gameWon = false;  // Reset win state
    
    // Reset all coins
    for (const coin of coins) {
        coin.collected = false;
    }
    
    // Reset enemies
    enemies.length = 0;  // Clear existing enemies
    enemies.push(
        // First section enemies (Easy)
        { x: 800, y: canvas.height - 600 - 100, width: 100, height: 100, speed: 2, direction: 1, startX: 800, endX: 1000, platformY: canvas.height - 600 - 100, lastShot: 0, shootDelay: 2000, type: 'inco' },
        { x: 7200, y: canvas.height - 200 - 100, width: 100, height: 100, speed: 2, direction: 1, startX: 1200, endX: 1400, platformY: canvas.height - 200 - 100, lastShot: 0, shootDelay: 2000, type: 'gun' },
        { x: 8600, y: canvas.height - 450 - 100, width: 100, height: 100, speed: 2, direction: 1, startX: 1600, endX: 1800, platformY: canvas.height - 450 - 100, lastShot: 0, shootDelay: 2000, type: 'inco' },
        
        // L-shaped section enemies (Medium)
        { x: 3700, y: canvas.height - 600 - 100, width: 100, height: 100, speed: 3, direction: 1, startX: 3700, endX: 3900, platformY: canvas.height - 600 - 100, lastShot: 0, shootDelay: 2000, type: 'inco' },
        
        // Mixed structures enemies (Hard)
        { x: 5600, y: canvas.height - 450 - 200, width: 100, height: 100, speed: 3, direction: 1, startX: 5600, endX: 5800, platformY: canvas.height - 450 - 200, lastShot: 0, shootDelay: 2000, type: 'inco' },
        
        // Complex L-shaped enemies (Expert)
        { x: 12200, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 4, direction: 1, startX: 6200, endX: 6800, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun' },
        { x: 6400, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 4, direction: -1, startX: 6400, endX: 6200, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'inco' },
        { x: 11600, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 4, direction: 1, startX: 6600, endX: 7000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun' },
        { x: 7000, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 4, direction: 1, startX: 7000, endX: 7400, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun' },
        
        // Fourth frame enemies (3 enemies) - Walking up and down
        { x: 16600, y: canvas.height - 800 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 7600, endX: 7600, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
        { x: 7800, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 2, direction: -1, startX: 7800, endX: 7800, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'inco', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
        { x: 18000, y: canvas.height - 600 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 8000, endX: 8000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
        { x: 19000, y: canvas.height - 600 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 9000, endX: 8000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'inco', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
        { x: 19500, y: canvas.height - 600 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 10000, endX: 8000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
        { x: 20000, y: canvas.height - 600 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 8000, endX: 8000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'inco', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 }
    );
    
    // Clear bullets
    bullets.length = 0;
    playerBullets.length = 0;
}

// Check coin collection
function checkCoinCollection() {
    for (const coin of coins) {
        if (!coin.collected && 
            player.x + player.width > coin.x &&
            player.x < coin.x + coin.width &&
            player.y + player.height > coin.y &&
            player.y < coin.y + coin.height) {
            coin.collected = true;
            if (coin.isSpecial) {
                player.score += 150;  // Add 150 points for special coin
                player.gameWon = true;  // Set game won state
                playSound('win');
            } else {
                player.score += 2;  // Regular coins give 2 points
                playSound('coin');
            }
        }
    }
}

// Draw coins
function drawCoins() {
    for (const coin of coins) {
        if (!coin.collected) {
            if (coin.isSpecial && incomascot.complete) {
                ctx.drawImage(incomascot, coin.x, coin.y, coin.width * 3, coin.height * 3);
            } else if (coinImage.complete) {
                // Regular coin drawing code - only draw if image is loaded
                ctx.save();
                ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2);
                ctx.rotate(coinFlip);
                const scale = Math.abs(Math.cos(coinFlip));
                ctx.scale(1, scale);
                ctx.drawImage(coinImage, -coin.width/2, -coin.height/2, coin.width, coin.height);
                ctx.restore();
            } else {
                // Fallback: draw a simple circle if image isn't loaded
                ctx.save();
                ctx.fillStyle = coinColor;
                ctx.beginPath();
                ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }
    coinFlip += 0.1;
    if (coinFlip >= Math.PI * 2) {
        coinFlip = 0;
    }
}

// Draw score
function drawScore() {
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${player.score}`, 20, 40);
    ctx.restore();
}

// Update player
function updatePlayer() {
    if (player.isDead) return;

    // Handle horizontal movement
    if (keys.ArrowLeft) {
        player.velocityX = -player.speed;
        player.facingRight = false;
    } else if (keys.ArrowRight) {
        player.velocityX = player.speed;
        player.facingRight = true;
    } else {
        player.velocityX = 0;
    }

    // Apply gravity
    player.velocityY += player.gravity;

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Prevent player from going beyond boundaries
    // Frame 0 boundary (start)
    if (player.x < 50) {
        player.x = 50;
        player.velocityX = 0;
    }

    // Last frame boundary (end)
    if (player.x > 35000) {  // Adjust this value based on your last frame's position
        player.x = 35000;
        player.velocityX = 0;
    }

    // Check for collisions
    checkPlatformCollision();
    
    // Check for coin collection
    checkCoinCollection();
    
    // Check for death
    checkPlayerDeath();
    
    // Update camera
    updateCamera();

    // Screen boundaries (only for vertical movement)
    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }

    // Player shooting (Enter key)
    if (keys.Enter && Date.now() - lastPlayerShot > playerShootDelay) {
        playerBullets.push({
            x: player.x + (player.facingRight ? player.width : 0),
            y: player.y + player.height / 2,
            direction: player.facingRight ? 1 : -1,
            radius: bulletRadius,
            startX: player.x + (player.facingRight ? player.width : 0),
            color: playerBulletColor
        });
        lastPlayerShot = Date.now();
        playSound('shoot');
    }
}

// Draw a single fine brick with gradient, outline, and mortar
function drawFineBrick(x, y, width, height) {
    // Brick gradient with new color
    const brickGradient = ctx.createLinearGradient(x, y, x, y + height);
    brickGradient.addColorStop(0, '#4EF6D3');  // Light teal top
    brickGradient.addColorStop(0.5, '#3DD1B8'); // Medium teal middle
    brickGradient.addColorStop(1, '#2BB5A0');   // Darker teal bottom
    ctx.fillStyle = brickGradient;
    ctx.fillRect(x, y, width, height);

    // Add highlight (subtle)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(x, y, width, height/3);

    // Mortar lines (top and left)
    ctx.strokeStyle = '#f5f5f5'; // Light gray for mortar
    ctx.lineWidth = 1; // Thinner mortar lines
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + width, y); // Top
    ctx.moveTo(x, y); ctx.lineTo(x, y + height); // Left
    ctx.stroke();

    // Brick outline (right and bottom)
    ctx.strokeStyle = '#8B0000'; // Dark red for outline
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + width, y); ctx.lineTo(x + width, y + height); // Right
    ctx.moveTo(x, y + height); ctx.lineTo(x + width, y + height); // Bottom
    ctx.stroke();
}

// Draw platforms
function drawPlatforms() {
    for (const platform of platforms) {
        const bricksPerRow = Math.ceil(platform.width / brickWidth);
        const rows = Math.ceil(platform.height / brickHeight);
        
        for (let row = 0; row < rows; row++) {
            // Stagger every other row
            const offset = (row % 2) * (brickWidth / 2);
            for (let col = 0; col < bricksPerRow; col++) {
                const x = platform.x + (col * brickWidth) - offset;
                const y = platform.y + (row * brickHeight);
                drawFineBrick(x, y, brickWidth, brickHeight);
            }
        }
    }
}

// Draw dashboard
function drawDashboard() {
    ctx.save();
    
    // Draw dashboard background with transparency
    ctx.fillStyle = 'rgba(44, 62, 80, 0.2)';
    ctx.fillRect(20, 20, 360, 70);  // Reverted back to original size
    
    // Draw SPRITEY with fun font
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Comic Sans MS"';
    ctx.textAlign = 'center';
    ctx.fillText('SPRITEY', 200, 40);  // Reverted x position
    
    // Draw coin and score
    ctx.beginPath();
    ctx.arc(200, 75, 15, 0, Math.PI * 2);  // Reverted x position
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    
    // Draw shine
    ctx.beginPath();
    ctx.arc(195, 70, 5, 0, Math.PI * 2);  // Reverted x position
    ctx.fillStyle = '#FFF8DC';
    ctx.fill();
    
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Comic Sans MS"';
    ctx.fillText(`${player.score}`, 230, 80);  // Reverted x position
    
    ctx.restore();
}

// Draw stars at top of game
function drawStars() {
    ctx.save();
    
    function drawStar(x, y, size, color) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(x + size * Math.cos((18 + i * 72) * Math.PI / 180),
                      y + size * Math.sin((18 + i * 72) * Math.PI / 180));
            ctx.lineTo(x + size/2 * Math.cos((54 + i * 72) * Math.PI / 180),
                      y + size/2 * Math.sin((54 + i * 72) * Math.PI / 180));
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }
    
    // Draw three stars at top of game with reduced size
    // First star - red if no deaths, gray if 1+ deaths
    drawStar(canvas.width/2 - 40, 25, 15, player.deaths >= 1 ? '#808080' : '#ff0000');
    // Second star - red if 0-1 deaths, gray if 2+ deaths
    drawStar(canvas.width/2, 25, 15, player.deaths >= 2 ? '#808080' : '#ff0000');
    // Third star - red if 0-2 deaths, gray if 3 deaths
    drawStar(canvas.width/2 + 40, 25, 15, player.deaths >= 3 ? '#808080' : '#ff0000');
    
    ctx.restore();
}

// Add restart key handler
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && player.isDead) {
        resetGame();
    }
});

// Bullet properties
const bullets = [];
const enemyBulletSpeed = 11  // Speed for enemy bullets
const playerBulletSpeed = 13; // Speed for player bullets
const bulletRadius = 5;
const bulletColor = '#000000';
const playerBulletColor = '#4EF6D3';
const bulletMaxDistance = 500;

// Enemy properties
const enemies = [
    // First section enemies (Easy)
    { x: 800, y: canvas.height - 600 - 100, width: 100, height: 100, speed: 2, direction: 1, startX: 800, endX: 1000, platformY: canvas.height - 600 - 100, lastShot: 0, shootDelay: 2000, type: 'inco' },  // On mid-high platform
    { x: 7200, y: canvas.height - 200 - 100, width: 100, height: 100, speed: 2, direction: 1, startX: 1200, endX: 1400, platformY: canvas.height - 200 - 100, lastShot: 0, shootDelay: 2000, type: 'gun' }, // On mid platform
    { x: 8600, y: canvas.height - 450 - 100, width: 100, height: 100, speed: 2, direction: 1, startX: 1600, endX: 1800, platformY: canvas.height - 450 - 100, lastShot: 0, shootDelay: 2000, type: 'inco' }, // On high platform
    
    // L-shaped section enemies (Medium)
    { x: 3700, y: canvas.height - 600 - 100, width: 100, height: 100, speed: 3, direction: 1, startX: 3700, endX: 3900, platformY: canvas.height - 600 - 100, lastShot: 0, shootDelay: 2000, type: 'inco' },  // On horizontal part of L

    // Mixed structures enemies (Hard)
    { x: 5600, y: canvas.height - 450 - 200, width: 100, height: 100, speed: 3, direction: 1, startX: 5600, endX: 5800, platformY: canvas.height - 450 - 200, lastShot: 0, shootDelay: 2000, type: 'inco' },  // On wide platform

    // Complex L-shaped enemies (Expert)
    { x: 12200, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 4, direction: 1, startX: 6200, endX: 6800, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun' },  // On horizontal part of L
    { x: 6400, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 4, direction: -1, startX: 6400, endX: 6200, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'inco' },  // On horizontal part of L
    { x: 11600, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 4, direction: 1, startX: 6600, endX: 7000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun' },  // On horizontal part of L
    { x: 7000, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 4, direction: 1, startX: 7000, endX: 7400, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun' },  // On horizontal part of L

    // Fourth frame enemies (3 enemies) - Walking up and down
    { x: 16600, y: canvas.height - 800 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 7600, endX: 7600, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
    { x: 7800, y: canvas.height - 400 - 100, width: 100, height: 100, speed: 2, direction: -1, startX: 7800, endX: 7800, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'inco', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
    { x: 18000, y: canvas.height - 600 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 8000, endX: 8000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
    { x: 19000, y: canvas.height - 600 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 9000, endX: 8000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'inco', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
    { x: 19500, y: canvas.height - 600 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 10000, endX: 8000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'gun', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 },
    { x: 20000, y: canvas.height - 600 - 1000, width: 100, height: 100, speed: 2, direction: -1, startX: 8000, endX: 8000, platformY: canvas.height - 400 - 100, lastShot: 0, shootDelay: 2000, type: 'inco', vertical: true, startY: canvas.height - 400 - 100, endY: canvas.height - 200 - 100 }
];

// Add player shooting variables
const playerBullets = [];
const playerShootDelay = 400; // Time between shots in milliseconds
let lastPlayerShot = 0;

// Update bullets function
function updateBullets() {
    // Update enemy bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += enemyBulletSpeed * bullet.direction;
        
        // Remove bullets that have traveled too far
        if (Math.abs(bullet.x - bullet.startX) > bulletMaxDistance) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Check bullet collision with player
        if (player.x + player.width > bullet.x - bullet.radius &&
            player.x < bullet.x + bullet.radius &&
            player.y + player.height > bullet.y - bullet.radius &&
            player.y < bullet.y + bullet.radius) {
            player.deaths++;
            if (player.deaths >= 3) {
                resetGame();
                playSound('gameOver');
            } else {
                resetPlayer();
                playSound('playerHit');
            }
            bullets.splice(i, 1);
        }
    }
    
    // Update player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        bullet.x += playerBulletSpeed * bullet.direction;
        
        // Remove bullets that have traveled too far
        if (Math.abs(bullet.x - bullet.startX) > bulletMaxDistance) {
            playerBullets.splice(i, 1);
            continue;
        }
        
        // Check for collisions with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (bullet.x + bullet.radius > enemy.x &&
                bullet.x - bullet.radius < enemy.x + enemy.width &&
                bullet.y + bullet.radius > enemy.y &&
                bullet.y - bullet.radius < enemy.y + enemy.height) {
                enemies.splice(j, 1);
                playerBullets.splice(i, 1);
                player.score += 5;
                playSound('enemyHit');
                break;
            }
        }
    }
}

// Draw bullets
function drawBullets() {
    ctx.save();
    // Draw enemy bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bulletColor;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    // Draw player bullets
    for (const bullet of playerBullets) {
        ctx.fillStyle = bullet.color || bulletColor;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Update enemies
function updateEnemies() {
    const currentTime = Date.now();
    
    for (const enemy of enemies) {
        if (enemy.vertical) {
            // Vertical movement
            enemy.y += enemy.speed * enemy.direction;
            
            // Change direction at vertical boundaries
            if (enemy.y <= enemy.startY) {
                enemy.y = enemy.startY;
                enemy.direction = 1; // Move down
            } else if (enemy.y >= enemy.endY) {
                enemy.y = enemy.endY;
                enemy.direction = -1; // Move up
            }
        } else {
            // Horizontal movement (existing code)
            enemy.x += enemy.speed * enemy.direction;
            
            // Apply gravity to enemies
            enemy.y += 0.8; // Same gravity as player
            
            // Check collision with platforms
            let onPlatform = false;
            for (const platform of platforms) {
                // Check if enemy is colliding with platform
                if (enemy.x + enemy.width > platform.x &&
                    enemy.x < platform.x + platform.width &&
                    enemy.y + enemy.height > platform.y &&
                    enemy.y < platform.y + platform.height) {
                    
                    // Calculate overlap on each side
                    const overlapLeft = (enemy.x + enemy.width) - platform.x;
                    const overlapRight = (platform.x + platform.width) - enemy.x;
                    const overlapTop = (enemy.y + enemy.height) - platform.y;
                    const overlapBottom = (platform.y + platform.height) - enemy.y;
                    
                    // Find the smallest overlap
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    
                    // Resolve collision based on the smallest overlap
                    if (minOverlap === overlapTop && enemy.y < platform.y) {
                        // Landing on top of platform
                        enemy.y = platform.y - enemy.height;
                        onPlatform = true;
                    } else if (minOverlap === overlapBottom && enemy.y > platform.y) {
                        // Hitting bottom of platform
                        enemy.y = platform.y + platform.height;
                    } else if (minOverlap === overlapLeft && enemy.x < platform.x) {
                        // Hitting right side of platform
                        enemy.x = platform.x - enemy.width;
                        enemy.direction *= -1; // Change direction when hitting wall
                    } else if (minOverlap === overlapRight && enemy.x > platform.x) {
                        // Hitting left side of platform
                        enemy.x = platform.x + platform.width;
                        enemy.direction *= -1; // Change direction when hitting wall
                    }
                }
            }
            
            // Change direction at patrol boundaries
            if (enemy.x <= enemy.startX || enemy.x >= enemy.endX) {
                enemy.direction *= -1;
            }
        }
        
        // Shooting logic
        if (currentTime - enemy.lastShot > enemy.shootDelay) {
            // Create new bullet
            bullets.push({
                x: enemy.x + (enemy.direction > 0 ? enemy.width : 0),
                y: enemy.y + enemy.height / 2,
                direction: enemy.direction,
                radius: bulletRadius,
                startX: enemy.x + (enemy.direction > 0 ? enemy.width : 0),
                color: '#ff4500' // Fire color
            });
            enemy.lastShot = currentTime;
        }
        
        // Check collision with player
        if (player.x + player.width > enemy.x &&
            player.x < enemy.x + enemy.width &&
            player.y + player.height > enemy.y &&
            player.y < enemy.y + enemy.height) {
            // Player dies when touching enemy
            player.deaths++;
            if (player.deaths >= 3) {
                resetGame();
                playSound('gameOver');
            } else {
                resetPlayer();
                playSound('playerHit');
            }
        }
    }
    
    // Update bullets
    updateBullets();
}

// Draw enemies and bullets
function drawEnemies() {
    // Draw bullets
    drawBullets();
    
    // Draw enemies
    for (const enemy of enemies) {
        if (enemy.type === 'gun') {
            // Draw gun enemy with flipping
            ctx.save();
            if (enemy.direction < 0) {
                ctx.translate(enemy.x + enemy.width, enemy.y);
                ctx.scale(-1, 1);
                ctx.drawImage(gunEnemyImage, 0, 0, enemy.width, enemy.height);
            } else {
                ctx.drawImage(gunEnemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
            }
            ctx.restore();
        } else {
            // Draw inco enemy
            ctx.drawImage(incoEnemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    }
}

// Update function
function update() {
    // Update player
    updatePlayer();
    
    // Update camera
    updateCamera();
    
    // Update background progression
    updateBackgroundProgression();
    
    // Update platforms
    for (const platform of platforms) {
        if (platform.startX !== undefined && platform.endX !== undefined) {
            // Horizontal movement
            platform.x += platform.speed * platform.direction;
            
            // Change direction at boundaries
            if (platform.x <= platform.startX) {
                platform.x = platform.startX;
                platform.direction = 1;
            } else if (platform.x >= platform.endX) {
                platform.x = platform.endX;
                platform.direction = -1;
            }
        }
    }
    
    // Update enemies
    updateEnemies();
    
    // Check coin collection
    checkCoinCollection();
    
    // Check if player is dead
    checkPlayerDeath();
}

// Draw function
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save the current context state
    ctx.save();
    
    // Apply camera offset
    ctx.translate(-camera.x, 0);
    
    // Draw animated background with transitions
    drawAnimatedBackground();
    
    // Draw platforms
    drawPlatforms();
    
    // Draw coins
    drawCoins();
    
    // Draw enemies
    drawEnemies();
    
    // Draw player if image is loaded
    if (spritey.complete) {
        ctx.save();
        
        if (!player.facingRight) {
            // Flip horizontally when facing left
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(spritey, 0, 0, player.width, player.height);
        } else {
            // Draw normally when facing right
            ctx.drawImage(spritey, player.x, player.y, player.width, player.height);
        }
        
        ctx.restore();
    }
    
    // Restore the context state
    ctx.restore();
    
    // Draw dashboard (not affected by camera)
    drawDashboard();
    
    // Draw stars at top (not affected by camera)
    drawStars();
    
    // Draw win screen if game is won
    if (player.gameWon) {
        drawWinScreen();
    }
}

// Initialize game
function initGame() {
    createCoins();  // Create coins
    resetPlayer();
    createPopupScreen();  // Show popup screen
    createMobileControls(); // Add mobile controls
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
initGame();  // Initialize game first
gameLoop();  // Then start the game loop

// Add drawWinScreen function
function drawWinScreen() {
    ctx.save();
    
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Win message
    ctx.fillStyle = '#0000ff';
    ctx.font = 'bold 48px "Comic Sans MS"';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', canvas.width/2, canvas.height/2 - 50);
    
    // Stats
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Comic Sans MS"';
    ctx.fillText(`Final Score: ${player.score}`, canvas.width/2, canvas.height/2 + 20);
    ctx.fillText(`Deaths: ${player.deaths}`, canvas.width/2, canvas.height/2 + 60);
    
    // Restart message
    ctx.font = 'bold 20px "Comic Sans MS"';
    ctx.fillText('Press R to Restart', canvas.width/2, canvas.height/2 + 120);
    
    ctx.restore();
}

// Add game state
let gameStarted = false;

// Create popup screen
function createPopupScreen() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.padding = '20px';

    // Create popup container
    const popup = document.createElement('div');
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    popup.style.padding = 'clamp(20px, 5vw, 30px)';
    popup.style.borderRadius = '15px';
    popup.style.color = 'white';
    popup.style.textAlign = 'center';
    popup.style.width = 'min(90%, 600px)';
    popup.style.maxHeight = '90vh';
    popup.style.overflowY = 'auto';
    popup.style.fontFamily = '"Comic Sans MS", cursive';
    popup.style.border = '3px solid #0000ff';
    popup.style.boxSizing = 'border-box';

    // Game title
    const title = document.createElement('h1');
    title.textContent = 'Spritey Adventure';
    title.style.color = '#0000ff';
    title.style.marginBottom = 'clamp(15px, 3vw, 20px)';
    title.style.fontSize = 'clamp(1.8em, 5vw, 2.5em)';
    title.style.textShadow = '#0000ff';
    popup.appendChild(title);

    // Story
    const story = document.createElement('p');
    story.innerHTML = `
    Welcome to the world of Inco Believers!<br><br>
    Spritey is an Inco Believer on a mission to save the Inco Cloud Bunny. Every adventure comes with a cost  she must defeat enemies along the way and fill her bag with coins.<br><br>
    Your goal is to rescue the Cloudy Bunny and complete your quest!

    `;
    story.style.marginBottom = 'clamp(15px, 3vw, 20px)';
    story.style.lineHeight = '1.6';
    story.style.fontSize = 'clamp(1em, 3vw, 1.2em)';
    popup.appendChild(story);

    // Instructions
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h2 style="color: #0000ff; margin-bottom: 10px; font-size: clamp(1.2em, 4vw, 1.5em);">How to Play:</h2>
        <ul style="text-align: left; list-style-type: none; padding: 0;">
            <li style="margin: clamp(8px, 2vw, 10px) 0; font-size: clamp(0.9em, 2.5vw, 1.1em);"> Arrow Keys: Move left and right</li>
            <li style="margin: clamp(8px, 2vw, 10px) 0; font-size: clamp(0.9em, 2.5vw, 1.1em);">space Key: Jump</li>
            <li style="margin: clamp(8px, 2vw, 10px) 0; font-size: clamp(0.9em, 2.5vw, 1.1em);">Space: Double Jump</li>
            <li style="margin: clamp(8px, 2vw, 10px) 0; font-size: clamp(0.9em, 2.5vw, 1.1em);">Enter: Shoot</li>
            <li style="margin: clamp(8px, 2vw, 10px) 0; font-size: clamp(0.9em, 2.5vw, 1.1em);">R: Restart after winning</li>
        </ul>
    `;
    instructions.style.marginBottom = 'clamp(15px, 3vw, 20px)';
    popup.appendChild(instructions);

    // Start button
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Adventure!';
    startButton.style.padding = 'clamp(10px, 3vw, 15px) clamp(20px, 5vw, 30px)';
    startButton.style.fontSize = 'clamp(1.2em, 4vw, 1.5em)';
    startButton.style.backgroundColor = '#0000ff';
    startButton.style.color = 'white';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '5px';
    startButton.style.cursor = 'pointer';
    startButton.style.fontFamily = '"Comic Sans MS", cursive';
    startButton.style.transition = 'all 0.3s ease';
    startButton.style.boxShadow = '0 4px 8px #0000ff';
    startButton.style.width = 'min(100%, 300px)';
    startButton.style.margin = '0 auto';

    // Button hover effect
    startButton.onmouseover = () => {
        startButton.style.transform = 'scale(1.1)';
        startButton.style.boxShadow = '0 6px 12px #0000ff';
    };
    startButton.onmouseout = () => {
        startButton.style.transform = 'scale(1)';
        startButton.style.boxShadow = '0 4px 8px #0000ff';
    };

    // Start game when button is clicked
    startButton.onclick = () => {
        overlay.remove();
        gameStarted = true;
        playBackgroundMusic();
        showMobileControls(); // Show mobile controls only after game starts
    };

    popup.appendChild(startButton);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

// Add mobile controls
function createMobileControls() {
    // Prevent duplicate controls
    if (document.getElementById('mobileControls')) return;
    const controls = document.createElement('div');
    controls.id = 'mobileControls';
    controls.style.position = 'fixed';
    controls.style.bottom = '20px';
    controls.style.left = '0';
    controls.style.right = '0';
    controls.style.display = 'none';
    controls.style.zIndex = '1000';

    // Add CSS for the controls
    const style = document.createElement('style');
    style.textContent = `
        .control-btn {
            width: 90px;
            height: 90px;
            background: transparent;
            border: none;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            touch-action: manipulation;
        }
        .arrow-left {
            width: 0;
            height: 0;
            border-top: 30px solid transparent;
            border-bottom: 30px solid transparent;
            border-right: 50px solid #00aaff;
            border-left: 0;
            position: relative;
        }
        .arrow-left::before {
            content: '';
            position: absolute;
            top: -31px;
            left: 0;
            width: 0;
            height: 0;
            border-top: 31px solid transparent;
            border-bottom: 31px solid transparent;
            border-right: 51px solid #000;
            z-index: -1;
        }
        .arrow-right {
            width: 0;
            height: 0;
            border-top: 30px solid transparent;
            border-bottom: 30px solid transparent;
            border-left: 50px solid #00aaff;
            border-right: 0;
            position: relative;
        }
        .arrow-right::before {
            content: '';
            position: absolute;
            top: -31px;
            left: -51px;
            width: 0;
            height: 0;
            border-top: 31px solid transparent;
            border-bottom: 31px solid transparent;
            border-left: 51px solid #000;
            z-index: -1;
        }
        .arrow-up {
            width: 50px;
            height: 50px;
            background: #00aaff;
            border-radius: 50%;
            position: relative;
            border: 2px solid #000;
        }
        .shoot-circle {
            width: 50px;
            height: 50px;
            background: #00aaff;
            border-radius: 50%;
            position: relative;
            border: 2px solid #000;
        }
        .control-btn:active .arrow-left,
        .control-btn:active .arrow-right,
        .control-btn:active .arrow-up,
        .control-btn:active .shoot-circle {
            transform: scale(0.95);
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);

    // Left side controls
    const leftControls = document.createElement('div');
    leftControls.style.position = 'fixed';
    leftControls.style.left = '20px';
    leftControls.style.bottom = '20px';
    leftControls.style.display = 'flex';
    leftControls.style.flexDirection = 'column';
    leftControls.style.gap = '10px';
    leftControls.style.alignItems = 'center';

    // Right side controls
    const rightControls = document.createElement('div');
    rightControls.style.position = 'fixed';
    rightControls.style.right = '20px';
    rightControls.style.bottom = '20px';
    rightControls.style.display = 'flex';
    rightControls.style.flexDirection = 'column';
    rightControls.style.gap = '10px';
    rightControls.style.alignItems = 'center';

    // Left button
    const leftBtn = document.createElement('button');
    leftBtn.className = 'control-btn';
    const leftArrow = document.createElement('div');
    leftArrow.className = 'arrow-left';
    leftBtn.appendChild(leftArrow);

    // Right button
    const rightBtn = document.createElement('button');
    rightBtn.className = 'control-btn';
    const rightArrow = document.createElement('div');
    rightArrow.className = 'arrow-right';
    rightBtn.appendChild(rightArrow);

    // Jump button
    const jumpBtn = document.createElement('button');
    jumpBtn.className = 'control-btn';
    const upArrow = document.createElement('div');
    upArrow.className = 'arrow-up';
    jumpBtn.appendChild(upArrow);

    // Shoot button
    const shootBtn = document.createElement('button');
    shootBtn.className = 'control-btn';
    const shootCircle = document.createElement('div');
    shootCircle.className = 'shoot-circle';
    shootBtn.appendChild(shootCircle);

    // Add touch event listeners
    leftBtn.addEventListener('touchstart', () => keys.ArrowLeft = true);
    leftBtn.addEventListener('touchend', () => keys.ArrowLeft = false);
    rightBtn.addEventListener('touchstart', () => keys.ArrowRight = true);
    rightBtn.addEventListener('touchend', () => keys.ArrowRight = false);
    jumpBtn.addEventListener('touchstart', () => {
        if (player.jumpCount < 2) {
            player.velocityY = player.jumpForce;
            player.jumpCount++;
            playSound('jump');
        }
    });
    shootBtn.addEventListener('touchstart', () => {
        if (Date.now() - lastPlayerShot > playerShootDelay) {
            playerBullets.push({
                x: player.x + (player.facingRight ? player.width : 0),
                y: player.y + player.height / 2,
                direction: player.facingRight ? 1 : -1,
                radius: bulletRadius,
                startX: player.x + (player.facingRight ? player.width : 0),
                color: playerBulletColor
            });
            lastPlayerShot = Date.now();
            playSound('shoot');
        }
    });

    // Add buttons to controls
    leftControls.appendChild(leftBtn);
    leftControls.appendChild(jumpBtn);
    rightControls.appendChild(rightBtn);
    rightControls.appendChild(shootBtn);
    controls.appendChild(leftControls);
    controls.appendChild(rightControls);

    // Only add controls to DOM on mobile devices
    if ('ontouchstart' in window) {
        document.body.appendChild(controls);
    }
}

// Show controls when game starts
function showMobileControls() {
    const controls = document.getElementById('mobileControls');
    if (controls) controls.style.display = 'flex';
}

// Add viewport meta tag for mobile devices
const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
document.head.appendChild(meta);

function adjustGameHeightForMobile() {
    if ('ontouchstart' in window) {
        const gameContainer = document.getElementById('gameContainer') || document.querySelector('canvas');
        if (gameContainer) {
            const vh = window.innerHeight;
            const adjustedHeight = vh - 20; // Subtract some pixels for mobile UI chrome
            gameContainer.style.height = `${adjustedHeight}px`;
            gameContainer.style.maxHeight = `${adjustedHeight}px`;
            gameContainer.style.overflow = 'hidden';
        }
    }
}
window.addEventListener('load', adjustGameHeightForMobile);
window.addEventListener('resize', adjustGameHeightForMobile);

// Handles controller visibility based on device type
function handleMobileControls() {
    const controller = document.getElementById('controller');

    if (!controller) return;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        controller.style.display = 'flex';
        controller.style.visibility = 'visible';
        controller.style.pointerEvents = 'auto';
    } else {
        controller.style.display = 'none';
        controller.style.visibility = 'hidden';
        controller.style.pointerEvents = 'none';
    }
}

// Initialize control visibility on load and orientation change
window.addEventListener('load', handleMobileControls);
window.addEventListener('resize', handleMobileControls);
window.addEventListener('orientationchange', handleMobileControls);

// Call it when the game starts too
function startGame() {
    gameState = 'playing';
    handleMobileControls();
    // ... rest of your game start logic ...
}

// Prevent image dragging for controller buttons
function preventImageDrag() {
    const controllerImages = document.querySelectorAll('#controller img');
    controllerImages.forEach(img => {
        img.setAttribute('draggable', 'false');
        img.style.userSelect = 'none';
        img.style.webkitUserSelect = 'none';
        img.style.webkitUserDrag = 'none';
        img.style.khtmlUserDrag = 'none';
        img.style.mozUserDrag = 'none';
        img.style.oUserDrag = 'none';
        img.style.userDrag = 'none';
    });
}

// Call this when the game starts
function startGame() {
    gameState = 'playing';
    preventImageDrag();
    // ... rest of your existing startGame code ...
}

// Initialize on load
window.addEventListener('load', preventImageDrag);

// Prevent highlighting on long press for mobile
function preventMobileHighlight() {
    // Add CSS to prevent text selection and touch callout
    const style = document.createElement('style');
    style.textContent = `
        * {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
    `;
    document.head.appendChild(style);
}

// Initialize on load
window.addEventListener('load', function() {
    preventImageDrag();
    preventMobileHighlight();
});

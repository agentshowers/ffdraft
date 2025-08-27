// CONFIGURATION - Change this to your draft ID
const DRAFT_ID = '1266518936610930688'; 

// Global variables - playersData will be loaded from players.js
let playersData = {}; 

// DOM elements
const statusDiv = document.getElementById('status');
const playerList = document.getElementById('playerList');

// Auto-fetch interval (in milliseconds)
const AUTO_FETCH_INTERVAL = 10000; // 10 seconds
let autoFetchInterval;

// Initialize
function initialize() {
    // Load player data from the globally loaded PLAYERS_DATA variable
    if (typeof PLAYERS_DATA !== 'undefined') {
        playersData = PLAYERS_DATA;
        console.log(`Loaded ${Object.keys(playersData).length} players from players.js`);
    } else {
        console.warn('PLAYERS_DATA not found. Make sure players.js is loaded.');
    }
    
    // Start auto-fetching
    startAutoFetch();
}

// Start automatic fetching
function startAutoFetch() {
    // Fetch immediately on page load
    fetchDraftStatus();
    
    // Set up interval for automatic fetching
    autoFetchInterval = setInterval(fetchDraftStatus, AUTO_FETCH_INTERVAL);
    console.log(`Auto-fetching enabled every ${AUTO_FETCH_INTERVAL / 1000} seconds`);
}

// Stop automatic fetching
function stopAutoFetch() {
    if (autoFetchInterval) {
        clearInterval(autoFetchInterval);
        autoFetchInterval = null;
        console.log('Auto-fetching stopped');
    }
}

// Show status message
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
}

// Hide status message
function hideStatus() {
    statusDiv.style.display = 'none';
}

// Get player information by ID
function getPlayerInfo(playerId) {
    const player = playersData[playerId];
    if (player) {
        return {
            name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
            team: player.team || 'Unknown',
            position: player.position || 'Unknown',
            fantasyPositions: player.fantasy_positions || []
        };
    }
    return {
        name: `Player ${playerId}`,
        team: 'Unknown',
        position: 'Unknown', 
        fantasyPositions: []
    };
}

// Fetch draft picks from Sleeper API
async function fetchDraftStatus() {
    showStatus('Fetching draft status...', 'loading');

    try {
        const response = await fetch(`https://api.sleeper.app/v1/draft/${DRAFT_ID}/picks`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const picks = await response.json();
        
        if (!Array.isArray(picks)) {
            throw new Error('Invalid response format');
        }

        displayDraftedPlayers(picks);
        showStatus(`Successfully loaded ${picks.length} picks! Last updated: ${new Date().toLocaleTimeString()}`, 'success');

        // Hide status after 3 seconds
        setTimeout(hideStatus, 3000);

    } catch (error) {
        console.error('Error fetching draft status:', error);
        showStatus(`Error: ${error.message}`, 'error');
        playerList.innerHTML = '<p>Failed to load drafted players. Check console for details.</p>';
    }
}

// Display drafted players
function displayDraftedPlayers(picks) {
    if (picks.length === 0) {
        playerList.innerHTML = '<p>No players drafted yet.</p>';
        return;
    }

    const playerPicks = picks
        .filter(pick => pick.player_id) // Only include picks with player_id
        .map((pick, index) => ({
            pickNumber: index + 1,
            playerId: pick.player_id,
            playerInfo: getPlayerInfo(pick.player_id)
        }));

    if (playerPicks.length === 0) {
        playerList.innerHTML = '<p>No players with IDs found in draft picks.</p>';
        return;
    }

    // Create HTML for player list with enhanced information
    const playersHtml = playerPicks
        .map(pick => {
            const positions = pick.playerInfo.fantasyPositions.length > 0 
                ? pick.playerInfo.fantasyPositions.join('/') 
                : pick.playerInfo.position;
            
            return `<div class="player-item">
                <strong>Pick ${pick.pickNumber}</strong><br>
                <strong>${pick.playerInfo.name}</strong><br>
                <span style="color: #666;">
                    ${positions} - ${pick.playerInfo.team}
                </span><br>
                <small style="color: #999;">ID: ${pick.playerId}</small>
            </div>`;
        })
        .join('');

    playerList.innerHTML = playersHtml;
}

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', function() {
    initialize();
});

// Clean up interval when page is unloaded
window.addEventListener('beforeunload', function() {
    stopAutoFetch();
});


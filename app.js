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
    
    // Load rankings data
    if (typeof PLAYERS_RANKINGS !== 'undefined') {
        console.log(`Loaded ${PLAYERS_RANKINGS.length} rankings from rankings.js`);
        displayPlayerRankings();
    } else {
        console.warn('PLAYERS_RANKINGS not found. Make sure rankings.js is loaded.');
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

// Find player ID by name in players.js data
function findPlayerId(playerName) {
    // Search through all players to find a match
    for (const [playerId, player] of Object.entries(playersData)) {
        const fullName = `${player.first_name} ${player.last_name}`.trim();
        if (fullName === playerName) {
            return playerId;
        }
    }
    return 'Not found';
}

// Display player rankings
function displayPlayerRankings() {
    if (!PLAYERS_RANKINGS || PLAYERS_RANKINGS.length === 0) {
        playerList.innerHTML = '<p>No rankings data available.</p>';
        return;
    }

    // Create HTML table for player rankings
    const tableHtml = `
        <table class="rankings-table">
            <thead>
                <tr>
                    <th class="rank-number">Rank</th>
                    <th class="player-name">Player Name</th>
                    <th class="position">Pos</th>
                    <th class="tier">Tier</th>
                    <th class="player-id">Player ID</th>
                </tr>
            </thead>
            <tbody>
                ${PLAYERS_RANKINGS.map(player => {
                    const playerId = findPlayerId(player.name);
                    const tierClass = `tier-${player.tier}`;
                    
                    return `<tr class="${tierClass}">
                        <td class="rank-number">${player.rank}</td>
                        <td class="player-name">${player.name}</td>
                        <td class="position">${player.position}</td>
                        <td class="tier">${player.tier}</td>
                        <td class="player-id">${playerId}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;

    playerList.innerHTML = tableHtml;
    showStatus(`Successfully loaded ${PLAYERS_RANKINGS.length} player rankings!`, 'success');
    
    // Hide status after 3 seconds
    setTimeout(hideStatus, 3000);
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

        showStatus(`Successfully loaded ${picks.length} picks! Last updated: ${new Date().toLocaleTimeString()}`, 'success');

        // Hide status after 3 seconds
        setTimeout(hideStatus, 3000);

    } catch (error) {
        console.error('Error fetching draft status:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', function() {
    initialize();
});

// Clean up interval when page is unloaded
window.addEventListener('beforeunload', function() {
    stopAutoFetch();
});


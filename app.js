// CONFIGURATION - Change this to your draft ID
const DRAFT_ID = '1266518936610930688'; 

// Global variables - playersData will be loaded from players.js
let playersData = {}; 

// DOM elements
const statusDiv = document.getElementById('status');
const playerList = document.getElementById('playerList');
const draftPicksList = document.getElementById('draftPicksList');
const lastRefreshSpan = document.getElementById('lastRefresh');
const totalPicksSpan = document.getElementById('totalPicks');

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
        console.warn('PLAYERS_DATA not found. Make sure players.js is loaded first');
    }
    
    // Load rankings data from the globally loaded PLAYERS_RANKINGS variable
    if (typeof PLAYERS_RANKINGS !== 'undefined') {
        console.log(`Loaded ${PLAYERS_RANKINGS.length} rankings from rankings.js`);
        displayPlayerRankings();
    } else {
        console.warn('PLAYERS_RANKINGS not found. Make sure rankings.js is loaded first');
    }
    
    // Start auto-fetching draft data
    startAutoFetch();
}

// Start automatic fetching
function startAutoFetch() {
    // Fetch immediately
    fetchDraftData();
    
    // Then set up interval
    autoFetchInterval = setInterval(fetchDraftData, AUTO_FETCH_INTERVAL);
}

// Fetch draft data from Sleeper API
async function fetchDraftData() {
    try {
        statusDiv.textContent = 'Fetching draft data...';
        statusDiv.className = 'status loading';
        
        const response = await fetch(`https://api.sleeper.app/v1/draft/${DRAFT_ID}/picks`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const draftPicks = await response.json();
        
        // Update draft picks display
        displayDraftPicks(draftPicks);
        
        // Hide status after successful fetch
        statusDiv.style.display = 'none';
        
    } catch (error) {
        console.error('Error fetching draft data:', error);
        statusDiv.textContent = `Error fetching draft data: ${error.message}`;
        statusDiv.className = 'status error';
        statusDiv.style.display = 'block';
    }
}

// Display draft picks in reverse order
function displayDraftPicks(draftPicks) {
    if (!draftPicks || draftPicks.length === 0) {
        draftPicksList.innerHTML = '<div class="draft-pick-item">No picks yet...</div>';
        // Update footer
        lastRefreshSpan.textContent = new Date().toLocaleTimeString();
        totalPicksSpan.textContent = '0';
        return;
    }
    
    // Sort picks by pick number in reverse order (most recent first)
    const sortedPicks = draftPicks.sort((a, b) => b.pick_no - a.pick_no);
    
    const picksHtml = sortedPicks.map(pick => {
        const playerId = pick.player_id;
        const player = playersData[playerId];
        
        if (player) {
            const playerName = `${player.first_name} ${player.last_name}`;
            const position = player.position;
            const pickNumber = pick.pick_no;
            
            return `
                <div class="draft-pick-item">
                    <span class="pick-number">#${pickNumber}</span>
                    <span class="pick-player">${playerName}</span>
                    <span class="pick-position">${position}</span>
                </div>
            `;
        } else {
            return `
                <div class="draft-pick-item">
                    <span class="pick-number">#${pick.pick_no}</span>
                    <span class="pick-player">Unknown Player</span>
                    <span class="pick-position">ID: ${playerId}</span>
                </div>
            `;
        }
    }).join('');
    
    draftPicksList.innerHTML = picksHtml;
    
    // Update footer information
    lastRefreshSpan.textContent = new Date().toLocaleTimeString();
    totalPicksSpan.textContent = draftPicks.length.toString();
}

// Find player ID by name (for rankings display)
function findPlayerId(playerName) {
    for (const [id, player] of Object.entries(playersData)) {
        const fullName = `${player.first_name} ${player.last_name}`;
        if (fullName === playerName) {
            return id;
        }
    }
    return null;
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
                    return `
                        <tr class="${tierClass}">
                            <td class="rank-number">${player.rank}</td>
                            <td class="player-name">${player.name}</td>
                            <td class="position">${player.position}</td>
                            <td class="tier">${player.tier}</td>
                            <td class="player-id">${playerId || 'N/A'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    playerList.innerHTML = tableHtml;
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);


// CONFIGURATION - Default draft ID
let DRAFT_ID = '1257359414734630912';

// FAVORITES - Add player names here (must match exactly with rankings)
const FAVORITES = [
    'Bo Nix',
    'Courtland Sutton',
    'Jacory Croskey-Merritt'
    // Add more favorite players here
]; 

// Global variables
let playersData = {}; 
let draftPicksData = []; // Store draft picks data

// DOM elements
const playerList = document.getElementById('playerList');
const draftPicksList = document.getElementById('draftPicksList');
const lastRefreshSpan = document.getElementById('lastRefresh');
const totalPicksSpan = document.getElementById('totalPicks');
const positionFilter = document.getElementById('positionFilter');
const draftIdInput = document.getElementById('draftIdInput');

// Auto-fetch interval (in milliseconds)
const AUTO_FETCH_INTERVAL = 5000; // 5 seconds
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
    
    // Set up position filter event listener
    positionFilter.addEventListener('change', displayPlayerRankings);
    
    // Set up draft ID input
    draftIdInput.value = DRAFT_ID;
    draftIdInput.addEventListener('change', handleDraftIdChange);
    draftIdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleDraftIdChange();
        }
    });
    
    // Start auto-fetching draft data
    startAutoFetch();
}

// Handle draft ID change
function handleDraftIdChange() {
    const newDraftId = draftIdInput.value.trim();
    if (newDraftId && newDraftId !== DRAFT_ID) {
        DRAFT_ID = newDraftId;
        console.log(`Draft ID changed to: ${DRAFT_ID}`);
        
        // Stop current auto-fetch interval
        if (autoFetchInterval) {
            clearInterval(autoFetchInterval);
        }
        
        // Clear current data
        draftPicksData = [];
        
        // Start fetching with new draft ID
        startAutoFetch();
    }
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
        const response = await fetch(`https://api.sleeper.app/v1/draft/${DRAFT_ID}/picks`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const draftPicks = await response.json();
        
        // Store draft picks data globally
        draftPicksData = draftPicks;
        
        // Update both displays
        displayDraftPicks();
        displayPlayerRankings();
        
    } catch (error) {
        console.error('Error fetching draft data:', error);
    }
}

// Display draft picks in reverse order
function displayDraftPicks() {
    if (!draftPicksData || draftPicksData.length === 0) {
        draftPicksList.innerHTML = '<div class="draft-pick-item">No picks yet...</div>';
        // Update footer
        lastRefreshSpan.textContent = new Date().toLocaleTimeString();
        totalPicksSpan.textContent = '0';
        return;
    }
    
    // Sort picks by pick number in reverse order (most recent first)
    const sortedPicks = draftPicksData.sort((a, b) => b.pick_no - a.pick_no);
    
    const picksHtml = sortedPicks.map(pick => {
        const playerId = pick.player_id;
        const player = playersData[playerId];
        
        if (player) {
            const playerName = `${player.first_name} ${player.last_name}`;
            const position = player.position;
            const pickNumber = pick.pick_no;
            const positionClass = `position-${position}`;
            
            return `
                <div class="draft-pick-item ${positionClass}">
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
    totalPicksSpan.textContent = draftPicksData.length.toString();
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

// Get list of drafted player IDs
function getDraftedPlayerIds() {
    return draftPicksData.map(pick => pick.player_id);
}

// Display player rankings (filtered by drafted players and position)
function displayPlayerRankings() {
    if (!PLAYERS_RANKINGS || PLAYERS_RANKINGS.length === 0) {
        playerList.innerHTML = '<p>No rankings data available.</p>';
        return;
    }

    // Get selected position filter
    const selectedPosition = positionFilter.value;
    
    // Get list of drafted players
    const draftedPlayerIds = getDraftedPlayerIds();
    
    // Filter players by position and draft status
    let availablePlayers = PLAYERS_RANKINGS.filter(player => {
        // Filter by position if selected
        if (selectedPosition && player.position !== selectedPosition) {
            return false;
        }
        
        // Filter out drafted players
        const playerId = findPlayerId(player.name);
        if (playerId && draftedPlayerIds.includes(playerId)) {
            return false; // Filter out drafted players
        }
        return true; // Keep available players
    });

    // Create HTML table for player rankings
    const tableHtml = `
        <table class="rankings-table">
            <thead>
                <tr>
                    <th class="rank-number">Rank</th>
                    <th class="player-name">Player Name</th>
                    <th class="position">Pos</th>
                    <th class="tier">Tier</th>
                </tr>
            </thead>
            <tbody>
                ${availablePlayers.map(player => {
                    const positionClass = `position-${player.position}`;
                    const isFavorite = FAVORITES.includes(player.name);
                    const starIcon = isFavorite ? '⭐ ' : '';
                    return `
                        <tr class="${positionClass}">
                            <td class="rank-number">${player.rank}</td>
                            <td class="player-name">${starIcon}${player.name}</td>
                            <td class="position">${player.position}</td>
                            <td class="tier">${player.tier}</td>
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
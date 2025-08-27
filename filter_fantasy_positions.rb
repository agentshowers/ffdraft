#!/usr/bin/env ruby

require 'json'

# Define the fantasy positions we want to keep
FANTASY_POSITIONS = %w[QB RB WR TE K DEF]

# Read the players.json file
puts 'Reading players.json...'
file_content = File.read('players.json')

# Parse the JSON
puts 'Parsing JSON...'
players_data = JSON.parse(file_content)

puts "Original player count: #{players_data.keys.length}"

# Filter players by two criteria:
# 1. Team is not null
# 2. Has relevant fantasy positions
puts 'Filtering for:'
puts '  - Team is not null'
puts "  - Fantasy positions include: #{FANTASY_POSITIONS.join(', ')}"

# First filter by criteria, then clean up the data structure
filtered_players = players_data.select do |_, player_data|
  # First check: team must not be null
  team_valid = !player_data['team'].nil?

  # Second check: must have relevant fantasy positions
  fantasy_position_valid = if player_data['fantasy_positions'].is_a?(Array)
                             # Check if any of the player's fantasy positions match our target positions
                             (player_data['fantasy_positions'] & FANTASY_POSITIONS).any?
                           else
                             false
                           end

  # Both conditions must be true
  team_valid && fantasy_position_valid
end

# Clean up each player object to only keep essential fields
puts 'Cleaning up player data structure...'
ESSENTIAL_FIELDS = %w[player_id first_name last_name team position fantasy_positions]

cleaned_players = {}
filtered_players.each do |player_id, player_data|
  cleaned_players[player_id] = ESSENTIAL_FIELDS.each_with_object({}) do |field, clean_data|
    clean_data[field] = player_data[field]
  end
end

filtered_players = cleaned_players

puts "Filtered player count: #{filtered_players.keys.length}"
puts "Removed #{players_data.keys.length - filtered_players.keys.length} players (null team or non-fantasy positions)"

# Show breakdown by position
puts "\nBreakdown by fantasy position:"
FANTASY_POSITIONS.each do |pos|
  count = filtered_players.count do |_, player_data|
    player_data['fantasy_positions']&.include?(pos)
  end
  puts "  #{pos}: #{count} players"
end

# Create backup of current file
puts "\nCreating backup of current file..."
File.write('players_backup.json', file_content)

# Write the filtered data as JavaScript file
puts 'Writing filtered data to players.js...'
js_content = "// Fantasy Football Players Data\n"
js_content += "// Generated on #{Time.now}\n"
js_content += "// Contains #{filtered_players.keys.length} fantasy-relevant players with teams\n\n"
js_content += "const PLAYERS_DATA = #{JSON.generate(filtered_players)};\n"
File.write('players.js', js_content)

# Also write JSON for backup/reference
File.write('players.json', JSON.generate(filtered_players))

puts "\nFiltering complete!"
puts '- Original file backed up as players_backup.json'
puts "- players.js created with #{filtered_players.keys.length} fantasy-relevant players"
puts '- players.json also updated for reference'
puts "- Removed #{players_data.keys.length - filtered_players.keys.length} players (null team or without QB/RB/WR/TE/K/DEF positions)"

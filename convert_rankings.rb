#!/usr/bin/env ruby

require 'csv'

# Read the CSV file
csv_file = 'FantasyPros_2025_Draft_ALL_Rankings.csv'
output_file = 'rankings.js'

# Check if CSV file exists
unless File.exist?(csv_file)
  puts "Error: #{csv_file} not found!"
  exit 1
end

# Clean player name by removing Jr., Sr., and numerals
def clean_player_name(name)
  # Special name transformations
  special_names = {
    'Marquise Brown' => 'Hollywood Brown'
    # Add more special cases here as needed
  }

  # Check if this is a special name that needs transformation
  return special_names[name] if special_names.key?(name)

  # Remove Jr., Sr., II, III, IV, etc.
  name.gsub(/\s+(Jr\.|Sr\.|II|III|IV|V|VI|VII|VIII|IX|X)\s*$/, '').strip
end

# Clean position name by converting DST to DEF
def clean_position_name(position)
  # Convert DST to DEF for consistency
  position == 'DST' ? 'DEF' : position
end

# Parse CSV and convert to JavaScript
players = []
CSV.foreach(csv_file, headers: true) do |row|
  # Extract data from CSV
  rank = row['RK'].to_i
  tier = row['TIERS'].to_i
  name = clean_player_name(row['PLAYER NAME'].strip)
  position = clean_position_name(row['POS'].gsub(/\d+$/, '')) # Remove numbers and convert DST to DEF

  # Create player object
  player = {
    rank: rank,
    tier: tier,
    name: name,
    position: position
  }

  players << player
end

# Sort by rank to ensure proper ordering
players.sort_by! { |p| p[:rank] }

# Generate JavaScript output
js_content = <<~JAVASCRIPT
  // FantasyPros 2025 Draft Rankings
  // Generated from FantasyPros_2025_Draft_ALL_Rankings.csv
  // Contains #{players.length} players ranked by FantasyPros
  // Player names cleaned (Jr., Sr., II, III, etc. removed) for better matching

  const PLAYERS_RANKINGS = [
  #{players.map { |p| "  { rank: #{p[:rank]}, tier: #{p[:tier]}, name: \"#{p[:name]}\", position: \"#{p[:position]}\" }" }.join(",\n")}
  ];

  // Export for use in other modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PLAYERS_RANKINGS;
  }
JAVASCRIPT

# Write to JavaScript file
File.write(output_file, js_content)

puts "Successfully converted #{players.length} players to #{output_file}"
puts 'Sample output (cleaned names):'
puts players.first(5).map { |p| "#{p[:rank]}. #{p[:name]} (#{p[:position]}) - Tier #{p[:tier]}" }.join("\n")
puts "\nNote: Player names have been cleaned (Jr., Sr., II, III, etc. removed) for better matching"

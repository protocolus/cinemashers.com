/**
 * Database migration script to create and initialize the game_info table
 * Run this script on your server to fix the "no such table: game_info" error
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database(path.join(__dirname, 'cinemash.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Create the game_info table if it doesn't exist
db.serialize(() => {
  // Check if the table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='game_info'", (err, row) => {
    if (err) {
      console.error('Error checking for game_info table:', err.message);
      closeAndExit(1);
      return;
    }

    if (!row) {
      console.log('game_info table does not exist, creating it...');
      
      // Create the table
      db.run(`
        CREATE TABLE game_info (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          rules TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating game_info table:', err.message);
          closeAndExit(1);
          return;
        }
        
        console.log('game_info table created successfully.');
        
        // Insert default game info
        db.run(`
          INSERT INTO game_info (id, name, description, rules)
          VALUES (1, 'Cinemashers', 'A movie-themed puzzle game', 'Guess the mashup of movie posters and titles.')
        `, (err) => {
          if (err) {
            console.error('Error inserting default game info:', err.message);
            closeAndExit(1);
            return;
          }
          
          console.log('Default game info inserted successfully.');
          closeAndExit(0);
        });
      });
    } else {
      console.log('game_info table already exists.');
      
      // Check if there's at least one row in the table
      db.get('SELECT COUNT(*) as count FROM game_info', (err, row) => {
        if (err) {
          console.error('Error checking game_info count:', err.message);
          closeAndExit(1);
          return;
        }
        
        if (row.count === 0) {
          console.log('game_info table is empty, inserting default data...');
          
          // Insert default game info
          db.run(`
            INSERT INTO game_info (id, name, description, rules)
            VALUES (1, 'Cinemashers', 'A movie-themed puzzle game', 'Guess the mashup of movie posters and titles.')
          `, (err) => {
            if (err) {
              console.error('Error inserting default game info:', err.message);
              closeAndExit(1);
              return;
            }
            
            console.log('Default game info inserted successfully.');
            closeAndExit(0);
          });
        } else {
          console.log('game_info table already has data.');
          closeAndExit(0);
        }
      });
    }
  });
});

function closeAndExit(code) {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(code);
  });
}

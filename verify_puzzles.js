/**
 * Verify the recently added puzzles in the database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const db = new sqlite3.Database(path.join(__dirname, 'cinemash.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Query recently added puzzles
db.all(`
  SELECT p.id, s.mashup_title, m1.title as movie1, m1.year as year1, m2.title as movie2, m2.year as year2
  FROM puzzles p 
  JOIN solutions s ON p.id = s.puzzle_id
  JOIN movies m1 ON p.id = m1.puzzle_id AND m1.movie_number = 1
  JOIN movies m2 ON p.id = m2.puzzle_id AND m2.movie_number = 2
  WHERE p.id >= 132
  ORDER BY p.id
`, [], (err, rows) => {
  if (err) {
    console.error('Error querying puzzles:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('\nRecently added puzzles:');
  console.log('======================');
  
  rows.forEach(row => {
    console.log(`ID: ${row.id} - "${row.mashup_title}"`);
    console.log(`  "${row.movie1}" (${row.year1}) + "${row.movie2}" (${row.year2})`);
    console.log('---------------------');
  });
  
  console.log(`\nTotal new puzzles: ${rows.length}`);
  
  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});

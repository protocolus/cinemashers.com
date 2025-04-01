/**
 * Batch add more movie mashup puzzles to the Cinemashers database - Batch 2
 * Focused on Night of the Living Dead, Dawn of the Dead, The Evil Dead series
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Night of the Living Dead series
    ["Night of the Living Dead", "Dead Men Don't Wear Plaid", "Night of the Living Dead Men Don't Wear Plaid", 1968, 1982],
    ["Night of the Living Dead", "Dead Ringers", "Night of the Living Dead Ringers", 1968, 1988],
    ["Night of the Living Dead", "Dead Calm", "Night of the Living Dead Calm", 1968, 1989],
    ["Night of the Living Dead", "Dead Man Walking", "Night of the Living Dead Man Walking", 1968, 1995],
    ["Night of the Living Dead", "Dead Presidents", "Night of the Living Dead Presidents", 1968, 1995],
    
    // Dawn of the Dead series
    ["Dawn of the Dead", "Dead Ringers", "Dawn of the Dead Ringers", 1978, 1988],
    ["Dawn of the Dead", "Dead Calm", "Dawn of the Dead Calm", 1978, 1989],
    ["Dawn of the Dead", "Dead Poets Society", "Dawn of the Dead Poets Society", 1978, 1989],
    ["Dawn of the Dead", "Dead Again", "Dawn of the Dead Again", 1978, 1991],
    ["Dawn of the Dead", "Dead Alive", "Dawn of the Dead Alive", 1978, 1992],
    ["Dawn of the Dead", "Dead Man", "Dawn of the Dead Man", 1978, 1995],
    ["Dawn of the Dead", "Dead Man Walking", "Dawn of the Dead Man Walking", 1978, 1995],
    ["Dawn of the Dead", "Dead Presidents", "Dawn of the Dead Presidents", 1978, 1995],
    ["Dawn of the Dead", "Dead End", "Dawn of the Dead End", 1978, 2003],
    ["Dawn of the Dead", "Dead Man's Shoes", "Dawn of the Dead Man's Shoes", 1978, 2004],
    ["Dawn of the Dead", "Dead Snow 2: Red vs. Dead", "Dawn of the Dead Snow 2: Red vs. Dead", 1978, 2014],
    ["Dawn of the Dead", "Dead Men Don't Wear Plaid", "Dawn of the Dead Men Don't Wear Plaid", 1978, 1982],
    
    // The Evil Dead series
    ["The Evil Dead", "Dead Men Don't Wear Plaid", "The Evil Dead Men Don't Wear Plaid", 1981, 1982],
    ["The Evil Dead", "Dead Ringers", "The Evil Dead Ringers", 1981, 1988],
    ["The Evil Dead", "Dead Calm", "The Evil Dead Calm", 1981, 1989],
    ["The Evil Dead", "Dead Poets Society", "The Evil Dead Poets Society", 1981, 1989],
    ["The Evil Dead", "Dead Again", "The Evil Dead Again", 1981, 1991],
    ["The Evil Dead", "Dead Alive", "The Evil Dead Alive", 1981, 1992],
    ["The Evil Dead", "Dead Man", "The Evil Dead Man", 1981, 1995],
    ["The Evil Dead", "Dead Man Walking", "The Evil Dead Man Walking", 1981, 1995],
    ["The Evil Dead", "Dead Presidents", "The Evil Dead Presidents", 1981, 1995]
  ];
  
  // Connect to the database
  const db = new sqlite3.Database(path.join(__dirname, 'cinemash.db'), (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      process.exit(1);
    }
    console.log('Connected to the SQLite database.');
  });

  // Process puzzles one at a time
  processPuzzles(db, puzzlesToAdd, 0);
  
} catch (err) {
  console.error('sqlite3 module not found. Please install it first:');
  console.error('npm install sqlite3');
  console.error('\nError details:', err.message);
  process.exit(1);
}

function processPuzzles(db, puzzles, index) {
  if (index >= puzzles.length) {
    console.log('All puzzles have been processed successfully!');
    db.close((err) => {
      if (err) console.error('Error closing database:', err.message);
      else console.log('Database connection closed.');
      process.exit(0);
    });
    return;
  }
  
  const puzzle = puzzles[index];
  const movie1Title = puzzle[0];
  const movie2Title = puzzle[1];
  const mashupTitle = puzzle[2];
  const movie1Year = puzzle[3];
  const movie2Year = puzzle[4];
  
  // Create appropriate clue
  const clue = `This mashup combines "${movie1Title}" with "${movie2Title}".`;
  
  // Generate IMDb search URLs
  const imdbSearchUrl1 = `https://www.imdb.com/find/?q=${encodeURIComponent(movie1Title)}`;
  const imdbSearchUrl2 = `https://www.imdb.com/find/?q=${encodeURIComponent(movie2Title)}`;
  
  console.log(`\nProcessing puzzle ${index + 1} of ${puzzles.length}:`);
  console.log(`Movie 1: "${movie1Title}" (${movie1Year})`);
  console.log(`Movie 2: "${movie2Title}" (${movie2Year})`);
  console.log(`Mashup Title: "${mashupTitle}"`);
  
  // Start a transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error(`Error starting transaction for puzzle ${index + 1}:`, err.message);
      processPuzzles(db, puzzles, index + 1); // Skip this one and continue
      return;
    }
    
    // Get the next available puzzle ID
    db.get('SELECT MAX(id) as maxId FROM puzzles', (err, row) => {
      if (err) {
        console.error(`Error getting max puzzle ID for puzzle ${index + 1}:`, err.message);
        db.run('ROLLBACK');
        processPuzzles(db, puzzles, index + 1); // Skip this one and continue
        return;
      }

      const puzzleId = (row.maxId || 0) + 1;
      
      // Insert into puzzles table
      db.run(
        `INSERT INTO puzzles (id, clue, tagline, synopsis, credits, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          puzzleId,
          clue,
          "A clever combination of two classic films.",
          `A creative mashup of "${movie1Title}" (${movie1Year}) and "${movie2Title}" (${movie2Year}) that blends the worlds of both films together.`,
          `A Cinemashers original mashup featuring elements from ${movie1Year} and ${movie2Year}.`,
          1 // is_active = true
        ],
        function(err) {
          if (err) {
            console.error(`Error inserting puzzle ${index + 1}:`, err.message);
            db.run('ROLLBACK');
            processPuzzles(db, puzzles, index + 1); // Skip this one and continue
            return;
          }

          // Insert into solutions table
          db.run(
            `INSERT INTO solutions (puzzle_id, mashup_title) VALUES (?, ?)`,
            [puzzleId, mashupTitle],
            function(err) {
              if (err) {
                console.error(`Error inserting solution ${index + 1}:`, err.message);
                db.run('ROLLBACK');
                processPuzzles(db, puzzles, index + 1); // Skip this one and continue
                return;
              }

              // Insert movie 1
              db.run(
                `INSERT INTO movies (puzzle_id, movie_number, title, year, imdb_url) VALUES (?, ?, ?, ?, ?)`,
                [puzzleId, 1, movie1Title, movie1Year, imdbSearchUrl1],
                function(err) {
                  if (err) {
                    console.error(`Error inserting movie 1 for puzzle ${index + 1}:`, err.message);
                    db.run('ROLLBACK');
                    processPuzzles(db, puzzles, index + 1); // Skip this one and continue
                    return;
                  }

                  // Insert movie 2
                  db.run(
                    `INSERT INTO movies (puzzle_id, movie_number, title, year, imdb_url) VALUES (?, ?, ?, ?, ?)`,
                    [puzzleId, 2, movie2Title, movie2Year, imdbSearchUrl2],
                    function(err) {
                      if (err) {
                        console.error(`Error inserting movie 2 for puzzle ${index + 1}:`, err.message);
                        db.run('ROLLBACK');
                        processPuzzles(db, puzzles, index + 1); // Skip this one and continue
                        return;
                      }
                      
                      // Commit the transaction
                      db.run('COMMIT', (err) => {
                        if (err) {
                          console.error(`Error committing transaction for puzzle ${index + 1}:`, err.message);
                          db.run('ROLLBACK');
                        } else {
                          console.log(`Successfully added "${mashupTitle}" puzzle to the database with ID: ${puzzleId}`);
                        }
                        
                        // Process the next puzzle
                        processPuzzles(db, puzzles, index + 1);
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
}

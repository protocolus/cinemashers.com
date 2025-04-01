/**
 * Add more Man themed mashups to the Cinemashers database
 * The eighth batch of the massive expansion
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Man series - The Wolf Man
    ["The Wolf Man", "Man with a Movie Camera", "The Wolf Man with a Movie Camera", 1941, 1929],
    ["The Wolf Man", "Man Bites Dog", "The Wolf Man Bites Dog", 1941, 1992],
    ["The Wolf Man", "Man on the Moon", "The Wolf Man on the Moon", 1941, 1999],
    ["The Wolf Man", "Man on Fire", "The Wolf Man on Fire", 1941, 2004],
    ["The Wolf Man", "Man of Steel", "The Wolf Man of Steel", 1941, 2013],
    ["The Wolf Man", "Man on Wire", "The Wolf Man on Wire", 1941, 2008],
    ["The Wolf Man", "Man on a Ledge", "The Wolf Man on a Ledge", 1941, 2012],
    ["The Wolf Man", "Man Up", "The Wolf Man Up", 1941, 2015],
    
    // Man series - The Third Man
    ["The Third Man", "Man with a Movie Camera", "The Third Man with a Movie Camera", 1949, 1929],
    ["The Third Man", "Man Bites Dog", "The Third Man Bites Dog", 1949, 1992],
    ["The Third Man", "Man on the Moon", "The Third Man on the Moon", 1949, 1999],
    ["The Third Man", "Man on Fire", "The Third Man on Fire", 1949, 2004],
    ["The Third Man", "Man of Steel", "The Third Man of Steel", 1949, 2013],
    ["The Third Man", "Man on Wire", "The Third Man on Wire", 1949, 2008],
    ["The Third Man", "Man on a Ledge", "The Third Man on a Ledge", 1949, 2012],
    ["The Third Man", "Man Up", "The Third Man Up", 1949, 2015],
    
    // Man series - The Quiet Man
    ["The Quiet Man", "Man with a Movie Camera", "The Quiet Man with a Movie Camera", 1952, 1929],
    ["The Quiet Man", "Man Bites Dog", "The Quiet Man Bites Dog", 1952, 1992],
    ["The Quiet Man", "Man on the Moon", "The Quiet Man on the Moon", 1952, 1999],
    ["The Quiet Man", "Man on Fire", "The Quiet Man on Fire", 1952, 2004],
    ["The Quiet Man", "Man of Steel", "The Quiet Man of Steel", 1952, 2013],
    ["The Quiet Man", "Man on Wire", "The Quiet Man on Wire", 1952, 2008],
    ["The Quiet Man", "Man on a Ledge", "The Quiet Man on a Ledge", 1952, 2012],
    ["The Quiet Man", "Man Up", "The Quiet Man Up", 1952, 2015]
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

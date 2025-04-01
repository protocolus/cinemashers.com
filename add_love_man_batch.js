/**
 * Add Shakespeare in Love and Man themed mashups to the Cinemashers database
 * The seventh batch of the massive expansion
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Shakespeare in Love series
    ["Shakespeare in Love", "Love in the Afternoon", "Shakespeare in Love in the Afternoon", 1998, 1957],
    ["Shakespeare in Love", "Love Story", "Shakespeare in Love Story", 1998, 1970],
    ["Shakespeare in Love", "Love Actually", "Shakespeare in Love Actually", 1998, 2003],
    ["Shakespeare in Love", "Love Me If You Dare", "Shakespeare in Love Me If You Dare", 1998, 2003],
    ["Shakespeare in Love", "Love & Other Drugs", "Shakespeare in Love & Other Drugs", 1998, 2010],
    ["Shakespeare in Love", "Love Lies Bleeding", "Shakespeare in Love Lies Bleeding", 1998, 2024],
    ["Shakespeare in Love", "Love at First Sight", "Shakespeare in Love at First Sight", 1998, 2023],
    ["Shakespeare in Love", "Love and Monsters", "Shakespeare in Love and Monsters", 1998, 2020],
    
    // Man series - The Invisible Man
    ["The Invisible Man", "Man with a Movie Camera", "The Invisible Man with a Movie Camera", 2020, 1929],
    ["The Invisible Man", "Man Bites Dog", "The Invisible Man Bites Dog", 2020, 1992],
    ["The Invisible Man", "Man on the Moon", "The Invisible Man on the Moon", 2020, 1999],
    ["The Invisible Man", "Man on Fire", "The Invisible Man on Fire", 2020, 2004],
    ["The Invisible Man", "Man of Steel", "The Invisible Man of Steel", 2020, 2013],
    ["The Invisible Man", "Man on Wire", "The Invisible Man on Wire", 2020, 2008],
    ["The Invisible Man", "Man on a Ledge", "The Invisible Man on a Ledge", 2020, 2012],
    ["The Invisible Man", "Man Up", "The Invisible Man Up", 2020, 2015],
    
    // Man series - The Thin Man
    ["The Thin Man", "Man with a Movie Camera", "The Thin Man with a Movie Camera", 1934, 1929],
    ["The Thin Man", "Man Bites Dog", "The Thin Man Bites Dog", 1934, 1992],
    ["The Thin Man", "Man on the Moon", "The Thin Man on the Moon", 1934, 1999],
    ["The Thin Man", "Man on Fire", "The Thin Man on Fire", 1934, 2004],
    ["The Thin Man", "Man of Steel", "The Thin Man of Steel", 1934, 2013],
    ["The Thin Man", "Man on Wire", "The Thin Man on Wire", 1934, 2008],
    ["The Thin Man", "Man on a Ledge", "The Thin Man on a Ledge", 1934, 2012],
    ["The Thin Man", "Man Up", "The Thin Man Up", 1934, 2015]
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

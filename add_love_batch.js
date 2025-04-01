/**
 * Add Love themed mashups to the Cinemashers database
 * The sixth batch of the massive expansion
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Love series - From Russia with Love
    ["From Russia with Love", "Love Actually", "From Russia with Love Actually", 1963, 2003],
    ["From Russia with Love", "Love Me If You Dare", "From Russia with Love Me If You Dare", 1963, 2003],
    ["From Russia with Love", "Love & Other Drugs", "From Russia with Love & Other Drugs", 1963, 2010],
    ["From Russia with Love", "Love Is All You Need", "From Russia with Love Is All You Need", 1963, 2012],
    ["From Russia with Love", "Love Lies Bleeding", "From Russia with Love Lies Bleeding", 1963, 2024],
    ["From Russia with Love", "Love at First Sight", "From Russia with Love at First Sight", 1963, 2023],
    
    // Love series - To Sir with Love
    ["To Sir, with Love", "Love in the Afternoon", "To Sir, with Love in the Afternoon", 1967, 1957],
    ["To Sir, with Love", "Love Story", "To Sir, with Love Story", 1967, 1970],
    ["To Sir, with Love", "Love and Death", "To Sir, with Love and Death", 1967, 1975],
    ["To Sir, with Love", "Love Letter", "To Sir, with Love Letter", 1967, 1999],
    ["To Sir, with Love", "Love Actually", "To Sir, with Love Actually", 1967, 2003],
    ["To Sir, with Love", "Love & Other Drugs", "To Sir, with Love & Other Drugs", 1967, 2010],
    ["To Sir, with Love", "Love Lies Bleeding", "To Sir, with Love Lies Bleeding", 1967, 2024],
    ["To Sir, with Love", "Love at First Sight", "To Sir, with Love at First Sight", 1967, 2023],
    ["To Sir, with Love", "Love and Monsters", "To Sir, with Love and Monsters", 1967, 2020],
    
    // Love series - Can't Buy Me Love
    ["Can't Buy Me Love", "Love in the Afternoon", "Can't Buy Me Love in the Afternoon", 1987, 1957],
    ["Can't Buy Me Love", "Love Story", "Can't Buy Me Love Story", 1987, 1970],
    ["Can't Buy Me Love", "Love and Death", "Can't Buy Me Love and Death", 1987, 1975],
    ["Can't Buy Me Love", "Love Letter", "Can't Buy Me Love Letter", 1987, 1999],
    ["Can't Buy Me Love", "Love Actually", "Can't Buy Me Love Actually", 1987, 2003],
    ["Can't Buy Me Love", "Love Lies Bleeding", "Can't Buy Me Love Lies Bleeding", 1987, 2024],
    ["Can't Buy Me Love", "Love at First Sight", "Can't Buy Me Love at First Sight", 1987, 2023],
    ["Can't Buy Me Love", "Love and Monsters", "Can't Buy Me Love and Monsters", 1987, 2020]
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

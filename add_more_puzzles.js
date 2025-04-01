/**
 * Batch add more movie mashup puzzles to the Cinemashers database
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Away series
    ["Far and Away", "Away We Go", "Far and Away We Go", 1992, 2009],
    ["Cast Away", "Away from Her", "Cast Away from Her", 2000, 2006],
    ["Cast Away", "Away We Go", "Cast Away We Go", 2000, 2009],
    ["Spirited Away", "Away from Her", "Spirited Away from Her", 2001, 2006],
    ["Spirited Away", "Away We Go", "Spirited Away We Go", 2001, 2009],
    ["Flushed Away", "Away from Her", "Flushed Away from Her", 2006, 2006],
    ["Flushed Away", "Away We Go", "Flushed Away We Go", 2006, 2009],
    
    // Baby Driver series
    ["Bringing Up Baby", "Baby Driver", "Bringing Up Baby Driver", 1938, 2017],
    ["Rosemary's Baby", "Baby Driver", "Rosemary's Baby Driver", 1968, 2017],
    ["Cry-Baby", "Baby Driver", "Cry-Baby Driver", 1990, 2017],
    ["Million Dollar Baby", "Baby Driver", "Million Dollar Baby Driver", 2004, 2017],
    
    // Back series
    ["Star Wars: Episode V - The Empire Strikes Back", "Back to School", "Star Wars: Episode V - The Empire Strikes Back to School", 1980, 1986],
    ["Jay and Silent Bob Strike Back", "Back to the Future", "Jay and Silent Bob Strike Back to the Future", 2001, 1985],
    ["Jay and Silent Bob Strike Back", "Back to School", "Jay and Silent Bob Strike Back to School", 2001, 1986],
    
    // Bang series
    ["Chitty Chitty Bang Bang", "Bang the Drum Slowly", "Chitty Chitty Bang Bang the Drum Slowly", 1968, 1973],
    ["Kiss Kiss Bang Bang", "Bang the Drum Slowly", "Kiss Kiss Bang Bang the Drum Slowly", 2005, 1973],
    
    // Miscellaneous 
    ["American Beauty", "Beauty and the Beast", "American Beauty and the Beast", 1999, 1991],
    ["The Unbearable Lightness of Being", "Being There", "The Unbearable Lightness of Being There", 1988, 1979],
    ["The Unbearable Lightness of Being", "Being John Malkovich", "The Unbearable Lightness of Being John Malkovich", 1988, 1999],
    ["Memphis Belle", "Belle de Jour", "Memphis Belle de Jour", 1990, 1967],
    ["Star Trek Beyond", "Beyond the Sea", "Star Trek Beyond the Sea", 2016, 2004],
    ["Lady Bird", "Bird Box", "Lady Bird Box", 2017, 2018],
    ["Follow That Bird", "Bird Box", "Follow That Bird Box", 1985, 2018],
    ["Meet Joe Black", "Black Beauty", "Meet Joe Black Beauty", 1998, 1994]
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

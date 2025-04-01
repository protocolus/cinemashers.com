/**
 * Batch add multiple movie mashup puzzles to the Cinemashers database
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    ["Bob & Carol & Ted & Alice", "Alice in Wonderland", "Bob & Carol & Ted & Alice in Wonderland", 1969, 1951],
    ["And Justice for All", "All Quiet on the Western Front", "And Justice for All Quiet on the Western Front", 1979, 1930],
    ["And Justice for All", "All the King's Men", "And Justice for All the King's Men", 1979, 1949],
    ["And Justice for All", "All About Eve", "And Justice for All About Eve", 1979, 1950],
    ["And Justice for All", "All the President's Men", "And Justice for All the President's Men", 1979, 1976],
    ["And Justice for All", "All That Jazz", "And Justice for All That Jazz", 1979, 1979],
    ["And Justice for All", "All of Me", "And Justice for All of Me", 1979, 1984],
    ["And Justice for All", "All Dogs Go to Heaven", "And Justice for All Dogs Go to Heaven", 1979, 1989],
    ["We're No Angels", "Angels with Dirty Faces", "We're No Angels with Dirty Faces", 1955, 1938],
    ["Where the Wild Things Are", "Are You There God? It's Me, Margaret.", "Where the Wild Things Are You There God? It's Me, Margaret.", 2009, 2023],
    ["Chances Are", "Are You There God? It's Me, Margaret.", "Chances Are You There God? It's Me, Margaret.", 1989, 2023]
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

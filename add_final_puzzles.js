/**
 * Batch add final set of movie mashup puzzles to the Cinemashers database
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Miscellaneous themed mashups
    ["Perfect Blue", "Blue Velvet", "Perfect Blue Velvet", 1997, 1986],
    ["What About Bob?", "Bob & Carol & Ted & Alice", "What About Bob? & Carol & Ted & Alice", 1991, 1969],
    ["What About Bob?", "Bob Roberts", "What About Bob? Roberts", 1991, 1992],
    ["A Star Is Born", "Born on the Fourth of July", "A Star Is Born on the Fourth of July", 2018, 1989],
    
    // Boys series
    ["Bad Boys", "Boys on the Side", "Bad Boys on the Side", 1995, 1995],
    ["The Lost Boys", "Boys on the Side", "The Lost Boys on the Side", 1987, 1995],
    ["The Lost Boys", "Boys Don't Cry", "The Lost Boys Don't Cry", 1987, 1999],
    ["The Fabulous Baker Boys", "Boys on the Side", "The Fabulous Baker Boys on the Side", 1989, 1995],
    ["The Fabulous Baker Boys", "Boys Don't Cry", "The Fabulous Baker Boys Don't Cry", 1989, 1999],
    ["Wonder Boys", "Boys on the Side", "Wonder Boys on the Side", 2000, 1995],
    ["Wonder Boys", "Boys Don't Cry", "Wonder Boys Don't Cry", 2000, 1999],
    ["Riding in Cars with Boys", "Boys on the Side", "Riding in Cars with Boys on the Side", 2001, 1995],
    ["Riding in Cars with Boys", "Boys Don't Cry", "Riding in Cars with Boys Don't Cry", 2001, 1999],
    
    // Bridge, Broken, Brooklyn
    ["Girl on the Bridge", "Bridge to Terabithia", "Girl on the Bridge to Terabithia", 1999, 2007],
    ["Wild Hearts Can't Be Broken", "Broken Arrow", "Wild Hearts Can't Be Broken Arrow", 1991, 1996],
    ["Wild Hearts Can't Be Broken", "Broken Flowers", "Wild Hearts Can't Be Broken Flowers", 1991, 2005],
    ["A Tree Grows in Brooklyn", "Brooklyn's Finest", "A Tree Grows in Brooklyn's Finest", 1945, 2009],
    
    // Bull, Castle
    ["Raging Bull", "Bull Durham", "Raging Bull Durham", 1980, 1988],
    ["Howl's Moving Castle", "Castle in the Sky", "Howl's Moving Castle in the Sky", 2004, 1986],
    ["Harold & Kumar Go to White Castle", "Castle in the Sky", "Harold & Kumar Go to White Castle in the Sky", 2004, 1986],
    
    // Cat series
    ["That Darn Cat!", "Cat People", "That Darn Cat! People", 1965, 1982],
    ["That Darn Cat!", "Cat on a Hot Tin Roof", "That Darn Cat! on a Hot Tin Roof", 1965, 1958],
    ["That Darn Cat!", "Cat Ballou", "That Darn Cat! Ballou", 1965, 1965],
    
    // Chicken
    ["The Ghost and Mr. Chicken", "Chicken Run", "The Ghost and Mr. Chicken Run", 1966, 2000]
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

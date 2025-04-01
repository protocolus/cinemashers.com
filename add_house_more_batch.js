/**
 * Add more House themed mashups to the Cinemashers database
 * The second batch of the massive expansion
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // House series - Life as a House combos
    ["Life as a House", "House of Wax", "Life as a House of Wax", 2001, 1953],
    ["Life as a House", "House on Haunted Hill", "Life as a House on Haunted Hill", 2001, 1959],
    ["Life as a House", "House of Usher", "Life as a House of Usher", 2001, 1960],
    ["Life as a House", "House of Games", "Life as a House of Games", 2001, 1987],
    ["Life as a House", "House Party", "Life as a House Party", 2001, 1990],
    ["Life as a House", "House of Sand and Fog", "Life as a House of Sand and Fog", 2001, 2003],
    ["Life as a House", "House of Flying Daggers", "Life as a House of Flying Daggers", 2001, 2004],
    
    // House series - The Lake House combos
    ["The Lake House", "House of Wax", "The Lake House of Wax", 2006, 1953],
    ["The Lake House", "House on Haunted Hill", "The Lake House on Haunted Hill", 2006, 1959],
    ["The Lake House", "House of Usher", "The Lake House of Usher", 2006, 1960],
    ["The Lake House", "House of Games", "The Lake House of Games", 2006, 1987],
    ["The Lake House", "House Party", "The Lake House Party", 2006, 1990],
    ["The Lake House", "House of Sand and Fog", "The Lake House of Sand and Fog", 2006, 2003],
    ["The Lake House", "House of Flying Daggers", "The Lake House of Flying Daggers", 2006, 2004],
    
    // House series - Monster House combos
    ["Monster House", "House of Wax", "Monster House of Wax", 2006, 1953],
    ["Monster House", "House on Haunted Hill", "Monster House on Haunted Hill", 2006, 1959],
    ["Monster House", "House of Usher", "Monster House of Usher", 2006, 1960],
    ["Monster House", "House of Games", "Monster House of Games", 2006, 1987],
    ["Monster House", "House Party", "Monster House Party", 2006, 1990],
    ["Monster House", "House of Sand and Fog", "Monster House of Sand and Fog", 2006, 2003],
    ["Monster House", "House of Flying Daggers", "Monster House of Flying Daggers", 2006, 2004],
    
    // Safe House combo
    ["Safe House", "House of Flying Daggers", "Safe House of Flying Daggers", 2012, 2004],
    
    // Hustle series
    ["Kung Fu Hustle", "Hustle & Flow", "Kung Fu Hustle & Flow", 2004, 2005],
    ["Logan Lucky", "Lucky Number Slevin", "Logan Lucky Number Slevin", 2017, 2006],
    
    // King and I series
    ["The King and I", "I Am Sam", "The King and I Am Sam", 1956, 2001],
    ["The King and I", "I Heart Huckabees", "The King and I Heart Huckabees", 1956, 2004],
    ["The King and I", "I Am Legend", "The King and I Am Legend", 1956, 2007],
    ["The King and I", "I Love You Phillip Morris", "The King and I Love You Phillip Morris", 1956, 2009],
    ["The King and I", "I Love You, Man", "The King and I Love You, Man", 1956, 2009],
    
    // Withnail and I series
    ["Withnail and I", "I Am Legend", "Withnail and I Am Legend", 1987, 2007]
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

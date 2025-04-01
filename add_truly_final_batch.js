/**
 * Add truly final batch of movie mashup puzzles to the Cinemashers database
 * Focused on Friday, Game, Girl, Gone, Goodbye, Green, and Hard themed series
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Friday series
    ["His Girl Friday", "Friday Night Lights", "His Girl Friday Night Lights", 1940, 2004],
    
    // Game series
    ["Ender's Game", "Game Night", "Ender's Game Night", 2013, 2018],
    ["Gerald's Game", "Game Night", "Gerald's Game Night", 2017, 2018],
    
    // Girl series
    ["Funny Girl", "Girl on the Bridge", "Funny Girl on the Bridge", 1968, 1999],
    ["Working Girl", "Girl on the Bridge", "Working Girl on the Bridge", 1988, 1999],
    ["My Girl", "Girl on the Bridge", "My Girl on the Bridge", 1991, 1999],
    ["Lars and the Real Girl", "Girl on the Bridge", "Lars and the Real Girl on the Bridge", 2007, 1999],
    ["Lars and the Real Girl", "Girl with a Pearl Earring", "Lars and the Real Girl with a Pearl Earring", 2007, 2003],
    ["The Danish Girl", "Girl on the Bridge", "The Danish Girl on the Bridge", 2015, 1999],
    ["The Danish Girl", "Girl with a Pearl Earring", "The Danish Girl with a Pearl Earring", 2015, 2003],
    ["Funny Girl", "Girl with a Pearl Earring", "Funny Girl with a Pearl Earring", 1968, 2003],
    ["Me and Earl and the Dying Girl", "Girl on the Bridge", "Me and Earl and the Dying Girl on the Bridge", 2015, 1999],
    ["Me and Earl and the Dying Girl", "Girl with a Pearl Earring", "Me and Earl and the Dying Girl with a Pearl Earring", 2015, 2003],
    
    // Gone series
    ["Gone Baby Gone", "Gone with the Wind", "Gone Baby Gone with the Wind", 2007, 1939],
    
    // Goodbye series
    ["The Long Goodbye", "Goodbye, Mr. Chips", "The Long Goodbye, Mr. Chips", 1973, 1969],
    
    // Green series
    ["Soylent Green", "Green Room", "Soylent Green Room", 1973, 2015],
    ["Soylent Green", "Green Book", "Soylent Green Book", 1973, 2018],
    
    // Hard series
    ["Die Hard", "Hard Candy", "Die Hard Candy", 1988, 2005],
    ["Live Free or Die Hard", "Hard Candy", "Live Free or Die Hard Candy", 2007, 2005]
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

/**
 * Add final batch of movie mashup puzzles to the Cinemashers database
 * Focused on Do, Dog, Dream, E.T., Edge, Eight, and Escape themed series
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Do series
    ["That Thing You Do!", "Do the Right Thing", "That Thing You Do! the Right Thing", 1996, 1989],
    
    // Dog series
    ["Wag the Dog", "Dog Day Afternoon", "Wag the Dog Day Afternoon", 1997, 1975],
    
    // Dream series
    ["Tucker: The Man and His Dream", "Dream Scenario", "Tucker: The Man and His Dream Scenario", 1988, 2023],
    ["Requiem for a Dream", "Dream Scenario", "Requiem for a Dream Scenario", 2000, 2023],
    
    // E.T. series
    ["Titan A.E.", "E.T. the Extra-Terrestrial", "Titan A.E. the Extra-Terrestrial", 2000, 1982],
    ["WALL·E", "E.T. the Extra-Terrestrial", "WALL·E the Extra-Terrestrial", 2008, 1982],
    
    // Edge series
    ["The Razor's Edge", "Edge of Seventeen", "The Razor's Edge of Seventeen", 1984, 2016],
    ["The Razor's Edge", "Edge of Darkness", "The Razor's Edge of Darkness", 1984, 2010],
    ["The Razor's Edge", "Edge of Tomorrow", "The Razor's Edge of Tomorrow", 1984, 2014],
    ["Over the Edge", "Edge of Seventeen", "Over the Edge of Seventeen", 1979, 2016],
    ["Over the Edge", "Edge of Darkness", "Over the Edge of Darkness", 1979, 2010],
    ["Over the Edge", "Edge of Tomorrow", "Over the Edge of Tomorrow", 1979, 2014],
    ["Jagged Edge", "Edge of Seventeen", "Jagged Edge of Seventeen", 1985, 2016],
    ["Jagged Edge", "Edge of Darkness", "Jagged Edge of Darkness", 1985, 2010],
    ["Jagged Edge", "Edge of Tomorrow", "Jagged Edge of Tomorrow", 1985, 2014],
    ["River's Edge", "Edge of Seventeen", "River's Edge of Seventeen", 1986, 2016],
    ["River's Edge", "Edge of Darkness", "River's Edge of Darkness", 1986, 2010],
    ["River's Edge", "Edge of Tomorrow", "River's Edge of Tomorrow", 1986, 2014],
    ["Postcards from the Edge", "Edge of Seventeen", "Postcards from the Edge of Seventeen", 1990, 2016],
    ["Postcards from the Edge", "Edge of Darkness", "Postcards from the Edge of Darkness", 1990, 2010],
    ["Postcards from the Edge", "Edge of Tomorrow", "Postcards from the Edge of Tomorrow", 1990, 2014],
    ["The Cutting Edge", "Edge of Seventeen", "The Cutting Edge of Seventeen", 1992, 2016],
    ["The Cutting Edge", "Edge of Darkness", "The Cutting Edge of Darkness", 1992, 2010],
    ["The Cutting Edge", "Edge of Tomorrow", "The Cutting Edge of Tomorrow", 1992, 2014],
    
    // Eight series
    ["Hard Eight", "Eight Men Out", "Hard Eight Men Out", 1996, 1988],
    ["The Hateful Eight", "Eight Men Out", "The Hateful Eight Men Out", 2015, 1988],
    
    // Escape series
    ["The Great Escape", "Escape from Alcatraz", "The Great Escape from Alcatraz", 1963, 1979],
    ["The Great Escape", "Escape from New York", "The Great Escape from New York", 1963, 1981]
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

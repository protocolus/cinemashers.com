/**
 * Add more Life themed mashups to the Cinemashers database
 * The fifth batch of the massive expansion
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Life series - Monty Python's the Meaning of Life
    ["Monty Python's the Meaning of Life", "Life Is Beautiful", "Monty Python's the Meaning of Life Is Beautiful", 1983, 1997],
    ["Monty Python's the Meaning of Life", "Life as a House", "Monty Python's the Meaning of Life as a House", 1983, 2001],
    ["Monty Python's the Meaning of Life", "Life of Pi", "Monty Python's the Meaning of Life of Pi", 1983, 2012],
    
    // Life series - Defending Your Life
    ["Defending Your Life", "Life Is Beautiful", "Defending Your Life Is Beautiful", 1991, 1997],
    ["Defending Your Life", "Life as a House", "Defending Your Life as a House", 1991, 2001],
    ["Defending Your Life", "Life of Pi", "Defending Your Life of Pi", 1991, 2012],
    
    // Life series - A Bug's Life
    ["A Bug's Life", "Life Is Beautiful", "A Bug's Life Is Beautiful", 1998, 1997],
    ["A Bug's Life", "Life as a House", "A Bug's Life as a House", 1998, 2001],
    
    // Life series - Waking Life
    ["Waking Life", "Life Is Beautiful", "Waking Life Is Beautiful", 2001, 1997],
    ["Waking Life", "Life as a House", "Waking Life as a House", 2001, 2001],
    ["Waking Life", "Life of Pi", "Waking Life of Pi", 2001, 2012],
    
    // Life series - Dan in Real Life
    ["Dan in Real Life", "Life Is Beautiful", "Dan in Real Life Is Beautiful", 2007, 1997],
    ["Dan in Real Life", "Life as a House", "Dan in Real Life as a House", 2007, 2001],
    ["Dan in Real Life", "Life of Pi", "Dan in Real Life of Pi", 2007, 2012],
    
    // Little series
    ["The Man Who Knew Too Little", "Little Big Man", "The Man Who Knew Too Little Big Man", 1997, 1970],
    ["The Man Who Knew Too Little", "Little Shop of Horrors", "The Man Who Knew Too Little Shop of Horrors", 1997, 1986],
    ["The Man Who Knew Too Little", "Little Giants", "The Man Who Knew Too Little Giants", 1997, 1994],
    ["The Man Who Knew Too Little", "Little Women", "The Man Who Knew Too Little Women", 1997, 2019],
    
    // Live series
    ["They Live", "Live and Let Die", "They Live and Let Die", 1988, 1973],
    ["They Live", "Live Free or Die Hard", "They Live Free or Die Hard", 1988, 2007],
    
    // Lucky series
    ["Happy-Go-Lucky", "Lucky Number Slevin", "Happy-Go-Lucky Number Slevin", 2008, 2006],
    ["Logan Lucky", "Lucky Number Slevin", "Logan Lucky Number Slevin", 2017, 2006]
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

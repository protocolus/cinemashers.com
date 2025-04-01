/**
 * Batch add more movie mashup puzzles to the Cinemashers database - Black, Blade, and Blood series
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Meet Joe Black series
    ["Meet Joe Black", "Black Snake Moan", "Meet Joe Black Snake Moan", 1998, 2006],
    ["Meet Joe Black", "Black Panther", "Meet Joe Black Panther", 1998, 2018],
    ["Meet Joe Black", "Black Widow", "Meet Joe Black Widow", 1998, 2021],
    ["Meet Joe Black", "Black Hawk Down", "Meet Joe Black Hawk Down", 1998, 2001],
    ["Meet Joe Black", "Black Panther: Wakanda Forever", "Meet Joe Black Panther: Wakanda Forever", 1998, 2022],
    ["Meet Joe Black", "Black Mirror: Bandersnatch", "Meet Joe Black Mirror: Bandersnatch", 1998, 2018],
    
    // Men in Black series
    ["Men in Black", "Black Beauty", "Men in Black Beauty", 1997, 1994],
    ["Men in Black", "Black Hawk Down", "Men in Black Hawk Down", 1997, 2001],
    ["Men in Black", "Black Friday", "Men in Black Friday", 1997, 2021],
    ["Men in Black", "Black Snake Moan", "Men in Black Snake Moan", 1997, 2006],
    ["Men in Black", "Black Swan", "Men in Black Swan", 1997, 2010],
    ["Men in Black", "Black Widow", "Men in Black Widow", 1997, 2021],
    ["Men in Black", "Black Panther: Wakanda Forever", "Men in Black Panther: Wakanda Forever", 1997, 2022],
    ["Men in Black", "Black Mirror: Bandersnatch", "Men in Black Mirror: Bandersnatch", 1997, 2018],
    
    // Pitch Black series
    ["Pitch Black", "Black Beauty", "Pitch Black Beauty", 2000, 1994],
    ["Pitch Black", "Black Hawk Down", "Pitch Black Hawk Down", 2000, 2001],
    ["Pitch Black", "Black Friday", "Pitch Black Friday", 2000, 2021],
    ["Pitch Black", "Black Snake Moan", "Pitch Black Snake Moan", 2000, 2006],
    ["Pitch Black", "Black Swan", "Pitch Black Swan", 2000, 2010],
    ["Pitch Black", "Black Panther", "Pitch Black Panther", 2000, 2018],
    ["Pitch Black", "Black Widow", "Pitch Black Widow", 2000, 2021],
    ["Pitch Black", "Black Panther: Wakanda Forever", "Pitch Black Panther: Wakanda Forever", 2000, 2022],
    ["Pitch Black", "Black Mirror: Bandersnatch", "Pitch Black Mirror: Bandersnatch", 2000, 2018],
    
    // Blade series
    ["Sling Blade", "Blade Runner", "Sling Blade Runner", 1996, 1982],
    ["Sling Blade", "Blade Runner 2049", "Sling Blade Runner 2049", 1996, 2017],
    
    // Blood series
    ["In Cold Blood", "Blood Simple", "In Cold Blood Simple", 1967, 1984],
    ["In Cold Blood", "Blood Diamond", "In Cold Blood Diamond", 1967, 2006],
    ["First Blood", "Blood Simple", "First Blood Simple", 1982, 1984],
    ["First Blood", "Blood Diamond", "First Blood Diamond", 1982, 2006],
    ["There Will Be Blood", "Blood Simple", "There Will Be Blood Simple", 2007, 1984],
    ["There Will Be Blood", "Blood Diamond", "There Will Be Blood Diamond", 2007, 2006]
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

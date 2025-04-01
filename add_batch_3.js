/**
 * Batch add more movie mashup puzzles to the Cinemashers database - Batch 3
 * Focused on Better Off Dead, Rosencrantz & Guildenstern Are Dead, Things to Do in Denver, Shaun of the Dead series
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Better Off Dead series
    ["Better Off Dead", "Dead Men Don't Wear Plaid", "Better Off Dead Men Don't Wear Plaid", 1985, 1982],
    ["Better Off Dead", "Dead Ringers", "Better Off Dead Ringers", 1985, 1988],
    ["Better Off Dead", "Dead Calm", "Better Off Dead Calm", 1985, 1989],
    ["Better Off Dead", "Dead Poets Society", "Better Off Dead Poets Society", 1985, 1989],
    ["Better Off Dead", "Dead Again", "Better Off Dead Again", 1985, 1991],
    ["Better Off Dead", "Dead Alive", "Better Off Dead Alive", 1985, 1992],
    ["Better Off Dead", "Dead Man", "Better Off Dead Man", 1985, 1995],
    ["Better Off Dead", "Dead Man Walking", "Better Off Dead Man Walking", 1985, 1995],
    ["Better Off Dead", "Dead Presidents", "Better Off Dead Presidents", 1985, 1995],
    
    // Rosencrantz & Guildenstern Are Dead series
    ["Rosencrantz & Guildenstern Are Dead", "Dead Men Don't Wear Plaid", "Rosencrantz & Guildenstern Are Dead Men Don't Wear Plaid", 1990, 1982],
    ["Rosencrantz & Guildenstern Are Dead", "Dead Ringers", "Rosencrantz & Guildenstern Are Dead Ringers", 1990, 1988],
    ["Rosencrantz & Guildenstern Are Dead", "Dead Calm", "Rosencrantz & Guildenstern Are Dead Calm", 1990, 1989],
    ["Rosencrantz & Guildenstern Are Dead", "Dead Poets Society", "Rosencrantz & Guildenstern Are Dead Poets Society", 1990, 1989],
    ["Rosencrantz & Guildenstern Are Dead", "Dead Again", "Rosencrantz & Guildenstern Are Dead Again", 1990, 1991],
    ["Rosencrantz & Guildenstern Are Dead", "Dead Alive", "Rosencrantz & Guildenstern Are Dead Alive", 1990, 1992],
    ["Rosencrantz & Guildenstern Are Dead", "Dead Man", "Rosencrantz & Guildenstern Are Dead Man", 1990, 1995],
    ["Rosencrantz & Guildenstern Are Dead", "Dead Man Walking", "Rosencrantz & Guildenstern Are Dead Man Walking", 1990, 1995],
    ["Rosencrantz & Guildenstern Are Dead", "Dead Presidents", "Rosencrantz & Guildenstern Are Dead Presidents", 1990, 1995],
    
    // Things to Do in Denver When You're Dead series
    ["Things to Do in Denver When You're Dead", "Dead Men Don't Wear Plaid", "Things to Do in Denver When You're Dead Men Don't Wear Plaid", 1995, 1982],
    ["Things to Do in Denver When You're Dead", "Dead Ringers", "Things to Do in Denver When You're Dead Ringers", 1995, 1988],
    ["Things to Do in Denver When You're Dead", "Dead Calm", "Things to Do in Denver When You're Dead Calm", 1995, 1989],
    ["Things to Do in Denver When You're Dead", "Dead Poets Society", "Things to Do in Denver When You're Dead Poets Society", 1995, 1989],
    ["Things to Do in Denver When You're Dead", "Dead Again", "Things to Do in Denver When You're Dead Again", 1995, 1991],
    ["Things to Do in Denver When You're Dead", "Dead Alive", "Things to Do in Denver When You're Dead Alive", 1995, 1992],
    ["Things to Do in Denver When You're Dead", "Dead Man", "Things to Do in Denver When You're Dead Man", 1995, 1995],
    ["Things to Do in Denver When You're Dead", "Dead Man Walking", "Things to Do in Denver When You're Dead Man Walking", 1995, 1995],
    ["Things to Do in Denver When You're Dead", "Dead Presidents", "Things to Do in Denver When You're Dead Presidents", 1995, 1995],
    
    // Shaun of the Dead series
    ["Shaun of the Dead", "Dead of Night", "Shaun of the Dead of Night", 2004, 1945],
    ["Shaun of the Dead", "Dead & Buried", "Shaun of the Dead & Buried", 2004, 1981],
    ["Shaun of the Dead", "Dead Men Don't Wear Plaid", "Shaun of the Dead Men Don't Wear Plaid", 2004, 1982],
    ["Shaun of the Dead", "Dead Ringers", "Shaun of the Dead Ringers", 2004, 1988]
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

/**
 * Add new puzzle: "Con Air" + "Air Force One" = "Con Air Force One"
 * Run this script with Node.js to add the new mashup to the database
 * 
 * To run locally:
 * 1. Install sqlite3 if not already installed: npm install sqlite3
 * 2. Run: node add_puzzle_con_air_force_one.js
 * 
 * To run on DigitalOcean server:
 * 1. Pull the latest code: git pull
 * 2. Run: node add_puzzle_con_air_force_one.js
 */

try {
  // Try to require sqlite3 - this may fail if it's not installed
  const sqlite3 = require('sqlite3');
  console.log('sqlite3 module found, continuing with database operations');
  addPuzzleToDb();
} catch (err) {
  console.error('sqlite3 module not found. Please install it first:');
  console.error('npm install sqlite3');
  console.error('\nError details:', err.message);
  process.exit(1);
}

function addPuzzleToDb() {
  const path = require('path');
  const sqlite3 = require('sqlite3').verbose();

  // Connect to the database
  const db = new sqlite3.Database(path.join(__dirname, 'cinemash.db'), (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      process.exit(1);
    }
    console.log('Connected to the SQLite database.');
  });

  // Start a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Get the next available puzzle ID
    db.get('SELECT MAX(id) as maxId FROM puzzles', (err, row) => {
      if (err) {
        console.error('Error getting max puzzle ID:', err.message);
        rollbackAndExit(1);
        return;
      }

      const puzzleId = (row.maxId || 0) + 1;
      console.log(`Creating new puzzle with ID: ${puzzleId}`);

      // Insert into puzzles table
      db.run(
        `INSERT INTO puzzles (id, clue, tagline, synopsis, credits, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          puzzleId,
          "This mashup combines a prison transport plane with the most important aircraft in America.",
          "The President is now the prisoner.",
          "When a dangerous group of criminals takes over a prison transport plane, they discover the President of the United States is on board. Now, the President must work with an unlikely ally to regain control of Air Force One and save the day.",
          "Starring Nicolas Cage, Harrison Ford, and John Malkovich. Directed by Simon West and Wolfgang Petersen.",
          1 // is_active = true
        ],
        function(err) {
          if (err) {
            console.error('Error inserting puzzle:', err.message);
            rollbackAndExit(1);
            return;
          }

          console.log(`Inserted puzzle with ID: ${puzzleId}`);

          // Insert into solutions table
          db.run(
            `INSERT INTO solutions (puzzle_id, mashup_title) VALUES (?, ?)`,
            [puzzleId, "Con Air Force One"],
            function(err) {
              if (err) {
                console.error('Error inserting solution:', err.message);
                rollbackAndExit(1);
                return;
              }

              console.log(`Inserted solution for puzzle ID: ${puzzleId}`);

              // Insert movie 1: Con Air
              db.run(
                `INSERT INTO movies (puzzle_id, movie_number, title, year, imdb_url) VALUES (?, ?, ?, ?, ?)`,
                [puzzleId, 1, "Con Air", 1997, "https://www.imdb.com/title/tt0118880/"],
                function(err) {
                  if (err) {
                    console.error('Error inserting movie 1:', err.message);
                    rollbackAndExit(1);
                    return;
                  }

                  console.log(`Inserted movie 1 (Con Air) for puzzle ID: ${puzzleId}`);

                  // Insert movie 2: Air Force One
                  db.run(
                    `INSERT INTO movies (puzzle_id, movie_number, title, year, imdb_url) VALUES (?, ?, ?, ?, ?)`,
                    [puzzleId, 2, "Air Force One", 1997, "https://www.imdb.com/title/tt0118571/"],
                    function(err) {
                      if (err) {
                        console.error('Error inserting movie 2:', err.message);
                        rollbackAndExit(1);
                        return;
                      }

                      console.log(`Inserted movie 2 (Air Force One) for puzzle ID: ${puzzleId}`);
                      
                      // Commit the transaction
                      db.run('COMMIT', (err) => {
                        if (err) {
                          console.error('Error committing transaction:', err.message);
                          rollbackAndExit(1);
                          return;
                        }

                        console.log(`Successfully added "Con Air Force One" puzzle to the database!`);
                        closeAndExit(0);
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

  function rollbackAndExit(code) {
    db.run('ROLLBACK', () => {
      console.log('Transaction rolled back due to errors.');
      closeAndExit(code);
    });
  }

  function closeAndExit(code) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
      process.exit(code);
    });
  }
}

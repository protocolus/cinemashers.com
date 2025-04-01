/**
 * Add a new movie mashup puzzle to the Cinemashers database
 * 
 * Usage: 
 * node add_puzzle.js "Movie Title 1" "Movie Title 2" "Mashup Title" [Year1] [Year2] [Clue] [Tagline] [Synopsis] [Credits]
 * 
 * Required parameters:
 * - Movie Title 1: Title of the first movie
 * - Movie Title 2: Title of the second movie
 * - Mashup Title: Title of the mashup (if omitted, will be generated from the two movie titles)
 * 
 * Optional parameters (will use defaults if not provided):
 * - Year1: Release year of the first movie
 * - Year2: Release year of the second movie 
 * - Clue: The clue for the puzzle
 * - Tagline: A short tagline for the puzzle
 * - Synopsis: A longer description of the mashup
 * - Credits: Cast and crew information
 */

try {
  // Try to require sqlite3 - this may fail if it's not installed
  const sqlite3 = require('sqlite3');
  console.log('sqlite3 module found, continuing with database operations');
  
  // Process command-line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Error: Not enough arguments provided.');
    console.error('Usage: node add_puzzle.js "Movie Title 1" "Movie Title 2" "Mashup Title" [Year1] [Year2] [Clue] [Tagline] [Synopsis] [Credits]');
    process.exit(1);
  }
  
  const movie1Title = args[0];
  const movie2Title = args[1];
  // If mashup title is not provided, create one by combining the movie titles
  const mashupTitle = args[2] || `${movie1Title} ${movie2Title}`;
  const movie1Year = parseInt(args[3] || "0") || new Date().getFullYear(); // Use current year as default
  const movie2Year = parseInt(args[4] || "0") || new Date().getFullYear();
  
  // Default values for optional parameters
  const defaultClue = `This mashup combines elements from "${movie1Title}" and "${movie2Title}".`;
  const defaultTagline = `A clever combination of two classic films.`;
  const defaultSynopsis = `A creative mashup of "${movie1Title}" and "${movie2Title}" that blends the worlds of both films together.`;
  const defaultCredits = `A Cinemashers original mashup.`;
  
  const clue = args[5] || defaultClue;
  const tagline = args[6] || defaultTagline;
  const synopsis = args[7] || defaultSynopsis;
  const credits = args[8] || defaultCredits;
  
  // Generate IMDb search URLs (not direct links, but search results)
  const imdbSearchUrl1 = `https://www.imdb.com/find/?q=${encodeURIComponent(movie1Title)}`;
  const imdbSearchUrl2 = `https://www.imdb.com/find/?q=${encodeURIComponent(movie2Title)}`;
  
  console.log('Adding new puzzle with the following details:');
  console.log(`Movie 1: "${movie1Title}" (${movie1Year})`);
  console.log(`Movie 2: "${movie2Title}" (${movie2Year})`);
  console.log(`Mashup Title: "${mashupTitle}"`);
  
  // Proceed with adding the puzzle
  addPuzzleToDb(movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year, clue, tagline, synopsis, credits, imdbSearchUrl1, imdbSearchUrl2);
  
} catch (err) {
  console.error('sqlite3 module not found. Please install it first:');
  console.error('npm install sqlite3');
  console.error('\nError details:', err.message);
  process.exit(1);
}

function addPuzzleToDb(movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year, clue, tagline, synopsis, credits, imdbUrl1, imdbUrl2) {
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
          clue,
          tagline,
          synopsis,
          credits,
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
            [puzzleId, mashupTitle],
            function(err) {
              if (err) {
                console.error('Error inserting solution:', err.message);
                rollbackAndExit(1);
                return;
              }

              console.log(`Inserted solution for puzzle ID: ${puzzleId}`);

              // Insert movie 1
              db.run(
                `INSERT INTO movies (puzzle_id, movie_number, title, year, imdb_url) VALUES (?, ?, ?, ?, ?)`,
                [puzzleId, 1, movie1Title, movie1Year, imdbUrl1],
                function(err) {
                  if (err) {
                    console.error('Error inserting movie 1:', err.message);
                    rollbackAndExit(1);
                    return;
                  }

                  console.log(`Inserted movie 1 (${movie1Title}) for puzzle ID: ${puzzleId}`);

                  // Insert movie 2
                  db.run(
                    `INSERT INTO movies (puzzle_id, movie_number, title, year, imdb_url) VALUES (?, ?, ?, ?, ?)`,
                    [puzzleId, 2, movie2Title, movie2Year, imdbUrl2],
                    function(err) {
                      if (err) {
                        console.error('Error inserting movie 2:', err.message);
                        rollbackAndExit(1);
                        return;
                      }

                      console.log(`Inserted movie 2 (${movie2Title}) for puzzle ID: ${puzzleId}`);
                      
                      // Commit the transaction
                      db.run('COMMIT', (err) => {
                        if (err) {
                          console.error('Error committing transaction:', err.message);
                          rollbackAndExit(1);
                          return;
                        }

                        console.log(`Successfully added "${mashupTitle}" puzzle to the database!`);
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

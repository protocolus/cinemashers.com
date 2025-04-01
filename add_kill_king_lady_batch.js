/**
 * Add Kill, King, Lady, and Life themed mashups to the Cinemashers database
 * The fourth batch of the massive expansion
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Kill series
    ["Dressed to Kill", "Kill Bill: Vol. 1", "Dressed to Kill Bill: Vol. 1", 1980, 2003],
    ["Shoot to Kill", "Kill Bill: Vol. 1", "Shoot to Kill Bill: Vol. 1", 1988, 2003],
    ["Licence to Kill", "Kill Bill: Vol. 1", "Licence to Kill Bill: Vol. 1", 1989, 2003],
    
    // King series - The Fisher King
    ["The Fisher King", "King Kong", "The Fisher King Kong", 1991, 2005],
    ["The Fisher King", "King of New York", "The Fisher King of New York", 1991, 1990],
    ["The Fisher King", "King of California", "The Fisher King of California", 1991, 2007],
    ["The Fisher King", "King of Devil's Island", "The Fisher King of Devil's Island", 1991, 2010],
    ["The Fisher King", "King Arthur: Legend of the Sword", "The Fisher King Arthur: Legend of the Sword", 1991, 2017],
    ["The Fisher King", "King Richard", "The Fisher King Richard", 1991, 2021],
    
    // King series - The Lion King
    ["The Lion King", "King of New York", "The Lion King of New York", 1994, 1990],
    ["The Lion King", "King of the Doormen", "The Lion King of the Doormen", 1994, 2020],
    ["The Lion King", "King Kong", "The Lion King Kong", 1994, 2005],
    ["The Lion King", "King of California", "The Lion King of California", 1994, 2007],
    ["The Lion King", "King of Devil's Island", "The Lion King of Devil's Island", 1994, 2010],
    ["The Lion King", "King Arthur: Legend of the Sword", "The Lion King Arthur: Legend of the Sword", 1994, 2017],
    ["The Lion King", "King Richard", "The Lion King Richard", 1994, 2021],
    
    // Lady series - My Fair Lady
    ["My Fair Lady", "Lady Chatterley's Lover", "My Fair Lady Chatterley's Lover", 1964, 1981],
    ["My Fair Lady", "Lady Macbeth", "My Fair Lady Macbeth", 1964, 2016],
    ["My Fair Lady", "Lady Bird", "My Fair Lady Bird", 1964, 2017],
    
    // Lady series - Quiz Lady
    ["Quiz Lady", "Lady and the Tramp", "Quiz Lady and the Tramp", 2023, 1955],
    ["Quiz Lady", "Lady Chatterley's Lover", "Quiz Lady Chatterley's Lover", 2023, 1981],
    ["Quiz Lady", "Lady Macbeth", "Quiz Lady Macbeth", 2023, 2016],
    ["Quiz Lady", "Lady Bird", "Quiz Lady Bird", 2023, 2017],
    
    // Life series - It's a Wonderful Life
    ["It's a Wonderful Life", "Life Is Beautiful", "It's a Wonderful Life Is Beautiful", 1946, 1997],
    ["It's a Wonderful Life", "Life as a House", "It's a Wonderful Life as a House", 1946, 2001]
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

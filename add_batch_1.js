/**
 * Batch add more movie mashup puzzles to the Cinemashers database - Batch 1
 * Focused on Coming, Crazy, Dark, Dawn, Days series
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Coming series
    ["The Russians Are Coming the Russians Are Coming", "Coming to America", "The Russians Are Coming the Russians Are Coming to America", 1966, 1988],
    
    // Crazy series  
    ["The Gods Must Be Crazy", "Crazy Heart", "The Gods Must Be Crazy Heart", 1980, 2009],
    ["The Gods Must Be Crazy", "Crazy, Stupid, Love.", "The Gods Must Be Crazy, Stupid, Love.", 1980, 2011],
    ["Stir Crazy", "Crazy, Stupid, Love.", "Stir Crazy, Stupid, Love.", 1980, 2011],
    ["Stir Crazy", "Crazy Rich Asians", "Stir Crazy Rich Asians", 1980, 2018],
    
    // D series
    ["Vampire Hunter D", "D.O.A.", "Vampire Hunter D.O.A.", 1985, 1950],
    
    // Dark series
    ["A Shot in the Dark", "Dark City", "A Shot in the Dark City", 1964, 1998],
    ["Elvira: Mistress of the Dark", "Dark City", "Elvira: Mistress of the Dark City", 1988, 1998],
    
    // Dawn series
    ["From Dusk Till Dawn", "Dawn of the Dead", "From Dusk Till Dawn of the Dead", 1996, 1978],
    ["From Dusk Till Dawn", "Dawn of the Planet of the Apes", "From Dusk Till Dawn of the Planet of the Apes", 1996, 2014],
    
    // Days series
    ["Around the World in 80 Days", "Days of Wine and Roses", "Around the World in 80 Days of Wine and Roses", 2004, 1962],
    ["Strange Days", "Days of Wine and Roses", "Strange Days of Wine and Roses", 1995, 1962],
    ["Thirteen Days", "Days of Wine and Roses", "Thirteen Days of Wine and Roses", 2000, 1962],
    ["How to Lose a Guy in 10 Days", "Days of Wine and Roses", "How to Lose a Guy in 10 Days of Wine and Roses", 2003, 1962],
    
    // Death series
    ["Murder by Death", "Death Wish", "Murder by Death Wish", 1976, 1974],
    ["Murder by Death", "Death on the Nile", "Murder by Death on the Nile", 1976, 1978],
    ["Murder by Death", "Death Becomes Her", "Murder by Death Becomes Her", 1976, 1992],
    ["Murder by Death", "Death and the Maiden", "Murder by Death and the Maiden", 1976, 1994],
    ["Murder by Death", "Death Note", "Murder by Death Note", 1976, 2017],
    ["Murder by Death", "Death at a Funeral", "Murder by Death at a Funeral", 1976, 2007],
    ["Murder by Death", "Death Sentence", "Murder by Death Sentence", 1976, 2007],
    ["Murder by Death", "Death Note: The Last Name", "Murder by Death Note: The Last Name", 1976, 2006],
    ["Murder by Death", "Death Proof", "Murder by Death Proof", 1976, 2007],
    
    // Die series
    ["Live and Let Die", "Die Hard", "Live and Let Die Hard", 1973, 1988],
    ["Live and Let Die", "Die Hard 2", "Live and Let Die Hard 2", 1973, 1990],
    ["Live and Let Die", "Die Hard with a Vengeance", "Live and Let Die Hard with a Vengeance", 1973, 1995],
    ["No Time to Die", "Die Hard", "No Time to Die Hard", 2021, 1988],
    ["No Time to Die", "Die Hard 2", "No Time to Die Hard 2", 2021, 1990],
    ["No Time to Die", "Die Hard with a Vengeance", "No Time to Die Hard with a Vengeance", 2021, 1995]
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

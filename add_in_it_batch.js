/**
 * Add In and It themed mashups to the Cinemashers database
 * The third batch of the massive expansion
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // In series with Let the Right One In
    ["Let the Right One In", "In Harm's Way", "Let the Right One In Harm's Way", 2008, 1965],
    ["Let the Right One In", "In Cold Blood", "Let the Right One In Cold Blood", 2008, 1967],
    ["Let the Right One In", "In the Heat of the Night", "Let the Right One In the Heat of the Night", 2008, 1967],
    ["Let the Right One In", "In Good Company", "Let the Right One In Good Company", 2008, 2004],
    ["Let the Right One In", "In Bruges", "Let the Right One In Bruges", 2008, 2008],
    ["Let the Right One In", "In the Loop", "Let the Right One In the Loop", 2008, 2009],
    
    // It series with She's Gotta Have It
    ["She's Gotta Have It", "It Happened One Night", "She's Gotta Have It Happened One Night", 1986, 1934],
    ["She's Gotta Have It", "It Came from Outer Space", "She's Gotta Have It Came from Outer Space", 1986, 1953],
    ["She's Gotta Have It", "It Might Get Loud", "She's Gotta Have It Might Get Loud", 1986, 2008],
    ["She's Gotta Have It", "It Follows", "She's Gotta Have It Follows", 1986, 2014],
    ["She's Gotta Have It", "It Chapter Two", "She's Gotta Have It Chapter Two", 1986, 2019],
    
    // It series with A River Runs Through It
    ["A River Runs Through It", "It Happened One Night", "A River Runs Through It Happened One Night", 1992, 1934],
    ["A River Runs Through It", "It Came from Outer Space", "A River Runs Through It Came from Outer Space", 1992, 1953],
    ["A River Runs Through It", "It Might Get Loud", "A River Runs Through It Might Get Loud", 1992, 2008],
    ["A River Runs Through It", "It Follows", "A River Runs Through It Follows", 1992, 2014],
    ["A River Runs Through It", "It Chapter Two", "A River Runs Through It Chapter Two", 1992, 2019],
    
    // It series with What's Love Got to Do with It
    ["What's Love Got to Do with It", "It Happened One Night", "What's Love Got to Do with It Happened One Night", 1993, 1934],
    ["What's Love Got to Do with It", "It Came from Outer Space", "What's Love Got to Do with It Came from Outer Space", 1993, 1953],
    ["What's Love Got to Do with It", "It Might Get Loud", "What's Love Got to Do with It Might Get Loud", 1993, 2008],
    ["What's Love Got to Do with It", "It Follows", "What's Love Got to Do with It Follows", 1993, 2014],
    ["What's Love Got to Do with It", "It Chapter Two", "What's Love Got to Do with It Chapter Two", 1993, 2019],
    
    // It series with Whip It
    ["Whip It", "It Happened One Night", "Whip It Happened One Night", 2009, 1934],
    ["Whip It", "It Came from Outer Space", "Whip It Came from Outer Space", 2009, 1953],
    ["Whip It", "It Might Get Loud", "Whip It Might Get Loud", 2009, 2008],
    ["Whip It", "It Follows", "Whip It Follows", 2009, 2014],
    ["Whip It", "It Chapter Two", "Whip It Chapter Two", 2009, 2019],
    
    // Various other J series
    ["Jesse James", "James and the Giant Peach", "Jesse James and the Giant Peach", 1939, 1996],
    ["What Ever Happened to Baby Jane?", "Jane Eyre", "What Ever Happened to Baby Jane Eyre?", 1962, 1943],
    ["Frankie and Johnny", "Johnny Dangerously", "Frankie and Johnny Dangerously", 1991, 1984],
    ["Homeward Bound: The Incredible Journey", "Journey to the Center of the Earth", "Homeward Bound: The Incredible Journey to the Center of the Earth", 1993, 2008],
    ["Swing Kids", "Kids in the Hall: Brain Candy", "Swing Kids in the Hall: Brain Candy", 1993, 1996]
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

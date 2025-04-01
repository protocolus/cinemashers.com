/**
 * Add final miscellaneous movie mashup puzzles to the Cinemashers database
 * Includes various themed combos to complete the massive expansion
 */

try {
  const sqlite3 = require('sqlite3');
  const path = require('path');
  console.log('sqlite3 module found, continuing with database operations');
  
  // List of puzzles to add in format: [movie1Title, movie2Title, mashupTitle, movie1Year, movie2Year]
  const puzzlesToAdd = [
    // Killers series
    ["The Fearless Vampire Killers", "Killers of the Flower Moon", "The Fearless Vampire Killers of the Flower Moon", 1967, 2023],
    ["Natural Born Killers", "Killers of the Flower Moon", "Natural Born Killers of the Flower Moon", 1994, 2023],
    
    // Top series
    ["Room at the Top", "Top Secret!", "Room at the Top Secret!", 1959, 1984],
    ["Room at the Top", "Top Gun", "Room at the Top Gun", 1959, 1986],
    ["Room at the Top", "Top Gun: Maverick", "Room at the Top Gun: Maverick", 1959, 2022],
    
    // Treasure series
    ["National Treasure", "Treasure Island", "National Treasure Island", 2004, 1950],
    ["National Treasure", "Treasure Planet", "National Treasure Planet", 2004, 2002],
    
    // Guys series
    ["Just One of the Guys", "Guys and Dolls", "Just One of the Guys and Dolls", 1985, 1955],
    ["The Other Guys", "Guys and Dolls", "The Other Guys and Dolls", 2010, 1955],
    ["The Nice Guys", "Guys and Dolls", "The Nice Guys and Dolls", 2016, 1955],
    ["The Bad Guys", "Guys and Dolls", "The Bad Guys and Dolls", 2022, 1955],
    
    // Easy series
    ["The Big Easy", "Easy Rider", "The Big Easy Rider", 1986, 1969],
    ["The Big Easy", "Easy A", "The Big Easy A", 1986, 2010],
    
    // Stand series
    ["X-Men: The Last Stand", "Stand by Me", "X-Men: The Last Stand by Me", 2006, 1986],
    ["X-Men: The Last Stand", "Stand and Deliver", "X-Men: The Last Stand and Deliver", 2006, 1988],
    
    // Steel series
    ["Man of Steel", "Steel Magnolias", "Man of Steel Magnolias", 2013, 1989],
    
    // Solo series
    ["Free Solo", "Solo: A Star Wars Story", "Free Solo: A Star Wars Story", 2018, 2018],
    
    // Perfect series
    ["Pitch Perfect", "Perfect Blue", "Pitch Perfect Blue", 2012, 1997],
    
    // Cowboy series
    ["Midnight Cowboy", "Cowboy Bebop: The Movie", "Midnight Cowboy Bebop: The Movie", 1969, 2001],
    ["Urban Cowboy", "Cowboy Bebop: The Movie", "Urban Cowboy Bebop: The Movie", 1980, 2001],
    ["Drugstore Cowboy", "Cowboy Bebop: The Movie", "Drugstore Cowboy Bebop: The Movie", 1989, 2001],
    
    // Crossing series
    ["Miller's Crossing", "Crossing Delancey", "Miller's Crossing Delancey", 1990, 1988],
    
    // Walking series
    ["Dead Man Walking", "Walking Tall", "Dead Man Walking Tall", 1995, 2004],
    
    // Can series
    ["Catch Me If You Can", "Can't Buy Me Love", "Catch Me If You Can't Buy Me Love", 2002, 1987],
    ["Catch Me If You Can", "Can't Hardly Wait", "Catch Me If You Can't Hardly Wait", 2002, 1998],
    
    // Much series
    ["The Man Who Knew Too Much", "Much Ado About Nothing", "The Man Who Knew Too Much Ado About Nothing", 1956, 1993],
    
    // Wrath series
    ["The Grapes of Wrath", "Wrath of Man", "The Grapes of Wrath of Man", 1940, 2021],
    
    // Wait series
    ["Heaven Can Wait", "Wait Until Dark", "Heaven Can Wait Until Dark", 1978, 1967],
    ["Can't Hardly Wait", "Wait Until Dark", "Can't Hardly Wait Until Dark", 1998, 1967],
    
    // Miracles series
    ["Pocketful of Miracles", "Miracles from Heaven", "Pocketful of Miracles from Heaven", 1961, 2016],
    
    // Million series
    ["How to Steal a Million", "Million Dollar Baby", "How to Steal a Million Dollar Baby", 1966, 2004],
    
    // Ball series
    ["Monster's Ball", "Ball of Fire", "Monster's Ball of Fire", 2001, 1941],
    
    // Quest series
    ["Vision Quest", "Quest for Fire", "Vision Quest for Fire", 1985, 1981],
    ["Galaxy Quest", "Quest for Fire", "Galaxy Quest for Fire", 1999, 1981],
    
    // Buck series
    ["Uncle Buck", "Buck Rogers in the 25th Century", "Uncle Buck Rogers in the 25th Century", 1989, 1979],
    
    // Monkey series
    ["Iron Monkey", "Monkey Business", "Iron Monkey Business", 1993, 1952],
    ["Iron Monkey", "Monkey Man", "Iron Monkey Man", 1993, 2024],
    
    // Sleeping series
    ["While You Were Sleeping", "Sleeping Beauty", "While You Were Sleeping Beauty", 1995, 1959],
    
    // Pitch series
    ["Fever Pitch", "Pitch Black", "Fever Pitch Black", 2005, 2000],
    ["Fever Pitch", "Pitch Perfect", "Fever Pitch Perfect", 2005, 2012],
    
    // Splendor series
    ["American Splendor", "Splendor in the Grass", "American Splendor in the Grass", 2003, 1961],
    
    // Twelve series
    ["Ocean's Twelve", "Twelve Chairs", "Ocean's Twelve Chairs", 2004, 1970],
    
    // Galaxy series
    ["The Hitchhiker's Guide to the Galaxy", "Galaxy Quest", "The Hitchhiker's Guide to the Galaxy Quest", 2005, 1999],
    
    // Foul series
    ["Murder Most Foul", "Foul Play", "Murder Most Foul Play", 1964, 1978],
    
    // Clear series
    ["A Midnight Clear", "Clear and Present Danger", "A Midnight Clear and Present Danger", 1992, 1994],
    
    // Broadway series
    ["Bullets Over Broadway", "Broadway Danny Rose", "Bullets Over Broadway Danny Rose", 1994, 1984],
    
    // Ripley series
    ["The Talented Mr. Ripley", "Ripley's Game", "The Talented Mr. Ripley's Game", 1999, 2002],
    
    // Sixteen series
    ["Sweet Sixteen", "Sixteen Candles", "Sweet Sixteen Candles", 2002, 1984],
    
    // Mars series
    ["Veronica Mars", "Mars Express", "Veronica Mars Express", 2014, 2023],
    
    // Young series
    ["Mighty Joe Young", "Young Guns", "Mighty Joe Young Guns", 1998, 1988],
    ["Mighty Joe Young", "Young Guns II", "Mighty Joe Young Guns II", 1998, 1990]
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

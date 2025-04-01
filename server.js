const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3001;

// Mobile detection middleware
const detectMobile = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  req.isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
  next();
};

// Apply mobile detection to all requests
app.use(detectMobile);

// Add JSON parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add multer middleware for file uploads
const multer = require('multer');
const fs = require('fs');
const { optimizeImageForMobile } = require('./auto_optimize_posters'); // Import optimization function

// Configure storage for poster uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'cineposters'));
  },
  filename: (req, file, cb) => {
    // Use the original filename provided from the client
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve admin static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve poster images - choose optimized version for mobile devices
app.use('/posters', (req, res, next) => {
  const requestedFile = req.path;
  
  // If it's a mobile device and not requesting a file from the mobile directory
  if (req.isMobile && !requestedFile.startsWith('/mobile/')) {
    // Check if optimized version exists
    const optimizedPath = path.join(__dirname, 'cineposters', 'mobile', path.basename(requestedFile).replace(/\.(png|jpe?g)$/i, '.jpg'));
    const originalPath = path.join(__dirname, 'cineposters', path.basename(requestedFile));
    
    if (fs.existsSync(optimizedPath)) {
      // Serve the optimized version
      res.sendFile(optimizedPath);
    } else {
      // If optimized version doesn't exist, fall back to original
      next();
    }
  } else {
    // For desktop or explicit request to mobile version, continue to next middleware
    next();
  }
}, express.static(path.join(__dirname, 'cineposters')));

// Specific puzzle view route
app.get('/puzzle/:id', (req, res) => {
  const puzzleId = req.params.id;
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to the SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'cinemash.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// API endpoints
app.get('/api/game-info', (req, res) => {
  db.get('SELECT name, description, rules FROM game_info WHERE id = 1', (err, row) => {
    if (err) {
      console.error('Error getting game info:', err.message);
      return res.status(500).json({ error: 'Failed to get game info' });
    }
    
    // Parse the rules JSON string back to an array
    let gameRules = [];
    try {
      gameRules = JSON.parse(row.rules);
    } catch (error) {
      console.error('Error parsing rules JSON:', error);
    }
    
    res.json({
      gameName: row.name,
      gameDescription: row.description,
      gameRules: gameRules
    });
  });
});

app.get('/api/puzzle/random', (req, res) => {
  db.get(`
    SELECT 
      puzzles.id, puzzles.clue, puzzles.tagline, puzzles.synopsis, puzzles.credits, 
      solutions.mashup_title 
    FROM puzzles 
    JOIN solutions ON puzzles.id = solutions.puzzle_id 
    WHERE puzzles.is_active = 1
    ORDER BY RANDOM() 
    LIMIT 1
  `, (err, puzzle) => {
    if (err) {
      console.error('Error getting random puzzle:', err.message);
      return res.status(500).json({ error: 'Failed to get a random puzzle' });
    }

    if (!puzzle) {
      return res.status(404).json({ error: 'No puzzles found' });
    }

    // Get the movies for this puzzle
    db.all(`
      SELECT movie_number, title, year, imdb_url 
      FROM movies 
      WHERE puzzle_id = ? 
      ORDER BY movie_number
    `, [puzzle.id], (err, movies) => {
      if (err) {
        console.error('Error getting puzzle movies:', err.message);
        return res.status(500).json({ error: 'Failed to get puzzle movies' });
      }

      // Get the poster for this puzzle
      db.get(`
        SELECT filename
        FROM posters
        WHERE puzzle_id = ?
        LIMIT 1
      `, [puzzle.id], (err, poster) => {
        if (err) {
          console.error('Error getting puzzle poster:', err.message);
          // Continue without poster if there's an error
        }

        // Construct the solution object in the same format as the original JSON
        const solution = {
          mashupTitle: puzzle.mashup_title
        };

        // Add movies to the solution object
        movies.forEach(movie => {
          solution[`movie${movie.movie_number}`] = {
            title: movie.title,
            year: movie.year,
            imdbUrl: movie.imdb_url
          };
        });

        // Construct the complete puzzle object
        const puzzleData = {
          id: puzzle.id,
          clue: puzzle.clue,
          tagline: puzzle.tagline,
          synopsis: puzzle.synopsis,
          credits: puzzle.credits,
          solution: solution,
          poster: poster ? `/posters/${poster.filename}` : null
        };

        res.json(puzzleData);
      });
    });
  });
});

app.get('/api/puzzle/:id', (req, res) => {
  const puzzleId = req.params.id;
  
  db.get(`
    SELECT 
      puzzles.id, puzzles.clue, puzzles.tagline, puzzles.synopsis, puzzles.credits, 
      solutions.mashup_title 
    FROM puzzles 
    JOIN solutions ON puzzles.id = solutions.puzzle_id 
    WHERE puzzles.id = ?
  `, [puzzleId], (err, puzzle) => {
    if (err) {
      console.error('Error getting puzzle:', err.message);
      return res.status(500).json({ error: 'Failed to get the puzzle' });
    }

    if (!puzzle) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }

    // Get the movies for this puzzle
    db.all(`
      SELECT movie_number, title, year, imdb_url 
      FROM movies 
      WHERE puzzle_id = ? 
      ORDER BY movie_number
    `, [puzzle.id], (err, movies) => {
      if (err) {
        console.error('Error getting puzzle movies:', err.message);
        return res.status(500).json({ error: 'Failed to get puzzle movies' });
      }

      // Get the poster for this puzzle
      db.get(`
        SELECT filename
        FROM posters
        WHERE puzzle_id = ?
        LIMIT 1
      `, [puzzle.id], (err, poster) => {
        if (err) {
          console.error('Error getting puzzle poster:', err.message);
          // Continue without poster if there's an error
        }

        // Construct the solution object in the same format as the original JSON
        const solution = {
          mashupTitle: puzzle.mashup_title
        };

        // Add movies to the solution object
        movies.forEach(movie => {
          solution[`movie${movie.movie_number}`] = {
            title: movie.title,
            year: movie.year,
            imdbUrl: movie.imdb_url
          };
        });

        // Construct the complete puzzle object
        const puzzleData = {
          id: puzzle.id,
          clue: puzzle.clue,
          tagline: puzzle.tagline,
          synopsis: puzzle.synopsis,
          credits: puzzle.credits,
          solution: solution,
          poster: poster ? `/posters/${poster.filename}` : null
        };

        res.json(puzzleData);
      });
    });
  });
});

// Get the next active puzzle in sequence
app.get('/api/puzzle/:id/next-active', (req, res) => {
  const currentId = req.params.id;
  
  db.get(`
    SELECT 
      puzzles.id, puzzles.clue, puzzles.tagline, puzzles.synopsis, puzzles.credits, 
      solutions.mashup_title 
    FROM puzzles 
    JOIN solutions ON puzzles.id = solutions.puzzle_id 
    WHERE puzzles.is_active = 1 AND puzzles.id > ?
    ORDER BY puzzles.id ASC
    LIMIT 1
  `, [currentId], (err, puzzle) => {
    if (err) {
      console.error('Error getting next active puzzle:', err.message);
      return res.status(500).json({ error: 'Failed to get next active puzzle' });
    }

    if (!puzzle) {
      return res.status(404).json({ error: 'No next active puzzle found' });
    }

    // Get the movies for this puzzle
    db.all(`
      SELECT movie_number, title, year, imdb_url 
      FROM movies 
      WHERE puzzle_id = ? 
      ORDER BY movie_number
    `, [puzzle.id], (err, movies) => {
      if (err) {
        console.error('Error getting puzzle movies:', err.message);
        return res.status(500).json({ error: 'Failed to get puzzle movies' });
      }

      // Get the poster for this puzzle
      db.get(`
        SELECT filename
        FROM posters
        WHERE puzzle_id = ?
        LIMIT 1
      `, [puzzle.id], (err, poster) => {
        if (err) {
          console.error('Error getting puzzle poster:', err.message);
          // Continue without poster if there's an error
        }

        // Construct the solution object
        const solution = {
          mashupTitle: puzzle.mashup_title
        };

        // Construct the response with all puzzle data
        const puzzleData = {
          id: puzzle.id,
          clue: puzzle.clue,
          tagline: puzzle.tagline || "",
          synopsis: puzzle.synopsis || "",
          credits: puzzle.credits || "",
          posterUrl: poster ? `/posters/${poster.filename}` : null,
          solution: solution,
          movies: movies.map(movie => ({
            number: movie.movie_number,
            title: movie.title,
            year: movie.year,
            imdbUrl: movie.imdb_url
          }))
        };

        res.json(puzzleData);
      });
    });
  });
});

// Get the previous active puzzle in sequence
app.get('/api/puzzle/:id/prev-active', (req, res) => {
  const currentId = req.params.id;
  
  db.get(`
    SELECT 
      puzzles.id, puzzles.clue, puzzles.tagline, puzzles.synopsis, puzzles.credits, 
      solutions.mashup_title 
    FROM puzzles 
    JOIN solutions ON puzzles.id = solutions.puzzle_id 
    WHERE puzzles.is_active = 1 AND puzzles.id < ?
    ORDER BY puzzles.id DESC
    LIMIT 1
  `, [currentId], (err, puzzle) => {
    if (err) {
      console.error('Error getting previous active puzzle:', err.message);
      return res.status(500).json({ error: 'Failed to get previous active puzzle' });
    }

    if (!puzzle) {
      return res.status(404).json({ error: 'No previous active puzzle found' });
    }

    // Get the movies for this puzzle
    db.all(`
      SELECT movie_number, title, year, imdb_url 
      FROM movies 
      WHERE puzzle_id = ? 
      ORDER BY movie_number
    `, [puzzle.id], (err, movies) => {
      if (err) {
        console.error('Error getting puzzle movies:', err.message);
        return res.status(500).json({ error: 'Failed to get puzzle movies' });
      }

      // Get the poster for this puzzle
      db.get(`
        SELECT filename
        FROM posters
        WHERE puzzle_id = ?
        LIMIT 1
      `, [puzzle.id], (err, poster) => {
        if (err) {
          console.error('Error getting puzzle poster:', err.message);
          // Continue without poster if there's an error
        }

        // Construct the solution object
        const solution = {
          mashupTitle: puzzle.mashup_title
        };

        // Construct the response with all puzzle data
        const puzzleData = {
          id: puzzle.id,
          clue: puzzle.clue,
          tagline: puzzle.tagline || "",
          synopsis: puzzle.synopsis || "",
          credits: puzzle.credits || "",
          posterUrl: poster ? `/posters/${poster.filename}` : null,
          solution: solution,
          movies: movies.map(movie => ({
            number: movie.movie_number,
            title: movie.title,
            year: movie.year,
            imdbUrl: movie.imdb_url
          }))
        };

        res.json(puzzleData);
      });
    });
  });
});

// Get the first active puzzle by ID
app.get('/api/puzzle/first-active', (req, res) => {
  db.get(`
    SELECT 
      puzzles.id, puzzles.clue, puzzles.tagline, puzzles.synopsis, puzzles.credits, 
      solutions.mashup_title 
    FROM puzzles 
    JOIN solutions ON puzzles.id = solutions.puzzle_id 
    WHERE puzzles.is_active = 1
    ORDER BY puzzles.id ASC
    LIMIT 1
  `, (err, puzzle) => {
    if (err) {
      console.error('Error getting first active puzzle:', err.message);
      return res.status(500).json({ error: 'Failed to get first active puzzle' });
    }

    if (!puzzle) {
      return res.status(404).json({ error: 'No active puzzles found' });
    }

    // Get the movies for this puzzle
    db.all(`
      SELECT movie_number, title, year, imdb_url 
      FROM movies 
      WHERE puzzle_id = ? 
      ORDER BY movie_number
    `, [puzzle.id], (err, movies) => {
      if (err) {
        console.error('Error getting puzzle movies:', err.message);
        return res.status(500).json({ error: 'Failed to get puzzle movies' });
      }

      // Get the poster for this puzzle
      db.get(`
        SELECT filename
        FROM posters
        WHERE puzzle_id = ?
        LIMIT 1
      `, [puzzle.id], (err, poster) => {
        if (err) {
          console.error('Error getting puzzle poster:', err.message);
          // Continue without poster if there's an error
        }

        // Construct the solution object
        const solution = {
          mashupTitle: puzzle.mashup_title
        };

        // Construct the response with all puzzle data
        const puzzleData = {
          id: puzzle.id,
          clue: puzzle.clue,
          tagline: puzzle.tagline || "",
          synopsis: puzzle.synopsis || "",
          credits: puzzle.credits || "",
          posterUrl: poster ? `/posters/${poster.filename}` : null,
          solution: solution,
          movies: movies.map(movie => ({
            number: movie.movie_number,
            title: movie.title,
            year: movie.year,
            imdbUrl: movie.imdb_url
          }))
        };

        res.json(puzzleData);
      });
    });
  });
});

// Get the last active puzzle by ID
app.get('/api/puzzle/last-active', (req, res) => {
  db.get(`
    SELECT 
      puzzles.id, puzzles.clue, puzzles.tagline, puzzles.synopsis, puzzles.credits, 
      solutions.mashup_title 
    FROM puzzles 
    JOIN solutions ON puzzles.id = solutions.puzzle_id 
    WHERE puzzles.is_active = 1
    ORDER BY puzzles.id DESC
    LIMIT 1
  `, (err, puzzle) => {
    if (err) {
      console.error('Error getting last active puzzle:', err.message);
      return res.status(500).json({ error: 'Failed to get last active puzzle' });
    }

    if (!puzzle) {
      return res.status(404).json({ error: 'No active puzzles found' });
    }

    // Get the movies for this puzzle
    db.all(`
      SELECT movie_number, title, year, imdb_url 
      FROM movies 
      WHERE puzzle_id = ? 
      ORDER BY movie_number
    `, [puzzle.id], (err, movies) => {
      if (err) {
        console.error('Error getting puzzle movies:', err.message);
        return res.status(500).json({ error: 'Failed to get puzzle movies' });
      }

      // Get the poster for this puzzle
      db.get(`
        SELECT filename
        FROM posters
        WHERE puzzle_id = ?
        LIMIT 1
      `, [puzzle.id], (err, poster) => {
        if (err) {
          console.error('Error getting puzzle poster:', err.message);
          // Continue without poster if there's an error
        }

        // Construct the solution object
        const solution = {
          mashupTitle: puzzle.mashup_title
        };

        // Construct the response with all puzzle data
        const puzzleData = {
          id: puzzle.id,
          clue: puzzle.clue,
          tagline: puzzle.tagline || "",
          synopsis: puzzle.synopsis || "",
          credits: puzzle.credits || "",
          posterUrl: poster ? `/posters/${poster.filename}` : null,
          solution: solution,
          movies: movies.map(movie => ({
            number: movie.movie_number,
            title: movie.title,
            year: movie.year,
            imdbUrl: movie.imdb_url
          }))
        };

        res.json(puzzleData);
      });
    });
  });
});

// Admin API endpoints
app.get('/api/admin/puzzles', (req, res) => {
  db.all(`
    SELECT 
      p.id, p.clue, p.tagline, p.synopsis, p.credits, p.is_active,
      s.mashup_title,
      CASE WHEN pos.id IS NULL THEN 0 ELSE 1 END as has_poster
    FROM puzzles p
    JOIN solutions s ON p.id = s.puzzle_id
    LEFT JOIN (
      SELECT DISTINCT puzzle_id, id 
      FROM posters
    ) pos ON p.id = pos.puzzle_id
    ORDER BY p.id
  `, (err, puzzles) => {
    if (err) {
      console.error('Error getting all puzzles:', err.message);
      return res.status(500).json({ error: 'Failed to get puzzles' });
    }
    
    res.json(puzzles);
  });
});

app.get('/api/admin/puzzle/:id', (req, res) => {
  const puzzleId = req.params.id;
  
  db.get(`
    SELECT 
      p.id, p.clue, p.tagline, p.synopsis, p.credits, 
      s.mashup_title, s.puzzle_id
    FROM puzzles p
    JOIN solutions s ON p.id = s.puzzle_id
    WHERE p.id = ?
  `, [puzzleId], (err, puzzle) => {
    if (err) {
      console.error('Error getting puzzle details:', err.message);
      return res.status(500).json({ error: 'Failed to get puzzle details' });
    }
    
    if (!puzzle) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }
    
    // Get movies associated with this puzzle
    db.all(`
      SELECT id, puzzle_id, movie_number, title, year, imdb_url
      FROM movies
      WHERE puzzle_id = ?
      ORDER BY movie_number
    `, [puzzleId], (err, movies) => {
      if (err) {
        console.error('Error getting puzzle movies:', err.message);
        return res.status(500).json({ error: 'Failed to get puzzle movies' });
      }
      
      // Get posters associated with this puzzle
      db.all(`
        SELECT id, puzzle_id, filename, movie_title
        FROM posters
        WHERE puzzle_id = ?
      `, [puzzleId], (err, posters) => {
        if (err) {
          console.error('Error getting puzzle posters:', err.message);
          return res.status(500).json({ error: 'Failed to get puzzle posters' });
        }
        
        const puzzleDetails = {
          ...puzzle,
          movies,
          posters
        };
        
        res.json(puzzleDetails);
      });
    });
  });
});

// Update puzzle
app.put('/api/admin/puzzle/:id', (req, res) => {
  const puzzleId = req.params.id;
  const { clue, tagline, synopsis, credits, mashup_title, is_active, movies } = req.body;
  
  // Start a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Update puzzles table
    db.run(`
      UPDATE puzzles
      SET clue = ?, tagline = ?, synopsis = ?, credits = ?, is_active = ?
      WHERE id = ?
    `, [clue, tagline, synopsis, credits, is_active, puzzleId], function(err) {
      if (err) {
        console.error('Error updating puzzle:', err.message);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to update puzzle' });
      }
      
      // Update solutions table
      db.run(`
        UPDATE solutions
        SET mashup_title = ?
        WHERE puzzle_id = ?
      `, [mashup_title, puzzleId], function(err) {
        if (err) {
          console.error('Error updating solution:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to update solution' });
        }
        
        // Update movies
        if (movies && Array.isArray(movies)) {
          let movieUpdates = 0;
          
          movies.forEach((movie) => {
            db.run(`
              UPDATE movies
              SET title = ?, year = ?, imdb_url = ?
              WHERE puzzle_id = ? AND movie_number = ?
            `, [movie.title, movie.year, movie.imdb_url, puzzleId, movie.movie_number], function(err) {
              if (err) {
                console.error('Error updating movie:', err.message);
                // Continue with other updates even if one fails
              }
              
              movieUpdates++;
              
              // If all updates are done, commit the transaction
              if (movieUpdates === movies.length) {
                db.run('COMMIT', function(err) {
                  if (err) {
                    console.error('Error committing transaction:', err.message);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to commit changes' });
                  }
                  
                  res.json({ success: true, message: 'Puzzle updated successfully' });
                });
              }
            });
          });
        } else {
          // If no movies to update, commit the transaction
          db.run('COMMIT', function(err) {
            if (err) {
              console.error('Error committing transaction:', err.message);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to commit changes' });
            }
            
            res.json({ success: true, message: 'Puzzle updated successfully' });
          });
        }
      });
    });
  });
});

// Get all posters for admin
app.get('/api/admin/posters', (req, res) => {
  db.all(`
    SELECT id, puzzle_id, filename, movie_title, original_filename
    FROM posters
    ORDER BY puzzle_id, id
  `, (err, posters) => {
    if (err) {
      console.error('Error getting all posters:', err.message);
      return res.status(500).json({ error: 'Failed to get posters' });
    }
    
    res.json(posters);
  });
});

// Update poster's puzzle association
app.put('/api/admin/poster/:id', (req, res) => {
  const posterId = req.params.id;
  const { puzzle_id } = req.body;
  
  db.run(`
    UPDATE posters
    SET puzzle_id = ?
    WHERE id = ?
  `, [puzzle_id, posterId], function(err) {
    if (err) {
      console.error('Error updating poster:', err.message);
      return res.status(500).json({ error: 'Failed to update poster' });
    }
    
    res.json({ success: true, message: 'Poster updated successfully' });
  });
});

// Handle poster uploads from admin
app.post('/api/admin/upload-poster', upload.single('poster'), (req, res) => {
  const { puzzleId, mashupTitle } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  
  if (!puzzleId) {
    return res.status(400).json({ success: false, error: 'No puzzle ID provided' });
  }
  
  const fileName = req.file.filename;
  const filePath = req.file.path;
  
  // Start a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Insert the poster record
    db.run(`
      INSERT INTO posters (puzzle_id, filename, movie_title, original_filename)
      VALUES (?, ?, ?, ?)
    `, [puzzleId, fileName, mashupTitle, fileName], function(err) {
      if (err) {
        console.error('Error inserting poster record:', err.message);
        db.run('ROLLBACK');
        // Delete the uploaded file if database insertion fails
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
        });
        return res.status(500).json({ success: false, error: 'Failed to create poster record' });
      }
      
      // Set the puzzle to active since it now has a poster
      db.run(`
        UPDATE puzzles
        SET is_active = 1
        WHERE id = ?
      `, [puzzleId], function(err) {
        if (err) {
          console.error('Error updating puzzle status:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ success: false, error: 'Failed to update puzzle status' });
        }
        
        // Commit the transaction
        db.run('COMMIT', function(err) {
          if (err) {
            console.error('Error committing transaction:', err.message);
            db.run('ROLLBACK');
            return res.status(500).json({ success: false, error: 'Failed to commit changes' });
          }
          
          // After successful database update, optimize the image for mobile
          optimizeImageForMobile(fileName)
            .then(optimization => {
              console.log(`Poster optimized for mobile: ${optimization.savings}% size reduction`);
              
              res.json({ 
                success: true, 
                message: 'Poster uploaded, linked, and optimized for mobile successfully',
                fileName: fileName,
                puzzleId: puzzleId,
                optimization: {
                  originalSize: Math.round(optimization.originalSize / 1024) + 'KB',
                  optimizedSize: Math.round(optimization.optimizedSize / 1024) + 'KB',
                  savings: optimization.savings + '%'
                }
              });
            })
            .catch(err => {
              console.error('Failed to optimize image for mobile:', err);
              // Still return success since the upload worked, just without mobile optimization
              res.json({ 
                success: true, 
                message: 'Poster uploaded and linked successfully (mobile optimization failed)',
                fileName: fileName,
                puzzleId: puzzleId
              });
            });
        });
      });
    });
  });
});

// Close the database when the server is shut down
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

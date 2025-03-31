# Poster Processing for Cinemashers

This guide explains how to use the `process_posters.js` script to process movie posters, extract movie titles using the OpenAI API, and link them to puzzles in the database.

## Prerequisites

- Node.js installed
- Required dependencies: `axios`, `form-data`, `sqlite3` (already in package.json)

## Setup

1. Make sure you have an OpenAI API key
2. Edit `process_posters.js` and replace `YOUR_OPENAI_API_KEY` with your actual API key

## How It Works

The script will:

1. Scan all PNG files in the `cineposters/new` directory
2. For each poster, use the OpenAI Vision API to extract the movie title
3. Rename the file based on the extracted title and save a copy to the `cineposters` directory (original files remain untouched)
4. Create or update a `posters` table in the database that links poster files to puzzle IDs

## Running the Script

```bash
node process_posters.js
```

## Database Structure

The script creates a new table called `posters` with the following structure:

```sql
CREATE TABLE IF NOT EXISTS posters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  puzzle_id INTEGER,
  filename TEXT,
  original_filename TEXT,
  movie_title TEXT,
  FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
)
```

## Important Notes

- The script matches extracted titles to puzzles by looking for partial matches in both the movie titles and mashup titles
- If multiple matches are found, the poster will be linked to all matching puzzles
- If no matches are found, the poster will be stored without a puzzle_id for manual review

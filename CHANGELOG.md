# Changelog

## [1.6.0] - 2025-03-30

### Added
- Progressive Web App (PWA) support
  - Offline mode with cached puzzles
  - Home screen installation
  - App icons and manifest
  - Service worker for offline content
  - Mobile-optimized experience

## [1.5.0] - 2025-03-30

### Added
- Added direct clipboard paste functionality for uploading poster images
- Added "Copy to Clipboard" button for generated poster prompts
- Implemented automatic puzzle activation when poster is added

### Fixed
- Fixed clue format for new puzzles to use standard [MOVIE year] format
- Improved poster management workflow in admin interface

## [1.4.0] - 2025-03-30

### Added
- Added 10 new movie mashup puzzles with carefully crafted descriptions and IMDb links
- Added indicators for puzzles that need posters in the admin interface
- Added puzzle activation status to control which puzzles appear in the game
- Added direct puzzle access via URL path (/puzzle/:id) for testing and sharing

### Changed
- Enhanced admin interface with visual indicators for puzzle status:
  - Yellow highlighting for inactive puzzles
  - Icons to indicate missing posters and inactive status
- Improved answer modal layout with more space for poster display

## [1.3.0] - 2025-03-30

### Changed
- Organized codebase by moving all utility scripts to the utils/ directory
- Consolidated poster processing, data validation, and fixing scripts in a central location
- Created dedicated admin interface for puzzle management

### Technical
- Added browser-based admin interface for easier puzzle and poster management
- Implemented comprehensive API endpoints for admin operations
- Added search functionality for puzzles and posters in admin interface

## [1.2.0] - 2025-03-30

### Added
- Added poster image processing system with OpenAI API integration
- Created "posters" table in SQLite database to link poster files to puzzles
- Added script to process, rename, and organize movie poster PNG files
- Added script to standardize poster filenames with consistent naming convention

## [1.1.0] - 2025-03-30

### Added
- Added SQLite database integration to replace JSON file storage
- Created a conversion script (`convert_to_sqlite.js`) to migrate data from JSON to SQLite
- Added movie links to IMDb in the answer modal
- Added comprehensive credits for all puzzles that were missing them
- Added proper formatted clues with movie years for all puzzles
- Added modern cinema-themed styling with film strip graphics
- Added responsive design for all screen sizes

### Changed
- Updated server.js to use SQLite instead of the JSON file
- Enhanced the answer modal to prominently display the mashup title
- Improved puzzle page layout:
  - Converted clues to pill-style format for better readability
  - Centered clues and removed "Clue:" prefix
  - Made taglines bold, bigger, and centered
  - Made synopsis dynamically sized to fill available space with responsive font sizing
  - Centered credits and removed "Credits:" prefix
  - Reduced wasted space at the top of the puzzle screen
- Changed server port from 3000 to 3001 to avoid conflicts
- Moved utility scripts to a separate `utils/` directory (excluded from git)
- Implemented professional typography with Google Fonts
- Enhanced buttons with hover animations and consistent styling

### Fixed
- Fixed empty CSS ruleset issue in style.css
- Fixed missing credits data for 32 puzzles
- Fixed missing or incorrectly formatted clues in the database
- Fixed credits visibility issue in the puzzle screen
- Fixed overall visual hierarchy and spacing

### Technical
- Added `sqlite3` dependency to package.json
- Created utility scripts for database management and verification
- Updated .gitignore to exclude the utils directory
- Added comprehensive README with installation and gameplay instructions

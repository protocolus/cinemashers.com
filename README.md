# Cinemashers

A creative movie mashup guessing game where players are presented with clues, taglines, and synopses that combine elements from two or more films.

## About

Cinemashers challenges players to identify movie mashups based on puzzle clues. Each puzzle combines elements of multiple movies into a single creative concept. Players use the clues, taglines, and combined synopsis to guess the movies that have been mashed together.

## Features

- **Engaging Puzzles**: Over 100 creative movie mashups to solve
- **Clean Interface**: Simple, intuitive UI for an enjoyable gaming experience
- **Detailed Information**: Each puzzle includes:
  - Clues about movie release years
  - Creative taglines
  - Combined movie synopses
  - Credits with directors and stars
- **Movie Details**: Links to IMDb pages for each original movie
- **Responsive Design**: Works on desktop and mobile devices

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Setup

1. Clone the repository:
   ```
   git clone [repository URL]
   cd cm
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

## Technologies

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Data Storage**: Movie data stored in SQLite database

## How to Play

1. Click "Start Game" on the splash screen
2. Read the puzzle clue, tagline, and combined synopsis
3. Try to guess which movies have been mashed together
4. Click "Reveal Answer" to see the solution
5. Click "Next Puzzle" to continue playing

## Development

- The project uses a SQLite database to store puzzle data
- Server endpoints provide game information and puzzles
- Utility scripts in the `utils/` directory help maintain database data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- All movie information is intended for educational and entertainment purposes
- Movie data sourced from IMDb
- Inspired by a love of creative word games and cinema

## Contact

For questions, feedback, or support, please contact: [Your Contact Information]

// Global variables and state
let currentPuzzle = null;
let currentPuzzleId = null;
let puzzleData = null;
let cachedPuzzles = {};
let isOffline = !navigator.onLine;

// Add offline indicator to the DOM
const offlineIndicator = document.createElement('div');
offlineIndicator.className = 'offline-indicator';
offlineIndicator.textContent = 'You are offline';
document.body.appendChild(offlineIndicator);

// Update offline indicator based on network status
function updateOfflineStatus() {
    if (!navigator.onLine) {
        offlineIndicator.classList.add('visible');
        isOffline = true;
    } else {
        offlineIndicator.classList.remove('visible');
        isOffline = false;
    }
}

// Event listeners for online/offline status
window.addEventListener('online', () => {
    updateOfflineStatus();
    loadPuzzleFromId(); // Try to reload puzzle when coming back online
});
window.addEventListener('offline', updateOfflineStatus);

// Initialize offline status indicator
updateOfflineStatus();

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const puzzleScreen = document.getElementById('puzzle-screen');
    const startGameBtn = document.getElementById('start-game-btn');
    const revealAnswerBtn = document.getElementById('reveal-answer-btn');
    const nextPuzzleBtn = document.getElementById('next-puzzle-btn');
    const answerModal = document.getElementById('answer-modal');
    const closeModalBtn = document.querySelector('.close-btn');

    const gameTitleEl = document.getElementById('game-title');
    const gameDescriptionEl = document.getElementById('game-description');
    const gameRulesEl = document.getElementById('game-rules');

    const puzzleClueEl = document.getElementById('puzzle-clue');
    const puzzleTaglineEl = document.getElementById('puzzle-tagline');
    const puzzleSynopsisEl = document.getElementById('puzzle-synopsis');
    const puzzleCreditsEl = document.getElementById('puzzle-credits');

    const answerMovie1El = document.getElementById('answer-movie1');
    const answerMovie2El = document.getElementById('answer-movie2');
    const mashupTitleEl = document.getElementById('mashup-title');
    const posterImageEl = document.getElementById('poster-image');

    // Check if we have a specific puzzle ID in the URL
    function checkForPuzzleInUrl() {
        const pathMatch = window.location.pathname.match(/\/puzzle\/(\d+)/);
        if (pathMatch && pathMatch[1]) {
            const puzzleId = pathMatch[1];
            loadPuzzleFromId(puzzleId);
            return true;
        }
        return false;
    }

    // Fetch game info for splash screen
    fetch('/api/game-info')
        .then(response => response.json())
        .then(data => {
            gameTitleEl.textContent = data.gameName;
            gameDescriptionEl.textContent = data.gameDescription;
            data.gameRules.forEach(rule => {
                const li = document.createElement('li');
                li.textContent = rule;
                gameRulesEl.appendChild(li);
            });
            
            // Check for puzzle ID in URL after loading game info
            if (checkForPuzzleInUrl()) {
                splashScreen.style.display = 'none';
                puzzleScreen.style.display = 'block';
            }
        })
        .catch(error => console.error('Error fetching game info:', error));

    // Function to load a puzzle by ID
    function loadPuzzleFromId(puzzleId) {
        if (puzzleId && !isNaN(puzzleId)) {
            // Check if puzzle is already cached
            if (isOffline && cachedPuzzles[puzzleId]) {
                console.log('Loading puzzle from cache:', puzzleId);
                handlePuzzleData(cachedPuzzles[puzzleId]);
                return;
            }
            
            fetch(`/api/puzzle/${puzzleId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Puzzle not found');
                    }
                    return response.json();
                })
                .then(puzzle => {
                    currentPuzzle = puzzle;
                    currentPuzzleId = puzzle.id;
                    // Cache the puzzle data for offline use
                    cachedPuzzles[puzzleId] = puzzle;
                    // Store in localStorage for persistent offline access
                    try {
                        localStorage.setItem('cachedPuzzles', JSON.stringify(cachedPuzzles));
                    } catch (e) {
                        console.warn('Failed to cache puzzle in localStorage:', e);
                    }
                    displayPuzzle(puzzle);
                })
                .catch(error => {
                    console.error('Error fetching puzzle:', error);
                    alert('Could not load the requested puzzle. Loading a random one instead.');
                    loadRandomPuzzle();
                });
        } else {
            loadRandomPuzzle();
        }
    }

    // Function to display a puzzle
    function displayPuzzle(puzzle) {
        // Format clue as pills
        const clueText = puzzle.clue;
        const clueParts = clueText.match(/\[([^\]]+)\]/g) || [];
        
        if (clueParts.length > 0) {
            // Clear existing content
            puzzleClueEl.innerHTML = '';
            
            // Create pills for each part
            clueParts.forEach(part => {
                const pillEl = document.createElement('span');
                pillEl.className = 'clue-pill';
                pillEl.textContent = part;
                puzzleClueEl.appendChild(pillEl);
            });
        } else {
            // Fallback for clues that don't match the pattern
            puzzleClueEl.textContent = clueText;
        }
        
        puzzleTaglineEl.textContent = puzzle.tagline;
        puzzleSynopsisEl.textContent = puzzle.synopsis;
        
        // Adjust synopsis container based on content length
        adjustSynopsisDisplay();
        
        puzzleCreditsEl.textContent = puzzle.credits;

        // Switch screens
        splashScreen.classList.remove('active');
        puzzleScreen.classList.add('active');
        answerModal.classList.remove('active'); // Ensure modal is hidden
    }

    // Function to adjust synopsis display based on content length
    function adjustSynopsisDisplay() {
        const synopsisContent = puzzleSynopsisEl.textContent;
        
        // Remove any previous classes
        puzzleSynopsisEl.classList.remove('short-content', 'medium-content', 'long-content');
        
        // Add appropriate class based on content length
        if (synopsisContent.length < 150) {
            puzzleSynopsisEl.classList.add('short-content');
        } else if (synopsisContent.length < 400) {
            puzzleSynopsisEl.classList.add('medium-content');
        } else {
            puzzleSynopsisEl.classList.add('long-content');
        }
    }

    // Function to fetch and display a random puzzle
    function loadRandomPuzzle() {
        // If offline, try to load a cached puzzle
        if (isOffline && Object.keys(cachedPuzzles).length > 0) {
            const cachedIds = Object.keys(cachedPuzzles);
            const randomCachedId = cachedIds[Math.floor(Math.random() * cachedIds.length)];
            handlePuzzleData(cachedPuzzles[randomCachedId]);
            return;
        }
        
        fetch('/api/puzzle/random')
            .then(response => response.json())
            .then(puzzle => {
                currentPuzzle = puzzle;
                currentPuzzleId = puzzle.id;
                // Cache the puzzle data for offline use
                cachedPuzzles[puzzle.id] = puzzle;
                // Store in localStorage for persistent offline access
                try {
                    localStorage.setItem('cachedPuzzles', JSON.stringify(cachedPuzzles));
                } catch (e) {
                    console.warn('Failed to cache puzzle in localStorage:', e);
                }
                displayPuzzle(puzzle);
            })
            .catch(error => console.error('Error fetching random puzzle:', error));
    }

    // Function to handle puzzle data
    function handlePuzzleData(data) {
        puzzleData = data;
        currentPuzzleId = data.id;
        
        const clueElement = document.querySelector('.clue');
        clueElement.innerHTML = data.clue;
        
        showPuzzleScreen();
    }

    // Function to show an error message
    function showErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    // Event Listeners
    startGameBtn.addEventListener('click', loadRandomPuzzle);

    revealAnswerBtn.addEventListener('click', () => {
        if (currentPuzzle && currentPuzzle.solution) {
            // Display the mashup title prominently at the top
            mashupTitleEl.textContent = currentPuzzle.solution.mashupTitle;
            
            // Add IMDb links to the movie titles
            answerMovie1El.innerHTML = `Movie 1: <a href="${currentPuzzle.solution.movie1.imdbUrl}" target="_blank">${currentPuzzle.solution.movie1.title}</a> (${currentPuzzle.solution.movie1.year})`;
            answerMovie2El.innerHTML = `Movie 2: <a href="${currentPuzzle.solution.movie2.imdbUrl}" target="_blank">${currentPuzzle.solution.movie2.title}</a> (${currentPuzzle.solution.movie2.year})`;
            
            // Set the poster image if available
            if (currentPuzzle.poster) {
                posterImageEl.src = currentPuzzle.poster;
                posterImageEl.alt = `${currentPuzzle.solution.mashupTitle} Poster`;
                posterImageEl.style.display = 'block';
            } else {
                posterImageEl.style.display = 'none';
            }
            
            answerModal.classList.add('active');
        } else {
            console.error('Could not display answer: No current puzzle or solution found');
            // Optionally show an error to the user
        }
    });

    closeModalBtn.addEventListener('click', () => {
        answerModal.classList.remove('active');
    });

    nextPuzzleBtn.addEventListener('click', () => {
        answerModal.classList.remove('active');
        loadRandomPuzzle();
    });

    // Close modal if clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target === answerModal) {
            answerModal.classList.remove('active');
        }
    });

    // Load cached puzzles from localStorage if available
    try {
        const cachedData = localStorage.getItem('cachedPuzzles');
        if (cachedData) {
            cachedPuzzles = JSON.parse(cachedData);
            console.log('Loaded cached puzzles:', Object.keys(cachedPuzzles).length);
        }
    } catch (e) {
        console.warn('Failed to load cached puzzles:', e);
    }

    // PWA enhancements for reload/refresh
    if ('serviceWorker' in navigator) {
        // Listen for service worker updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker controller changed, refreshing content...');
            // Try to reload puzzle data without refreshing the page
            if (currentPuzzleId) {
                loadPuzzleFromId(currentPuzzleId);
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const puzzlesBtn = document.getElementById('puzzles-btn');
    const postersBtn = document.getElementById('posters-btn');
    const puzzlesSection = document.getElementById('puzzles-section');
    const postersSection = document.getElementById('posters-section');
    const puzzleEditSection = document.getElementById('puzzle-edit-section');
    const puzzlesList = document.getElementById('puzzles-list');
    const postersGrid = document.getElementById('posters-grid');
    const puzzleSearchInput = document.getElementById('puzzle-search');
    const posterSearchInput = document.getElementById('poster-search');
    const backToPuzzlesBtn = document.getElementById('back-to-puzzles');
    const savePuzzleBtn = document.getElementById('save-puzzle');
    const puzzleEditId = document.getElementById('puzzle-edit-id');
    const loadingOverlay = document.getElementById('loading');
    const puzzlePosters = document.getElementById('puzzle-posters');
    const moviesContainer = document.getElementById('movies-container');
    
    // Form Inputs
    const mashupTitleInput = document.getElementById('mashup-title');
    const clueInput = document.getElementById('clue');
    const taglineInput = document.getElementById('tagline');
    const synopsisInput = document.getElementById('synopsis');
    const creditsInput = document.getElementById('credits');
    
    // Current data
    let puzzles = [];
    let posters = [];
    let currentPuzzle = null;
    
    // Initialize
    init();
    
    function init() {
        // Load puzzles on init
        loadPuzzles();
        
        // Add event listeners
        puzzlesBtn.addEventListener('click', showPuzzlesSection);
        postersBtn.addEventListener('click', showPostersSection);
        backToPuzzlesBtn.addEventListener('click', showPuzzlesSection);
        savePuzzleBtn.addEventListener('click', savePuzzle);
        puzzleSearchInput.addEventListener('input', filterPuzzles);
        posterSearchInput.addEventListener('input', filterPosters);
    }
    
    function showPuzzlesSection() {
        setActiveSection(puzzlesSection);
        setActiveButton(puzzlesBtn);
    }
    
    function showPostersSection() {
        setActiveSection(postersSection);
        setActiveButton(postersBtn);
        if (posters.length === 0) {
            loadPosters();
        }
    }
    
    function showEditSection(puzzleId) {
        setActiveSection(puzzleEditSection);
        loadPuzzleDetails(puzzleId);
    }
    
    function setActiveSection(section) {
        // Remove active class from all sections
        document.querySelectorAll('.section').forEach(s => {
            s.classList.remove('active');
        });
        
        // Add active class to selected section
        section.classList.add('active');
    }
    
    function setActiveButton(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.nav-buttons button').forEach(b => {
            b.classList.remove('active');
        });
        
        // Add active class to selected button
        button.classList.add('active');
    }
    
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }
    
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }
    
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type);
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // API calls
    async function loadPuzzles() {
        showLoading();
        
        try {
            const response = await fetch('/api/admin/puzzles');
            if (!response.ok) {
                throw new Error('Failed to fetch puzzles');
            }
            
            puzzles = await response.json();
            renderPuzzles(puzzles);
        } catch (error) {
            console.error('Error loading puzzles:', error);
            showToast('Error loading puzzles: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }
    
    async function loadPosters() {
        showLoading();
        
        try {
            const response = await fetch('/api/admin/posters');
            if (!response.ok) {
                throw new Error('Failed to fetch posters');
            }
            
            posters = await response.json();
            renderPosters(posters);
        } catch (error) {
            console.error('Error loading posters:', error);
            showToast('Error loading posters: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }
    
    async function loadPuzzleDetails(puzzleId) {
        showLoading();
        puzzleEditId.textContent = puzzleId;
        
        try {
            const response = await fetch(`/api/admin/puzzle/${puzzleId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch puzzle details');
            }
            
            currentPuzzle = await response.json();
            renderPuzzleForm(currentPuzzle);
        } catch (error) {
            console.error('Error loading puzzle details:', error);
            showToast('Error loading puzzle details: ' + error.message, 'error');
            showPuzzlesSection();
        } finally {
            hideLoading();
        }
    }
    
    async function savePuzzle() {
        if (!currentPuzzle) {
            showToast('No puzzle selected', 'warning');
            return;
        }
        
        showLoading();
        
        // Collect the updated values
        const updatedPuzzle = {
            clue: clueInput.value,
            tagline: taglineInput.value,
            synopsis: synopsisInput.value,
            credits: creditsInput.value,
            mashup_title: mashupTitleInput.value,
            is_active: document.getElementById('puzzle-active').checked ? 1 : 0,
            movies: []
        };
        
        // Collect the movie updates
        const movieElements = document.querySelectorAll('.movie-item');
        movieElements.forEach(movieEl => {
            const movieNumber = movieEl.dataset.movieNumber;
            const title = movieEl.querySelector('.movie-title').value;
            const year = movieEl.querySelector('.movie-year').value;
            const imdbUrl = movieEl.querySelector('.movie-imdb').value;
            
            updatedPuzzle.movies.push({
                movie_number: movieNumber,
                title: title,
                year: year,
                imdb_url: imdbUrl
            });
        });
        
        try {
            const response = await fetch(`/api/admin/puzzle/${currentPuzzle.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedPuzzle)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update puzzle');
            }
            
            const result = await response.json();
            showToast('Puzzle updated successfully');
            
            // Refresh puzzles list
            loadPuzzles();
            
            // Return to puzzles section
            showPuzzlesSection();
        } catch (error) {
            console.error('Error saving puzzle:', error);
            showToast('Error saving puzzle: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Render functions
    function renderPuzzles(puzzles) {
        puzzlesList.innerHTML = '';
        
        puzzles.forEach(puzzle => {
            const row = document.createElement('tr');
            
            // Add a class for inactive puzzles
            if (puzzle.is_active === 0) {
                row.classList.add('inactive-puzzle');
            }
            
            const idCell = document.createElement('td');
            idCell.textContent = puzzle.id;
            
            const titleCell = document.createElement('td');
            titleCell.textContent = puzzle.mashup_title;
            
            // Add status indicators
            if (puzzle.has_poster === 0) {
                const posterMissingIcon = document.createElement('span');
                posterMissingIcon.className = 'status-icon missing-poster';
                posterMissingIcon.title = 'Missing poster';
                posterMissingIcon.textContent = '🖼️';
                titleCell.appendChild(posterMissingIcon);
            }
            
            if (puzzle.is_active === 0) {
                const inactiveIcon = document.createElement('span');
                inactiveIcon.className = 'status-icon inactive';
                inactiveIcon.title = 'Inactive puzzle';
                inactiveIcon.textContent = '⚠️';
                titleCell.appendChild(inactiveIcon);
            }
            
            const clueCell = document.createElement('td');
            clueCell.textContent = puzzle.clue;
            
            const actionCell = document.createElement('td');
            actionCell.className = 'action-cell';
            
            const viewBtn = document.createElement('a');
            viewBtn.className = 'btn btn-secondary';
            viewBtn.textContent = 'View';
            viewBtn.href = `/puzzle/${puzzle.id}`;
            viewBtn.target = '_blank';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => showEditSection(puzzle.id));
            
            actionCell.appendChild(viewBtn);
            actionCell.appendChild(document.createTextNode(' '));
            actionCell.appendChild(editBtn);
            
            row.appendChild(idCell);
            row.appendChild(titleCell);
            row.appendChild(clueCell);
            row.appendChild(actionCell);
            
            puzzlesList.appendChild(row);
        });
    }
    
    function renderPosters(posters) {
        postersGrid.innerHTML = '';
        
        posters.forEach(poster => {
            const posterCard = document.createElement('div');
            posterCard.className = 'poster-card';
            
            const img = document.createElement('img');
            img.className = 'poster-image';
            img.src = `/posters/${poster.filename}`;
            img.alt = poster.movie_title || 'Movie poster';
            
            const posterInfo = document.createElement('div');
            posterInfo.className = 'poster-info';
            
            const title = document.createElement('div');
            title.className = 'poster-title';
            title.textContent = poster.movie_title || poster.filename;
            
            const puzzleId = document.createElement('div');
            puzzleId.className = 'poster-puzzle-id';
            puzzleId.textContent = poster.puzzle_id ? `Puzzle #${poster.puzzle_id}` : 'Unassigned';
            
            posterInfo.appendChild(title);
            posterInfo.appendChild(puzzleId);
            
            posterCard.appendChild(img);
            posterCard.appendChild(posterInfo);
            
            postersGrid.appendChild(posterCard);
        });
    }
    
    function renderPuzzleForm(puzzle) {
        // Set form values
        mashupTitleInput.value = puzzle.mashup_title;
        clueInput.value = puzzle.clue;
        taglineInput.value = puzzle.tagline;
        synopsisInput.value = puzzle.synopsis;
        creditsInput.value = puzzle.credits;
        
        // Add active status toggle
        const activeStatusDiv = document.createElement('div');
        activeStatusDiv.className = 'form-group active-status-container';
        
        const activeCheckbox = document.createElement('input');
        activeCheckbox.type = 'checkbox';
        activeCheckbox.id = 'puzzle-active';
        activeCheckbox.className = 'active-checkbox';
        activeCheckbox.checked = puzzle.is_active === 1;
        
        const activeLabel = document.createElement('label');
        activeLabel.htmlFor = 'puzzle-active';
        activeLabel.textContent = 'Puzzle Active';
        
        const statusDescription = document.createElement('small');
        statusDescription.textContent = 'Inactive puzzles will be highlighted in the admin panel and won\'t appear in the game until activated';
        
        activeStatusDiv.appendChild(activeCheckbox);
        activeStatusDiv.appendChild(activeLabel);
        activeStatusDiv.appendChild(statusDescription);
        
        // Find where to insert the active status toggle (after the credits field)
        const formGroups = document.querySelectorAll('.form-group');
        const lastFormGroup = formGroups[formGroups.length - 1];
        lastFormGroup.parentNode.insertBefore(activeStatusDiv, lastFormGroup.nextSibling);
        
        // Render movies
        renderMoviesForm(puzzle.movies);
        
        // Render posters
        renderPuzzlePosters(puzzle.posters);
        
        // Update poster status notice
        let posterNotice = document.querySelector('.poster-notice');
        if (posterNotice) {
            posterNotice.remove();
        }
        
        if (!puzzle.posters || puzzle.posters.length === 0) {
            posterNotice = document.createElement('div');
            posterNotice.className = 'poster-notice warning';
            posterNotice.innerHTML = '<strong>⚠️ This puzzle has no poster!</strong> Please create and upload a poster image for this puzzle.';
            
            // Extract movie information for the prompt
            let movie1 = '';
            let movie2 = '';
            
            if (puzzle.movies && puzzle.movies.length > 0) {
                puzzle.movies.forEach(movie => {
                    if (movie.movie_number === 1) {
                        movie1 = `${movie.title} (${movie.year})`;
                    } else if (movie.movie_number === 2) {
                        movie2 = `${movie.title} (${movie.year})`;
                    }
                });
            }
            
            // Create poster prompt container
            const promptContainer = document.createElement('div');
            promptContainer.className = 'poster-prompt-container';
            
            // Create the textbox with the generated prompt
            const promptTextbox = document.createElement('textarea');
            promptTextbox.className = 'poster-prompt-textbox';
            promptTextbox.readOnly = true;
            promptTextbox.value = `Create a movie poster based on ${movie1} and ${movie2}, combining elements from both movies. The title should be "${puzzle.mashup_title}".`;
            
            // Create copy button
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-prompt-btn';
            copyButton.textContent = 'Copy to Clipboard';
            copyButton.addEventListener('click', function() {
                promptTextbox.select();
                document.execCommand('copy');
                showToast('Prompt copied to clipboard!', 'success');
            });
            
            // Add elements to container
            promptContainer.appendChild(promptTextbox);
            promptContainer.appendChild(copyButton);
            
            // Add the prompt container after the notice
            posterNotice.appendChild(promptContainer);
            
            // Add image paste area
            const pasteContainer = document.createElement('div');
            pasteContainer.className = 'paste-container';
            
            const pasteInstructions = document.createElement('p');
            pasteInstructions.className = 'paste-instructions';
            pasteInstructions.textContent = 'Paste your poster image here (Ctrl+V):';
            
            const pasteArea = document.createElement('div');
            pasteArea.className = 'paste-area';
            pasteArea.setAttribute('tabindex', '0');
            pasteArea.innerHTML = '<div class="paste-placeholder">Click here and press Ctrl+V to paste image</div>';
            
            const imagePreview = document.createElement('img');
            imagePreview.className = 'image-preview';
            imagePreview.style.display = 'none';
            
            const saveContainer = document.createElement('div');
            saveContainer.className = 'save-poster-container';
            saveContainer.style.display = 'none';
            
            const saveButton = document.createElement('button');
            saveButton.className = 'save-poster-btn';
            saveButton.textContent = 'Save Poster & Link to Puzzle';
            
            saveContainer.appendChild(saveButton);
            pasteArea.appendChild(imagePreview);
            pasteContainer.appendChild(pasteInstructions);
            pasteContainer.appendChild(pasteArea);
            pasteContainer.appendChild(saveContainer);
            
            posterNotice.appendChild(pasteContainer);
            puzzlePosters.parentNode.insertBefore(posterNotice, puzzlePosters);
            
            // Handle paste events
            pasteArea.addEventListener('click', function() {
                this.focus();
            });
            
            pasteArea.addEventListener('paste', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Get the pasted items
                const items = (e.clipboardData || window.clipboardData).items;
                
                // Find the first image item
                let blob = null;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        blob = items[i].getAsFile();
                        break;
                    }
                }
                
                // If no image found in clipboard
                if (!blob) {
                    showToast('No image found in clipboard!', 'error');
                    return;
                }
                
                // Display the pasted image
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                    document.querySelector('.paste-placeholder').style.display = 'none';
                    saveContainer.style.display = 'block';
                    
                    // Store the blob for upload
                    imagePreview.dataset.blob = blob;
                };
                reader.readAsDataURL(blob);
            });
            
            // Handle save button click
            saveButton.addEventListener('click', function() {
                if (!imagePreview.src) {
                    showToast('Please paste an image first!', 'warning');
                    return;
                }
                
                showLoading();
                
                // Create a formatted filename based on the mashup title
                const formattedTitle = puzzle.mashup_title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                
                // Create form data for the upload
                const formData = new FormData();
                formData.append('poster', dataURItoBlob(imagePreview.src), `${formattedTitle}.png`);
                formData.append('puzzleId', puzzle.id);
                formData.append('mashupTitle', puzzle.mashup_title);
                
                // Upload the image
                fetch('/api/admin/upload-poster', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    hideLoading();
                    if (data.success) {
                        showToast('Poster uploaded and linked successfully!', 'success');
                        loadPuzzleDetails(puzzle.id);
                    } else {
                        showToast('Error: ' + data.error, 'error');
                    }
                })
                .catch(error => {
                    hideLoading();
                    console.error('Error uploading poster:', error);
                    showToast('Error uploading poster', 'error');
                });
            });
        }
    }
    
    function renderMoviesForm(movies) {
        moviesContainer.innerHTML = '';
        
        movies.forEach(movie => {
            const movieEl = document.createElement('div');
            movieEl.className = 'movie-item';
            movieEl.dataset.movieNumber = movie.movie_number;
            
            movieEl.innerHTML = `
                <h4>Movie ${movie.movie_number}</h4>
                <div class="form-group">
                    <label for="movie-${movie.movie_number}-title">Title:</label>
                    <input type="text" id="movie-${movie.movie_number}-title" class="form-control movie-title" value="${movie.title || ''}">
                </div>
                <div class="form-group">
                    <label for="movie-${movie.movie_number}-year">Year:</label>
                    <input type="text" id="movie-${movie.movie_number}-year" class="form-control movie-year" value="${movie.year || ''}">
                </div>
                <div class="form-group">
                    <label for="movie-${movie.movie_number}-imdb">IMDb URL:</label>
                    <input type="text" id="movie-${movie.movie_number}-imdb" class="form-control movie-imdb" value="${movie.imdb_url || ''}">
                </div>
            `;
            
            moviesContainer.appendChild(movieEl);
        });
        
        if (movies.length === 0) {
            moviesContainer.innerHTML = '<p>No movies found for this puzzle.</p>';
        }
    }
    
    function renderPuzzlePosters(posters) {
        puzzlePosters.innerHTML = '';
        
        if (posters && posters.length > 0) {
            posters.forEach(poster => {
                const posterEl = document.createElement('div');
                posterEl.className = 'poster-preview-item';
                
                const img = document.createElement('img');
                img.className = 'poster-preview-image';
                img.src = `/posters/${poster.filename}`;
                img.alt = poster.movie_title || 'Movie poster';
                
                posterEl.appendChild(img);
                puzzlePosters.appendChild(posterEl);
            });
        } else {
            puzzlePosters.innerHTML = '<p>No posters found for this puzzle.</p>';
        }
    }
    
    // Filter functions
    function filterPuzzles() {
        const searchTerm = puzzleSearchInput.value.toLowerCase();
        
        if (!searchTerm) {
            renderPuzzles(puzzles);
            return;
        }
        
        const filteredPuzzles = puzzles.filter(puzzle => {
            return (
                puzzle.id.toString().includes(searchTerm) ||
                puzzle.mashup_title.toLowerCase().includes(searchTerm) ||
                puzzle.clue.toLowerCase().includes(searchTerm)
            );
        });
        
        renderPuzzles(filteredPuzzles);
    }
    
    function filterPosters() {
        const searchTerm = posterSearchInput.value.toLowerCase();
        
        if (!searchTerm) {
            renderPosters(posters);
            return;
        }
        
        const filteredPosters = posters.filter(poster => {
            return (
                (poster.movie_title && poster.movie_title.toLowerCase().includes(searchTerm)) ||
                poster.filename.toLowerCase().includes(searchTerm) ||
                (poster.puzzle_id && poster.puzzle_id.toString().includes(searchTerm))
            );
        });
        
        renderPosters(filteredPosters);
    }
});

// Helper function to convert data URI to Blob
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
}

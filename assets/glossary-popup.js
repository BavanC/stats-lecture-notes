// --- GLOBAL STATE ---
let isGlossaryVisible = false;

// --- DOM ELEMENT REFERENCES ---
let pageGrid, mainContent, glossarySidebar, glossaryToggleButton, glossaryPopup;

/**
 * Initializes the glossary functionality by setting up DOM references and event listeners.
 */
function initializeGlossary() {
    // Get DOM element references
    pageGrid = document.getElementById('page-grid');
    mainContent = document.getElementById('main-content');
    glossarySidebar = document.getElementById('glossary-sidebar');
    glossaryToggleButton = document.getElementById('btn-glossary-toggle');
    glossaryPopup = document.getElementById('glossary-popup');

    // Set initial state: closed if isGlossaryVisible is false
    if (!isGlossaryVisible) {
        if (glossarySidebar) glossarySidebar.classList.remove('visible');
        if (pageGrid) {
            pageGrid.classList.remove('lg:grid-cols-3');
            pageGrid.classList.add('lg:grid-cols-1');
        }
        if (mainContent) {
            mainContent.classList.remove('lg:col-span-2');
            mainContent.classList.add('lg:col-span-3');
        }
        if (glossaryToggleButton) {
            glossaryToggleButton.classList.remove('bg-blue-700');
            glossaryToggleButton.classList.add('bg-blue-600');
        }
    }

    // Set up event listeners
    if (glossaryToggleButton) {
        glossaryToggleButton.addEventListener('click', toggleGlossary);
    }
    document.addEventListener('click', handleGlossaryTermClick);
}

/**
 * Toggles the visibility of the glossary sidebar and adjusts the main content width.
 */
function toggleGlossary() {
    isGlossaryVisible = !isGlossaryVisible;

    if (isGlossaryVisible) {
        glossarySidebar.classList.add('visible');
        pageGrid.classList.remove('lg:grid-cols-1');
        pageGrid.classList.add('lg:grid-cols-3');
        mainContent.classList.remove('lg:col-span-3');
        mainContent.classList.add('lg:col-span-2');
        glossaryToggleButton.classList.add('bg-blue-700');
        glossaryToggleButton.classList.remove('bg-blue-600');
    } else {
        glossarySidebar.classList.remove('visible');
        pageGrid.classList.remove('lg:grid-cols-3');
        pageGrid.classList.add('lg:grid-cols-1');
        mainContent.classList.remove('lg:col-span-2');
        mainContent.classList.add('lg:col-span-3');
        glossaryToggleButton.classList.remove('bg-blue-700');
        glossaryToggleButton.classList.add('bg-blue-600');
    }
}

/**
 * Scrolls to a glossary term in the sidebar and highlights it.
 */
function scrollToTerm(termId) {
    const element = document.getElementById(termId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-yellow-200', 'transition', 'duration-300', 'dark:bg-yellow-600');
        setTimeout(() => {
            element.classList.remove('bg-yellow-200', 'dark:bg-yellow-600');
        }, 1500);
    }
}

/**
 * Shows the glossary term definition in a popup near the cursor.
 */
function showGlossaryPopup(termId, event) {
    const termElement = document.getElementById(termId);
    if (termElement) {
        const definition = termElement.querySelector('p').innerHTML;
        glossaryPopup.innerHTML = `<strong>${termElement.querySelector('h4').textContent}</strong><p class="mt-2">${definition}</p>`;
        
        glossaryPopup.style.left = `${event.pageX + 15}px`;
        glossaryPopup.style.top = `${event.pageY + 15}px`;
        glossaryPopup.style.display = 'block';

        setTimeout(() => { 
            document.addEventListener('click', hideGlossaryPopup, { once: true });
        }, 100);
        // Trigger MathJax typesetting for popup
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([glossaryPopup]);
        }
    }
}

/**
 * Hides the glossary popup.
 */
function hideGlossaryPopup() {
    glossaryPopup.style.display = 'none';
}

/**
 * Handles clicks on glossary terms, deciding whether to scroll or show a popup.
 */
function handleGlossaryTermClick(event) {
    const termSpan = event.target.closest('.glossary-term');
    if (!termSpan) return;

    event.preventDefault(); 
    event.stopPropagation(); 
    
    const termId = termSpan.dataset.termId;

    if (isGlossaryVisible) {
        scrollToTerm(termId);
    } else {
        showGlossaryPopup(termId, event);
    }
}

/**
 * Loads the glossary content from the external file and alphabetizes it.
 */
function loadGlossaryContent() {
    fetch('../assets/glossary.html')
        .then(response => response.text())
        .then(html => {
            const glossaryContainer = document.getElementById('glossary-content');
            if (glossaryContainer) {
                glossaryContainer.innerHTML = html;
                // Alphabetize Glossary
                const terms = Array.from(glossaryContainer.children);
                terms.sort((a, b) => a.id.localeCompare(b.id));
                terms.forEach(term => glossaryContainer.appendChild(term));
                // Trigger MathJax typesetting
                if (window.MathJax && window.MathJax.typesetPromise) {
                    MathJax.typesetPromise([glossaryContainer]);
                }
            }
        })
        .catch(error => {
            console.error('Error loading glossary content:', error);
        });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeGlossary();
    loadGlossaryContent();
}); 
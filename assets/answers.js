// Generic Answers Page JavaScript
// Handles MCQ display, case study loading, and collapsible functionality for any season

class AnswersApp {
    constructor(config) {
        this.config = config || this.getDefaultConfig();
        this.quizData = [];
        this.caseStudyData = {};
        this.isExpandedView = false; // Start collapsed to match visual state
        this.init();
    }

    getDefaultConfig() {
        // Try to get config from HTML data attributes or use defaults
        const configElement = document.querySelector('[data-answers-config]');
        if (configElement) {
            try {
                return JSON.parse(configElement.dataset.answersConfig);
            } catch (e) {
                console.warn('Invalid config in data-answers-config, using defaults');
            }
        }
        
        // Default config for backward compatibility
        return {
            season: 'winter',
            mcqPath: '../resources/winter_test/winter-test-mcqs.json',
            caseStudies: [
                { number: 26, path: '../resources/winter_test/winter-test-case_study_26.json' },
                { number: 27, path: '../resources/winter_test/winter-test-case_study_27.json' },
                { number: 28, path: '../resources/winter_test/winter-test-case_study_28.json' }
            ]
        };
    }

    async init() {
        try {
            await this.loadData();
            this.displayMCQAnswers();
            this.config.caseStudies.forEach(caseStudy => {
                this.displayCaseStudy(caseStudy.number);
            });
            
            setTimeout(() => {
                this.setExpandState(false); // Start collapsed to match visual state
                this.updateExpandButtonText();
                this.setupQuickNav();
                this.initializeTabs();
                this.setupScrollToTop();
                this.addMobileEnhancements();
            }, 100);
        } catch (error) {
            console.error('Error initializing app:', error);
            document.getElementById('mcq-container').innerHTML = 
                '<p class="text-red-500 text-center">Error loading answers. Please check the file paths.</p>';
        }
    }

    async loadData() {
        const fetchPromises = [
            fetch(this.config.mcqPath).then(response => response.json())
        ];
        
        // Add case study fetch promises
        this.config.caseStudies.forEach(caseStudy => {
            fetchPromises.push(
                fetch(caseStudy.path).then(response => response.json())
            );
        });
        
        const results = await Promise.all(fetchPromises);
        
        this.quizData = results[0].questions;
        
        // Store case study data
        this.config.caseStudies.forEach((caseStudy, index) => {
            this.caseStudyData[`case${caseStudy.number}`] = results[index + 1];
        });
    }

    displayMCQAnswers() {
        const container = document.getElementById('mcq-container');
        container.innerHTML = '';
        
        this.quizData.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md quiz-card';
            card.setAttribute('data-question-id', item.id);

            const questionNumber = document.createElement('div');
            questionNumber.className = 'text-sm font-semibold text-[#81b29a] mb-2';
            questionNumber.textContent = `Question ${item.id}`;
            card.appendChild(questionNumber);

            const question = document.createElement('p');
            question.className = 'question-text font-semibold text-lg mb-4 text-[#3d405b]';
            question.textContent = item.question;
            card.appendChild(question);

            // Display all options with correct answer highlighted
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options-container space-y-2 mb-4';
            item.options.forEach(option => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'p-3 rounded-lg border-2 transition-colors';
                if (option === item.correct_answer) {
                    optionDiv.className += ' bg-green-100 border-green-500 text-green-800 correct-option';
                    optionDiv.innerHTML = `<span class="font-bold">✓</span> ${option}`;
                } else {
                    optionDiv.className += ' bg-gray-50 border-gray-200 text-gray-700 wrong-option';
                    optionDiv.innerHTML = `<span class="font-bold">○</span> ${option}`;
                }
                optionsContainer.appendChild(optionDiv);
            });
            card.appendChild(optionsContainer);

            // Explanation section
            const explanationCard = document.createElement('div');
            explanationCard.className = 'explanation-card rounded-lg mb-2';
            const explanationHeader = document.createElement('button');
            explanationHeader.className = 'collapsible-toggle';
            explanationHeader.setAttribute('data-type', 'explanation');
            explanationHeader.setAttribute('data-target', `#mcq-${item.id}-explanation`);
            explanationHeader.innerHTML = `<span>View Explanation</span><span class="arrow">▼</span>`;
            const explanationContent = document.createElement('div');
            explanationContent.className = 'collapsible-content rounded-lg mt-2';
            explanationContent.id = `mcq-${item.id}-explanation`;
            explanationContent.textContent = item.explanation;
            explanationCard.appendChild(explanationHeader);
            explanationCard.appendChild(explanationContent);
            card.appendChild(explanationCard);
            
            container.appendChild(card);
        });
        
        // Initialize collapsible functionality for MCQ explanations
        this.initializeCollapsibleContent();
    }

    displayCaseStudy(caseNumber) {
        const caseKey = `case${caseNumber}`;
        if (!this.caseStudyData[caseKey]) return;
        
        const container = document.getElementById(`content-${caseKey}`);
        const caseData = this.caseStudyData[caseKey];
        
        // Update the title
        const titleElement = container.querySelector('h3');
        if (titleElement) {
            titleElement.textContent = caseData.title;
        }
        
        // Create the case study content
        const contentDiv = container.querySelector('.max-w-2xl');
        if (contentDiv) {
            contentDiv.innerHTML = '';
            
            // Research scenario section
            const scenarioSection = document.createElement('div');
            scenarioSection.className = 'bg-white p-6 rounded-lg shadow-md mb-8';
            scenarioSection.innerHTML = `
                <h4 class="font-bold text-xl mb-4">Case:</h4>
                <div class="space-y-4">
                    <div class="content-card rounded-lg mb-2">
                        <button class="collapsible-toggle" data-type="content" data-target="#${caseKey}-desc">
                            <span>Research Scenario</span>
                            <span class="arrow">▼</span>
                        </button>
                        <div id="${caseKey}-desc" class="collapsible-content rounded-lg mt-2">
                            <p>${caseData.case_study.research_scenario}</p>
                        </div>
                    </div>
                    ${this.generateStatisticalTables(caseData.case_study.statistical_tables, caseNumber)}
                </div>
            `;
            contentDiv.appendChild(scenarioSection);
            
            // Questions section
            caseData.questions.forEach(question => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'bg-white p-6 rounded-lg shadow-md';
                questionDiv.innerHTML = `
                    <div class="font-semibold mb-2">${question.id}) ${question.question}</div>
                    <div class="answer-card rounded-lg mb-2">
                        <button class="w-full text-left font-semibold flex justify-between items-center p-3 green-answer-toggle" data-target="#${caseKey}-${question.id}-answer">
                            <span>View Answer</span>
                            <span class="text-green-600">▼</span>
                        </button>
                        <div id="${caseKey}-${question.id}-answer" class="explanation-content rounded-lg mt-2 text-green-900">
                            ${question.answer}
                        </div>
                    </div>
                    <div class="explanation-card rounded-lg mb-2">
                        <button class="w-full text-left font-semibold flex justify-between items-center p-3 pink-explanation-toggle" data-target="#${caseKey}-${question.id}-expl">
                            <span>View Explanation</span>
                            <span class="text-pink-600">▼</span>
                        </button>
                        <div id="${caseKey}-${question.id}-expl" class="collapsible-content rounded-lg mt-2 text-pink-900">
                            <span class="font-semibold">Explanation:</span> ${question.explanation}
                        </div>
                    </div>
                `;
                contentDiv.appendChild(questionDiv);
            });
            
            // Initialize collapsible functionality for the newly created content
            this.initializeCollapsibleContent();
        }
    }

    generateStatisticalTables(tables, caseNumber = 26) {
        let html = '';
        
        Object.entries(tables).forEach(([key, table]) => {
            const tableId = `case${caseNumber}-${key.replace(/_/g, '-')}`;
            html += `
                <div class="content-card rounded-lg mb-2">
                    <button class="collapsible-toggle" data-type="content" data-target="#${tableId}">
                        <span>${table.title}</span>
                        <span class="arrow">▼</span>
                    </button>
                    <div id="${tableId}" class="collapsible-content rounded-lg mt-2">
                        <table class="w-full text-left">
                            <thead class="bg-gray-200">
                                <tr>
                                    ${table.headers.map(header => `<th class="table-cell text-left">${header}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${table.rows.map((row, index) => `
                                    <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                        ${row.map(cell => `<td class="table-cell text-left">${cell}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    initializeCollapsibleContent() {
        // Initialize collapsible toggles
        document.querySelectorAll('.collapsible-toggle').forEach(btn => {
            this.setupCollapsibleToggle(btn);
        });
        
        // Initialize green answer toggles
        document.querySelectorAll('.green-answer-toggle').forEach(btn => {
            this.setupAnswerToggle(btn, 'green');
        });
        
        // Initialize pink explanation toggles
        document.querySelectorAll('.pink-explanation-toggle').forEach(btn => {
            this.setupAnswerToggle(btn, 'pink');
        });
    }

    setupCollapsibleToggle(btn) {
        const type = btn.getAttribute('data-type');
        const targetSel = btn.getAttribute('data-target');
        const target = document.querySelector(targetSel);
        const label = btn.querySelector('span');
        const arrow = btn.querySelector('.arrow');
        
        if (!target) return;
        
        // Set initial state
        if (type === 'content') {
            arrow.textContent = target.classList.contains('show') ? '▲' : '▼';
            btn.setAttribute('aria-expanded', target.classList.contains('show'));
        } else {
            if (target.classList.contains('show')) {
                label.textContent = (type === 'explanation') ? 'Hide Explanation' : 'Hide Answer';
                arrow.textContent = '▲';
                btn.setAttribute('aria-expanded', 'true');
            } else {
                label.textContent = (type === 'explanation') ? 'View Explanation' : 'View Answer';
                arrow.textContent = '▼';
                btn.setAttribute('aria-expanded', 'false');
            }
        }
        
        // Remove existing event listener to prevent duplicates
        btn.removeEventListener('click', btn._clickHandler);
        
        // Add new event listener
        btn._clickHandler = () => {
            const expanded = target.classList.toggle('show');
            btn.setAttribute('aria-expanded', expanded);
            if (type === 'content') {
                arrow.textContent = expanded ? '▲' : '▼';
            } else {
                if (expanded) {
                    label.textContent = (type === 'explanation') ? 'Hide Explanation' : 'Hide Answer';
                    arrow.textContent = '▲';
                } else {
                    label.textContent = (type === 'explanation') ? 'View Explanation' : 'View Answer';
                    arrow.textContent = '▼';
                }
            }
        };
        btn.addEventListener('click', btn._clickHandler);
    }

    setupAnswerToggle(btn, type) {
        const targetSel = btn.getAttribute('data-target');
        const target = document.querySelector(targetSel);
        if (!target) return;
        
        btn.setAttribute('aria-expanded', 'false');
        const icon = btn.querySelector(`span.text-${type}-600`);
        const label = btn.querySelector('span');
        
        // Set initial state
        if (target.classList.contains('show')) {
            label.textContent = type === 'green' ? 'Hide Answer' : 'Hide Explanation';
            icon.textContent = '▲';
            btn.setAttribute('aria-expanded', 'true');
        } else {
            label.textContent = type === 'green' ? 'View Answer' : 'View Explanation';
            icon.textContent = '▼';
            btn.setAttribute('aria-expanded', 'false');
        }
        
        // Remove existing event listener to prevent duplicates
        btn.removeEventListener('click', btn._clickHandler);
        
        // Add new event listener
        btn._clickHandler = () => {
            const expanded = target.classList.toggle('show');
            btn.setAttribute('aria-expanded', expanded);
            if (expanded) {
                label.textContent = type === 'green' ? 'Hide Answer' : 'Hide Explanation';
                icon.textContent = '▲';
            } else {
                label.textContent = type === 'green' ? 'View Answer' : 'View Explanation';
                icon.textContent = '▼';
            }
        };
        btn.addEventListener('click', btn._clickHandler);
    }

    setExpandState(expanded) {
        this.isExpandedView = expanded;
        
        // Handle all collapsible content types
        const allCollapsibleContent = document.querySelectorAll('.explanation-content, .collapsible-content');
        const allCollapsibleToggles = document.querySelectorAll('.collapsible-toggle, .green-answer-toggle, .pink-explanation-toggle');
        const wrongOptions = document.querySelectorAll('.wrong-option');

        if (expanded) {
            // Expand all content
            allCollapsibleContent.forEach(content => content.classList.add('show'));
            wrongOptions.forEach(option => option.classList.remove('hidden'));
            
            // Update all toggle buttons
            allCollapsibleToggles.forEach(btn => {
                const type = btn.getAttribute('data-type');
                const label = btn.querySelector('span');
                const arrow = btn.querySelector('.arrow') || btn.querySelector('span:last-child');
                
                if (type === 'content') {
                    arrow.textContent = '▲';
                    btn.setAttribute('aria-expanded', 'true');
                } else if (btn.classList.contains('green-answer-toggle')) {
                    label.textContent = 'Hide Answer';
                    arrow.textContent = '▲';
                    btn.setAttribute('aria-expanded', 'true');
                } else if (btn.classList.contains('pink-explanation-toggle')) {
                    label.textContent = 'Hide Explanation';
                    arrow.textContent = '▲';
                    btn.setAttribute('aria-expanded', 'true');
                } else {
                    label.textContent = 'Hide Explanation';
                    arrow.textContent = '▲';
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        } else {
            // Collapse all content
            allCollapsibleContent.forEach(content => content.classList.remove('show'));
            wrongOptions.forEach(option => option.classList.add('hidden'));
            
            // Update all toggle buttons
            allCollapsibleToggles.forEach(btn => {
                const type = btn.getAttribute('data-type');
                const label = btn.querySelector('span');
                const arrow = btn.querySelector('.arrow') || btn.querySelector('span:last-child');
                
                if (type === 'content') {
                    arrow.textContent = '▼';
                    btn.setAttribute('aria-expanded', 'false');
                } else if (btn.classList.contains('green-answer-toggle')) {
                    label.textContent = 'View Answer';
                    arrow.textContent = '▼';
                    btn.setAttribute('aria-expanded', 'false');
                } else if (btn.classList.contains('pink-explanation-toggle')) {
                    label.textContent = 'View Explanation';
                    arrow.textContent = '▼';
                    btn.setAttribute('aria-expanded', 'false');
                } else {
                    label.textContent = 'View Explanation';
                    arrow.textContent = '▼';
                    btn.setAttribute('aria-expanded', 'false');
                }
            });
        }
        this.updateExpandButtonText();
    }

    updateExpandButtonText() {
        const btn = document.getElementById('toggle-expand-btn');
        if (this.isExpandedView) {
            btn.innerHTML = `
                <span class="hidden sm:inline">Collapse All Explanations</span>
                <span class="sm:hidden">Collapse All</span>
            `;
        } else {
            btn.innerHTML = `
                <span class="hidden sm:inline">Expand All Explanations</span>
                <span class="sm:hidden">Expand All</span>
            `;
        }
    }

    setupQuickNav() {
        const mobileNav = document.querySelector('#mcq-answers .grid');
        if (mobileNav) {
            mobileNav.innerHTML = '';
            this.quizData.forEach((item) => {
                const navButton = document.createElement('button');
                navButton.className = 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-1 rounded text-sm transition-colors';
                navButton.textContent = item.id;
                navButton.onclick = () => {
                    const targetCard = document.querySelector(`[data-question-id="${item.id}"]`);
                    if (targetCard) {
                        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                };
                mobileNav.appendChild(navButton);
            });
        }
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.id.replace('tab-', 'content-');
                tabButtons.forEach(btn => {
                    btn.classList.remove('active', 'bg-[#81b29a]', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                });
                button.classList.add('active', 'bg-[#81b29a]', 'text-white');
                button.classList.remove('bg-gray-200', 'text-gray-700');
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.classList.add('hidden');
                });
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                    setTimeout(() => {
                        targetContent.classList.add('active');
                    }, 10);
                }
                document.getElementById('tab-content').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            });
        });
    }

    setupScrollToTop() {
        const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 120) {
                scrollToTopBtn.classList.remove('hidden');
            } else {
                scrollToTopBtn.classList.add('hidden');
            }
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    addMobileEnhancements() {
        const explanations = document.querySelectorAll('.explanation');
        explanations.forEach(exp => {
            exp.addEventListener('touchstart', function(e) {
                if (this.scrollHeight > this.clientHeight) {
                    e.stopPropagation();
                }
            }, { passive: true });
        });
        if ('vibrate' in navigator) {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    navigator.vibrate(10);
                });
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const app = new AnswersApp();
    
    // Set up the toggle expand/collapse button
    document.getElementById('toggle-expand-btn').addEventListener('click', () => {
        app.setExpandState(!app.isExpandedView);
    });
}); 
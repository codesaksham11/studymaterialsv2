// js/mcq_quiz_see_script_new.js
// New build of the MCQ quiz logic

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const quizTitleElement = document.getElementById('quiz-title');
    const timerDisplay = document.getElementById('timer-display');
    const quizForm = document.getElementById('quiz-form');
    const questionListDiv = document.getElementById('question-list');
    const submitArea = document.getElementById('submit-area');
    const submitButton = document.getElementById('submit-button');
    const resultsArea = document.getElementById('results-area');
    const resultsTitle = document.getElementById('results-title');
    const resultsScoreP = document.getElementById('results-score');
    const resultsTimeP = document.getElementById('results-time');
    const resultsMessageP = document.getElementById('results-message');
    const resultsBackButton = document.getElementById('back-to-setup-button');
    // const correctedAnswersDiv = document.getElementById('corrected-answers'); // For later if needed
    const errorDisplay = document.getElementById('error-display');
    const errorMessageElement = document.getElementById('error-message');

    // --- State Variables ---
    let quizState = 'loading'; // loading, active, finished, error
    let questionsForSession = [];
    let targetQuestionCount = 0;
    let targetTimeLimit = 0; // minutes
    let timeLeft = 0; // seconds
    let timerInterval = null;
    let currentScore = 0;
    let startTime = null; // To calculate exact time taken

    // --- Utility: Shuffle Array (Fisher-Yates) ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // ES6 swap
        }
        return array;
    }

    // --- Error Display Function ---
    function showError(message) {
        console.error("Quiz Error:", message); // Log for potential debugging
        quizState = 'error';
        if (errorMessageElement) errorMessageElement.textContent = message;

        // Hide main content, show error display
        if (quizForm) quizForm.classList.add('hidden');
        if (submitArea) submitArea.classList.add('hidden');
        if (resultsArea) resultsArea.classList.add('hidden'); // Hide results too
        if (errorDisplay) errorDisplay.classList.remove('hidden');

        // Optionally hide header too if error is critical
        // if (document.querySelector('.quiz-header')) document.querySelector('.quiz-header').classList.add('hidden');

        // Stop timer if running
        if (timerInterval) clearInterval(timerInterval);
    }

    // --- Initialization Function ---
    function initializeQuiz() {
        console.log("Initializing New Quiz...");
        quizState = 'loading';

        // 1. Get URL Parameters
        const urlParams = new URLSearchParams(window.location.search);
        const countParam = urlParams.get('count');
        const timeParam = urlParams.get('time');
        const subjectsParam = urlParams.get('subjects');

        // 2. Validate Parameters
        targetQuestionCount = parseInt(countParam, 10);
        targetTimeLimit = parseInt(timeParam, 10);

        if (isNaN(targetQuestionCount) || targetQuestionCount < 1 || isNaN(targetTimeLimit) || targetTimeLimit < 1 || !subjectsParam) {
            showError(`Setup Error: Invalid quiz parameters received. Please go back and configure the quiz again. (Count: ${countParam}, Time: ${timeParam}, Subjects: ${subjectsParam})`);
            return;
        }

        const selectedSubjectKeys = subjectsParam.split(',').map(s => s.trim()).filter(s => s); // Get non-empty subject keys
        if (selectedSubjectKeys.length === 0) {
            showError("Setup Error: No subjects were specified. Please go back and select subjects.");
            return;
        }

        console.log(`Params: Count=${targetQuestionCount}, Time=${targetTimeLimit}m, Subjects=${selectedSubjectKeys.join(', ')}`);

        // 3. Check Question Data Source
        if (typeof MCQ_DATA_SEE === 'undefined' || !MCQ_DATA_SEE) {
            showError("Data Error: The question data (MCQ_DATA_SEE) is missing or not loaded correctly. Check 'mcq_data_see.js'.");
            return;
        }

        // 4. Select Questions for the Session
        questionsForSession = selectQuestions(selectedSubjectKeys, targetQuestionCount);

        if (questionsForSession.length === 0) {
             showError(`Data Error: Could not select any questions for the chosen subjects (${selectedSubjectKeys.join(', ')}) and count (${targetQuestionCount}). Check if data exists and count is realistic.`);
             return;
        }

        // Adjust target count if fewer questions were available than requested
        if (questionsForSession.length < targetQuestionCount) {
             console.warn(`Requested ${targetQuestionCount} questions, but only ${questionsForSession.length} were available for the selected subjects.`);
             targetQuestionCount = questionsForSession.length; // Use the actual count for scoring etc.
        }

        console.log(`Selected ${questionsForSession.length} questions.`);

        // 5. Render Questions onto the Page
        renderQuestions(questionsForSession);

        // 6. Prepare and Start Timer
        timeLeft = targetTimeLimit * 60;
        startTimer();
        updateTimerDisplay(); // Initial display

        // 7. Attach Submit Listener
        if (quizForm) {
             quizForm.addEventListener('submit', handleSubmit);
        } else {
             showError("Internal Error: Quiz form element not found.");
             return;
        }

        // 8. Update State and UI
        if (quizTitleElement) quizTitleElement.textContent = `SEE MCQ Practice (${targetQuestionCount} Questions)`;
        quizState = 'active';
        startTime = Date.now(); // Record start time for accurate duration calculation
        console.log("Quiz Initialized and Active.");

    } // End of initializeQuiz

    // --- Placeholder for Select Questions Function ---
    function selectQuestions(subjectKeys, count) {
        console.log(`Selecting up to ${count} questions from subjects: ${subjectKeys.join(', ')}`);
        let availablePool = [];
        subjectKeys.forEach(key => {
            if (MCQ_DATA_SEE[key] && Array.isArray(MCQ_DATA_SEE[key])) {
                availablePool = availablePool.concat(MCQ_DATA_SEE[key]);
            } else {
                console.warn(`No data found or data is not an array for subject key: ${key}`);
            }
        });

        console.log(`Total questions found in pool: ${availablePool.length}`);
        if (availablePool.length === 0) return []; // Return empty if nothing found

        const shuffledPool = shuffleArray(availablePool);

        return shuffledPool.slice(0, count); // Return the requested number (or fewer if pool is small)
    }

    // --- Placeholder for Render Questions Function ---
    function renderQuestions(questions) {
        console.log("Rendering questions...");
        if (!questionListDiv) {
            showError("Internal Error: Cannot find the question list container (#question-list).");
            return;
        }
        questionListDiv.innerHTML = ''; // Clear "Loading..." message or previous questions

        questions.forEach((question, index) => {
            try {
                // Basic check for valid question structure
                if (!question || !question.id || !question.q || !Array.isArray(question.o) || typeof question.a === 'undefined') {
                     console.warn(`Skipping question at index ${index} due to invalid format:`, question);
                     return; // Skip this iteration
                }

                // Create question container
                const questionBlock = document.createElement('div');
                questionBlock.className = 'question-block';
                questionBlock.id = `question-${question.id}`;

                // Question Number
                const numberP = document.createElement('p');
                numberP.className = 'question-number';
                numberP.textContent = `${index + 1}.`;

                // Question Text
                const textP = document.createElement('p');
                textP.className = 'question-text';
                textP.innerHTML = question.q; // Use innerHTML to allow basic formatting if needed

                // Options container
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'options';

                // Shuffle options for display
                const optionIndices = question.o.map((_, idx) => idx); // [0, 1, 2, 3]
                const shuffledOptionIndices = shuffleArray([...optionIndices]); // Shuffle the indices

                shuffledOptionIndices.forEach(originalIndex => {
                    const optionText = question.o[originalIndex];

                    const label = document.createElement('label');
                    label.className = 'option-label';

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `q_${question.id}`; // Group options for the same question
                    radio.value = originalIndex; // The value is the ORIGINAL index

                    const span = document.createElement('span');
                    span.className = 'option-text';
                    span.innerHTML = optionText; // Use innerHTML for options too

                    label.appendChild(radio);
                    label.appendChild(span);
                    optionsDiv.appendChild(label);
                });

                // Append elements
                questionBlock.appendChild(numberP);
                questionBlock.appendChild(textP);
                questionBlock.appendChild(optionsDiv);
                questionListDiv.appendChild(questionBlock);

            } catch (err) {
                 console.error(`Error rendering question at index ${index} (ID: ${question?.id}):`, err);
                 // Maybe add a placeholder indicating an error for this specific question?
                 const errorP = document.createElement('p');
                 errorP.textContent = `Error loading question ${index + 1}.`;
                 errorP.style.color = 'red';
                 questionListDiv.appendChild(errorP);
            }
        });
        console.log("Finished rendering questions.");
    }

    // --- Placeholder for Timer Functions ---
    function startTimer() {
        console.log("Starting timer...");
        if (timerInterval) clearInterval(timerInterval); // Clear any existing timer

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                console.log("Time ran out!");
                clearInterval(timerInterval);
                handleSubmit(null, true); // Pass a flag indicating timeout
            }
        }, 1000); // Update every second
    }

    function updateTimerDisplay() {
        if (!timerDisplay) return;
        const minutes = Math.max(0, Math.floor(timeLeft / 60)); // Ensure non-negative
        const seconds = Math.max(0, timeLeft % 60);
        timerDisplay.textContent = `Time Left: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // --- Placeholder for Submit Handler ---
    function handleSubmit(event, isTimeout = false) {
        if (event) event.preventDefault(); // Prevent default form submission if it was a click

        if (quizState !== 'active') {
             console.warn("Submit called when quiz not active. State:", quizState);
             return; // Don't submit if already finished or in error/loading state
        }

        console.log("Handling submission...");
        quizState = 'finished';
        clearInterval(timerInterval); // Stop the timer

        // Calculate time taken
        const endTime = Date.now();
        const timeTakenSeconds = Math.round((endTime - startTime) / 1000);

        // Disable submit button
        if (submitButton) submitButton.disabled = true;
        if (submitArea) submitArea.classList.add('hidden'); // Hide submit area

        // Calculate score
        currentScore = 0;
        questionsForSession.forEach((question) => {
             const selectedRadio = quizForm.querySelector(`input[name="q_${question.id}"]:checked`);
             if (selectedRadio) {
                 const selectedAnswerIndex = parseInt(selectedRadio.value, 10);
                 if (selectedAnswerIndex === question.a) {
                     currentScore++;
                 }
             }
             // Optional: Add visual feedback for correct/incorrect answers here later
        });

        console.log(`Score: ${currentScore} / ${targetQuestionCount}`);

        // Display results
        displayResults(currentScore, targetQuestionCount, timeTakenSeconds, isTimeout);
    }

    // --- Placeholder for Display Results Function ---
    function displayResults(score, total, timeSeconds, wasTimeout) {
        console.log("Displaying results...");

        if (!resultsArea || !resultsTitle || !resultsScoreP || !resultsTimeP || !resultsMessageP || !resultsBackButton) {
            showError("Internal Error: Could not find all necessary elements to display results.");
            return;
        }

        // Hide the quiz form
        if (quizForm) quizForm.classList.add('hidden');

        // Format time
        const minutes = Math.floor(timeSeconds / 60);
        const seconds = timeSeconds % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Set results content
        resultsTitle.textContent = wasTimeout ? "Time Out!" : "Quiz Finished!";
        resultsScoreP.textContent = `Score: ${score} / ${total}`;
        resultsTimeP.textContent = `Time Taken: ${timeString}`;

        // Generate feedback message
        const percentage = total > 0 ? (score / total) * 100 : 0;
        let message = "";
        let messageColor = "#333"; // Default color

        // --- Same feedback logic as before ---
        if (percentage >= 90) { message = "Excellent! You're crushing these MCQs!"; messageColor = "#28a745"; }
        else if (percentage >= 70) { message = "Great job! Almost perfect, keep practicing!"; messageColor = "#17a2b8"; }
        else if (percentage >= 50) { message = "Good effort! Keep working on it."; messageColor = "#ffc107"; }
        else if (percentage >= 30) { message = "Average performance. Needs more effort."; messageColor = "#fd7e14"; }
        else { message = "Keep practicing! More effort needed."; messageColor = "#dc3545"; }
        // --- End feedback logic ---

        resultsMessageP.textContent = message;
        resultsMessageP.style.color = messageColor;

        // Add event listener for the back button
        resultsBackButton.onclick = () => {
            window.location.href = 'mcq_setup_see.html'; // Go back to setup
        };

        // Show the results area
        resultsArea.classList.remove('hidden');

        // Scroll to top to make results visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }


    // --- Start the Quiz ---
    initializeQuiz();

}); // End DOMContentLoaded

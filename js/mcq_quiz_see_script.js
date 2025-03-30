// js/mcq_quiz_see_script.js
// Revised Version 2: Using showError for Visual Assertions

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const quizTitleElement = document.getElementById('quiz-title');
    const timerDisplay = document.getElementById('timer-display');
    const quizForm = document.getElementById('quiz-form');
    const questionListDiv = document.getElementById('question-list');
    const submitArea = document.getElementById('submit-area');
    const submitButton = document.getElementById('submit-button');
    const resultsSummaryDiv = document.getElementById('results-summary');
    const resultsTitle = document.getElementById('results-title');
    const resultsScoreP = document.getElementById('results-score');
    const resultsTimeP = document.getElementById('results-time');
    const resultsMessageP = document.getElementById('results-message');
    const errorOverlay = document.getElementById('error-overlay');
    const errorMessageElement = document.getElementById('error-message');
    const resultsBackButton = document.getElementById('back-to-setup-button-results');

    // --- State Variables ---
    let timerInterval = null;
    let timeLeft = 0; // in seconds
    let totalQuestions = 0;
    let targetQuestionCount = 0;
    let targetTimeLimit = 0; // in minutes
    let selectedSubjects = [];
    let questionsForSession = [];
    let quizFinished = false;

    // --- MODIFIED Error Handling / Visual Assertion ---
    let assertionStep = 0;
    let lastAssertionTimeout = null;

    // Function to display temporary status or persistent errors
    function showUserFeedback(message, isError = false, duration = 1500) {
        console.log( (isError ? "ERROR: " : "Assertion: ") + message); // Keep console log
        if (!errorMessageElement || !errorOverlay) return;

        clearTimeout(lastAssertionTimeout); // Clear previous temporary message timer

        assertionStep++;
        const prefix = isError ? `ERROR (Step ${assertionStep})` : `Debug Step ${assertionStep}`;
        errorMessageElement.textContent = `${prefix}: ${message}`;
        errorOverlay.classList.add('visible');

        // Ensure quiz content is hidden when feedback is shown
        document.querySelectorAll('.quiz-container > *:not(.error-overlay)')?.forEach(el => {
             if (el) el.style.visibility = 'hidden';
        });


        if (!isError) {
            // If not an error, hide it after the duration
            lastAssertionTimeout = setTimeout(() => {
                // Only hide if this specific message is still showing
                if (errorMessageElement.textContent.startsWith(prefix)) {
                    errorOverlay.classList.remove('visible');
                     // Make quiz content visible again unless a new message appeared
                     document.querySelectorAll('.quiz-container > *:not(.error-overlay)')?.forEach(el => {
                          if (el) el.style.visibility = 'visible';
                     });
                }
            }, duration);
        }
        // If it IS an error, it stays visible, and content stays hidden.
    }


    // ... (Keep getCookie, shuffleArray functions as before) ...

    // --- Question Selection Logic (Keep previous robust version) ---
    function selectSessionQuestions() {
        showUserFeedback("Selecting questions..."); // Assertion point
        questionsForSession = [];
        let availableQuestions = [];

        selectedSubjects.forEach(subjectKey => {
             try {
                if (MCQ_DATA_SEE && MCQ_DATA_SEE[subjectKey] && Array.isArray(MCQ_DATA_SEE[subjectKey])) {
                    console.log(`Found ${MCQ_DATA_SEE[subjectKey].length} questions for ${subjectKey}`);
                    availableQuestions.push(...MCQ_DATA_SEE[subjectKey]);
                } else { console.warn(`No valid data array for subject key: ${subjectKey}`); }
             } catch (error) { console.error(`Error processing subject ${subjectKey}:`, error); }
        });

        if (availableQuestions.length === 0) {
             showUserFeedback("No questions available from data source.", true); // ERROR
             return;
        }
        availableQuestions = shuffleArray(availableQuestions);
        questionsForSession = availableQuestions.slice(0, targetQuestionCount);
        showUserFeedback(`Selected ${questionsForSession.length} of ${targetQuestionCount} questions.`); // Assertion point
    }

    // --- HTML Generation (Keep previous robust version) ---
    function populateQuestionList() {
        showUserFeedback("Starting HTML generation..."); // Assertion point
        if (!questionListDiv) {
             showUserFeedback("Cannot find #question-list div", true); // ERROR
             return;
        }
        questionListDiv.innerHTML = '';
        let currentSubjectHeader = null;
        const displayOrder = [...questionsForSession].sort(/* ... sort logic ... */); // Keep sorting

        displayOrder.forEach((question, index) => {
            try {
                 if (!question || typeof question.id === 'undefined' || /* ... other checks ... */ !Array.isArray(question.o)) {
                    console.warn(`Skipping malformed question index ${index}`); return;
                 }
                 // ... (Create header if needed) ...
                 // ... (Create block, number, text, optionsDiv) ...
                 // ... (Shuffle and create option labels/radios/spans) ...
                 // ... (Append children to block, append block to questionListDiv) ...
                 const block = document.createElement('div'); block.classList.add('question-block'); block.id = `question-${question.id}`;
                 const numberP = document.createElement('p'); numberP.classList.add('question-number'); numberP.textContent = `${index + 1}.`; block.appendChild(numberP);
                 const textP = document.createElement('p'); textP.classList.add('question-text'); textP.innerHTML = question.q; block.appendChild(textP);
                 const optionsDiv = document.createElement('div'); optionsDiv.classList.add('options');
                 const optionIndices = question.o.map((_, idx) => idx); const shuffledOptionIndices = shuffleArray([...optionIndices]);
                 shuffledOptionIndices.forEach(optionIndex => { /* ... create label, radio, span ... */
                     const label = document.createElement('label'); label.classList.add('option-label'); const radio = document.createElement('input'); radio.type = 'radio'; radio.name = `q_${question.id}`; radio.value = optionIndex; const span = document.createElement('span'); span.classList.add('option-text'); span.innerHTML = question.o[optionIndex]; label.appendChild(radio); label.appendChild(span); optionsDiv.appendChild(label); });
                 block.appendChild(optionsDiv); questionListDiv.appendChild(block); // Append at the end

            } catch (error) {
                console.error(`Error populating HTML for question index ${index} (ID: ${question?.id}):`, error);
                showUserFeedback(`Failed to create HTML for question ${index + 1}. Check data format.`, true); // ERROR
                throw error; // Stop processing further questions if one fails badly
            }
        });
        showUserFeedback("Finished HTML generation."); // Assertion point
    }

    // --- Timer Logic ---
    function startTimer() {
        showUserFeedback("Starting timer..."); // Assertion point
        if (timerInterval) clearInterval(timerInterval);
        updateTimerDisplay();
        timerInterval = setInterval(() => { timeLeft--; updateTimerDisplay(); if (timeLeft <= 0) { clearInterval(timerInterval); handleTimeout(); } }, 1000);
    }
    function updateTimerDisplay() { /* ... as before ... */ }

    // --- Submission & Results Logic ---
    function handleSubmit(event) {
        showUserFeedback("Handling submit/timeout..."); // Assertion point
        // ... (rest of function, using try/catch as before) ...
    }
    function displayResultsSummary(score) {
        showUserFeedback("Displaying results summary..."); // Assertion point
         // ... (rest of function) ...
    }
     function handleTimeout() {
         showUserFeedback("Timeout occurred..."); // Assertion point
         if (!quizFinished) { handleSubmit(); /* ... */ }
     }

    // --- Initialization ---
    function initializeQuiz() {
        try { // Wrap the entire initialization in a try...catch
            showUserFeedback("Init: Starting", false, 500); // Quick flash

            // --- SECURITY CHECK (Bypassed) ---
            console.warn("SECURITY CHECK BYPASSED");

            // --- READ PARAMS ---
            const urlParams = new URLSearchParams(window.location.search);
            targetQuestionCount = parseInt(urlParams.get('count'), 10);
            targetTimeLimit = parseInt(urlParams.get('time'), 10);
            const subjectsParam = urlParams.get('subjects');
            showUserFeedback(`Init: Params Read (C:${targetQuestionCount}, T:${targetTimeLimit}, S:${subjectsParam})`);

            // --- VALIDATE PARAMS ---
            if (isNaN(targetQuestionCount) || targetQuestionCount < 1 || isNaN(targetTimeLimit) || targetTimeLimit < 1 || !subjectsParam) {
                throw new Error(`Invalid params. C:${targetQuestionCount}, T:${targetTimeLimit}, S:${subjectsParam}`);
            }
            // Other validation (e.g., count range)
            timeLeft = targetTimeLimit * 60;
            selectedSubjects = subjectsParam.split(',').filter(s => s.trim() !== '');
            if (selectedSubjects.length === 0) throw new Error("No valid subjects selected.");
            showUserFeedback("Init: Params Validated");

            // --- CHECK DATA ---
            if (typeof MCQ_DATA_SEE === 'undefined' || !MCQ_DATA_SEE) {
                throw new Error("MCQ_DATA_SEE is undefined/missing.");
            }
            const allSubjectsExist = selectedSubjects.every(subj => MCQ_DATA_SEE.hasOwnProperty(subj));
            if (!allSubjectsExist) {
                 const missing = selectedSubjects.filter(subj => !MCQ_DATA_SEE.hasOwnProperty(subj));
                 throw new Error(`Data missing for subject(s): ${missing.join(', ')}`);
            }
            showUserFeedback("Init: Question Data Found");

            // --- SELECT QUESTIONS ---
            selectSessionQuestions(); // Has internal assertions
            showUserFeedback("Init: Returned from selectSessionQuestions");

            if (questionsForSession.length === 0) {
                // Should have been caught earlier, but double-check
                 throw new Error("No questions were selected.");
            }
            totalQuestions = questionsForSession.length;
            showUserFeedback(`Init: Total questions: ${totalQuestions}`);

            // --- POPULATE HTML ---
            populateQuestionList(); // Has internal assertions
            showUserFeedback("Init: Returned from populateQuestionList");

            if (!questionListDiv || questionListDiv.innerHTML.trim() === '') {
                 throw new Error("Question list div empty after population attempt.");
            }
            showUserFeedback("Init: Question list populated.");

            // --- START TIMER ---
            startTimer(); // Has internal assertion
            showUserFeedback("Init: Returned from startTimer");

            // --- ATTACH SUBMIT HANDLER ---
            if (quizForm) {
                quizForm.addEventListener('submit', handleSubmit);
                showUserFeedback("Init: Submit listener attached.");
            } else {
                 throw new Error("Cannot find quiz form element.");
            }

            // --- SUCCESS ---
            showUserFeedback("Init: SUCCESSFUL!", false, 2500); // Show success briefly
            // Final cleanup of title and visibility handled by the success message timeout

             if (quizTitleElement) quizTitleElement.textContent = `SEE MCQ Practice (${totalQuestions} Questions)`;

        } catch (error) {
            // If any error is thrown during initialization, display it permanently
            showUserFeedback(`Initialization failed: ${error.message}`, true);
        }
    }

    // --- Run Initialization ---
    initializeQuiz();

}); // End DOMContentLoaded

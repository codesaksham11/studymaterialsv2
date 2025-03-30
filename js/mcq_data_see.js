// js/mcq_quiz_see_script.js

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

    // --- Cookie Function ---
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // --- Error Handling ---
    function showError(message) {
        if (!errorMessageElement || !errorOverlay) return;
        errorMessageElement.textContent = message;
        errorOverlay.classList.add('visible');
        // Optionally hide quiz container parts if needed
        document.querySelectorAll('.quiz-container > *:not(.error-overlay)')?.forEach(el => {
            if (el) el.style.display = 'none'; // Hide instead of visibility
        });
    }

    // --- Utility: Shuffle Array (Fisher-Yates) ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    // --- Question Selection Logic ---
    function selectSessionQuestions() {
        questionsForSession = []; // Reset
        let availableQuestions = [];

        // 1. Gather questions from selected subjects
        selectedSubjects.forEach(subjectKey => {
            if (MCQ_DATA_SEE && MCQ_DATA_SEE[subjectKey]) {
                availableQuestions.push(...MCQ_DATA_SEE[subjectKey]);
            } else {
                console.warn(`No data found for subject: ${subjectKey}`);
            }
        });

        // 2. Shuffle all available questions
        availableQuestions = shuffleArray(availableQuestions);

        // 3. Select the target number, handling subject distribution if both selected
        if (selectedSubjects.length === 2) {
            // Aim for 50/50 split (roughly)
            const countPerSubject = Math.floor(targetQuestionCount / 2);
            const remainder = targetQuestionCount % 2; // Will be 0 or 1

            let scienceQs = availableQuestions.filter(q => q.id.startsWith('see_sci_')).slice(0, countPerSubject + remainder); // Science gets remainder
            let socialQs = availableQuestions.filter(q => q.id.startsWith('see_soc_')).slice(0, countPerSubject);

            questionsForSession = shuffleArray([...scienceQs, ...socialQs]); // Combine and shuffle again

            // Adjust if one subject doesn't have enough questions
            const shortFall = targetQuestionCount - questionsForSession.length;
            if (shortFall > 0) {
                 console.warn(`Could not select ${targetQuestionCount} questions. Trying to add more from available pool.`);
                 // Try to fill shortfall from the general pool (might skew balance slightly if one subject is very small)
                 const extraQuestions = availableQuestions.filter(q => !questionsForSession.some(sq => sq.id === q.id)).slice(0, shortFall);
                 questionsForSession.push(...extraQuestions);
                 questionsForSession = shuffleArray(questionsForSession); // Final shuffle
            }


        } else if (selectedSubjects.length === 1) {
            // Just take from the single selected subject pool
            questionsForSession = availableQuestions.slice(0, targetQuestionCount);
        }

        // Ensure we don't exceed requested count if source has fewer
        if(questionsForSession.length > targetQuestionCount) {
            questionsForSession = questionsForSession.slice(0, targetQuestionCount);
        }

        console.log(`Selected ${questionsForSession.length} questions for the session.`);
    }


    // --- HTML Generation ---
    function populateQuestionList() {
        if (!questionListDiv) return;
        questionListDiv.innerHTML = ''; // Clear previous
        let currentSubjectHeader = null;

        // Determine order (e.g., Science first if both selected)
        const displayOrder = questionsForSession.sort((a, b) => {
             // Simple sort: Science before Social
             if (a.id.startsWith('see_sci_') && b.id.startsWith('see_soc_')) return -1;
             if (a.id.startsWith('see_soc_') && b.id.startsWith('see_sci_')) return 1;
             return 0; // Keep same-subject order as shuffled
        });


        displayOrder.forEach((question, index) => {
            // Add Subject Header
             const questionSubject = question.id.startsWith('see_sci_') ? 'Science' : 'Social Studies';
             if (questionSubject !== currentSubjectHeader) {
                 const header = document.createElement('div');
                 header.classList.add('subject-header');
                 header.textContent = questionSubject + " Questions";
                 questionListDiv.appendChild(header);
                 currentSubjectHeader = questionSubject;
             }

            // Create Question Block
            const block = document.createElement('div');
            block.classList.add('question-block');
            block.id = `question-${question.id}`;

            const numberP = document.createElement('p');
            numberP.classList.add('question-number');
            numberP.textContent = `${index + 1}.`;

            const textP = document.createElement('p');
            textP.classList.add('question-text');
            textP.innerHTML = question.q; // Use innerHTML if question text might contain basic formatting

            const optionsDiv = document.createElement('div');
            optionsDiv.classList.add('options');

            // Shuffle options for display (optional, but good practice)
            const optionIndices = question.o.map((_, idx) => idx); // [0, 1, 2, 3]
            const shuffledOptionIndices = shuffleArray([...optionIndices]); // Shuffle a copy

            shuffledOptionIndices.forEach(optionIndex => {
                 const optionText = question.o[optionIndex];
                 const label = document.createElement('label');
                 label.classList.add('option-label');

                 const radio = document.createElement('input');
                 radio.type = 'radio';
                 radio.name = `q_${question.id}`;
                 radio.value = optionIndex; // Value is the ORIGINAL index

                 const span = document.createElement('span');
                 span.classList.add('option-text');
                 span.innerHTML = optionText; // Use innerHTML if options might have formatting

                 label.appendChild(radio);
                 label.appendChild(span);
                 optionsDiv.appendChild(label);
             });


            block.appendChild(numberP);
            block.appendChild(textP);
            block.appendChild(optionsDiv);
            questionListDiv.appendChild(block);
        });
    }

    // --- Timer Logic ---
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval); // Clear any existing timer
        updateTimerDisplay(); // Show initial time
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                 clearInterval(timerInterval);
                 handleTimeout();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        if (!timerDisplay) return;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `Time Left: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // --- Submission & Results Logic ---
    function handleSubmit(event) {
        if (event) event.preventDefault(); // Crucial to prevent page reload
        if (quizFinished) return;

        console.log("Quiz Submitted or Timed Out");
        quizFinished = true;
        clearInterval(timerInterval); // Stop timer

        let score = 0;
        if (!quizForm || !questionListDiv) return;
        quizForm.classList.add('quiz-results-mode'); // Add class to trigger result styling

        questionsForSession.forEach((question, index) => {
            const questionBlock = document.getElementById(`question-${question.id}`);
            if (!questionBlock) {
                console.warn(`Could not find block for question ${question.id}`);
                return; // Skip if block not found
            }
            const selectedRadio = quizForm.querySelector(`input[name="q_${question.id}"]:checked`);
            const options = questionBlock.querySelectorAll('.option-label'); // Get labels

            let userAnswerIndex = -1; // Use -1 to indicate skipped
            if (selectedRadio) {
                userAnswerIndex = parseInt(selectedRadio.value, 10);
            }

            options.forEach((label) => {
                // Find the corresponding input within the label to get its value
                const radioInput = label.querySelector('input[type="radio"]');
                if (!radioInput) return;
                const optionIndex = parseInt(radioInput.value, 10);

                // Mark correct answer
                if (optionIndex === question.a) {
                    label.classList.add('correct-answer');
                }
                // Mark user's choice
                if (optionIndex === userAnswerIndex) {
                    label.classList.add('user-selected'); // Add this regardless
                    if(userAnswerIndex === question.a) {
                         label.classList.add('user-correct');
                         score++;
                    } else {
                         label.classList.add('user-incorrect');
                    }
                } else if (userAnswerIndex === -1 && optionIndex === question.a) {
                    // If skipped, still highlight the correct answer but don't mark user incorrect
                }
            });
        });

        displayResultsSummary(score);

        // Hide submit button
        if(submitArea) submitArea.style.display = 'none';
         // Scroll to top automatically to show results
         window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function displayResultsSummary(score) {
         if (!resultsSummaryDiv || !resultsTitle || !resultsScoreP || !resultsTimeP || !resultsMessageP || !resultsBackButton) return;

        const timeElapsed = targetTimeLimit * 60 - timeLeft;
        const minutes = Math.max(0, Math.floor(timeElapsed / 60)); // Ensure non-negative
        const seconds = Math.max(0, timeElapsed % 60);
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        resultsTitle.textContent = (timeLeft <= 0) ? "Time Out!" : "Quiz Finished!";
        resultsScoreP.textContent = `Score: ${score} / ${totalQuestions}`;
        resultsTimeP.textContent = `Time Taken: ${timeString}`;

        // Motivational Message
        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
        let message = "";
        let messageColor = "#333";
        if (percentage >= 90) { message = "Excellent! You're crushing these MCQs!"; messageColor = "#28a745"; }
        else if (percentage >= 70) { message = "Great job! Almost perfect, keep practicing!"; messageColor = "#17a2b8"; }
        else if (percentage >= 50) { message = "Good effort! Keep working on it."; messageColor = "#ffc107"; }
        else if (percentage >= 30) { message = "Average performance. Needs more effort."; messageColor = "#fd7e14"; }
        else { message = "Keep practicing! More effort needed."; messageColor = "#dc3545"; }

        resultsMessageP.textContent = message;
        resultsMessageP.style.color = messageColor;

        resultsSummaryDiv.style.display = 'block'; // Show summary

         // Add event listener for the results back button
         resultsBackButton.onclick = () => {
             window.location.href = 'mcq_setup_see.html'; // Go back to setup
         };
    }

    // --- Timeout Handler ---
     function handleTimeout() {
         if (!quizFinished) { // Only trigger if not already manually submitted
            console.log("Time Ran Out!");
            // We need to ensure the form submission logic runs to calculate score for answered questions
            handleSubmit(); // Trigger submit process (calculates score, shows results)
            // Explicitly set the title to Time Out after score calculation
             if(resultsTitle) resultsTitle.textContent = "Time Out!";
         }
     }

    // --- Initialization ---
    function initializeQuiz() {
        console.log("Initializing Quiz..."); // Debug log

        // 1. **TEMP: Bypass Security Check for Testing**
         console.warn("SECURITY CHECK BYPASSED FOR TESTING");
        // if (getCookie('mcq_see') !== 'unlocked') {
        //     showError("Access Denied (Code 102). Please ensure MCQ SEE access is unlocked.");
        //     return;
        // }

        // 2. Get Parameters & Validate
        const urlParams = new URLSearchParams(window.location.search);
        targetQuestionCount = parseInt(urlParams.get('count'), 10);
        targetTimeLimit = parseInt(urlParams.get('time'), 10);
        const subjectsParam = urlParams.get('subjects');

        // Basic validation (add more robust checks if needed)
        if (isNaN(targetQuestionCount) || targetQuestionCount < 10 || isNaN(targetTimeLimit) || targetTimeLimit < 1 || !subjectsParam) {
             showError("Invalid parameters received from setup page. Please go back and try again.");
             return;
        }

        timeLeft = targetTimeLimit * 60; // Convert minutes to seconds
        selectedSubjects = subjectsParam.split(',');
        if (selectedSubjects.length === 0) {
             showError("No subjects selected. Please go back and select at least one subject.");
             return;
        }

        console.log(`Params: Count=${targetQuestionCount}, Time=${targetTimeLimit}m, Subjects=${selectedSubjects}`);

        // 3. Load & Select Questions
        if (typeof MCQ_DATA_SEE === 'undefined') {
             showError("Error: Question data could not be loaded.");
             return;
        }
        selectSessionQuestions();
        if (questionsForSession.length === 0) {
             showError("Could not find questions for the selected subject(s) or count.");
             return;
        }
        totalQuestions = questionsForSession.length; // Actual number selected

        // Update title to reflect actual count
        if (quizTitleElement) quizTitleElement.textContent = `SEE MCQ Practice (${totalQuestions} Questions)`;

        // 4. Generate Quiz HTML
        populateQuestionList();
        if (!questionListDiv || questionListDiv.innerHTML === '') {
             showError("Failed to generate question list.");
             return;
        }


        // 5. Start Timer
        startTimer();


        // 6. Add Form Submit Listener
         if(quizForm) {
            quizForm.addEventListener('submit', handleSubmit);
            console.log("Submit listener attached.");
         } else {
             console.error("Could not find quiz form element.");
             showError("Initialization error: Form not found.");
             return;
         }

         console.log("Quiz Initialized Successfully.");
    }

    // --- Run Initialization ---
    initializeQuiz();

}); // End DOMContentLoaded

// js/mcq_quiz_see_script.js
// Revised Version with enhanced error handling and temporary debug displays

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
    function getCookie(name) { const nameEQ = name + "="; const ca = document.cookie.split(';'); for (let i = 0; i < ca.length; i++) { let c = ca[i]; while (c.charAt(0) === ' ') c = c.substring(1, c.length); if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length); } return null; }

    // --- Error Handling ---
    function showError(message) {
        console.error("Quiz Error:", message); // Log error for debugging if possible
        if (!errorMessageElement || !errorOverlay) return;
        errorMessageElement.textContent = message;
        errorOverlay.classList.add('visible');
        // Hide all direct children of quiz-container except the error overlay
        document.querySelectorAll('.quiz-container > *:not(.error-overlay)')?.forEach(el => {
             if (el) el.style.visibility = 'hidden'; // Use visibility to keep layout space
        });
    }

    // --- Utility: Shuffle Array (Fisher-Yates) ---
    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }

    // --- Question Selection Logic ---
    function selectSessionQuestions() {
        console.log("Selecting questions for subjects:", selectedSubjects);
        questionsForSession = [];
        let availableQuestions = [];

        selectedSubjects.forEach(subjectKey => {
            try {
                if (MCQ_DATA_SEE && MCQ_DATA_SEE[subjectKey] && Array.isArray(MCQ_DATA_SEE[subjectKey])) {
                    console.log(`Found ${MCQ_DATA_SEE[subjectKey].length} questions for ${subjectKey}`);
                    // Use spread operator carefully, ensuring data is array
                    availableQuestions.push(...MCQ_DATA_SEE[subjectKey]);
                } else {
                    console.warn(`No valid data array found for subject key: ${subjectKey}`);
                }
            } catch (error) {
                console.error(`Error processing subject data for key ${subjectKey}:`, error);
                // Continue to next subject even if one fails
            }
        });

        if (availableQuestions.length === 0) {
             console.warn("No questions available after checking subjects.");
             return; // Exit early if no questions found at all
        }

        availableQuestions = shuffleArray(availableQuestions);
        console.log(`Total available shuffled questions: ${availableQuestions.length}`);

        // Simplified selection logic: just take the required count from the shuffled pool
        // This bypasses the complex per-subject splitting logic which might have edge cases
        // We can restore the more complex logic later if needed
        questionsForSession = availableQuestions.slice(0, targetQuestionCount);


        // --- Keep the original complex logic commented out for reference ---
        /*
        if (selectedSubjects.length === 2) {
            const countPerSubject = Math.floor(targetQuestionCount / 2);
            const remainder = targetQuestionCount % 2;
            let scienceQs = availableQuestions.filter(q => q.id.startsWith('see_sci_')).slice(0, countPerSubject + remainder);
            let socialQs = availableQuestions.filter(q => q.id.startsWith('see_soc_')).slice(0, countPerSubject);
            questionsForSession = shuffleArray([...scienceQs, ...socialQs]);
            const shortFall = targetQuestionCount - questionsForSession.length;
            if (shortFall > 0) {
                console.warn(`Could not select ${targetQuestionCount} questions initially (${questionsForSession.length}). Trying to add ${shortFall} more.`);
                const existingIds = new Set(questionsForSession.map(q => q.id));
                const extraQuestions = availableQuestions.filter(q => !existingIds.has(q.id)).slice(0, shortFall);
                questionsForSession.push(...extraQuestions);
                questionsForSession = shuffleArray(questionsForSession);
            }
        } else if (selectedSubjects.length === 1) {
            questionsForSession = availableQuestions.slice(0, targetQuestionCount);
        }

        // Final trim just in case (shouldn't be strictly needed with slice)
        if(questionsForSession.length > targetQuestionCount) {
            questionsForSession = questionsForSession.slice(0, targetQuestionCount);
        }
        */
        // --- End of commented out original logic ---

        console.log(`Selected ${questionsForSession.length} questions for the session.`);
    }

    // --- HTML Generation ---
    function populateQuestionList() {
        if (!questionListDiv) {
             console.error("Cannot find question list div (#question-list)");
             return;
        }
        questionListDiv.innerHTML = ''; // Clear previous content
        let currentSubjectHeader = null;

        // Sort for display (Science first)
        const displayOrder = [...questionsForSession].sort((a, b) => {
             const aIsSci = a.id.startsWith('see_sci_');
             const bIsSci = b.id.startsWith('see_sci_');
             if (aIsSci && !bIsSci) return -1;
             if (!aIsSci && bIsSci) return 1;
             return 0; // Keep original order within same subject
        });

        displayOrder.forEach((question, index) => {
            try { // Add try...catch around each question's processing
                if (!question || typeof question.id === 'undefined' || typeof question.q === 'undefined' || !Array.isArray(question.o) || typeof question.a === 'undefined') {
                    console.warn(`Skipping malformed question object at index ${index}:`, question);
                    return; // Skip this iteration if question data is bad
                }

                const questionSubject = question.id.startsWith('see_sci_') ? 'Science' : 'Social Studies';

                // Add subject header if it changes
                if (questionSubject !== currentSubjectHeader) {
                    const header = document.createElement('div');
                    header.classList.add('subject-header');
                    header.textContent = questionSubject + " Questions";
                    questionListDiv.appendChild(header);
                    currentSubjectHeader = questionSubject;
                }

                // Create question block elements
                const block = document.createElement('div');
                block.classList.add('question-block');
                block.id = `question-${question.id}`;

                const numberP = document.createElement('p');
                numberP.classList.add('question-number');
                numberP.textContent = `${index + 1}.`;

                const textP = document.createElement('p');
                textP.classList.add('question-text');
                textP.innerHTML = question.q; // Use innerHTML if questions have formatting

                const optionsDiv = document.createElement('div');
                optionsDiv.classList.add('options');

                // Shuffle option display order
                const optionIndices = question.o.map((_, idx) => idx);
                const shuffledOptionIndices = shuffleArray([...optionIndices]);

                shuffledOptionIndices.forEach(optionIndex => {
                    const optionText = question.o[optionIndex];
                    const label = document.createElement('label');
                    label.classList.add('option-label');

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `q_${question.id}`; // Use question ID for unique group name
                    radio.value = optionIndex; // Value is the original index

                    const span = document.createElement('span');
                    span.classList.add('option-text');
                    span.innerHTML = optionText; // Use innerHTML if options have formatting

                    label.appendChild(radio);
                    label.appendChild(span);
                    optionsDiv.appendChild(label);
                });

                block.appendChild(numberP);
                block.appendChild(textP);
                block.appendChild(optionsDiv);
                questionListDiv.appendChild(block);

            } catch (error) {
                console.error(`Error populating HTML for question index ${index} (ID: ${question?.id}):`, error);
                // Continue to the next question even if one fails to render
            }
        });
         console.log("Finished populating question list HTML.");
    }

    // --- Timer Logic ---
    function startTimer() { if (timerInterval) clearInterval(timerInterval); updateTimerDisplay(); timerInterval = setInterval(() => { timeLeft--; updateTimerDisplay(); if (timeLeft <= 0) { clearInterval(timerInterval); handleTimeout(); } }, 1000); }
    function updateTimerDisplay() { if (!timerDisplay) return; const minutes = Math.floor(timeLeft / 60); const seconds = timeLeft % 60; timerDisplay.textContent = `Time Left: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; }

    // --- Submission & Results Logic ---
    function handleSubmit(event) {
        if (event) event.preventDefault();
        if (quizFinished) return;
        console.log("Quiz Submitted or Timed Out");
        quizFinished = true;
        clearInterval(timerInterval);
        if(submitButton) submitButton.disabled = true; // Disable button

        let score = 0;
        if (!quizForm || !questionListDiv) {
            console.error("Cannot find form or question list for submission.");
            return;
        }

        quizForm.classList.add('quiz-results-mode'); // Add class for results styling

        questionsForSession.forEach((question) => {
             try { // Add try-catch here too for robustness
                const questionBlock = document.getElementById(`question-${question.id}`);
                if (!questionBlock) {
                    console.warn(`Could not find block for question ${question.id} during submission.`);
                    return; // Skip if block not found
                }

                const selectedRadio = quizForm.querySelector(`input[name="q_${question.id}"]:checked`);
                const options = questionBlock.querySelectorAll('.option-label');
                let userAnswerIndex = -1;

                if (selectedRadio) {
                    userAnswerIndex = parseInt(selectedRadio.value, 10);
                }

                options.forEach((label) => {
                    const radioInput = label.querySelector('input[type="radio"]'); // Find the radio inside label
                    if (!radioInput) return;
                    const optionIndex = parseInt(radioInput.value, 10);

                    // Reset classes first
                    label.classList.remove('correct-answer', 'user-selected', 'user-correct', 'user-incorrect');

                    // Mark correct answer
                    if (optionIndex === question.a) {
                        label.classList.add('correct-answer');
                    }

                    // Mark user's selection and correctness
                    if (optionIndex === userAnswerIndex) {
                        label.classList.add('user-selected');
                        if (userAnswerIndex === question.a) {
                            label.classList.add('user-correct');
                            score++; // Increment score only for correct selections
                        } else {
                            label.classList.add('user-incorrect');
                        }
                    }
                });
             } catch (error) {
                 console.error(`Error processing results for question ID ${question?.id}:`, error);
             }
        });

        displayResultsSummary(score);
        if (submitArea) submitArea.style.display = 'none'; // Hide submit button area
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to show results
    }

    // --- Display Results Summary ---
    function displayResultsSummary(score) {
        if (!resultsSummaryDiv || !resultsTitle || !resultsScoreP || !resultsTimeP || !resultsMessageP || !resultsBackButton) {
             console.error("Cannot find all results summary elements.");
             return;
        }

        const timeElapsed = targetTimeLimit * 60 - Math.max(0, timeLeft); // Ensure timeElapsed isn't negative
        const minutes = Math.max(0, Math.floor(timeElapsed / 60));
        const seconds = Math.max(0, timeElapsed % 60);
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        resultsTitle.textContent = (timeLeft <= 0 && !quizFinished) ? "Time Out!" : "Quiz Finished!";
        resultsScoreP.textContent = `Score: ${score} / ${totalQuestions}`; // Use totalQuestions from init
        resultsTimeP.textContent = `Time Taken: ${timeString}`;

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

        resultsSummaryDiv.style.display = 'block'; // Show results area
        resultsBackButton.onclick = () => { window.location.href = 'mcq_setup_see.html'; };
    }


    // --- Timeout Handler ---
    function handleTimeout() { if (!quizFinished) { console.log("Time Ran Out!"); handleSubmit(); // Call submit logic if not already finished if(resultsTitle) resultsTitle.textContent = "Time Out!"; // Ensure title shows Time Out } }

    // --- Initialization ---
    function initializeQuiz() {
        console.log("Initializing Quiz...");
        // TEMP: Bypass Security Check (Keep bypassed as per original)
        console.warn("SECURITY CHECK BYPASSED FOR TESTING");
        // if (getCookie('mcq_see') !== 'unlocked') {
        //     showError("Access Denied (Code 102). Please ensure MCQ SEE access is unlocked.");
        //     return;
        // }

        const urlParams = new URLSearchParams(window.location.search);
        targetQuestionCount = parseInt(urlParams.get('count'), 10);
        targetTimeLimit = parseInt(urlParams.get('time'), 10);
        const subjectsParam = urlParams.get('subjects');

        // --- TEMPORARY DEBUG DISPLAY ---
        let debugInfo = `Params: Count=${targetQuestionCount || 'N/A'}, Time=${targetTimeLimit || 'N/A'}, Subjects=${subjectsParam || 'N/A'}`;
        if (quizTitleElement) quizTitleElement.textContent = debugInfo; // Show params briefly
        // --- END TEMP DEBUG ---


        if (isNaN(targetQuestionCount) || targetQuestionCount < 1 || isNaN(targetTimeLimit) || targetTimeLimit < 1 || !subjectsParam) { // Allow count >= 1 internally now
            showError(`Invalid parameters received. Count: ${targetQuestionCount}, Time: ${targetTimeLimit}, Subjects: ${subjectsParam}. Please go back and try again.`);
            return;
        }

        // Validate count against practical limits (e.g., setup page limits) after parsing
        if (targetQuestionCount < 10 || targetQuestionCount > 100) {
             console.warn(`Requested question count ${targetQuestionCount} is outside the typical range (10-100). Proceeding anyway.`);
             // Or show error: showError(`Question count (${targetQuestionCount}) must be between 10 and 100.`); return;
        }


        timeLeft = targetTimeLimit * 60;
        selectedSubjects = subjectsParam.split(',').filter(s => s.trim() !== ''); // Ensure no empty strings

        if (selectedSubjects.length === 0) {
            showError("No valid subjects selected. Please go back and select at least one subject.");
            return;
        }

        console.log(`Processed Params: Count=${targetQuestionCount}, Time=${targetTimeLimit}m, Subjects=${selectedSubjects}`);

        if (typeof MCQ_DATA_SEE === 'undefined') {
            showError("Error: Question data (MCQ_DATA_SEE) could not be loaded. Check js/mcq_data_see.js.");
            return;
        }

        selectSessionQuestions(); // Select the questions based on params

        // --- TEMPORARY DEBUG DISPLAY 2 ---
        debugInfo += ` | Selected: ${questionsForSession.length}`;
        if (quizTitleElement) quizTitleElement.textContent = debugInfo; // Update title with selected count
         // You might want to set the actual title after a short delay or remove this debug line later
        setTimeout(() => {
             if (quizTitleElement) quizTitleElement.textContent = `SEE MCQ Practice (${totalQuestions} Questions)`;
        }, 1000); // Reset title after 1 second
        // --- END TEMP DEBUG 2 ---


        if (questionsForSession.length === 0) {
            showError("Could not find enough questions for the selected subject(s) and count. Check data or criteria.");
            return;
        }

        totalQuestions = questionsForSession.length; // Set actual total based on selection

        // Update title properly (moved timing above)
        // if (quizTitleElement) quizTitleElement.textContent = `SEE MCQ Practice (${totalQuestions} Questions)`;

        populateQuestionList(); // Generate the HTML for the questions

        if (!questionListDiv || questionListDiv.innerHTML.trim() === '') {
             // Check if empty AFTER population attempt
             showError("Failed to generate question list HTML, even though questions were selected.");
             return;
        }


        startTimer(); // Start the countdown

        if (quizForm) {
            quizForm.addEventListener('submit', handleSubmit);
            console.log("Submit listener attached.");
        } else {
            console.error("Could not find quiz form element (#quiz-form).");
            showError("Initialization error: Form element not found.");
            return;
        }

        console.log("Quiz Initialized Successfully.");
    }

    // --- Run Initialization ---
    initializeQuiz();

}); // End DOMContentLoaded

// js/mcq_quiz_see_script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // Get references to all needed elements (timer, title, form, question-list, submit-area, results-summary, error-overlay etc.)

    // --- State Variables ---
    let timerInterval;
    let timeLeft = 0;
    let totalQuestions = 0;
    let targetQuestionCount = 0; // Requested count
    let targetTimeLimit = 0; // Requested time
    let selectedSubjects = []; // Array of subject strings ('science', 'social')
    let questionsForSession = []; // The actual questions selected
    let quizFinished = false;

    // --- Cookie Function (Same as before) ---
    function getCookie(name) { /* ... */ }

    // --- Error Handling (Same as before) ---
    function showError(message) { /* ... */ }

    // --- Initialization ---
    function initializeQuiz() {
        // 1. Security Check (Layer 3)
        if (getCookie('mcq_see') !== 'unlocked') {
            showError("Access Denied (Code 102). Please ensure MCQ SEE access is unlocked.");
            return;
        }

        // 2. Get Parameters & Validate
        const urlParams = new URLSearchParams(window.location.search);
        targetQuestionCount = parseInt(urlParams.get('count'), 10);
        targetTimeLimit = parseInt(urlParams.get('time'), 10);
        const subjectsParam = urlParams.get('subjects');
        // ... (Add validation checks as in setup page) ...
        timeLeft = targetTimeLimit * 60;
        selectedSubjects = subjectsParam ? subjectsParam.split(',') : [];
        if (selectedSubjects.length === 0) { /* ... show error ... */ }

        // 3. Load & Select Questions
        if (typeof MCQ_DATA_SEE === 'undefined') { /* ... show error ... */ }
        selectSessionQuestions(); // New selection logic
        if (questionsForSession.length === 0) { /* ... show error ... */ }
        totalQuestions = questionsForSession.length; // Actual number might be less if insufficient data

        // 4. Generate Quiz HTML
        populateQuestionList();

        // 5. Start Timer
        startTimer();
        updateTimerDisplay();

        // 6. Add Form Submit Listener
        document.getElementById('quiz-form').addEventListener('submit', handleSubmit);
    }

    // --- Question Selection Logic ---
    function selectSessionQuestions() {
        // ... (Implement logic based on selectedSubjects and targetQuestionCount)
        // ... (Use shuffleArray helper)
        // ... (Handle 50/50 split for Science/Social if both selected)
        // ... (Set questionsForSession array)
    }

    // --- HTML Generation ---
    function populateQuestionList() {
        const questionListDiv = document.getElementById('question-list');
        questionListDiv.innerHTML = ''; // Clear previous
        let currentSubjectHeader = null;

        questionsForSession.forEach((question, index) => {
            // --- Add Subject Header if needed ---
             const questionSubject = question.id.startsWith('see_sci_') ? 'Science' : 'Social Studies'; // Determine subject from ID prefix
             if (questionSubject !== currentSubjectHeader) {
                 const header = document.createElement('div');
                 header.classList.add('subject-header');
                 header.textContent = questionSubject + " Questions";
                 questionListDiv.appendChild(header);
                 currentSubjectHeader = questionSubject;
             }

            // --- Create Question Block ---
            const block = document.createElement('div');
            block.classList.add('question-block');
            block.id = `question-${question.id}`; // Use question ID for targeting later

            const numberP = document.createElement('p');
            numberP.classList.add('question-number');
            numberP.textContent = `${index + 1}.`;

            const textP = document.createElement('p');
            textP.classList.add('question-text');
            textP.textContent = question.q;

            const optionsDiv = document.createElement('div');
            optionsDiv.classList.add('options');

            question.o.forEach((optionText, optionIndex) => {
                const label = document.createElement('label');
                label.classList.add('option-label');

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `q_${question.id}`; // Group radios by question ID
                radio.value = optionIndex; // Value is the index

                const span = document.createElement('span');
                span.classList.add('option-text');
                span.textContent = optionText;

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
    function startTimer() { /* ... (Same as before) ... */ }
    function updateTimerDisplay() { /* ... (Same as before) ... */ }

    // --- Submission & Results Logic ---
    function handleSubmit(event) {
        if(event) event.preventDefault(); // Prevent form reload if triggered by button
        if (quizFinished) return; // Prevent double submission

        quizFinished = true;
        clearInterval(timerInterval); // Stop timer

        let score = 0;
        const form = document.getElementById('quiz-form');
        form.classList.add('quiz-results-mode'); // Add class to trigger result styling

        questionsForSession.forEach((question, index) => {
            const questionBlock = document.getElementById(`question-${question.id}`);
            const selectedRadio = form.querySelector(`input[name="q_${question.id}"]:checked`);
            const options = questionBlock.querySelectorAll('.option-label');

            let userAnswerIndex = -1;
            if (selectedRadio) {
                userAnswerIndex = parseInt(selectedRadio.value, 10);
            }

            options.forEach((label, optionIndex) => {
                // Mark correct answer
                if (optionIndex === question.a) {
                    label.classList.add('correct-answer');
                }
                // Mark user's choice
                if (optionIndex === userAnswerIndex) {
                    label.classList.add('user-selected'); // Should be user-correct or user-incorrect
                    if(userAnswerIndex === question.a) {
                         label.classList.add('user-correct');
                         score++;
                    } else {
                         label.classList.add('user-incorrect');
                    }
                }
            });
        });

        displayResultsSummary(score);

        // Hide submit button
        document.getElementById('submit-area').style.display = 'none';
    }

    function displayResultsSummary(score) {
        const summaryDiv = document.getElementById('results-summary');
        const title = document.getElementById('results-title');
        const scoreP = document.getElementById('results-score');
        const timeP = document.getElementById('results-time');
        const messageP = document.getElementById('results-message');

        const timeElapsed = targetTimeLimit * 60 - timeLeft;
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        title.textContent = (timeLeft <= 0 && !quizFinished) ? "Time Out!" : "Quiz Finished!"; // Check if timer forced finish
        scoreP.textContent = `Score: ${score} / ${totalQuestions}`;
        timeP.textContent = `Time Taken: ${timeString}`;

        // --- Motivational Message ---
        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
        let message = "";
        let messageColor = "#333"; // Default
        if (percentage >= 90) { message = "Excellent! You're crushing these MCQs!"; messageColor = "#28a745"; }
        else if (percentage >= 70) { message = "Great job! Almost perfect, keep practicing!"; messageColor = "#17a2b8"; }
        else if (percentage >= 50) { message = "Good effort! Keep working on it."; messageColor = "#ffc107"; }
        else if (percentage >= 30) { message = "Average performance. Needs more effort."; messageColor = "#fd7e14"; }
        else { message = "Keep practicing! More effort needed."; messageColor = "#dc3545"; }

        messageP.textContent = message;
        messageP.style.color = messageColor;

        summaryDiv.style.display = 'block'; // Show summary
        summaryDiv.scrollIntoView({ behavior: 'smooth' }); // Scroll to top to show summary
    }


    // --- Timeout ---
     function handleTimeout() {
         if (!quizFinished) { // Only trigger if not already submitted
            console.log("Time Ran Out!");
            handleSubmit(); // Trigger submit process
            // Adjust title after handleSubmit sets quizFinished
            document.getElementById('results-title').textContent = "Time Out!";
         }
     }
     // Adjust timer logic slightly:
     function startTimer() {
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                 clearInterval(timerInterval); // Stop timer immediately
                 handleTimeout(); // Handle timeout logic
            }
        }, 1000);
    }


    // --- Start Initialization ---
    initializeQuiz();

}); // End DOMContentLoaded

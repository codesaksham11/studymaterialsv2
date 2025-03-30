/* --- RESULTS FEEDBACK STYLING --- */

/* Add this class to the question list or form when showing results */
.results-mode .options {
    pointer-events: none; /* Disable clicking options after submit */
}
.results-mode .option-label {
    cursor: default;
    background-color: #fff; /* Reset hover effect */
    opacity: 0.7; /* Slightly fade unselected/non-correct options */
    border-color: #ccc;
    transition: opacity 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
    position: relative; /* Needed for potential pseudo-elements (icons) */
    padding-left: 40px; /* Make space for an icon */
}

/* Hide the actual radio button visually in results mode */
.results-mode .option-label input[type="radio"] {
    opacity: 0;
    position: absolute;
    left: -9999px; /* Move off-screen */
}

/* General style for the icon placeholder */
.results-mode .option-label::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #ccc;
    background-color: #fff;
    text-align: center;
    font-weight: bold;
    line-height: 18px; /* Adjust line height for centering content */
    font-size: 14px;    /* Font size for check/cross */
    color: white;      /* Text color for check/cross */
    box-sizing: border-box;
}


/* Correct Answer Styling */
.results-mode .option-label.correct-answer {
    border-color: #28a745; /* Green border */
    background-color: #e9f7ef; /* Light green background */
    opacity: 1; /* Ensure correct answer is fully visible */
    /* font-weight: bold; */ /* Optional: make text bold */
}
.results-mode .option-label.correct-answer::before {
    content: '\2714'; /* Check mark */
    background-color: #28a745;
    border-color: #28a745;
}

/* User's Incorrect Selection Styling */
.results-mode .option-label.user-incorrect {
    border-color: #dc3545; /* Red border */
    background-color: #fce8eA; /* Light red background */
    opacity: 1; /* Ensure user's incorrect choice is fully visible */
}
/* Add cross mark specifically if user was incorrect */
.results-mode .option-label.user-incorrect.user-selected::before {
     content: '\2718'; /* Cross mark */
     background-color: #dc3545;
     border-color: #dc3545;
}


/* Ensure user's correct choice also gets full opacity and checkmark */
.results-mode .option-label.user-correct.correct-answer {
     opacity: 1;
}
/* Style for user's correct choice indicator (might be redundant if correct-answer is styled) */
.results-mode .option-label.user-correct.user-selected::before {
    /* Checkmark is already applied by .correct-answer */
}


/* --- Ensure Results Summary is Positioned Well --- */
/* (Make sure your existing .results-summary styles work) */
.results-summary {
    /* Existing styles like padding, background, border-bottom etc. */
     margin-bottom: 20px; /* Add some space between summary and questions */
}

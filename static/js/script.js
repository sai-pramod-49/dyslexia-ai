// DOM Elements
const modeSelection = document.getElementById('mode-selection');
const practiceArea = document.getElementById('practice-area');
const resultsArea = document.getElementById('results-area');
const conversationContainer = document.getElementById('conversation-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const restartBtn = document.getElementById('restart-btn');

// Mode specific elements
const mode1Content = document.getElementById('mode-1-content');
const mode2Content = document.getElementById('mode-2-content');
const mode3Content = document.getElementById('mode-3-content');
const questionText = document.getElementById('question-text');
const choicesContainer = document.getElementById('choices-container');
const displayWord = document.getElementById('display-word');
const recordBtn = document.getElementById('record-btn');
const displayImage = document.getElementById('display-image');
const timeRemaining = document.getElementById('time-remaining');

// Results elements
const finalScore = document.getElementById('final-score');
const questionsCompleted = document.getElementById('questions-completed');
const finalFeedback = document.getElementById('final-feedback');

// State variables
let currentMode = null;
let currentQuestion = null;
let timerInterval = null;
let startTime = null;
let recognitionActive = false;
let recognition = null;

// Initialize Web Speech API
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.trim();
        userInput.value = transcript;
        recognitionActive = false;
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        addMessage('I couldn\'t hear that. Could you try again?', 'assistant');
        recognitionActive = false;
    };
    
    recognition.onend = function() {
        micBtn.textContent = '🎤';
        recognitionActive = false;
    };
} else {
    micBtn.style.display = 'none';
    console.warn('Speech recognition not supported');
}

// Event Listeners
document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => {
        const mode = button.getAttribute('data-mode');
        selectMode(mode);
    });
});

sendBtn.addEventListener('click', sendUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendUserInput();
    }
});

micBtn.addEventListener('click', toggleSpeechRecognition);
recordBtn.addEventListener('click', startRecording);
restartBtn.addEventListener('click', resetApplication);

// Functions
function selectMode(mode) {
    currentMode = mode;
    
    // Hide mode selection, show practice area
    modeSelection.classList.add('hidden');
    practiceArea.classList.remove('hidden');
    
    // Reset conversation
    conversationContainer.innerHTML = '';
    
    // Send mode selection to server
    fetch('/select_mode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `mode=${mode}`
    })
    .then(response => response.json())
    .then(data => {
        // Display greeting
        addMessage(data.greeting, 'assistant');
        playAudio(data.speech_url);
        
        // Setup mode-specific content
        showModeContent(mode);
        
        // Set current question
        currentQuestion = data.question;
        displayCurrentQuestion();
    })
    .catch(error => {
        console.error('Error selecting mode:', error);
        addMessage('Sorry, there was an error selecting the mode. Please try again.', 'assistant');
    });
}

function showModeContent(mode) {
    // Hide all mode content
    mode1Content.classList.add('hidden');
    mode2Content.classList.add('hidden');
    mode3Content.classList.add('hidden');
    
    // Show selected mode content
    if (mode === '1') {
        mode1Content.classList.remove('hidden');
    } else if (mode === '2') {
        mode2Content.classList.remove('hidden');
    } else if (mode === '3') {
        mode3Content.classList.remove('hidden');
    }
}

function displayCurrentQuestion() {
    if (!currentQuestion) return;
    
    if (currentMode === '1') {
        // Mode 1: Phonological Dyslexia
        questionText.textContent = currentQuestion.question;
        choicesContainer.innerHTML = '';
        
        currentQuestion.choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice;
            button.addEventListener('click', () => {
                userInput.value = choice;
                sendUserInput();
            });
            choicesContainer.appendChild(button);
        });
        
    } else if (currentMode === '2') {
        // Mode 2: Surface Dyslexia
        displayWord.textContent = currentQuestion.word;
        
    } else if (currentMode === '3') {
        // Mode 3: Rapid Naming Deficit
        displayImage.src = currentQuestion.image;
        displayImage.alt = currentQuestion.category;
        
        // Set timer based on difficulty
        let seconds = 5; // Default easy
        if (currentQuestion.difficulty.toLowerCase() === 'medium') {
            seconds = 10;
        } else if (currentQuestion.difficulty.toLowerCase() === 'hard') {
            seconds = 15;
        }
        
        startTimer(seconds);
    }
}

function startTimer(seconds) {
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Set start time and display initial time
    startTime = new Date();
    timeRemaining.textContent = seconds;
    
    // Start the countdown
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((new Date() - startTime) / 1000);
        const remaining = seconds - elapsed;
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            timeRemaining.textContent = '0';
            addMessage("Time's up! What's your answer?", 'assistant');
        } else {
            timeRemaining.textContent = remaining;
        }
    }, 1000);
}

function toggleSpeechRecognition() {
    if (recognitionActive) {
        // Stop speech recognition
        recognition.stop();
        micBtn.textContent = '🎤';
        recognitionActive = false;
    } else {
        // Start speech recognition
        recognition.start();
        micBtn.textContent = '⏹️';
        recognitionActive = true;
    }
}

function startRecording() {
    // This is specifically for Mode 2 where we need to record pronunciation
    if (recognitionActive) return;
    
    recordBtn.disabled = true;
    recordBtn.textContent = 'Listening...';
    
    recognition.start();
    recognitionActive = true;
    
    recognition.onend = function() {
        recordBtn.disabled = false;
        recordBtn.textContent = 'Record Pronunciation';
        recognitionActive = false;
        
        // Send the transcript to be processed
        if (userInput.value) {
            sendUserInput();
        }
    };
}

function sendUserInput() {
    const text = userInput.value.trim();
    if (!text) return;
    
    // Add user message to conversation
    addMessage(text, 'user');
    
    // Send to server for processing
    fetch('/process_response', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `response=${encodeURIComponent(text)}`
    })
    .then(response => response.json())
    .then(data => {
        // Display AI response
        addMessage(data.response, 'assistant');
        playAudio(data.speech_url);
        
        // Check if we should move to next question
        if (data.next_question) {
            currentQuestion = data.next_question;
            displayCurrentQuestion();
        }
        
        // Check if we've reached the end of a mode
        if (data.end_of_mode) {
            showResults(data.score, data.question_count);
        }
    })
    .catch(error => {
        console.error('Error processing response:', error);
        addMessage('Sorry, there was an error processing your response. Please try again.', 'assistant');
    });
    
    // Clear input field
    userInput.value = '';
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    conversationContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    conversationContainer.scrollTop = conversationContainer.scrollHeight;
}

function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}

function showResults(score, questionCount) {
    // Hide practice area, show results
    practiceArea.classList.add('hidden');
    resultsArea.classList.remove('hidden');
    
    // Display results
    finalScore.textContent = score;
    questionsCompleted.textContent = questionCount;
    
    // Generate feedback based on score and mode
    let feedback = '';
    const scorePercentage = (score / (questionCount * 3)) * 100; // Assuming max 3 points per question
    
    if (scorePercentage >= 80) {
        feedback = 'Great job! You showed excellent skills in this practice.';
    } else if (scorePercentage >= 60) {
        feedback = 'Good work! You\'re making solid progress with your skills.';
    } else {
        feedback = 'Keep practicing! Everyone improves with regular practice.';
    }
    
    finalFeedback.textContent = feedback;
    
    // Send completion to server to get final message
    fetch('/finish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mode: currentMode,
            score: score,
            question_count: questionCount
        })
    })
    .then(response => response.json())
    .then(data => {
        playAudio(data.speech_url);
    })
    .catch(error => {
        console.error('Error finishing session:', error);
    });
}

function resetApplication() {
    // Reset to mode selection
    resultsArea.classList.add('hidden');
    modeSelection.classList.remove('hidden');
    
    // Clear state
    currentMode = null;
    currentQuestion = null;
    
    // Clear timer if running
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
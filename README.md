# Dyslexia Support AI Web Application

An AI-powered educational application designed to assist individuals with dyslexia through interactive learning modes and a supportive tutoring experience.


## 🧠 Project Overview

This application was developed during Impact AI Hackathon to create an accessible, interactive learning tool for individuals with dyslexia. It uses the Gemini API to power a conversational AI tutor that guides users through specialized exercises targeting different aspects of dyslexia.

### Key Features

- **AI-powered tutoring system** that provides friendly, patient guidance
- **Three specialized learning modes** targeting different dyslexia subtypes
- **Text-to-speech integration** for all AI responses using a natural female voice
- **Speech recognition** for pronunciation practice
- **Scoring system** with difficulty-based points
- **Dyslexia-friendly interface** with accessible design principles

## 🚀 Learning Modes

### 1. Phonological Dyslexia
- AI pronounces words and users select the correct spelling from choices
- Helps improve phonological awareness and sound-letter associations
- Includes hint options and pronunciation repetition

### 2. Surface Dyslexia
- Users practice pronouncing irregular words displayed on screen
- Speech recognition evaluates pronunciation accuracy
- AI provides syllable breakdowns and pronunciation guidance

### 3. Rapid Naming
- Timed image identification exercises with increasing difficulty
- Helps improve processing speed and word retrieval
- Challenges users with difficulty-based time limits

## 💻 Technologies Used

- **Gemini API** for natural language processing and AI tutoring
- **Web Speech API** for text-to-speech and speech recognition
- **HTML/CSS/JavaScript** for front-end development
- **Custom JSON datasets** for each learning mode

## 🛠️ Installation & Setup

1. Clone this repository
   ```bash
   git clone https://github.com/your-username/dyslexia-support-ai.git
   cd dyslexia-support-ai
   ```

2. Create a `config.js` file in the root directory with your Gemini API key
   ```javascript
   const API_KEY = "YOUR_GEMINI_API_KEY";
   export default API_KEY;
   ```

3. Open `index.html` in a modern web browser (Chrome recommended for best speech recognition support)

## 📊 Data Structure

The application uses three JSON datasets for different learning modes:

### Phonological Dyslexia Example
```json
{
  "question": "Which word matches the pronunciation: 'cat'?",
  "choices": ["cat", "kat", "cut"],
  "answer": "cat",
  "difficulty": "Easy"
}
```

### Surface Dyslexia Example
```json
{
  "word": "though",
  "difficulty": "Medium"
}
```

### Rapid Naming Example
```json
{
  "category": "animal",
  "difficulty": "Easy",
  "label": "cat",
  "image": "assets/images/cat.png",
  "answer": "cat"
}
```

## 🤝 Contributing

This project was created during a hackathon, but contributions are welcome to improve the application:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

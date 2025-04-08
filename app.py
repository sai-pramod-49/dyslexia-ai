from flask import Flask, render_template, request, jsonify, session
import json
import os
from utils.gemini_api import generate_response
from utils.speech import text_to_speech
import random

app = Flask(__name__)
app.secret_key = 'dyslexia_support_app'

# Load JSON data
def load_data(mode):
    file_path = f'static/json/mode{mode}.json'
    with open(file_path, 'r') as file:
        full_data = json.load(file)

    # Organize questions by difficulty
    easy = [q for q in full_data if q.get('difficulty', '').lower() == 'easy']
    medium = [q for q in full_data if q.get('difficulty', '').lower() == 'medium']
    hard = [q for q in full_data if q.get('difficulty', '').lower() == 'hard']

    # Randomly pick 2 from each (if available)
    selected = random.sample(easy, min(2, len(easy))) + \
               random.sample(medium, min(2, len(medium))) + \
               random.sample(hard, min(2, len(hard)))

    # Shuffle the selected questions so they’re not in order
    random.shuffle(selected)
    return selected

@app.route('/')
def index():
    # Reset session data when loading the main page
    session.clear()
    session['history'] = []
    session['score'] = 0
    session['question_count'] = 0
    return render_template('index.html')

@app.route('/select_mode', methods=['POST'])
def select_mode():
    mode = request.form.get('mode')
    session['mode'] = mode
    session['data'] = load_data(mode)
    session['current_question_index'] = 0
    session['history'] = []
    
    # Initial greeting based on mode
    greeting = get_mode_greeting(mode)
    speech_file = text_to_speech(greeting)
    
    # Add to history
    session['history'].append({"role": "assistant", "content": greeting})
    
    first_question = get_current_question()
    question_audio = None
    if mode == '1' and first_question:
        question_audio = text_to_speech(first_question.get('question', ''))

    return jsonify({
        'greeting': greeting,
        'speech_url': speech_file,
        'question': first_question,
        'mode': mode
    })


def get_mode_greeting(mode):
    if mode == '1':
        return "Welcome to Phonological Dyslexia practice. I'll pronounce a word, and you'll select the matching spelling."
    elif mode == '2':
        return "Welcome to Surface Dyslexia practice. I'll show you words that don't follow regular spelling rules. You'll need to pronounce them correctly. Ready to begin?"
    else:
        return "Welcome to Rapid Naming practice. I'll show you images, and you'll need to name them quickly. Are you ready?"

def get_current_question():
    mode = session.get('mode')
    data = session.get('data')
    index = session.get('current_question_index', 0)
    
    if index >= len(data):
        return None
    
    question = data[index]
    return question

@app.route('/process_response', methods=['POST'])
def process_response():
    user_response = request.form.get('response')
    mode = session.get('mode')
    current_question = get_current_question()
    
    # Add user response to history
    session['history'].append({"role": "user", "content": user_response})
    
    # Process with Gemini API
    prompt = create_gemini_prompt(mode, current_question, user_response)
    ai_response = generate_response(prompt, session['history'])
    
    # Add AI response to history
    session['history'].append({"role": "assistant", "content": ai_response})
    
    # Generate speech for AI response
    speech_file = text_to_speech(ai_response)
    
    
    # Check if we need to move to next question
    if any(word in user_response.lower() for word in ['next', 'continue', 'yes']):
        advance_question = True

    else:
        # Let Gemini decide if we should advance
        advance_question = "let's move to the next question" in ai_response.lower()
    
    # Update score if answer was correct
    if is_correct_answer(mode, current_question, user_response):
        difficulty = current_question.get('difficulty', 'Easy').lower()
        points = {'easy': 1, 'medium': 2, 'hard': 3}.get(difficulty, 1)
        session['score'] = session.get('score', 0) + points
        session['question_count'] = session.get('question_count', 0) + 1
    
    response_data = {
        'response': ai_response,
        'speech_url': speech_file
    }
    
    if advance_question:
        session['current_question_index'] = session.get('current_question_index', 0) + 1
        next_question = get_current_question()
        if next_question:
            response_data['next_question'] = next_question
        else:
            # End of questions
            response_data['end_of_mode'] = True
            response_data['score'] = session.get('score', 0)
            response_data['question_count'] = session.get('question_count', 0)
    
    return jsonify(response_data)

def create_gemini_prompt(mode, question, user_response):
    if mode == '1':
        return f"""You are a supportive AI tutor helping someone with phonological dyslexia.
                   Current question: {question['question']}
                   Options: {', '.join(question['choices'])}
                   Correct answer: {question['answer']}
                   User response: {user_response}
                   
                   Respond in a friendly, supportive way. If they answered correctly, give positive feedback.
                   If they answered incorrectly, gently correct them and offer encouragement.
                   If they asked for a hint, provide a helpful clue without giving away the answer.
                   If they say next or yes, then proceed to next question if they chose correct option an never speak about previous questions.
                   Keep your responses brief but helpful."""
    
    elif mode == '2':
        return f"""You are a supportive AI tutor helping someone with surface dyslexia.
                   Current word: {question['word']}
                   Difficulty: {question['difficulty']}
                   User response: {user_response}
                   
                   Respond in a friendly, supportive way. Check if their pronunciation was correct.
                   If they need help, explain how to pronounce the word.
                   If they ask for an explanation, explain the pronunciation rules.
                   Don't give very lengthy explanations, just a few sentences.
                   Don't repeat the question or ask if they are ready for the next question.
                   If they say next or yes, then proceed to next question if they chose correct option an never speak about previous questions.
                   """
    
    else:  # Mode 3
        return f"""You are a supportive AI tutor helping with rapid naming practice.
                   Image category: {question['category']}
                   Correct label: {question['answer']}
                   Difficulty: {question['difficulty']}
                   User response: {user_response}
                   
                   This is rapid-fire mode, so keep your response to one short sentence.
                    Just say if they're correct or not and we'll move quickly to the next question.
                    If they're incorrect, just briefly correct them without detailed explanation.
                   """

def is_correct_answer(mode, question, user_response):
    if mode == '1':
        return user_response.lower() == question['answer'].lower()
    elif mode == '2':
        # This will be handled by the Gemini API's response analysis
        return "correct" in user_response.lower()
    else:  # Mode 3
        return user_response.lower() == question['answer'].lower()

@app.route('/finish', methods=['POST'])
def finish():
    score = session.get('score', 0)
    question_count = session.get('question_count', 0)
    mode = session.get('mode')
    
    # Generate completion message
    mode_names = {
        '1': 'Phonological Dyslexia',
        '2': 'Surface Dyslexia',
        '3': 'Rapid Naming Deficit'
    }
    
    completion_message = f"Great job! You've completed the {mode_names.get(mode, '')} practice. Your score is {score} points from {question_count} questions."
    speech_file = text_to_speech(completion_message)
    
    return jsonify({
        'message': completion_message,
        'speech_url': speech_file,
        'score': score,
        'question_count': question_count
    })
    
from flask import request, jsonify
from utils.speech import text_to_speech

@app.route('/generate_audio')
def generate_audio():
    text = request.args.get('text', '')
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    audio_path = text_to_speech(text)
    return jsonify({'speech_url': '/' + audio_path})  # So it resolves from static/


if __name__ == '__main__':
    app.run(debug=True)
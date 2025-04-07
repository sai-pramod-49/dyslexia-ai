import google.generativeai as genai
import os
from dotenv import load_dotenv

# Configure the Gemini API
def configure_gemini():
    # You'll need to set this environment variable in your deployment
    api_key = os.getenv("API_KEY")
    genai.configure(api_key=api_key)

# Generate response from Gemini API
def generate_response(prompt, history=None):
    configure_gemini()
    
    # Create a model instance
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    # Format the history for Gemini
    formatted_history = []
    if history:
        for msg in history:
            formatted_history.append({
                "role": msg["role"],
                "parts": [msg["content"]]
            })
    
    # Add the current prompt
    chat = model.start_chat(history=formatted_history)
    response = chat.send_message(prompt)
    
    return response.text

# Function to analyze user response
def analyze_response(user_response, correct_answer, mode):
    configure_gemini()
    
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    Analyze this response for a dyslexia assistance app:
    Mode: {mode}
    User's response: "{user_response}"
    Correct answer: "{correct_answer}"
    
    Please determine:
    1. Is the answer correct? (yes/no)
    2. What kind of feedback should we give?
    3. Should we provide a hint?
    
    Return your analysis in JSON format.
    """
    
    response = model.generate_content(prompt)
    return response.text
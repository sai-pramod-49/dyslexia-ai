import os
import uuid
from gtts import gTTS
import speech_recognition as sr

# Text to Speech functionality using gTTS (clearer, better voice)
def text_to_speech(text, lang='en', tld='co.in'):
    # Create a unique filename for the audio
    filename = f"static/audio/speech_{uuid.uuid4()}.mp3"
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    # Generate and save speech
    tts = gTTS(text=text, lang=lang, tld=tld)  # You can customize tld for accent
    tts.save(filename)

    return filename

# Speech to Text functionality (unchanged)
def speech_to_text(timeout=5):
    recognizer = sr.Recognizer()
    
    with sr.Microphone() as source:
        # Adjust for ambient noise
        recognizer.adjust_for_ambient_noise(source)
        
        # Listen for user's response with timeout
        try:
            audio = recognizer.listen(source, timeout=timeout)
            # Convert speech to text
            text = recognizer.recognize_google(audio)
            return text
        except sr.WaitTimeoutError:
            return "TIMEOUT"
        except sr.UnknownValueError:
            return "UNRECOGNIZED"
        except Exception as e:
            return f"ERROR: {str(e)}"


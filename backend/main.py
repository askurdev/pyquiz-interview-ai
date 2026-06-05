import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

# 1. Load Environment Variables from .env file
load_dotenv()

# Ensure API Key is available
if not os.getenv("GEMINI_API_KEY"):
    raise ValueError("GEMINI_API_KEY is missing from the .env file!")

# 2. Initialize Gemini Client (automatically picks up GEMINI_API_KEY from env)
client = genai.Client()

# 3. Initialize FastAPI App
app = FastAPI(title="PyQuiz Core AI Backend")

# 4. Enable CORS so Next.js (localhost:3000) can fetch data safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model for quiz submission
class QuizSubmission(BaseModel):
    topic: str
    answers: dict  # Format: {"question_id": "selected_option"}

# Path to the generated questions directory
QUESTIONS_DIR = os.path.join(os.path.dirname(__file__), "questions")

@app.get("/")
def read_root():
    return {"message": "Welcome to PyQuiz AI Backend API. Everything is running smooth!"}

# 5. Endpoint to Fetch Questions by Topic
@app.get("/api/quiz/{topic}")
def get_quiz_questions(topic: str):
    file_path = os.path.join(QUESTIONS_DIR, f"{topic}.json")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Topic '{topic}' not found or questions not generated yet.")
    
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            questions_data = json.load(file)
            # Take a slice of 20 questions for the actual quiz match
            return questions_data[:20]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading question file: {str(e)}")

# 6. Endpoint to Submit Answers and Get International Gemini Feedback
@app.post("/api/quiz/submit")
def submit_quiz(submission: QuizSubmission):
    file_path = os.path.join(QUESTIONS_DIR, f"{submission.topic}.json")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Topic file not found.")
        
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            all_questions = json.load(file)
            
        # Map questions by ID for quick lookup
        questions_map = {q["id"]: q for q in all_questions}
        
        score = 0
        total = len(submission.answers)
        review_data = []

        # Calculate score and prepare evaluation data for AI
        for q_id, user_ans in submission.answers.items():
            if q_id in questions_map:
                q_item = questions_map[q_id]
                is_correct = q_item["correct_answer"] == user_ans
                if is_correct:
                    score += 1
                
                review_data.append({
                    "question": q_item["question"],
                    "user_answer": user_ans,
                    "correct_answer": q_item["correct_answer"],
                    "is_correct": is_correct
                })

        percentage = round((score / total) * 100, 2) if total > 0 else 0

        # 7. Construct Prompt for Gemini AI (100% International/English Feedback)
        ai_prompt = f"""
        You are an expert International Python Mentor. Analyze the following quiz performance data and provide a professional evaluation.
        
        Topic: {submission.topic}
        User Score: {score} out of {total} ({percentage}%)
        
        Detailed Breakdown:
        {json.dumps(review_data, indent=2)}
        
        Requirements:
        1. Provide the response STRICTLY in English language.
        2. Keep the tone professional, encouraging, and highly constructive.
        3. Highlight the user's strong areas and point out exactly what concept needs improvement based on wrong answers.
        4. Keep the summary concise but impactful for a developer dashboard.
        """

        # Call Gemini Model (Using gemini-2.5-flash as default)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=ai_prompt,
        )
        
        ai_analysis = response.text

        return {
            "score": score,
            "total": total,
            "percentage": percentage,
            "ai_analysis": ai_analysis
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process quiz submission: {str(e)}")
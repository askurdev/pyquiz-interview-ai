import os
import json
import time
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

client = genai.Client()

class QuestionSchema(BaseModel):
    id: str = Field(description="Unique string ID like func_001, loop_052")
    question: str = Field(description="The Python quiz question text")
    options: list[str] = Field(description="Strictly 4 multiple choice options")
    correct_answer: str = Field(description="The exact text of the correct option")
    explanation: str = Field(description="Brief explanation of why this answer is correct")

class QuizPoolSchema(BaseModel):
    questions: list[QuestionSchema]

TOPICS = {
    "functions": "Python Functions, arguments, return values, lambda, and scopes.",
    "oop": "Python Object-Oriented Programming, classes, objects, inheritance, polymorphism.",
    "loops": "Python For loops, While loops, break, continue, pass, and nested loops.",
    "lists": "Python Lists, indexing, slicing, methods, and list comprehensions.",
    "dictionaries": "Python Dictionaries, keys, values, methods, and dictionary comprehensions."
}

def generate_topic_questions(topic_name, topic_desc, batch_size=20, total_needed=100):
    print(f"{topic_name} টপিকের প্রশ্ন জেনারেশন শুরু হচ্ছে...")
    all_questions = []
    batches = total_needed // batch_size

    for i in range(batches):
        print(f"{topic_name}-এর জন্য ব্যাচ {i+1}/{batches} জেনারেট হচ্ছে...")
        prompt = f"Generate {batch_size} unique MCQs about {topic_name}. Focus areas: {topic_desc}. Ensure IDs are unique, e.g., {topic_name}_{len(all_questions) + i}."

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=QuizPoolSchema,
                    temperature=0.7
                ),
            )
            data = json.loads(response.text)
            batch_questions = data.get("questions", [])
            all_questions.extend(batch_questions)
            print(f"সফলভাবে {len(batch_questions)}টি প্রশ্ন যোগ হয়েছে।")
            time.sleep(6)
        except Exception as e:
            print(f"ব্যাচ {i+1}-এ সমস্যা হয়েছে: {e}")
            time.sleep(10)
            continue

    os.makedirs("questions", exist_ok=True)
    filename = f"questions/{topic_name}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, indent=4, ensure_ascii=False)
    print(f"সফলভাবে {len(all_questions)}টি প্রশ্ন {filename} ফাইলে সেভ হয়েছে।\n")

if __name__ == "__main__":
    for topic, desc in TOPICS.items():
        generate_topic_questions(topic, desc, batch_size=20, total_needed=100)
    print("সব প্রশ্ন সফলভাবে জেনারেট হয়েছে!")
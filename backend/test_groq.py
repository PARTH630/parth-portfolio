
import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_groq import ChatGroq

# Read secrets from backend/.env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

api_key = os.getenv("GROQ_API_KEY")
model_name = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

if not api_key:
    raise ValueError(
        "GROQ_API_KEY is missing from backend/.env"
    )

# Initialize the hosted language model
llm = ChatGroq(
    model=model_name,
    temperature=0,
    max_retries=2,
    api_key=api_key
)

# Test the model
response = llm.invoke(
    "Explain Retrieval-Augmented Generation "
    "in two simple sentences."
)

print("\nPARTH.AI — GROQ CONNECTION")
print("=" * 35)
print(response.content)

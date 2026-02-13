import os
from langchain_groq import ChatGroq
from crewai import Agent, Task, Crew, Process

# Load env vars manually for test
import dotenv
dotenv.load_dotenv()

# Test 1: Current Fix (ChatGroq with groq/ prefix)
def test_chatgroq_with_prefix():
    print("\n--- Test 1: ChatGroq with 'groq/' prefix ---")
    try:
        llm = ChatGroq(
            model="groq/llama-3.3-70b-versatile",
            temperature=0.7,
            api_key=os.getenv("GROQ_API_KEY")
        )
        print("ChatGroq initialized.")
        response = llm.invoke("Hello")
        print(f"Success! Response: {response.content}")
    except Exception as e:
        print(f"FAILED: {e}")

# Test 2: Original (ChatGroq WITHOUT prefix)
def test_chatgroq_no_prefix():
    print("\n--- Test 2: ChatGroq WITHOUT prefix ---")
    try:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            api_key=os.getenv("GROQ_API_KEY")
        )
        print("ChatGroq initialized.")
        # This worked for invoke but failed in CrewAI?
        # Simulation of Crew might be needed if invoke works.
        response = llm.invoke("Hello")
        print(f"Success! Response: {response.content}")
    except Exception as e:
        print(f"FAILED: {e}")

# Test 3: String format (Native CrewAI/LiteLLM)
def test_string_format():
    print("\n--- Test 3: String 'groq/llama-3.3-70b-versatile' ---")
    try:
        # CrewAI agent with string LLM
        agent = Agent(
            role="Test",
            goal="Test",
            backstory="Test",
            llm="groq/llama-3.3-70b-versatile"
        )
        print("Agent initialized with string.")
        # We can't easily invoke agent without a task, but initialization checks provider
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_chatgroq_with_prefix()
    test_chatgroq_no_prefix()
    # test_string_format() # Optional

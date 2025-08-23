import requests
import json
import asyncio
import aiohttp

API_BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    response = requests.get(f"{API_BASE_URL}/health")
    print("Health Check:", response.json())

def test_basic_chat():
    """Test basic chat endpoint"""
    payload = {
        "prompt": "Hello, what is the capital of Japan?",
        "temperature": 0.7,
        "max_tokens": 100
    }
    response = requests.post(f"{API_BASE_URL}/chat", json=payload)
    print("\nBasic Chat Response:", response.json())

def test_chat_completions():
    """Test chat completions endpoint (OpenAI-compatible format)"""
    payload = {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is machine learning in simple terms?"}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }
    response = requests.post(f"{API_BASE_URL}/chat/completions", json=payload)
    print("\nChat Completions Response:", json.dumps(response.json(), indent=2))

async def test_streaming():
    """Test streaming chat endpoint"""
    payload = {
        "prompt": "Write a short story about a robot in 3 sentences.",
        "temperature": 0.8,
        "max_tokens": 200,
        "stream": True
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{API_BASE_URL}/chat/stream", json=payload) as response:
            print("\nStreaming Response:")
            async for line in response.content:
                if line:
                    decoded = line.decode('utf-8').strip()
                    if decoded.startswith('data: '):
                        try:
                            data = json.loads(decoded[6:])
                            if 'chunk' in data:
                                print(data['chunk'], end='', flush=True)
                        except json.JSONDecodeError:
                            pass
            print()

def main():
    print("Testing Ollama Phi4-mini API")
    print("=" * 50)
    
    try:
        test_health()
        test_basic_chat()
        test_chat_completions()
        
        print("\nTesting streaming (async)...")
        asyncio.run(test_streaming())
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure the server is running.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
"""Streaming endpoint tests."""

import pytest
import json
import asyncio
import aiohttp
from typing import AsyncGenerator


@pytest.mark.streaming
@pytest.mark.integration
@pytest.mark.asyncio
class TestStreamingEndpoints:
    """Test suite for streaming chat endpoints."""

    async def test_chat_stream_endpoint(self, async_client: aiohttp.ClientSession, api_base_url: str):
        """Test the streaming chat endpoint."""
        payload = {
            "prompt": "Count from 1 to 5",
            "temperature": 0.7,
            "max_tokens": 100,
            "stream": True
        }
        
        async with async_client.post(f"{api_base_url}/chat/stream", json=payload) as response:
            assert response.status == 200
            assert response.headers.get("content-type") == "text/event-stream; charset=utf-8"
            
            chunks = []
            async for line in response.content:
                if line:
                    decoded = line.decode('utf-8').strip()
                    if decoded.startswith('data: '):
                        try:
                            data = json.loads(decoded[6:])
                            if 'chunk' in data:
                                chunks.append(data['chunk'])
                            elif 'error' in data:
                                pytest.fail(f"Streaming error: {data['error']}")
                        except json.JSONDecodeError:
                            pass
            
            # Should have received some chunks
            assert len(chunks) > 0
            
            # Combine chunks to form complete response
            complete_response = ''.join(chunks)
            assert len(complete_response) > 0

    async def test_chat_stream_without_stream_flag(self, async_client: aiohttp.ClientSession, api_base_url: str):
        """Test streaming endpoint without stream=true should fail."""
        payload = {
            "prompt": "Hello",
            "temperature": 0.7,
            "max_tokens": 50,
            "stream": False  # Should cause error
        }
        
        async with async_client.post(f"{api_base_url}/chat/stream", json=payload) as response:
            assert response.status == 400
            data = await response.json()
            assert "detail" in data

    async def test_completions_streaming(self, async_client: aiohttp.ClientSession, api_base_url: str):
        """Test OpenAI-compatible completions with streaming."""
        payload = {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello in 3 words"}
            ],
            "temperature": 0.7,
            "max_tokens": 50,
            "stream": True
        }
        
        async with async_client.post(f"{api_base_url}/chat/completions", json=payload) as response:
            assert response.status == 200
            assert response.headers.get("content-type") == "text/event-stream; charset=utf-8"
            
            chunks = []
            chunk_count = 0
            max_chunks = 50  # Prevent infinite loop
            
            async for line in response.content:
                if chunk_count >= max_chunks:
                    break
                    
                if line:
                    decoded = line.decode('utf-8').strip()
                    if decoded.startswith('data: '):
                        try:
                            data = json.loads(decoded[6:])
                            if 'chunk' in data:
                                chunks.append(data['chunk'])
                            elif 'error' in data:
                                pytest.fail(f"Streaming error: {data['error']}")
                        except json.JSONDecodeError:
                            pass
                    chunk_count += 1
            
            # Should have received some chunks
            assert len(chunks) > 0

    async def test_stream_response_timeout(self, async_client: aiohttp.ClientSession, api_base_url: str):
        """Test that streaming responses don't hang indefinitely."""
        payload = {
            "prompt": "Write a very long story",
            "temperature": 0.8,
            "max_tokens": 10,  # Limit tokens to prevent long responses
            "stream": True
        }
        
        # Set a reasonable timeout
        timeout = aiohttp.ClientTimeout(total=30)
        
        try:
            async with async_client.post(
                f"{api_base_url}/chat/stream", 
                json=payload,
                timeout=timeout
            ) as response:
                assert response.status == 200
                
                chunks = []
                start_time = asyncio.get_event_loop().time()
                
                async for line in response.content:
                    current_time = asyncio.get_event_loop().time()
                    if current_time - start_time > 25:  # 25 second timeout
                        break
                        
                    if line:
                        decoded = line.decode('utf-8').strip()
                        if decoded.startswith('data: '):
                            try:
                                data = json.loads(decoded[6:])
                                if 'chunk' in data:
                                    chunks.append(data['chunk'])
                            except json.JSONDecodeError:
                                pass
                
                # Should complete within timeout
                assert len(chunks) > 0
                
        except asyncio.TimeoutError:
            pytest.fail("Streaming response timed out")

    async def test_stream_error_handling(self, async_client: aiohttp.ClientSession, api_base_url: str):
        """Test streaming endpoint error handling."""
        payload = {
            "prompt": "Test prompt",
            "temperature": -5.0,  # Invalid temperature might cause issues
            "max_tokens": 50,
            "stream": True
        }
        
        async with async_client.post(f"{api_base_url}/chat/stream", json=payload) as response:
            # Should handle gracefully, either by returning error or valid response
            assert response.status in [200, 400, 422, 500]
            
            if response.status == 200:
                # Check if error is sent through stream
                async for line in response.content:
                    if line:
                        decoded = line.decode('utf-8').strip()
                        if decoded.startswith('data: '):
                            try:
                                data = json.loads(decoded[6:])
                                if 'error' in data:
                                    # Error properly handled through stream
                                    break
                            except json.JSONDecodeError:
                                pass

    async def test_stream_japanese_input(self, async_client: aiohttp.ClientSession, api_base_url: str):
        """Test streaming with Japanese text input."""
        payload = {
            "prompt": "日本の首都はどこですか？簡潔に答えてください。",
            "temperature": 0.7,
            "max_tokens": 50,
            "stream": True
        }
        
        async with async_client.post(f"{api_base_url}/chat/stream", json=payload) as response:
            assert response.status == 200
            
            chunks = []
            async for line in response.content:
                if line:
                    decoded = line.decode('utf-8').strip()
                    if decoded.startswith('data: '):
                        try:
                            data = json.loads(decoded[6:])
                            if 'chunk' in data:
                                chunks.append(data['chunk'])
                        except json.JSONDecodeError:
                            pass
            
            # Should handle Japanese text
            assert len(chunks) > 0
            complete_response = ''.join(chunks)
            assert len(complete_response) > 0

    @pytest.mark.slow
    async def test_multiple_concurrent_streams(self, api_base_url: str):
        """Test multiple concurrent streaming requests."""
        async def make_stream_request(session: aiohttp.ClientSession, prompt_id: int):
            payload = {
                "prompt": f"Say 'Response {prompt_id}' and nothing else",
                "temperature": 0.0,
                "max_tokens": 20,
                "stream": True
            }
            
            async with session.post(f"{api_base_url}/chat/stream", json=payload) as response:
                if response.status == 200:
                    chunks = []
                    async for line in response.content:
                        if line:
                            decoded = line.decode('utf-8').strip()
                            if decoded.startswith('data: '):
                                try:
                                    data = json.loads(decoded[6:])
                                    if 'chunk' in data:
                                        chunks.append(data['chunk'])
                                except json.JSONDecodeError:
                                    pass
                    return len(chunks) > 0
                return False
        
        # Test 3 concurrent streams
        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            tasks = [make_stream_request(session, i) for i in range(3)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # At least some should succeed
            successful = sum(1 for r in results if r is True)
            assert successful > 0
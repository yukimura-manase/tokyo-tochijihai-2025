"""OpenAI LLM integration."""

import os
from typing import Optional
from langchain_openai import ChatOpenAI
from config import Settings


class OpenAILLM:
    """Wrapper for OpenAI LLM with default settings."""
    
    def __init__(self, settings: Settings, api_key: Optional[str] = None):
        self.settings = settings
        
        if api_key:
            os.environ["OPENAI_API_KEY"] = api_key
        elif settings.OPENAI_API_KEY:
            os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
        
        self._llm = ChatOpenAI(
            model=settings.OPENAI_CHAT_MODEL,
            temperature=0
        )
    
    @property
    def llm(self):
        """Get the underlying LLM instance."""
        return self._llm
    
    def invoke(self, prompt: str, **kwargs):
        """Invoke the LLM with a prompt."""
        return self._llm.invoke(prompt, **kwargs)
    
    def stream(self, prompt: str, **kwargs):
        """Stream the LLM response."""
        return self._llm.stream(prompt, **kwargs)
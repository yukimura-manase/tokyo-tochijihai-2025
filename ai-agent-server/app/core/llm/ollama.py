"""Ollama LLM integration."""

from langchain_ollama import OllamaLLM as BaseLangChainOllamaLLM
from config import Settings


class OllamaLLM:
    """Wrapper for Ollama LLM with default settings."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self._llm = BaseLangChainOllamaLLM(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL
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
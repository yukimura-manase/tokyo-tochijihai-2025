"""General utility functions and helpers."""

from typing import Any, Dict
from fastapi import HTTPException


def extract_llm_response_text(response: Any) -> str:
    """
    Extract text content from LLM response regardless of LLM type.
    
    Args:
        response: Response from LLM (could be string or object with content attribute)
    
    Returns:
        String content of the response
    """
    if hasattr(response, 'content'):
        return response.content
    else:
        return str(response)


def create_error_response(status_code: int, detail: str) -> HTTPException:
    """
    Create standardized error response.
    
    Args:
        status_code: HTTP status code
        detail: Error detail message
    
    Returns:
        HTTPException instance
    """
    return HTTPException(status_code=status_code, detail=detail)


def validate_coordinates(lat: float, lon: float) -> bool:
    """
    Validate latitude and longitude coordinates.
    
    Args:
        lat: Latitude value
        lon: Longitude value
    
    Returns:
        True if coordinates are valid
    """
    return -90 <= lat <= 90 and -180 <= lon <= 180


def safe_get_metadata(doc_metadata: Dict[str, Any], key: str, default: Any = None) -> Any:
    """
    Safely get metadata value with default fallback.
    
    Args:
        doc_metadata: Document metadata dictionary
        key: Key to retrieve
        default: Default value if key not found
    
    Returns:
        Metadata value or default
    """
    return doc_metadata.get(key, default)
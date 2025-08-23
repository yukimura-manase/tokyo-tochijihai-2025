"""Geographic utility functions for location-based operations."""

import math
from typing import Optional, List, Tuple
from langchain_core.documents import Document


def haversine_km(lat1: float, lon1: float, lat2: Optional[float], lon2: Optional[float]) -> float:
    """
    Calculate the great circle distance between two points on Earth (specified in decimal degrees).
    
    Args:
        lat1: Latitude of the first point
        lon1: Longitude of the first point
        lat2: Latitude of the second point
        lon2: Longitude of the second point
    
    Returns:
        Distance in kilometers
    """
    if None in (lat1, lon1, lat2, lon2):
        return float("inf")
    
    R = 6371.0  # Radius of Earth in kilometers
    
    # Convert degrees to radians
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = math.sin(dphi/2)**2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def rerank_by_distance(
    docs: List[Document], 
    user_lat: float, 
    user_lon: float
) -> List[Tuple[float, Document]]:
    """
    Rerank documents by distance from user's location.
    
    Args:
        docs: List of documents with lat/lon in metadata
        user_lat: User's latitude
        user_lon: User's longitude
    
    Returns:
        List of tuples (distance, document) sorted by distance
    """
    scored_docs = []
    
    for doc in docs:
        lat = doc.metadata.get("lat")
        lon = doc.metadata.get("lon")
        distance = haversine_km(user_lat, user_lon, lat, lon)
        scored_docs.append((distance, doc))
    
    # Sort by distance (ascending)
    scored_docs.sort(key=lambda x: x[0])
    
    return scored_docs


def filter_by_radius(
    docs: List[Document],
    user_lat: float,
    user_lon: float,
    radius_km: float
) -> List[Document]:
    """
    Filter documents to only include those within a certain radius.
    
    Args:
        docs: List of documents with lat/lon in metadata
        user_lat: User's latitude
        user_lon: User's longitude
        radius_km: Maximum distance in kilometers
    
    Returns:
        Filtered list of documents within radius
    """
    filtered = []
    
    for doc in docs:
        lat = doc.metadata.get("lat")
        lon = doc.metadata.get("lon")
        distance = haversine_km(user_lat, user_lon, lat, lon)
        
        if distance <= radius_km:
            doc.metadata["distance_km"] = round(distance, 3)
            filtered.append(doc)
    
    return filtered
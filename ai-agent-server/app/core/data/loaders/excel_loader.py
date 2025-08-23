"""Excel data loader for WiFi spot information."""

import pandas as pd
from pathlib import Path
from typing import List
from langchain_core.documents import Document


def clean_wifi_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and normalize column names from Japanese WiFi spot Excel file.
    """
    # Remove newlines and full-width spaces from column names
    df = df.rename(columns=lambda x: str(x).replace("\n", "").replace("　", " ").strip())
    
    # Common rename patterns for WiFi spot data
    # Note: These will be adjusted based on actual column names
    rename_map = {
        "区市町村コード": "municipality_code", 
        "区市町村": "municipality",
        "施設名": "facility_name",
        "事業者名": "provider",
        "設置場所名": "location_name",
        "設置場所住所": "address",
        "緯度": "lat",
        "経度": "lon",
        "SSID": "ssid",
        "利用可能時間": "available_hours",
        "利用料金": "fee",
        "認証方式": "auth_method",
        "電話番号": "phone",
        "URL": "url",
        "備考": "notes"
    }
    
    for k, v in rename_map.items():
        if k in df.columns:
            df = df.rename(columns={k: v})
    
    return df


def load_wifi_excel_as_documents(excel_path: str) -> List[Document]:
    """
    Load WiFi spot Excel file and convert to LangChain Documents.
    
    Args:
        excel_path: Path to the Excel file
    
    Returns:
        List of Document objects with page_content and metadata
    """
    # Read Excel with proper encoding
    df = pd.read_excel(excel_path)
    df = clean_wifi_columns(df)
    
    # Convert to dictionary records
    records = df.to_dict(orient="records")
    
    docs: List[Document] = []
    
    for record in records:
        # Extract key fields
        lat = record.get("lat", None)
        lon = record.get("lon", None) 
        facility_name = record.get("facility_name", "")
        location_name = record.get("location_name", "")
        municipality = record.get("municipality", "")
        address = record.get("address", "")
        provider = record.get("provider", "")
        ssid = record.get("ssid", "")
        available_hours = record.get("available_hours", "")
        fee = record.get("fee", "")
        auth_method = record.get("auth_method", "")
        phone = record.get("phone", "")
        url = record.get("url", "")
        notes = record.get("notes", "")
        
        # Skip records without essential information
        if not facility_name and not location_name:
            continue
            
        # Determine primary name
        display_name = facility_name or location_name
        
        # Check if it's free WiFi
        is_free = False
        if pd.notna(fee):
            fee_str = str(fee).lower()
            is_free = any(word in fee_str for word in ["無料", "free", "0円", "0 円"])
        
        # Check if it's 24/7 available
        is_24h = False
        if pd.notna(available_hours):
            hours_str = str(available_hours).lower()
            is_24h = any(word in hours_str for word in ["24時間", "24h", "終日", "常時"])
        
        # Create page content for semantic search
        page_content_parts = [
            f"施設名: {display_name}",
            f"設置場所: {location_name}" if location_name and location_name != display_name else "",
            f"自治体: {municipality}",
            f"住所: {address}",
            f"事業者: {provider}" if provider else ""
        ]
        
        # Filter out empty parts
        page_content_parts = [part for part in page_content_parts if part]
        
        if ssid:
            page_content_parts.append(f"SSID: {ssid}")
        
        if available_hours:
            page_content_parts.append(f"利用可能時間: {available_hours}")
            
        if fee:
            page_content_parts.append(f"利用料金: {fee}")
            
        if auth_method:
            page_content_parts.append(f"認証方式: {auth_method}")
        
        if is_free:
            page_content_parts.append("無料WiFi")
            
        if is_24h:
            page_content_parts.append("24時間利用可能")
            
        if phone:
            page_content_parts.append(f"電話番号: {phone}")
            
        if notes:
            page_content_parts.append(f"備考: {notes}")
        
        page_content = "\n".join(page_content_parts)
        
        # Create metadata for filtering and additional info
        metadata = {
            "lat": float(lat) if pd.notna(lat) else None,
            "lon": float(lon) if pd.notna(lon) else None,
            "facility_name": display_name,
            "location_name": location_name,
            "municipality": municipality,
            "address": address,
            "provider": provider,
            "ssid": ssid,
            "available_hours": str(available_hours) if pd.notna(available_hours) else "",
            "fee": str(fee) if pd.notna(fee) else "",
            "auth_method": str(auth_method) if pd.notna(auth_method) else "",
            "phone": str(phone) if pd.notna(phone) else "",
            "url": str(url) if pd.notna(url) else "",
            "notes": str(notes) if pd.notna(notes) else "",
            "is_free": is_free,
            "is_24h": is_24h,
            "source": Path(excel_path).name,
            "data_type": "wifi_spot"
        }
        
        docs.append(Document(page_content=page_content, metadata=metadata))
    
    return docs
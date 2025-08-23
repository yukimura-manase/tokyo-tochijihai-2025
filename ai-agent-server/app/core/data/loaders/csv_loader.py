"""CSV data loader for evacuation area information."""

import pandas as pd
from pathlib import Path
from typing import List
from langchain_core.documents import Document


def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and normalize column names from Japanese CSV.
    """
    # Remove newlines and full-width spaces from column names
    df = df.rename(columns=lambda x: str(x).replace("\n", "").replace("　", " ").strip())
    
    # Rename Japanese columns to English for easier handling
    rename_map = {
        "区市町村コード": "municipality_code",
        "区市町村": "municipality",
        "施設名": "facility",
        "所在地住所": "address",
        "緯度": "lat",
        "経度": "lon",
        "洪水": "flood",
        "崖崩れ、土石流及び地滑り": "landslide",
        "高潮": "storm_surge",
        "地震": "earthquake",
        "津波": "tsunami",
        "大規模な火事": "large_fire",
        "内水氾濫": "inland_flood",
        "火山現象": "volcano",
        "その他（具体的に）": "others_detail",
        "エレベーター有/避難スペースが１階": "elevator_or_1f",
        "電話番号": "phone",
        "FAX番号": "fax",
    }
    
    for k, v in rename_map.items():
        if k in df.columns:
            df = df.rename(columns={k: v})
    
    return df


def load_csv_as_documents(csv_path: str) -> List[Document]:
    """
    Load evacuation area CSV file and convert to LangChain Documents.
    
    Args:
        csv_path: Path to the CSV file
    
    Returns:
        List of Document objects with page_content and metadata
    """
    # Read CSV with proper encoding
    df = pd.read_csv(csv_path, encoding='utf-8')
    df = clean_columns(df)
    
    # Convert to dictionary records
    records = df.to_dict(orient="records")
    
    docs: List[Document] = []
    
    for record in records:
        # Extract key fields
        lat = record.get("lat", None)
        lon = record.get("lon", None)
        facility = record.get("facility", "")
        municipality = record.get("municipality", "")
        address = record.get("address", "")
        phone = record.get("phone", "")
        
        # Check elevator/barrier-free status
        elevator_info = record.get("elevator_or_1f", "")
        is_barrier_free = pd.notna(elevator_info) and elevator_info != ""
        
        # Collect applicable hazards
        hazards = []
        hazard_columns = [
            ("flood", "洪水"),
            ("landslide", "崖崩れ・土石流・地滑り"),
            ("storm_surge", "高潮"),
            ("earthquake", "地震"),
            ("tsunami", "津波"),
            ("large_fire", "大規模火災"),
            ("inland_flood", "内水氾濫"),
            ("volcano", "火山現象")
        ]
        
        for col, jp_name in hazard_columns:
            if col in record and pd.notna(record[col]) and str(record[col]).strip():
                hazards.append(jp_name)
        
        # Check for other hazards
        others = record.get("others_detail", "")
        if pd.notna(others) and str(others).strip():
            hazards.append(f"その他: {others}")
        
        # Create page content for semantic search
        page_content_parts = [
            f"施設名: {facility}",
            f"自治体: {municipality}",
            f"住所: {address}",
        ]
        
        if hazards:
            page_content_parts.append(f"対応災害: {', '.join(hazards)}")
        
        if is_barrier_free:
            page_content_parts.append("バリアフリー: エレベーター有または避難スペースが1階")
        
        if pd.notna(phone) and str(phone).strip():
            page_content_parts.append(f"電話番号: {phone}")
        
        page_content = "\n".join(page_content_parts)
        
        # Create metadata for filtering and additional info
        metadata = {
            "lat": float(lat) if pd.notna(lat) else None,
            "lon": float(lon) if pd.notna(lon) else None,
            "facility": facility,
            "municipality": municipality,
            "address": address,
            "phone": str(phone) if pd.notna(phone) else "",
            "is_barrier_free": is_barrier_free,
            "hazards": hazards,
            "source": Path(csv_path).name
        }
        
        # Add individual hazard flags for filtering
        for col, _ in hazard_columns:
            if col in record:
                metadata[f"supports_{col}"] = bool(pd.notna(record[col]) and str(record[col]).strip())
        
        docs.append(Document(page_content=page_content, metadata=metadata))
    
    return docs
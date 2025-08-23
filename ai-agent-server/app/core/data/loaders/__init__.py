"""Data loaders for various file formats."""

from core.data.loaders.csv_loader import load_csv_as_documents
from core.data.loaders.pdf_loader import load_pdf_as_documents, load_multiple_pdfs_as_documents
from core.data.loaders.excel_loader import load_wifi_excel_as_documents

__all__ = [
    "load_csv_as_documents",
    "load_pdf_as_documents", 
    "load_multiple_pdfs_as_documents",
    "load_wifi_excel_as_documents"
]
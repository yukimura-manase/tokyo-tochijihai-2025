"""PDF data loader for disaster prevention documents."""

from pathlib import Path
from typing import List
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter


def load_pdf_as_documents(
    pdf_path: str, 
    chunk_size: int = 1000, 
    chunk_overlap: int = 200
) -> List[Document]:
    """
    Load PDF file and convert to LangChain Documents with chunking.
    
    Args:
        pdf_path: Path to the PDF file
        chunk_size: Size of each text chunk
        chunk_overlap: Overlap between chunks
    
    Returns:
        List of Document objects with page_content and metadata
    """
    if not Path(pdf_path).exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    # Load PDF
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()
    
    # Initialize text splitter for Japanese text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", "。", "、", " ", ""],
        add_start_index=True
    )
    
    # Split documents into chunks
    docs = []
    for page in pages:
        # Split page content into chunks
        page_chunks = text_splitter.split_text(page.page_content)
        
        for i, chunk in enumerate(page_chunks):
            # Skip very short chunks
            if len(chunk.strip()) < 50:
                continue
                
            # Create metadata for each chunk
            metadata = {
                "source": Path(pdf_path).name,
                "source_type": "pdf",
                "page": page.metadata.get("page", 0),
                "chunk_index": i,
                "total_pages": len(pages),
                "file_path": str(pdf_path)
            }
            
            # Add document type classification
            metadata["document_type"] = "disaster_prevention_plan"
            
            # Create document
            doc = Document(
                page_content=chunk.strip(),
                metadata=metadata
            )
            docs.append(doc)
    
    return docs


def load_multiple_pdfs_as_documents(
    pdf_directory: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> List[Document]:
    """
    Load multiple PDF files from a directory.
    
    Args:
        pdf_directory: Directory containing PDF files
        chunk_size: Size of each text chunk
        chunk_overlap: Overlap between chunks
    
    Returns:
        List of Document objects from all PDFs
    """
    pdf_dir = Path(pdf_directory)
    if not pdf_dir.exists():
        raise FileNotFoundError(f"Directory not found: {pdf_directory}")
    
    all_docs = []
    pdf_files = list(pdf_dir.glob("*.pdf"))
    
    if not pdf_files:
        print(f"No PDF files found in {pdf_directory}")
        return all_docs
    
    for pdf_file in pdf_files:
        try:
            docs = load_pdf_as_documents(
                str(pdf_file), 
                chunk_size=chunk_size, 
                chunk_overlap=chunk_overlap
            )
            all_docs.extend(docs)
            print(f"Loaded {len(docs)} chunks from {pdf_file.name}")
        except Exception as e:
            print(f"Error loading {pdf_file}: {e}")
            continue
    
    return all_docs
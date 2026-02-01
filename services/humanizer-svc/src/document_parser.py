"""
Document parser for extracting paragraphs from DOCX files.
Preserves document structure metadata.
"""

from typing import List, Dict, Any
from docx import Document
from docx.document import Document as DocumentType
from docx.oxml.text.paragraph import CT_P
from docx.text.paragraph import Paragraph


class ParagraphInfo:
    """Information about a paragraph in the document."""
    
    def __init__(self, paragraph: Paragraph, index: int, text: str):
        self.paragraph = paragraph
        self.index = index
        self.text = text
        self.is_heading = False
        self.style_name = paragraph.style.name if paragraph.style else None


def parse_document(docx_path: str) -> DocumentType:
    """
    Parse a DOCX file and return the Document object.
    
    Args:
        docx_path: Path to the .docx file
        
    Returns:
        Document object
    """
    return Document(docx_path)


def extract_paragraphs(document: DocumentType) -> List[ParagraphInfo]:
    """
    Extract all paragraphs from the document.
    
    Args:
        document: python-docx Document object
        
    Returns:
        List of ParagraphInfo objects
    """
    paragraphs = []
    
    for idx, para in enumerate(document.paragraphs):
        text = para.text.strip()
        if not text:  # Skip empty paragraphs
            continue
            
        para_info = ParagraphInfo(para, idx, text)
        
        # Check if it's a heading style
        if para.style and para.style.name.startswith('Heading'):
            para_info.is_heading = True
            
        paragraphs.append(para_info)
    
    return paragraphs


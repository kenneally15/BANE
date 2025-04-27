from docx import Document

def word_to_text(docx_path: str) -> str:
    """
    Convert a Word (.docx) document to plain text.
    Returns the extracted text as a string.
    """
    doc = Document(docx_path)
    text = []
    for para in doc.paragraphs:
        text.append(para.text)
    return '\n'.join(text) 
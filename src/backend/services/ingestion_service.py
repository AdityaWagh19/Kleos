"""Document ingestion service — PDF, DOCX, URL."""

import io


def extract_pdf(file_content: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF."""
    import fitz
    doc = fitz.open(stream=file_content, filetype="pdf")
    return "\n\n".join(page.get_text() for page in doc)


def extract_docx(file_content: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    import docx
    doc = docx.Document(io.BytesIO(file_content))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_url(url: str) -> str:
    """Fetch and extract text from a static URL (server-side, bypasses CORS)."""
    import requests
    from bs4 import BeautifulSoup

    resp = requests.get(url, timeout=15, headers={"User-Agent": "Kleos/1.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    # Remove scripts/styles
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)[:8000]

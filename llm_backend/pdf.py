import os

import pdfplumber
import pytesseract
from pdf2image import convert_from_path

pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_BIN")

def create_text_chunks_pdfplumber(pdf_path):
    content = ""

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # Extrahiere den gesamten Text auf der Seite
            page_text = page.extract_text()
            if page_text:
                content += page_text + "\n"

            # Extrahiere Tabellen (falls vorhanden)
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    # Konvertiere jede Tabellenzeile in eine durch Tabulatoren getrennte Zeichenfolge
                    row_text = "\t".join(
                        [str(cell) if cell is not None else "" for cell in row]
                    )
                    content += row_text + "\n"

    return content

def create_text_chunks_ocr(pdf_path):
    pages = convert_from_path(pdf_path, 600)
    content = ""
    for page in pages:
        text = pytesseract.image_to_string(page, lang="eng")
        content += text + "\n"

    return content

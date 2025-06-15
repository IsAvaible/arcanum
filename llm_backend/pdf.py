import os

import pdfplumber
import pytesseract
from flask import abort
from pdf2image import convert_from_path

pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_BIN")

def create_text_chunks_pdfplumber(pdf_path):
    """
    Convert a PDF File into a text
    :param pdf_path: path to the pdf file
    :return: content as a string
    """

    try:
        content = ""
        # read pages of pdf file
        with pdfplumber.open(pdf_path) as pdf:
            # iterate over pdf pages
            for page in pdf.pages:
                # extract content of page
                page_text = page.extract_text()
                if page_text:
                    content += page_text + "\n"

                # extract tables if they exists
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        # convert table into text
                        row_text = "\t".join(
                            [str(cell) if cell is not None else "" for cell in row]
                        )
                        content += row_text + "\n"

        return content
    except Exception as e:
        abort(500, description=f"Could not convert {pdf_path} to text: {e}")


# ocr method (unused)
def create_text_chunks_ocr(pdf_path):
    pages = convert_from_path(pdf_path, 600)
    content = ""
    for page in pages:
        text = pytesseract.image_to_string(page, lang="eng")
        content += text + "\n"

    return content

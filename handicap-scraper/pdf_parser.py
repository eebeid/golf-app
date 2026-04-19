import pdfplumber
import io
from utils import extract_mappings

def parse_pdf(pdf_buffer, course_name="Unknown Course"):
    """
    Reads a PDF file/buffer using pdfplumber, extracts all tabular data,
    and searches for handicap mappings.
    """
    best_mapping = {}
    best_confidence = "low"

    with pdfplumber.open(pdf_buffer) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                # Filter out None values from the table grid
                grid = []
                for row in table:
                    clean_row = [str(cell) if cell is not None else "" for cell in row]
                    grid.append(clean_row)
                    
                mapping, confidence = extract_mappings(grid)
                
                if len(mapping) > len(best_mapping):
                    best_mapping = mapping
                    best_confidence = confidence
                    
                    if len(best_mapping) == 18 and confidence == "high":
                        break
            if len(best_mapping) == 18 and best_confidence == "high":
                break

    holes_list = [{"hole": k, "handicap": v} for k, v in sorted(best_mapping.items())]
    
    if not holes_list:
        best_confidence = "low"

    return {
        "course_name": course_name,
        "holes": holes_list,
        "confidence": best_confidence
    }

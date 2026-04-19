from bs4 import BeautifulSoup
from utils import extract_mappings

def parse_html(html_content: str):
    """
    Parses HTML content, finds all tables, converts them into 2D lists,
    and searches for handicap mappings.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    tables = soup.find_all('table')
    
    best_mapping = {}
    best_confidence = "low"
    
    for table in tables:
        grid = []
        rows = table.find_all('tr')
        for row in rows:
            # Handle both th and td
            cols = row.find_all(['td', 'th'])
            row_data = [col.get_text(separator=' ', strip=True) for col in cols]
            grid.append(row_data)
            
        mapping, confidence = extract_mappings(grid)
        
        # If we got a better mapping, keep it
        if len(mapping) > len(best_mapping):
            best_mapping = mapping
            best_confidence = confidence
            
            if len(best_mapping) == 18 and confidence == "high":
                break
                
    # Try to extract a course name from headers or title
    course_name = "Unknown Course"
    
    title = soup.find('title')
    if title:
        course_name = title.get_text(strip=True).split('|')[0].strip()
        
    # Formatting output
    holes_list = [{"hole": k, "handicap": v} for k, v in sorted(best_mapping.items())]
    
    if not holes_list:
        best_confidence = "low"
        
    return {
        "course_name": course_name,
        "holes": holes_list,
        "confidence": best_confidence
    }

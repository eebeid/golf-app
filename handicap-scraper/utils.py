import re
from rapidfuzz import fuzz

def clean_cell(cell_val):
    if not isinstance(cell_val, str):
        if cell_val is None:
            return ""
        return str(cell_val).strip()
    return cell_val.strip().replace('\n', ' ')

def is_hole_label(val):
    val = str(val).lower()
    return fuzz.token_sort_ratio(val, "hole") > 80 or fuzz.token_sort_ratio(val, "hole no") > 80

def is_handicap_label(val):
    val = str(val).lower()
    targets = ["handicap", "hcp", "hdcp", "si", "stroke index", "men's handicap", "ladies' handicap"]
    for t in targets:
        if fuzz.partial_ratio(val, t) > 85 or t in val:
            return True
    return False

def extract_integers(row):
    """Returns a list of integer values found in the row. Ignores non-numeric cells."""
    ints = []
    for cell in row:
        c = clean_cell(cell)
        # Handle cases like "1" or " 1 " 
        if c.isdigit():
            ints.append(int(c))
    return ints

def looks_like_hole_sequence(ints):
    """Check if a sequence of integers looks like golf holes (1-9 or 1-18 or 10-18)"""
    if len(ints) < 5:
        return False
    # Check for sequential increasing numbers
     sequential_count = 0
     for i in range(1, len(ints)):
         if ints[i] == ints[i-1] + 1:
             sequential_count += 1
    # If mostly sequential
    return sequential_count >= (len(ints) * 0.6)

def extract_mappings(table_grid):
    """
    Given a 2D list of strings representing a table, attempts to find the hole row
    and the corresponding handicap row.
    Returns a dictionary of {hole_number: handicap_value} and confidence string.
    """
    hole_rows = []
    handicap_rows = []

    # First pass: try to identify rows by explicit labels in the first few columns
    for r_idx, row in enumerate(table_grid):
        cleaned_row = [clean_cell(c) for c in row]
        # Check first 3 columns for labels
        label_found = False
        for cell in cleaned_row[:3]:
            if is_hole_label(cell):
                hole_rows.append(r_idx)
                label_found = True
                break
            if is_handicap_label(cell):
                handicap_rows.append(r_idx)
                label_found = True
                break
        
        # Fallback: check if the row just loosely looks like holes (1, 2, 3...)
        if not label_found:
            ints = extract_integers(cleaned_row)
            if looks_like_hole_sequence(ints):
                hole_rows.append(r_idx)

    # If we didn't find clear handicap rows, we might need to scan for rows full of ints 
    # right below the hole rows. But for simplicity, let's rely on labels for handicaps.
    
    if not hole_rows or not handicap_rows:
        return {}, "low"

    results = {}
    confidence = "high"

    for h_idx in hole_rows:
        hole_row_data = [clean_cell(c) for c in table_grid[h_idx]]
        
        # Find closest handicap row below or above this front/back 9 chunk
        # Assuming typical scorecard: holes at top, handicap somewhere below
        closest_hcp_idx = None
        min_dist = 999
        for hdcp_idx in handicap_rows:
            dist = abs(hdcp_idx - h_idx)
            if dist < min_dist:
                min_dist = dist
                closest_hcp_idx = hdcp_idx
                
        if closest_hcp_idx is not None:
            hdcp_row_data = [clean_cell(c) for c in table_grid[closest_hcp_idx]]
            
            # Map column by column
            mapped_count = 0
            for col_i in range(min(len(hole_row_data), len(hdcp_row_data))):
                hole_val = hole_row_data[col_i]
                hdcp_val = hdcp_row_data[col_i]
                
                if hole_val.isdigit() and hdcp_val.isdigit():
                    h = int(hole_val)
                    if 1 <= h <= 18:
                        results[h] = int(hdcp_val)
                        mapped_count += 1
                        
            if mapped_count < 9:
                confidence = "medium"

    return results, confidence

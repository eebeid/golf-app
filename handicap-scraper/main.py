import os
import io
import argparse
import json
import httpx

from html_parser import parse_html
from pdf_parser import parse_pdf

def fetch_and_parse(url=None, file_path=None):
    if file_path:
        # Local file parsing
        if file_path.lower().endswith(".pdf"):
            with open(file_path, "rb") as f:
                pdf_bytes = io.BytesIO(f.read())
            return parse_pdf(pdf_bytes, course_name=os.path.basename(file_path))
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return parse_html(content)
            
    if url:
        # Remote URL fetching
        try:
            with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                headers = {"User-Agent": "Mozilla/5.0 (Handicap Scraper)"}
                resp = client.get(url, headers=headers)
                resp.raise_for_status()
                
                content_type = resp.headers.get('content-type', '').lower()
                
                if 'application/pdf' in content_type or url.lower().endswith('.pdf'):
                    pdf_bytes = io.BytesIO(resp.content)
                    return parse_pdf(pdf_bytes, course_name=url.split('/')[-1])
                else:
                    return parse_html(resp.text)
                    
        except Exception as e:
            return {"error": str(e), "confidence": "none"}
            
    return {"error": "Either URL or File Path must be provided.", "confidence": "none"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract Golf Course Hole Handicaps")
    parser.add_argument("--url", type=str, help="URL to an HTML scorecard or PDF")
    parser.add_argument("--file", type=str, help="Local PDF or HTML file")
    
    args = parser.parse_args()
    
    if not args.url and not args.file:
        print(json.dumps({"error": "Provide --url or --file", "confidence": "none"}, indent=2))
        exit(1)
        
    result = fetch_and_parse(url=args.url, file_path=args.file)
    print(json.dumps(result, indent=2))

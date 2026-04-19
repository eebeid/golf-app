import asyncio
import httpx
from bs4 import BeautifulSoup
from rapidfuzz import process, fuzz
import re

class NCRDBClient:
    BASE_URL = "https://ncrdb.usga.org"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=20.0)
        self.token = None

    async def init_session(self):
        """Fetches the homepage to extract the CSRF RequestVerificationToken and cookies."""
        resp = await self.client.get(self.BASE_URL)
        resp.raise_for_status()
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        token_input = soup.find('input', {'name': '__RequestVerificationToken'})
        if token_input:
            self.token = token_input.get('value')
        else:
            raise ValueError("Could not find CSRF token on NCRDB homepage.")

    async def search_courses(self, course_name: str, state_code: str = ""):
        """Searches NCRDB using the LoadCourses handler."""
        if not self.token:
            await self.init_session()

        headers = {
            "RequestVerificationToken": self.token,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest"
        }
        
        data = {
            "clubName": course_name,
            "clubCity": "",
            "clubState": state_code or "(Select)",
            "clubCountry": "USA" if state_code else "(Select)"
        }
        
        url = f"{self.BASE_URL}/NCRListing?handler=LoadCourses"
        resp = await self.client.post(url, data=data, headers=headers)
        
        if resp.status_code != 200:
            return []
            
        try:
            return resp.json()
        except:
            return []

    async def get_tee_info(self, course_id: int):
        """Fetches tee data for a specific course ID."""
        url = f"{self.BASE_URL}/courseTeeInfo?CourseID={course_id}"
        resp = await self.client.get(url)
        resp.raise_for_status()
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        table = soup.find('table', id='gvTee')
        if not table:
            return []

        tees = []
        rows = table.find_all('tr')[1:]  # Skip headers
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 16:
                continue
                
            tee_name = cols[0].text.strip()
            if not tee_name: 
                continue
                
            gender = cols[1].text.strip()
            if gender not in ['M', 'F']:
                gender = 'M' if 'men' in gender.lower() else 'F'
                
            par_str = cols[2].text.strip()
            rating_str = cols[3].text.strip()
            slope_str = cols[5].text.strip()
            yardage_str = cols[15].text.strip()

            try:
                tees.append({
                    "tee_name": tee_name,
                    "gender": gender,
                    "par": int(par_str) if par_str and par_str.isdigit() else None,
                    "course_rating": float(rating_str) if rating_str else None,
                    "slope_rating": int(slope_str) if slope_str and slope_str.isdigit() else None,
                    "yardage": int(yardage_str) if yardage_str and yardage_str.isdigit() else None
                })
            except ValueError:
                continue

        # Normalize/dedupe exact same tees if any
        normalized = []
        seen = set()
        for t in tees:
            sig = (t["tee_name"], t["gender"])
            if sig not in seen:
                seen.add(sig)
                normalized.append(t)

        return normalized

    async def close(self):
        await self.client.aclose()


def match_course(input_name, candidates):
    """
    Fuzzy matches the input name against a list of candidate dictionaries.
    Returns (matched_candidate, score)
    """
    if not candidates:
        return None, 0

    # Build choices dict. Prefer fullName, fallback to facilityName.
    choices = {c['courseID']: c.get('fullName') or c.get('facilityName') for c in candidates}
    
    # fuzzy token sort ratio handles missing words well e.g., "Pebble Beach" vs "Pebble Beach Golf Links"
    best = process.extractOne(input_name, choices, scorer=fuzz.token_sort_ratio)
    if best:
        match_str, score, course_id = best
        matched_candidate = next(c for c in candidates if c['courseID'] == course_id)
        return matched_candidate, score
        
    return None, 0

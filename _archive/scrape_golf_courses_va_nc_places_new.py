#!/usr/bin/env python3
"""
Pull golf courses in Virginia + North Carolina via Google Places API (New),
then try to discover a "scorecard" link from each course website,
and save results to a CSV.

This replaces the legacy Places "nearbysearch" + "details" endpoints with:
- Nearby Search (New):  POST https://places.googleapis.com/v1/places:searchNearby
- Place Details (New):  GET  https://places.googleapis.com/v1/places/{placeId}
and uses Field Masks via X-Goog-FieldMask.

USAGE:
  1) pip install requests beautifulsoup4 tqdm
  2) export GOOGLE_MAPS_API_KEY="YOUR_KEY"
  3) python scrape_golf_courses_va_nc.py

OUTPUT:
  - va_nc_golf_courses.csv

NOTES:
- Getting "all" golf courses is approximate: we scan a grid across each state
  and de-duplicate by place id.
- Scorecard links are not in Places data; we use heuristics to find them
  from each course website (best effort).
"""

import os
import time
import csv
from typing import Dict, List, Optional, Tuple, Set

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not API_KEY:
    raise SystemExit(
        "Missing GOOGLE_MAPS_API_KEY env var. Example:\n"
        "  export GOOGLE_MAPS_API_KEY='...'\n"
    )

# Places API (New)
PLACES_BASE = "https://places.googleapis.com/v1"
NEARBY_NEW_URL = f"{PLACES_BASE}/places:searchNearby"
DETAILS_NEW_URL_TMPL = f"{PLACES_BASE}/places/{{place_id}}"

# Output
OUT_CSV = "va_nc_golf_courses.csv"

# Approximate state bounding boxes
STATE_BBOX = {
    "VA": {"min_lat": 36.54, "max_lat": 39.47, "min_lng": -83.68, "max_lng": -75.17},
    "NC": {"min_lat": 33.84, "max_lat": 36.59, "min_lng": -84.32, "max_lng": -75.40},
}

# Grid step in degrees. Smaller => more complete, more API calls.
GRID_STEP_DEG = 0.20

# Nearby Search radius in meters (<= 50000)
RADIUS_M = 25000

# Places type filter (New API uses includedTypes)
INCLUDED_TYPES = ["golf_course"]

# Rate limiting / politeness
REQUEST_SLEEP_S = 0.10

# Scorecard discovery
HTTP_TIMEOUT_S = 15
MAX_SCORECARD_PAGES_TO_TRY = 2  # home + one common page
SCORECARD_KEYWORDS = ("scorecard", "score card", "course guide", "yardage", "hole by hole")


def frange(start: float, stop: float, step: float):
    x = start
    while x <= stop + 1e-9:
        yield round(x, 6)
        x += step


def places_headers(field_mask: str) -> Dict[str, str]:
    # Field mask is REQUIRED for Places API (New)
    return {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": field_mask,
    }


def google_places_nearby_new(lat: float, lng: float, radius_m: int) -> List[Dict]:
    """
    Nearby Search (New).
    Returns a list of Place objects (each place has fields based on field mask).
    """
    # Keep the nearby payload small; we'll call Details per place.
    field_mask = ",".join([
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.googleMapsUri",
    ])

    body = {
        "includedTypes": INCLUDED_TYPES,
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius_m,
            }
        },
        "rankPreference": "DISTANCE",
    }

    r = requests.post(
        NEARBY_NEW_URL,
        headers=places_headers(field_mask),
        json=body,
        timeout=HTTP_TIMEOUT_S,
    )
    r.raise_for_status()
    data = r.json()
    return data.get("places", []) or []


def google_place_details_new(place_id: str) -> Dict:
    """
    Place Details (New).
    """
    # For Details, field mask paths are top-level (not prefixed by "places.")
    fields = ",".join([
        "id",
        "displayName",
        "formattedAddress",
        "location",
        "googleMapsUri",
        "websiteUri",
        "nationalPhoneNumber",
        "internationalPhoneNumber",
    ])

    url = DETAILS_NEW_URL_TMPL.format(place_id=place_id)
    r = requests.get(
        url,
        headers=places_headers(fields),
        timeout=HTTP_TIMEOUT_S,
    )
    r.raise_for_status()
    return r.json()


def normalize_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return url
    u = url.strip()
    if u.startswith("//"):
        u = "https:" + u
    return u


def find_scorecard(website: Optional[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Best-effort: fetch website and look for links containing scorecard keywords
    or PDFs likely to be scorecards.
    Returns: (scorecard_url, source_page, match_text)
    """
    if not website:
        return (None, None, None)

    website = normalize_url(website)
    assert website is not None

    candidates_pages = [website]
    for suffix in ("/golf", "/course", "/rates", "/play", "/scorecard"):
        candidates_pages.append(website.rstrip("/") + suffix)

    tried = 0
    seen_pages: Set[str] = set()

    for page in candidates_pages:
        if tried >= MAX_SCORECARD_PAGES_TO_TRY:
            break
        if page in seen_pages:
            continue
        seen_pages.add(page)
        tried += 1

        try:
            resp = requests.get(
                page,
                timeout=HTTP_TIMEOUT_S,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            if resp.status_code >= 400:
                continue
            html = resp.text
        except Exception:
            continue

        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a"):
            href = a.get("href")
            if not href:
                continue

            text = " ".join((a.get_text(" ", strip=True) or "").split()).lower()
            href_l = href.lower()

            # Keyword match in link text or href
            if any(k in text for k in SCORECARD_KEYWORDS) or any(k in href_l for k in SCORECARD_KEYWORDS):
                score_url = requests.compat.urljoin(page, href)
                return (normalize_url(score_url), page, a.get_text(" ", strip=True) or href)

            # PDF heuristic
            if href_l.endswith(".pdf"):
                compact = href_l.replace("-", "").replace("_", "").replace(" ", "")
                if any(k.replace(" ", "") in compact for k in ("scorecard", "yardage", "courseguide")):
                    score_url = requests.compat.urljoin(page, href)
                    return (normalize_url(score_url), page, a.get_text(" ", strip=True) or href)

    return (None, None, None)


def generate_grid_points(bbox: Dict[str, float]) -> List[Tuple[float, float]]:
    pts = []
    for lat in frange(bbox["min_lat"], bbox["max_lat"], GRID_STEP_DEG):
        for lng in frange(bbox["min_lng"], bbox["max_lng"], GRID_STEP_DEG):
            pts.append((lat, lng))
    return pts


def infer_state(lat: Optional[float], lng: Optional[float]) -> Optional[str]:
    if lat is None or lng is None:
        return None
    for st, bbox in STATE_BBOX.items():
        if bbox["min_lat"] <= lat <= bbox["max_lat"] and bbox["min_lng"] <= lng <= bbox["max_lng"]:
            return st
    return None


def main():
    place_ids: Set[str] = set()

    # 1) Collect place IDs by scanning grids
    for st, bbox in STATE_BBOX.items():
        pts = generate_grid_points(bbox)
        print(f"{st}: scanning {len(pts)} grid points...")
        for lat, lng in tqdm(pts, desc=f"Nearby (New) {st}"):
            try:
                places = google_places_nearby_new(lat, lng, RADIUS_M)
            except Exception:
                continue

            for p in places:
                pid = p.get("id")
                if pid:
                    place_ids.add(pid)

            time.sleep(REQUEST_SLEEP_S)

    print(f"Unique place IDs collected: {len(place_ids)}")

    # 2) Enrich with details + attempt scorecard discovery
    rows = []
    for pid in tqdm(sorted(place_ids), desc="Details (New) + scorecards"):
        try:
            details = google_place_details_new(pid)
        except Exception:
            continue

        name = None
        dn = details.get("displayName")
        if isinstance(dn, dict):
            name = dn.get("text")

        addr = details.get("formattedAddress")
        loc = details.get("location") or {}
        lat = loc.get("latitude")
        lng = loc.get("longitude")
        website = details.get("websiteUri")
        gmaps = details.get("googleMapsUri")
        phone = details.get("nationalPhoneNumber") or details.get("internationalPhoneNumber")

        scorecard_url, score_src, score_text = find_scorecard(website)

        rows.append({
            "state": infer_state(lat, lng),
            "name": name,
            "place_id": pid,
            "google_maps_url": gmaps,
            "website": website,
            "formatted_address": addr,
            "latitude": lat,
            "longitude": lng,
            "phone_number": phone,
            "scorecard_url": scorecard_url,
            "scorecard_source_page": score_src,
            "scorecard_match_text": score_text,
        })

        time.sleep(REQUEST_SLEEP_S)

    # 3) Write CSV
    fieldnames = [
        "state",
        "name",
        "place_id",
        "google_maps_url",
        "website",
        "formatted_address",
        "latitude",
        "longitude",
        "phone_number",
        "scorecard_url",
        "scorecard_source_page",
        "scorecard_match_text",
    ]

    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"Done. Wrote {len(rows)} rows to {OUT_CSV}")


if __name__ == "__main__":
    main()

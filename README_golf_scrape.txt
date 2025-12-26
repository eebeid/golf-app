What you’re getting
- scrape_golf_courses_va_nc.py: A ready-to-run script that uses Google Places Nearby Search + Place Details to collect golf courses in VA/NC, then tries to find a "scorecard" link on each course website.
- va_nc_golf_courses_template.csv: A CSV template showing the output columns.

How to run (on your computer)
1) Install Python 3.10+
2) Install deps:
   pip install requests beautifulsoup4 tqdm
3) Set your Google key:
   export GOOGLE_MAPS_API_KEY="YOUR_KEY"
4) Run:
   python scrape_golf_courses_va_nc.py

Output
- va_nc_golf_courses.csv in the same folder you run it from.

Tuning knobs (in the script)
- GRID_STEP_DEG: smaller = more complete, more API calls
- RADIUS_M: larger = fewer grid points needed, but may miss edges
- MAX_SCORECARD_PAGES_TO_TRY: increase if you want deeper scorecard searching

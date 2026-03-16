# pip install playwright pandas
# playwright install

import json
import pandas as pd
from playwright.sync_api import sync_playwright

URL = "https://www.virginia.org/things-to-do/sports-and-recreation/golf/?view=list&sort=qualityScore&bounds=false"

captured = []

def is_json_response(resp):
    ct = resp.headers.get("content-type", "")
    return "application/json" in ct or ct.endswith("+json")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    def on_response(resp):
        try:
            if is_json_response(resp):
                data = resp.json()
                captured.append({"url": resp.url, "data": data})
                print("JSON:", resp.url)
        except Exception:
            pass

    page.on("response", on_response)
    page.goto(URL, wait_until="networkidle")
    browser.close()

# Save raw captures so you can inspect
with open("va_golf_json_captures.json", "w") as f:
    json.dump(captured, f)

print(f"Captured {len(captured)} JSON responses.")

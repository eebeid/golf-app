import argparse
import asyncio
import csv
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tenacity import retry, stop_after_attempt, wait_exponential

from models import Base, Course, Tee, ScrapeLog
from ncrdb_client import NCRDBClient, match_course
from fallback import dispatch_fallback

# Settings
DATABASE_URL = "sqlite:///golf_data.db"  # Use postgresql in production
MATCH_THRESHOLD = 85
CONCURRENCY = 5

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def process_course(row, client, semaphore):
    async with semaphore:
        course_name = row['course_name']
        city = row.get('city', '')
        state = row['state']
        
        db = SessionLocal()
        try:
            # 1. Search NCRDB
            candidates = await client.search_courses(course_name, state)
            best_match, score = match_course(course_name, candidates)
            
            source_used = "ncrdb"
            tees_data = []
            matched_course_info = None
            
            if score >= MATCH_THRESHOLD and best_match:
                # 2. Extract Tees from NCRDB
                course_id = best_match['courseID']
                matched_course_info = best_match
                tees_data = await client.get_tee_info(course_id)
            else:
                # 3. Fallback Logic
                source_used = f"state_{state.lower()}"
                tees_data = await dispatch_fallback(course_name, state, city)
                
                if not tees_data:
                    # Log failure
                    db.add(ScrapeLog(
                        course_name=course_name,
                        status="fail",
                        error_message=f"No match found. NCRDB Best score: {score}."
                    ))
                    db.commit()
                    logger.warning(f"[FAIL] {course_name} ({state}) - Score: {score}")
                    return

            # 4. Save to DB
            course_entry = Course(
                name=matched_course_info['fullName'] if matched_course_info else course_name,
                facility_name=matched_course_info.get('facilityName') if matched_course_info else "",
                city=matched_course_info.get('city') if matched_course_info else city,
                state=matched_course_info.get('stateDisplay') if matched_course_info else state,
                source=source_used,
                source_url=f"https://ncrdb.usga.org/courseTeeInfo?CourseID={matched_course_info['courseID']}" if source_used == "ncrdb" else ""
            )
            
            db.add(course_entry)
            db.flush() # flush to get the course ID
            
            for t in tees_data:
                db.add(Tee(
                    course_id=course_entry.id,
                    tee_name=t['tee_name'],
                    gender=t['gender'],
                    par=t['par'],
                    yardage=t['yardage'],
                    course_rating=t['course_rating'],
                    slope_rating=t['slope_rating']
                ))
            
            db.add(ScrapeLog(
                course_name=course_name,
                status="success" if source_used == "ncrdb" else "fallback",
                source_used=source_used
            ))
            
            db.commit()
            logger.info(f"[{source_used.upper()}] Saved {course_name} ({len(tees_data)} tees)")
            
        except Exception as e:
            db.rollback()
            db.add(ScrapeLog(course_name=course_name, status="fail", error_message=str(e)))
            db.commit()
            logger.error(f"[ERROR] {course_name}: {str(e)}")
            raise e
        finally:
            db.close()


async def scrape_all(csv_path: str, state_filter: str = None):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized.")
    
    client = NCRDBClient()
    logger.info("Initializing NCRDB session...")
    await client.init_session()
    
    # Control concurrency to avoid hammering the servers
    semaphore = asyncio.Semaphore(CONCURRENCY)
    tasks = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if state_filter and row['state'] != state_filter:
                continue
            tasks.append(process_course(row, client, semaphore))
            
    logger.info(f"Queued {len(tasks)} courses for scraping...")
    await asyncio.gather(*tasks)
    
    await client.close()
    logger.info("Scraping completed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape USGA NCRDB and Fallback Sources")
    parser.add_argument("--file", default="seed.csv", help="CSV file with course_name, city, state")
    parser.add_argument("--state", default=None, help="Process only specific state code (e.g., VA)")
    
    args = parser.parse_args()
    
    asyncio.run(scrape_all(args.file, args.state))

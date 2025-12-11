/**
 * Course Handicap Calculation Utilities
 * 
 * Uses the USGA formula:
 * Course Handicap = (Handicap Index × Slope Rating / 113) + (Course Rating - Par)
 */

/**
 * Calculate course handicap using USGA formula
 * @param {number} handicapIndex - Player's Handicap Index
 * @param {number} courseRating - Course rating for the selected tee
 * @param {number} slopeRating - Slope rating for the selected tee
 * @param {number} par - Par for the course
 * @returns {number} Calculated course handicap (rounded to nearest integer)
 */
export function calculateCourseHandicap(handicapIndex, courseRating, slopeRating, par) {
    if (!handicapIndex || handicapIndex === 0) return 0;

    // USGA Formula: (Handicap Index × Slope Rating / 113) + (Course Rating - Par)
    const courseHandicap = (handicapIndex * slopeRating / 113) + (courseRating - par);

    // Round to nearest integer
    return Math.round(courseHandicap);
}

/**
 * Get tee data from course
 * @param {Object} course - Course object from courses.json
 * @param {string} teeName - Name of the tee (e.g., "Gold", "Blue")
 * @returns {Object|null} Tee object with rating, slope, yardage
 */
export function getTeeData(course, teeName) {
    if (!course || !course.tees || !teeName) return null;

    return course.tees.find(tee => tee.name === teeName);
}

/**
 * Calculate all course handicaps for a player
 * @param {number} handicapIndex - Player's Handicap Index
 * @param {Array} courses - Array of course objects
 * @param {Object} teeSelections - Object with tee selections { river: "Gold", plantation: "Blue", rnk: "White" }
 * @returns {Object} Object with calculated handicaps { hcpRiver, hcpPlantation, hcpRNK }
 */
export function calculateAllCourseHandicaps(handicapIndex, courses, teeSelections) {
    const result = {
        hcpRiver: 0,
        hcpPlantation: 0,
        hcpRNK: 0
    };

    if (!handicapIndex || !courses || !teeSelections) return result;

    // River Course (id: 2)
    const riverCourse = courses.find(c => c.id === 2);
    if (riverCourse && teeSelections.river) {
        const tee = getTeeData(riverCourse, teeSelections.river);
        if (tee) {
            result.hcpRiver = calculateCourseHandicap(
                handicapIndex,
                tee.rating,
                tee.slope,
                riverCourse.par
            );
        }
    }

    // Plantation Course (id: 1)
    const plantationCourse = courses.find(c => c.id === 1);
    if (plantationCourse && teeSelections.plantation) {
        const tee = getTeeData(plantationCourse, teeSelections.plantation);
        if (tee) {
            result.hcpPlantation = calculateCourseHandicap(
                handicapIndex,
                tee.rating,
                tee.slope,
                plantationCourse.par
            );
        }
    }

    // Royal New Kent (id: 3)
    const rnkCourse = courses.find(c => c.id === 3);
    if (rnkCourse && teeSelections.rnk) {
        const tee = getTeeData(rnkCourse, teeSelections.rnk);
        if (tee) {
            result.hcpRNK = calculateCourseHandicap(
                handicapIndex,
                tee.rating,
                tee.slope,
                rnkCourse.par
            );
        }
    }

    return result;
}

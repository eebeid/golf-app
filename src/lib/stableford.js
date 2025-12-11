/**
 * Stableford Scoring Utilities
 * 
 * Point System:
 * - 1 point for net bogey (1 over par)
 * - 2 points for net par
 * - 3 points for net birdie (1 under par)
 * - 4 points for net eagle (2 under par)
 * - 5 points for net albatross (3 under par)
 * - 0 points for double bogey or worse
 */

/**
 * Calculate Stableford points for a single hole
 * @param {number} grossScore - The actual score on the hole
 * @param {number} par - Par for the hole
 * @param {number} strokesReceived - Number of handicap strokes received on this hole
 * @returns {number} Stableford points earned
 */
export function calculateStablefordPoints(grossScore, par, strokesReceived = 0) {
    const netScore = grossScore - strokesReceived;
    const scoreToPar = netScore - par;

    // Stableford points based on score relative to par
    if (scoreToPar <= -3) return 5; // Albatross or better
    if (scoreToPar === -2) return 4; // Eagle
    if (scoreToPar === -1) return 3; // Birdie
    if (scoreToPar === 0) return 2;  // Par
    if (scoreToPar === 1) return 1;  // Bogey
    return 0; // Double bogey or worse
}

/**
 * Calculate net score for a hole
 * @param {number} grossScore - The actual score on the hole
 * @param {number} strokesReceived - Number of handicap strokes received on this hole
 * @returns {number} Net score
 */
export function calculateNetScore(grossScore, strokesReceived = 0) {
    return grossScore - strokesReceived;
}

/**
 * Distribute handicap strokes across 18 holes
 * Standard method: strokes are distributed based on hole handicap index (1-18)
 * Holes with lower handicap index receive strokes first
 * 
 * @param {number} courseHandicap - Player's course handicap
 * @param {Array} holes - Array of hole objects with handicapIndex property
 * @returns {Object} Map of hole number to strokes received
 */
export function distributeHandicapStrokes(courseHandicap, holes) {
    const strokesMap = {};

    // Initialize all holes to 0 strokes
    holes.forEach(hole => {
        strokesMap[hole.number] = 0;
    });

    // If no handicap, return empty map
    if (courseHandicap <= 0) return strokesMap;

    // Sort holes by handicap index (lower index = harder hole, gets strokes first)
    const sortedHoles = [...holes].sort((a, b) => {
        const indexA = a.handicapIndex || a.number;
        const indexB = b.handicapIndex || b.number;
        return indexA - indexB;
    });

    // Distribute strokes
    let strokesRemaining = Math.abs(courseHandicap);
    let round = 0;

    while (strokesRemaining > 0) {
        for (let i = 0; i < sortedHoles.length && strokesRemaining > 0; i++) {
            const hole = sortedHoles[i];
            strokesMap[hole.number]++;
            strokesRemaining--;
        }
        round++;
    }

    return strokesMap;
}

/**
 * Calculate total Stableford points for a round
 * @param {Array} scores - Array of score objects with hole, score properties
 * @param {Object} courseData - Course data with holes array containing par and handicapIndex
 * @param {number} playerHandicap - Player's course handicap
 * @returns {Object} Object with totalPoints and pointsPerHole
 */
export function getTotalStablefordPoints(scores, courseData, playerHandicap) {
    const holes = courseData.holes || [];
    const strokesMap = distributeHandicapStrokes(playerHandicap, holes);

    let totalPoints = 0;
    const pointsPerHole = {};

    scores.forEach(scoreEntry => {
        const hole = holes.find(h => h.number === scoreEntry.hole);
        if (!hole) return;

        const strokesReceived = strokesMap[scoreEntry.hole] || 0;
        const points = calculateStablefordPoints(scoreEntry.score, hole.par, strokesReceived);

        pointsPerHole[scoreEntry.hole] = {
            gross: scoreEntry.score,
            par: hole.par,
            strokes: strokesReceived,
            net: calculateNetScore(scoreEntry.score, strokesReceived),
            points: points
        };

        totalPoints += points;
    });

    return {
        totalPoints,
        pointsPerHole
    };
}

/**
 * Get a display string for the score type (birdie, par, bogey, etc.)
 * @param {number} scoreToPar - Score relative to par (negative = under par)
 * @returns {string} Display string
 */
export function getScoreType(scoreToPar) {
    if (scoreToPar <= -3) return 'Albatross';
    if (scoreToPar === -2) return 'Eagle';
    if (scoreToPar === -1) return 'Birdie';
    if (scoreToPar === 0) return 'Par';
    if (scoreToPar === 1) return 'Bogey';
    if (scoreToPar === 2) return 'Double Bogey';
    return `+${scoreToPar}`;
}

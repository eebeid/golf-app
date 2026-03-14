import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const { archiveId, tournamentId } = await request.json();

        if (!archiveId || !tournamentId) {
            return NextResponse.json({ error: 'Archive ID and Tournament ID are required' }, { status: 400 });
        }

        // 1. Fetch Archive
        const archive = await prisma.historicalTrip.findUnique({
            where: { id: archiveId }
        });

        if (!archive) {
            return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
        }

        const snapshot = archive.data;

        // 2. Fetch Target Tournament & Verify Admin
        const tournament = await prisma.tournament.findFirst({
            where: {
                OR: [
                    { slug: tournamentId },
                    { id: tournamentId }
                ]
            }
        });

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // Admin check (Simplified, assuming similar logic to settings)
        let isAdmin = false;
        if (session?.user) {
            if (session.user.id === tournament.ownerId) isAdmin = true;
            if (session.user.email && isSuperAdmin(session.user.email)) isAdmin = true;

            if (!isAdmin && session.user.email) {
                const playerManager = await prisma.player.findFirst({
                    where: { tournamentId: tournament.id, email: session.user.email, isManager: true }
                });
                if (playerManager) isAdmin = true;
            }
        }

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Destructive RESTORE Operation (Transaction)
        await prisma.$transaction(async (tx) => {
            const currentTid = tournament.id;

            // Clear Existing Data
            await tx.message.deleteMany({ where: { tournamentId: currentTid } });
            await tx.teeTime.deleteMany({ where: { tournamentId: currentTid } });
            await tx.scorecard.deleteMany({ where: { tournamentId: currentTid } });
            await tx.photo.deleteMany({ where: { tournamentId: currentTid } });
            await tx.restaurant.deleteMany({ where: { tournamentId: currentTid } });
            await tx.lodging.deleteMany({ where: { tournamentId: currentTid } }); // Cascades to LodgingPlayer
            await tx.score.deleteMany({
                where: { player: { tournamentId: currentTid } }
            });
            await tx.player.deleteMany({ where: { tournamentId: currentTid } });
            await tx.course.deleteMany({ where: { tournamentId: currentTid } });
            await tx.settings.deleteMany({ where: { tournamentId: currentTid } });

            // Restore Settings
            if (snapshot.settings) {
                const { id, updatedAt, tournamentId: oldTid, ...settingsData } = snapshot.settings;
                await tx.settings.create({
                    data: {
                        ...settingsData,
                        tournamentId: currentTid
                    }
                });
            }

            // Restore Courses (Map old IDs to new IDs if we let Prisma generate them)
            // But if we want to preserve relationships, we might need to map them.
            // Let's preserve IDs from snapshot if possible OR use a mapping object.

            const courseMapping = {};
            if (snapshot.courses) {
                for (const course of snapshot.courses) {
                    const { id: oldId, ...courseData } = course;
                    const newCourse = await tx.course.create({
                        data: {
                            ...courseData,
                            tournamentId: currentTid
                        }
                    });
                    courseMapping[oldId] = newCourse.id;
                }
            }

            // Restore Players & Scores
            const playerMapping = {};
            if (snapshot.players) {
                for (const player of snapshot.players) {
                    const { id: oldId, scores, ...playerData } = player;
                    const newPlayer = await tx.player.create({
                        data: {
                            ...playerData,
                            tournamentId: currentTid
                        }
                    });
                    playerMapping[oldId] = newPlayer.id;

                    // Restore Scores for this player
                    if (scores) {
                        for (const score of scores) {
                            const { id, createdAt, updatedAt, ...scoreData } = score;
                            await tx.score.create({
                                data: {
                                    ...scoreData,
                                    playerId: newPlayer.id,
                                    courseId: courseMapping[score.courseId] || score.courseId // Map to new course ID
                                }
                            });
                        }
                    }
                }
            }

            // Restore Lodging
            if (snapshot.lodging) {
                for (const lodge of snapshot.lodging) {
                    const { id: oldLodgeId, players: lodgePlayers, ...lodgeData } = lodge;
                    const newLodge = await tx.lodging.create({
                        data: {
                            ...lodgeData,
                            tournamentId: currentTid
                        }
                    });

                    if (lodgePlayers) {
                        for (const lp of lodgePlayers) {
                            await tx.lodgingPlayer.create({
                                data: {
                                    lodgingId: newLodge.id,
                                    playerId: playerMapping[lp.playerId] || lp.playerId
                                }
                            });
                        }
                    }
                }
            }

            // Restore Restaurants
            if (snapshot.restaurants) {
                for (const rest of snapshot.restaurants) {
                    const { id, ...restData } = rest;
                    await tx.restaurant.create({
                        data: {
                            ...restData,
                            tournamentId: currentTid,
                            payerId: rest.payerId ? (playerMapping[rest.payerId] || rest.payerId) : null
                        }
                    });
                }
            }

            // Restore Photos
            if (snapshot.photos) {
                for (const photo of snapshot.photos) {
                    const { id, ...photoData } = photo;
                    await tx.photo.create({
                        data: {
                            ...photoData,
                            tournamentId: currentTid
                        }
                    });
                }
            }

            // Restore Scorecards
            if (snapshot.scorecards) {
                for (const sc of snapshot.scorecards) {
                    const { id, ...scData } = sc;
                    // Note: playerIds in snapshot might need mapping if they were stored as IDs
                    let mappedPlayerIds = sc.playerIds;
                    if (Array.isArray(sc.playerIds)) {
                        mappedPlayerIds = sc.playerIds.map(pid => playerMapping[pid] || pid);
                    }

                    await tx.scorecard.create({
                        data: {
                            ...scData,
                            playerIds: mappedPlayerIds,
                            tournamentId: currentTid
                        }
                    });
                }
            }

            // Restore TeeTimes
            if (snapshot.teeTimes) {
                for (const tt of snapshot.teeTimes) {
                    const { id, ...ttData } = tt;
                    // Players in teeTimes are usually stored as JSON objects with player IDs
                    let mappedTeePlayers = tt.players;
                    if (Array.isArray(tt.players)) {
                        mappedTeePlayers = tt.players.map(p => {
                            if (p && p.id) {
                                return { ...p, id: playerMapping[p.id] || p.id };
                            }
                            return p;
                        });
                    }

                    await tx.teeTime.create({
                        data: {
                            ...ttData,
                            players: mappedTeePlayers,
                            tournamentId: currentTid
                        }
                    });
                }
            }

            // Messages
            if (snapshot.messages) {
                for (const msg of snapshot.messages) {
                    const { id, user, ...msgData } = msg;
                    await tx.message.create({
                        data: {
                            ...msgData,
                            tournamentId: currentTid
                        }
                    });
                }
            }
        }, {
            timeout: 30000 // 30 seconds for heavy restore
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error restoring history:', error);
        return NextResponse.json({ error: 'Failed to restore: ' + error.message }, { status: 500 });
    }
}

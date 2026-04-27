import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { archiveId, newName } = await request.json();

        if (!archiveId || !newName) {
            return NextResponse.json({ error: 'Archive ID and new tournament name are required' }, { status: 400 });
        }

        // 1. Fetch Archive
        const archive = await prisma.historicalTrip.findUnique({
            where: { id: archiveId }
        });

        if (!archive) {
            return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
        }

        const snapshot = archive.data;

        // 2. Transaction: Create brand new tournament and populate it
        const newTournament = await prisma.$transaction(async (tx) => {
            // Create New Tournament
            const tournament = await tx.tournament.create({
                data: {
                    name: newName,
                    ownerId: session.user.id
                }
            });
            const newTid = tournament.id;

            // Clone Settings (but reset dates/schedule-specific info if desired, or just copy as is)
            if (snapshot.settings) {
                const { id, updatedAt, tournamentId, tournamentName, ...settingsData } = snapshot.settings;
                await tx.settings.create({
                    data: {
                        ...settingsData,
                        tournamentName: newName, // Use the new name
                        tournamentId: newTid
                    }
                });
            }

            // Clone Courses
            const courseMapping = {};
            if (snapshot.courses) {
                for (const course of snapshot.courses) {
                    const { id: oldId, ...courseData } = course;
                    const newCourse = await tx.course.create({
                        data: {
                            ...courseData,
                            tournamentId: newTid
                        }
                    });
                    courseMapping[oldId] = newCourse.id;
                }
            }

            // Clone Players (SKIP SCORES and TEE TIMES)
            const playerMapping = {};
            if (snapshot.players) {
                for (const player of snapshot.players) {
                    const { id: oldId, scores, ...playerData } = player;
                    const newPlayer = await tx.player.create({
                        data: {
                            ...playerData,
                            tournamentId: newTid
                        }
                    });
                    playerMapping[oldId] = newPlayer.id;
                }
            }

            // Clone Lodging
            if (snapshot.lodging) {
                for (const lodge of snapshot.lodging) {
                    const { id: oldLodgeId, players: lodgePlayers, ...lodgeData } = lodge;
                    const newLodge = await tx.lodging.create({
                        data: {
                            ...lodgeData,
                            tournamentId: newTid
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

            // Clone Restaurants (Skip payer assignments as it might be a new trip)
            if (snapshot.restaurants) {
                for (const rest of snapshot.restaurants) {
                    const { id, payerId, ...restData } = rest;
                    await tx.restaurant.create({
                        data: {
                            ...restData,
                            payerId: null, // Reset the payer for a new trip
                            tournamentId: newTid
                        }
                    });
                }
            }

            // We explicitly SKIP cloning: Messages, Photos, Scorecards, Scores, TeeTimes.

            return tournament;
        });

        return NextResponse.json({ success: true, slug: newTournament.slug });
    } catch (error) {
        console.error('Error cloning tournament:', error);
        return NextResponse.json({ error: 'Failed to clone tournament' }, { status: 500 });
    }
}

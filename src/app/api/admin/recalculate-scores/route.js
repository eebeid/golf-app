import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tournamentId = searchParams.get('tournamentId');

        if (!tournamentId) {
            return NextResponse.json({ error: "Missing tournamentId" }, { status: 400 });
        }

        const tournament = await prisma.tournament.findUnique({
            where: { slug: tournamentId },
            include: { settings: true }
        });

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        let isAuthorized = isSuperAdmin(session.user.email) || tournament.ownerId === session.user.id;
        if (!isAuthorized) {
            const manager = await prisma.player.findFirst({
                where: { tournamentId: tournament.id, email: session.user.email, isManager: true }
            });
            if (manager) isAuthorized = true;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const scores = await prisma.score.findMany({
            where: {
                player: {
                    tournamentId: tournament.id
                }
            },
            include: {
                player: true,
                course: true
            }
        });

        let updatedCount = 0;

        for (const score of scores) {
            if (!score.score) continue; 

            const player = score.player;
            const course = score.course;
            const settings = tournament.settings;

            const roundVal = score.round || 1;
            const holeNum = score.hole;
            
            const holes = Array.isArray(course.holes) ? course.holes : [];
            const holeData = holes.find(h => h.number === holeNum);
            const par = holeData?.par || 4;
            let holeHandicap = holeData?.handicapIndex || 18;

            let pHandicap = Math.round(player.handicapIndex || 0);
            const pcd = typeof player.courseData === 'string' ? JSON.parse(player.courseData || '{}') : (player.courseData || {});
            
            if (pcd[course.id] && pcd[course.id].tee) {
                const playerTeeName = pcd[course.id].tee;
                const courseTees = Array.isArray(course.tees) ? course.tees : [];
                const selectedTee = courseTees.find(t => t.name === playerTeeName);
                
                if (selectedTee && Array.isArray(selectedTee.handicaps)) {
                    const teeHoleHcp = selectedTee.handicaps.find(h => h.hole === holeNum);
                    if (teeHoleHcp && teeHoleHcp.index) {
                        holeHandicap = parseInt(teeHoleHcp.index);
                    }
                }
            }

            if (pcd[course.id] && pcd[course.id].hcp !== undefined) {
                pHandicap = pcd[course.id].hcp;
            } else {
                const cn = course.name.toLowerCase();
                if (cn.includes('plantation')) pHandicap = player.hcpPlantation || pHandicap;
                else if (cn.includes('river')) pHandicap = player.hcpRiver || pHandicap;
                else if (cn.includes('royal') || cn.includes('rnk')) pHandicap = player.hcpRNK || pHandicap;
            }

            if (settings && settings.roundHandicaps && Array.isArray(settings.roundHandicaps)) {
                const hcpPctStr = settings.roundHandicaps[roundVal - 1];
                if (hcpPctStr) {
                    const pct = parseFloat(hcpPctStr);
                    if (!isNaN(pct)) pHandicap = Math.round(pHandicap * (pct / 100));
                }
            }

            const dbMaxHcp = settings?.roundTimeConfig && typeof settings.roundTimeConfig === 'object' ? settings.roundTimeConfig.maxHandicap : null;
            if (dbMaxHcp != null && pHandicap > dbMaxHcp) {
                pHandicap = dbMaxHcp;
            }

            let pStrokes = 0;
            if (pHandicap > 0) {
                pStrokes = Math.floor(pHandicap / 18) + (holeHandicap <= (pHandicap % 18) ? 1 : 0);
            }
            
            const pNet = score.score - pStrokes;
            let pPoints = Math.max(0, par - pNet + 2);

            if (score.stablefordPoints !== pPoints || score.strokesReceived !== pStrokes) {
                await prisma.score.update({
                    where: { id: score.id },
                    data: {
                        stablefordPoints: pPoints,
                        strokesReceived: pStrokes
                    }
                });
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, updatedCount });

    } catch (e) {
        console.error("Recalculate error:", e);
        return NextResponse.json({ error: "Server Error", details: e.message }, { status: 500 });
    }
}

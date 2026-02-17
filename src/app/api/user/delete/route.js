import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const confirmEmail = searchParams.get('confirmEmail');

        // Verify the user is deleting their own account or is an admin
        const isOwnAccount = userId === session.user.id;
        const userEmail = session.user.email?.toLowerCase();
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
        const isAdmin = adminEmails.includes(userEmail);

        if (!isOwnAccount && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden: You can only delete your own account' }, { status: 403 });
        }

        // Get user to verify email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                tournaments: true,
                messages: true,
                accounts: true,
                sessions: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify email confirmation
        if (confirmEmail !== user.email) {
            return NextResponse.json({ error: 'Email confirmation does not match' }, { status: 400 });
        }

        // Delete user data in transaction
        await prisma.$transaction(async (tx) => {
            // Delete user's sessions
            await tx.session.deleteMany({
                where: { userId: userId }
            });

            // Delete user's OAuth accounts
            await tx.account.deleteMany({
                where: { userId: userId }
            });

            // Delete user's messages
            await tx.message.deleteMany({
                where: { userId: userId }
            });

            // Handle tournaments owned by user
            // Option 1: Delete tournaments (if user is sole owner)
            // Option 2: Transfer ownership (implement if needed)
            // For now, we'll delete tournaments they own
            const ownedTournaments = await tx.tournament.findMany({
                where: { ownerId: userId }
            });

            for (const tournament of ownedTournaments) {
                // Delete related data first due to foreign key constraints
                await tx.scorecard.deleteMany({ where: { tournamentId: tournament.id } });
                await tx.photo.deleteMany({ where: { tournamentId: tournament.id } });
                await tx.message.deleteMany({ where: { tournamentId: tournament.id } });
                await tx.teeTime.deleteMany({ where: { tournamentId: tournament.id } });
                await tx.settings.deleteMany({ where: { tournamentId: tournament.id } });
                await tx.restaurant.deleteMany({ where: { tournamentId: tournament.id } });
                await tx.lodging.deleteMany({ where: { tournamentId: tournament.id } });

                // Delete players and their scores
                const players = await tx.player.findMany({ where: { tournamentId: tournament.id } });
                for (const player of players) {
                    await tx.score.deleteMany({ where: { playerId: player.id } });
                }
                await tx.player.deleteMany({ where: { tournamentId: tournament.id } });

                // Delete courses and their scores
                const courses = await tx.course.findMany({ where: { tournamentId: tournament.id } });
                for (const course of courses) {
                    await tx.score.deleteMany({ where: { courseId: course.id } });
                }
                await tx.course.deleteMany({ where: { tournamentId: tournament.id } });

                // Finally delete the tournament
                await tx.tournament.delete({ where: { id: tournament.id } });
            }

            // Delete the user account
            await tx.user.delete({
                where: { id: userId }
            });
        });

        return NextResponse.json({
            success: true,
            message: 'User account and all associated data have been permanently deleted',
            deletedTournaments: user.tournaments.length
        });

    } catch (error) {
        console.error('Error deleting user account:', error);
        return NextResponse.json({
            error: 'Failed to delete user account',
            details: error.message
        }, { status: 500 });
    }
}

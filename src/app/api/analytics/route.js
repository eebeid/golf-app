import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !isSuperAdmin(session.user?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = process.env.GA_PROPERTY_ID;

    try {
        if (!propertyId || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return NextResponse.json({ error: 'Google Analytics credentials not fully configured.' }, { status: 500 });
        }

        const analyticsDataClient = new BetaAnalyticsDataClient({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
        });

        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: '30daysAgo',
                    endDate: 'today',
                },
            ],
            dimensions: [
                {
                    name: 'date',
                },
            ],
            metrics: [
                {
                    name: 'activeUsers',
                },
                {
                    name: 'screenPageViews',
                }
            ],
        });

        const data = response.rows.map(row => {
            const dateStr = row.dimensionValues[0].value;
            // Format YYYYMMDD to MMM DD
            const formattedDate = `${dateStr.substring(4, 6)}/${dateStr.substring(6, 8)}`;

            return {
                rawDate: dateStr,
                date: formattedDate,
                users: parseInt(row.metricValues[0].value, 10),
                views: parseInt(row.metricValues[1].value, 10),
            };
        }).sort((a, b) => a.rawDate.localeCompare(b.rawDate));

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics data', details: error.message }, { status: 500 });
    }
}

// src/app/api/proxy/route.ts
import { NextResponse } from 'next/server';
import { GAS_API_URL } from '@/config';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (!GAS_API_URL) {
            return NextResponse.json({ error: 'GAS_API_URL not configured' }, { status: 500 });
        }

        // Forward the request to GAS
        const response = await fetch(`${GAS_API_URL}?action=${action}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // 'cache': 'no-store' // efficient for dynamic data
        });

        if (!response.ok) {
            return NextResponse.json({ error: `GAS responded with ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch from GAS' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!GAS_API_URL) {
            return NextResponse.json({ error: 'GAS_API_URL not configured' }, { status: 500 });
        }

        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // GAS POST often returns 302 or text/html if not carefully handled, but with ContentService JSON it should be fine.
        // However, if it redirects, Next.js fetch follows it by default.

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Proxy Post Error:', error);
        return NextResponse.json({ error: 'Failed to post to GAS' }, { status: 500 });
    }
}

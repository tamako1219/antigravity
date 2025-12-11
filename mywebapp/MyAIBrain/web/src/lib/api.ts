// src/lib/api.ts
import { GAS_API_URL } from '../config'; // Used for type reference or fallback if needed, but mainly we use proxy now

const PROXY_URL = '/api/proxy';

export interface BrainItem {
    timestamp: string;
    title: string;
    body: string;
    translation: string;
    summary: string;
    tags: string[];
    color: string;
    url: string;
    fileUrl: string;
    fileId: string;
    type: string;
}

export type BrainData = BrainItem[];

export async function fetchBrainData(): Promise<BrainData> {
    try {
        // Call Next.js API Proxy instead of direct GAS
        const response = await fetch(`${PROXY_URL}?action=getData`);

        if (!response.ok) {
            console.error(`Proxy Error: ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Failed to fetch brain data:", error);
        return [];
    }
}

export async function postToBrain(data: any): Promise<any> {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return await response.json();
    } catch (error) {
        console.error("Failed to post to brain:", error);
        return { status: 'error', message: error };
    }
}

// src/components/GraphView.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { BrainItem } from '@/lib/api';

// Dynamic import for client-side only library
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const GraphView = ({ items }: { items: BrainItem[] }) => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 800, h: 600 });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                w: containerRef.current.clientWidth,
                h: containerRef.current.clientHeight
            });
        }

        // Transform items to nodes/links
        // Simple logic: Link items with same tags
        const nodes = items.map(i => ({ id: i.url || i.title, name: i.title, val: 1, color: i.color }));
        const links: any[] = [];

        // Naive linking O(N^2) - optimize later
        items.forEach((itemA, idxA) => {
            items.forEach((itemB, idxB) => {
                if (idxA < idxB) {
                    const commonTags = itemA.tags.filter(t => itemB.tags.includes(t));
                    if (commonTags.length > 0) {
                        links.push({ source: itemA.url || itemA.title, target: itemB.url || itemB.title });
                    }
                }
            });
        });

        setGraphData({ nodes, links } as any);

    }, [items]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[500px] border rounded-xl overflow-hidden bg-slate-50">
            <ForceGraph2D
                width={dimensions.w}
                height={dimensions.h}
                graphData={graphData}
                nodeLabel="name"
                nodeRelSize={6}
                linkColor={() => '#cccccc'}
            />
        </div>
    );
};

export default GraphView;

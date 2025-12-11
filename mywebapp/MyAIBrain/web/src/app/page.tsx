// src/app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Brain, LayoutGrid, Network, Plus, RefreshCw } from 'lucide-react';
import NoteCard from '@/components/NoteCard';
import GraphView from '@/components/GraphView';
import { fetchBrainData, BrainItem } from '@/lib/api';

export default function Home() {
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid');
  const [items, setItems] = useState<BrainItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchBrainData();
    // Dummy Data fallback for dev if empty
    if (data.length === 0) {
      // console.log("Using dummy data");
      // setItems([...]); 
    } else {
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-indigo-600">
          <Brain size={32} />
          <h1 className="text-xl font-bold tracking-tight">My AI Brain 3.0</h1>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`p-2 rounded-md transition-all ${viewMode === 'graph' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
          >
            <Network size={20} />
          </button>
        </div>

        <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-full">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {loading && items.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-400">Loading your brain...</div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item, idx) => (
                  <NoteCard key={idx} item={item} />
                ))}
              </div>
            ) : (
              <div className="h-[calc(100vh-120px)]">
                <GraphView items={items} />
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB (Floating Action Button) for mobile capture - Placeholder */}
      <button className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105 active:scale-95">
        <Plus size={24} />
      </button>
    </main>
  );
}

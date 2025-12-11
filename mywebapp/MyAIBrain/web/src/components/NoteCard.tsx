// src/components/NoteCard.tsx
import React from 'react';
import { ExternalLink, FileText, Image, Youtube } from 'lucide-react';
import { BrainItem } from '@/lib/api';

const NoteCard = ({ item }: { item: BrainItem }) => {
    const getIcon = () => {
        if (item.type === 'image') return <Image size={20} />;
        if (item.type === 'page') return <ExternalLink size={20} />;
        if (item.type === 'youtube') return <Youtube size={20} />;
        return <FileText size={20} />;
    };

    return (
        <div
            className="rounded-xl shadow-sm p-4 hover:shadow-md transition-all border border-gray-100 flex flex-col gap-2 overflow-hidden"
            style={{ backgroundColor: item.color === '#FFFFFF' ? 'white' : item.color + '20', borderLeft: `4px solid ${item.color}` }}
        >
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800 line-clamp-2">{item.title}</h3>
                <span className="text-gray-500">{getIcon()}</span>
            </div>

            {item.fileUrl && item.type === 'image' && (
                <img src={item.fileUrl} alt={item.title} className="w-full h-32 object-cover rounded-md" />
            )}

            <p className="text-sm text-gray-600 line-clamp-3">{item.summary || item.body}</p>

            {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-white/50 rounded-full border border-gray-200">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-auto pt-2 flex justify-between items-center text-xs text-gray-400">
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">
                        Open Link
                    </a>
                )}
            </div>
        </div>
    );
};

export default NoteCard;

import { StickyNote } from 'lucide-react';

interface AcarsNotesProps {
    notes: string;
    onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function AcarsNotes({ notes, onNotesChange }: AcarsNotesProps) {
    return (
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-mono text-gray-300">
                        Flight Notes
                    </span>
                </div>
            </div>
            <div className="p-4" style={{ height: 'calc(100vh - 200px)' }}>
                <textarea
                    value={notes}
                    onChange={onNotesChange}
                    placeholder="Loading flight plan details..."
                    className="w-full h-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                />
            </div>
        </div>
    );
}

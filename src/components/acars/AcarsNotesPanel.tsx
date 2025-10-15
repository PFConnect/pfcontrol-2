import { StickyNote } from 'lucide-react';

interface NotesPanelProps {
  notes: string;
  handleNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function NotesPanel({
  notes,
  handleNotesChange,
}: NotesPanelProps) {
  return (
    <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 px-4 h-12 flex items-center flex-shrink-0 border-b border-zinc-700 overflow-hidden">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-mono text-zinc-300 truncate">
            Flight Notes
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 p-4 flex flex-col">
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Loading flight plan details..."
          className="w-full flex-1 min-h-0 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-600"
        />
      </div>
    </div>
  );
}

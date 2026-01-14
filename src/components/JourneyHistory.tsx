import { useState, useEffect } from 'react';
import type { Journey } from '../types';
import { LINES } from '../data/lines';
import { getJourneyHistory, isSupabaseConfigured } from '../services/supabase';

interface JourneyHistoryProps {
  onBack: () => void;
}

export function JourneyHistory({ onBack }: JourneyHistoryProps) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (isSupabaseConfigured()) {
        const history = await getJourneyHistory();
        setJourneys(history);
      }
      setIsLoading(false);
    }
    loadHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In progress';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60);

    if (diff < 60) {
      return `${diff} min`;
    } else {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-lg font-semibold text-gray-900">Journey History</h2>

      {!isSupabaseConfigured() ? (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm">
          <p className="font-medium">Local Mode Active</p>
          <p className="mt-1">
            Journey history requires Supabase to be configured. Add your Supabase
            credentials to enable persistent storage.
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-12 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-2" />
          <p className="text-gray-500">Loading history...</p>
        </div>
      ) : journeys.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-gray-900 font-medium mb-1">No journeys yet</h3>
          <p className="text-gray-500 text-sm">
            Your check-in history will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {journeys.map((journey) => {
            const line = LINES[journey.lineId];
            return (
              <div
                key={journey.id}
                className="bg-white rounded-xl shadow-sm p-4 border-l-4"
                style={{ borderLeftColor: line?.color || '#888' }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{journey.trainId}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: line?.color || '#888' }}
                      >
                        {journey.lineName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(journey.startedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        journey.status === 'completed'
                          ? 'text-green-600'
                          : journey.status === 'active'
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {journey.status === 'completed'
                        ? formatDuration(journey.startedAt, journey.endedAt)
                        : journey.status}
                    </span>
                  </div>
                </div>

                {(journey.originStation || journey.destinationStation) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-sm text-gray-600">
                    {journey.originStation && <span>{journey.originStation}</span>}
                    {journey.originStation && journey.destinationStation && (
                      <svg
                        className="w-4 h-4 mx-2 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    )}
                    {journey.destinationStation && <span>{journey.destinationStation}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

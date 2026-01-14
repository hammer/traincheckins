import { useState, useEffect } from 'react';
import type { Journey, Stop } from '../types';
import { LINES } from '../data/lines';
import { getStopsForJourney, addStop } from '../services/supabase';

interface ActiveJourneyProps {
  journey: Journey;
  onEndJourney: (destinationStation?: string) => void;
}

export function ActiveJourney({ journey, onEndJourney }: ActiveJourneyProps) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [elapsedTime, setElapsedTime] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [destinationInput, setDestinationInput] = useState('');

  const line = LINES[journey.lineId];

  // Load stops
  useEffect(() => {
    async function loadStops() {
      const journeyStops = await getStopsForJourney(journey.id);
      setStops(journeyStops);
    }
    loadStops();
  }, [journey.id]);

  // Update elapsed time
  useEffect(() => {
    const updateTime = () => {
      const start = new Date(journey.startedAt);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (hours > 0) {
        setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setElapsedTime(`${minutes}m ${seconds}s`);
      } else {
        setElapsedTime(`${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [journey.startedAt]);

  const handleAddStop = async () => {
    const stationName = prompt('Enter station name:');
    if (stationName) {
      const stop = await addStop(
        journey.id,
        `manual-${Date.now()}`,
        stationName,
        stops.length + 1
      );
      if (stop) {
        setStops([...stops, stop]);
      }
    }
  };

  const handleEndJourney = () => {
    onEndJourney(destinationInput || undefined);
  };

  return (
    <div className="space-y-4">
      {/* Journey card */}
      <div
        className="rounded-xl p-6 text-white"
        style={{ backgroundColor: line.color }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold font-mono">{journey.trainId}</h2>
            <p className="opacity-90">{line.name} line</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75">Duration</div>
            <div className="text-xl font-mono">{elapsedTime}</div>
          </div>
        </div>

        {journey.originStation && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-sm opacity-75">From</div>
            <div className="font-medium">{journey.originStation}</div>
          </div>
        )}
      </div>

      {/* Stops */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-900">Journey Stops</h3>
          <button
            onClick={handleAddStop}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Stop
          </button>
        </div>

        {stops.length > 0 ? (
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <div key={stop.id} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: line.color }}
                />
                <div className="flex-1">
                  <div className="font-medium">{stop.stationName}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(stop.arrivedAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-sm text-gray-400">#{index + 1}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No stops recorded yet. Tap "+ Add Stop" to track your journey.
          </p>
        )}
      </div>

      {/* End journey */}
      {!isEnding ? (
        <button
          onClick={() => setIsEnding(true)}
          className="w-full py-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
        >
          End Journey
        </button>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-medium text-gray-900">End your journey?</h3>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Destination station (optional)
            </label>
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="e.g. Oxford Circus"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEnding(false)}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEndJourney}
              className="flex-1 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

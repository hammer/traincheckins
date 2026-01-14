import { useState, useEffect } from 'react';
import type { LineId, Station, TrackerNetTrain } from '../types';
import { LINES, TRACKERNET_LINES } from '../data/lines';
import { STATION_CODES } from '../data/stationCodes';
import { getCurrentPosition, findNearestStations, formatDistance } from '../services/geolocation';
import { getStationsForLine, getTrainsAtStation } from '../services/tflApi';

interface NearbyTrainsProps {
  onCheckIn: (trainId: string, lineId: LineId, stationName?: string) => void;
  onBack: () => void;
}

interface TrainWithStation extends TrackerNetTrain {
  stationName: string;
  stationId: string;
}

export function NearbyTrains({ onCheckIn, onBack }: NearbyTrainsProps) {
  const [selectedLine, setSelectedLine] = useState<LineId | null>(null);
  const [stations, setStations] = useState<(Station & { distance: number })[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [trains, setTrains] = useState<TrainWithStation[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [isLoadingTrains, setIsLoadingTrains] = useState(false);
  const [error, setError] = useState('');

  // Fetch nearby stations when line is selected
  useEffect(() => {
    if (!selectedLine) return;

    const lineId = selectedLine; // Capture for closure

    async function fetchStations() {
      setIsLoadingStations(true);
      setError('');

      try {
        const allStations = await getStationsForLine(lineId);
        setIsLoadingLocation(true);

        try {
          const position = await getCurrentPosition();
          const nearby = findNearestStations(position.lat, position.lng, allStations, 10);
          setStations(nearby);
        } catch {
          // If location fails, show all stations sorted alphabetically
          setStations(
            allStations
              .map((s) => ({ ...s, distance: 0 }))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stations');
      } finally {
        setIsLoadingStations(false);
        setIsLoadingLocation(false);
      }
    }

    fetchStations();
  }, [selectedLine]);

  // Fetch trains when station is selected
  useEffect(() => {
    if (!selectedLine || !selectedStation) return;

    const lineId = selectedLine; // Capture for closure
    const station = selectedStation; // Capture for closure

    async function fetchTrains() {
      setIsLoadingTrains(true);
      setError('');

      try {
        const line = LINES[lineId];
        // Look up TrackerNet station code from naptan ID
        const stationCode = STATION_CODES[station.id];
        if (!stationCode) {
          throw new Error(`Unknown station code for ${station.name}`);
        }

        // Use trackerNetCode if available (e.g., Circle/H&C/Met use District endpoint)
        const apiLineCode = line.trackerNetCode || line.code;
        const trainData = await getTrainsAtStation(apiLineCode, stationCode);

        // Filter to only trains with valid 5-digit LCIDs
        const validTrains = trainData
          .filter((t) => /^\d{5}$/.test(t.lcid))
          .map((t) => ({
            ...t,
            stationName: station.name,
            stationId: station.id,
          }));

        setTrains(validTrains);

        if (validTrains.length === 0) {
          setError('No trains with valid IDs found. Try a different station or use manual entry.');
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('API key')) {
          setError('TfL API key required. Add VITE_TFL_API_KEY to your .env file.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load trains');
        }
      } finally {
        setIsLoadingTrains(false);
      }
    }

    fetchTrains();
  }, [selectedLine, selectedStation]);

  const handleTrainSelect = (train: TrainWithStation) => {
    if (selectedLine) {
      onCheckIn(train.lcid, selectedLine, train.stationName);
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

      <h2 className="text-lg font-semibold text-gray-900">Find Nearby Trains</h2>
      <p className="text-sm text-gray-500">Real-time train detection available for select lines</p>

      {/* Step 1: Select line */}
      {!selectedLine && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-700 mb-3">Select a line</h3>
          <div className="grid grid-cols-2 gap-2">
            {TRACKERNET_LINES.map((line) => (
              <button
                key={line.id}
                onClick={() => setSelectedLine(line.id)}
                className="p-3 rounded-lg text-left border-2 border-transparent hover:border-gray-200 transition-colors"
                style={{ backgroundColor: `${line.color}20` }}
              >
                <div
                  className="w-4 h-4 rounded-full mb-1"
                  style={{ backgroundColor: line.color }}
                />
                <span className="text-sm font-medium">{line.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select station */}
      {selectedLine && !selectedStation && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700">Select a station</h3>
            <button
              onClick={() => setSelectedLine(null)}
              className="text-sm text-blue-600"
            >
              Change line
            </button>
          </div>

          <div
            className="h-1 rounded mb-4"
            style={{ backgroundColor: LINES[selectedLine].color }}
          />

          {isLoadingStations || isLoadingLocation ? (
            <div className="py-8 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-2" />
              {isLoadingLocation ? 'Getting your location...' : 'Loading stations...'}
            </div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {stations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => setSelectedStation(station)}
                  className="w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                  <span>{station.name}</span>
                  {station.distance > 0 && (
                    <span className="text-sm text-gray-400">
                      {formatDistance(station.distance)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select train */}
      {selectedLine && selectedStation && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-700">{selectedStation.name}</h3>
              <p className="text-sm text-gray-500">{LINES[selectedLine].name} line</p>
            </div>
            <button
              onClick={() => setSelectedStation(null)}
              className="text-sm text-blue-600"
            >
              Change station
            </button>
          </div>

          <div
            className="h-1 rounded mb-4"
            style={{ backgroundColor: LINES[selectedLine].color }}
          />

          {isLoadingTrains ? (
            <div className="py-8 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-2" />
              Loading trains...
            </div>
          ) : trains.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-2">Select your train:</p>
              {trains.map((train) => (
                <button
                  key={`${train.lcid}-${train.secondsTo}`}
                  onClick={() => handleTrainSelect(train)}
                  className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-lg font-bold">{train.lcid}</span>
                      <p className="text-sm text-gray-500 mt-1">
                        To {train.destination}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {train.secondsTo < 60
                          ? 'Due'
                          : `${Math.floor(train.secondsTo / 60)} min`}
                      </span>
                      <p className="text-xs text-gray-400">{train.location}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>
      )}
    </div>
  );
}

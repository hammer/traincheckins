import { useState, useEffect } from 'react';
import { CheckInForm } from './components/CheckInForm';
import { NearbyTrains } from './components/NearbyTrains';
import { ActiveJourney } from './components/ActiveJourney';
import { JourneyHistory } from './components/JourneyHistory';
import type { Journey, LineId } from './types';
import { LINES } from './data/lines';
import {
  createJourney,
  getActiveJourney,
  updateJourney,
  isSupabaseConfigured,
  signInAnonymously,
} from './services/supabase';

type View = 'home' | 'nearby' | 'history';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Sign in anonymously if Supabase is configured
      if (isSupabaseConfigured()) {
        await signInAnonymously();
        const journey = await getActiveJourney();
        setActiveJourney(journey);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const handleCheckIn = async (trainId: string, lineId: LineId, stationName?: string) => {
    const line = LINES[lineId];

    if (isSupabaseConfigured()) {
      const journey = await createJourney(trainId, lineId, line.name, stationName);
      if (journey) {
        setActiveJourney(journey);
      }
    } else {
      // Local-only mode
      setActiveJourney({
        id: crypto.randomUUID(),
        trainId,
        lineId,
        lineName: line.name,
        startedAt: new Date().toISOString(),
        originStation: stationName,
        status: 'active',
      });
    }
  };

  const handleEndJourney = async (destinationStation?: string) => {
    if (!activeJourney) return;

    if (isSupabaseConfigured()) {
      await updateJourney(activeJourney.id, {
        destinationStation,
        status: 'completed',
        endedAt: new Date().toISOString(),
      });
    }

    setActiveJourney(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Tube Check-in</h1>
          {!isSupabaseConfigured() && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Local Mode
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {activeJourney ? (
          <ActiveJourney journey={activeJourney} onEndJourney={handleEndJourney} />
        ) : (
          <>
            {currentView === 'home' && (
              <div className="space-y-6">
                <CheckInForm onCheckIn={handleCheckIn} />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">or</span>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentView('nearby')}
                  className="w-full py-4 px-4 bg-white rounded-xl shadow-sm border border-gray-200 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Find Nearby Trains</h3>
                      <p className="text-sm text-gray-500">Select from trains at your station</p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              </div>
            )}

            {currentView === 'nearby' && (
              <NearbyTrains
                onCheckIn={handleCheckIn}
                onBack={() => setCurrentView('home')}
              />
            )}

            {currentView === 'history' && (
              <JourneyHistory onBack={() => setCurrentView('home')} />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      {!activeJourney && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
          <div className="max-w-lg mx-auto flex">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex-1 py-3 flex flex-col items-center ${
                currentView === 'home' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-xs mt-1">Check In</span>
            </button>
            <button
              onClick={() => setCurrentView('nearby')}
              className={`flex-1 py-3 flex flex-col items-center ${
                currentView === 'nearby' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-xs mt-1">Nearby</span>
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`flex-1 py-3 flex flex-col items-center ${
                currentView === 'history' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs mt-1">History</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;

import { useState } from 'react';
import type { LineId } from '../types';
import { ALL_LINES } from '../data/lines';

interface CheckInFormProps {
  onCheckIn: (trainId: string, lineId: LineId, stationName?: string) => void;
}

export function CheckInForm({ onCheckIn }: CheckInFormProps) {
  const [trainId, setTrainId] = useState('');
  const [selectedLine, setSelectedLine] = useState<LineId | ''>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate train ID
    if (!/^\d{5}$/.test(trainId)) {
      setError('Please enter a valid 5-digit train number');
      return;
    }

    // Auto-detect line from train ID prefix if not selected
    let lineId = selectedLine;
    if (!lineId) {
      const prefix = trainId.substring(0, 2);
      if (prefix === '11') lineId = 'victoria';
      else if (prefix === '96') lineId = 'jubilee';
      else if (prefix === '51') lineId = 'northern';
      else if (prefix === '91') lineId = 'central';
      else if (prefix === '21') {
        setError('Train 21xxx could be Met/District/H&C/Circle - please select a line');
        return;
      } else {
        setError('Could not identify line from train number. Please select manually.');
        return;
      }
    }

    onCheckIn(trainId, lineId);
    setTrainId('');
    setSelectedLine('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Check-in</h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter the 5-digit number displayed on the front of the train
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="trainId" className="block text-sm font-medium text-gray-700 mb-1">
            Train Number
          </label>
          <input
            type="text"
            id="trainId"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            placeholder="e.g. 11054"
            value={trainId}
            onChange={(e) => {
              setTrainId(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            className="w-full px-4 py-3 text-xl tracking-widest text-center font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="line" className="block text-sm font-medium text-gray-700 mb-1">
            Line (optional)
          </label>
          <select
            id="line"
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value as LineId | '')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Auto-detect from number</option>
            {ALL_LINES.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
        )}

        <button
          type="submit"
          disabled={trainId.length !== 5}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          Check In
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-400 text-center">
        All tube lines supported for manual check-in
      </div>
    </div>
  );
}

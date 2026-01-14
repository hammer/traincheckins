import type { TflArrival, TrackerNetTrain, LineId, TrackerNetLineCode, Station } from '../types';
import { LINES } from '../data/lines';

// Use Vite proxy in development to bypass CORS
const TFL_API_BASE = import.meta.env.DEV ? '/api/tfl' : 'https://api.tfl.gov.uk';

function getApiKey(): string {
  const key = import.meta.env.VITE_TFL_API_KEY;
  if (!key) {
    console.warn('TFL API key not set. Some features may not work.');
    return '';
  }
  return key;
}

function buildUrl(path: string): string {
  const key = getApiKey();
  const separator = path.includes('?') ? '&' : '?';
  return key ? `${TFL_API_BASE}${path}${separator}app_key=${key}` : `${TFL_API_BASE}${path}`;
}

// Fetch arrivals using the Unified API (returns 3-digit vehicleId)
export async function getArrivals(lineId: LineId): Promise<TflArrival[]> {
  const url = buildUrl(`/Line/${lineId}/Arrivals`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch arrivals: ${response.statusText}`);
  }
  return response.json();
}

// Fetch arrivals at a specific station
export async function getStationArrivals(stationId: string): Promise<TflArrival[]> {
  const url = buildUrl(`/StopPoint/${stationId}/Arrivals`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch station arrivals: ${response.statusText}`);
  }
  return response.json();
}

// Parse TrackerNet XML response to extract trains with LeadingCarNo
function parseTrackerNetXml(xml: string): TrackerNetTrain[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const trains: TrackerNetTrain[] = [];

  // Use getElementsByTagName which ignores XML namespaces
  const trainElements = doc.getElementsByTagName('T');
  for (let i = 0; i < trainElements.length; i++) {
    const el = trainElements[i];
    const leadingCarNo = el.getAttribute('LeadingCarNo') || '';
    // Only include trains with valid 5-digit leading car numbers
    if (leadingCarNo && /^\d{5}$/.test(leadingCarNo)) {
      trains.push({
        lcid: leadingCarNo,
        setNo: el.getAttribute('SetNo') || '',
        tripNo: el.getAttribute('TripNo') || '',
        secondsTo: parseInt(el.getAttribute('SecondsTo') || '0', 10),
        location: el.getAttribute('Location') || '',
        destination: el.getAttribute('Destination') || '',
        destCode: el.getAttribute('DestCode') || '',
        departed: el.getAttribute('Departed') === '1',
        direction: el.getAttribute('Direction') || '',
        trackCode: el.getAttribute('TrackCode') || '',
        line: el.getAttribute('LN') || '',
      });
    }
  }

  return trains;
}

// Fetch trains with 5-digit LCIDs from TrackerNet PredictionDetailed
// Requires API key
export async function getTrainsAtStation(
  lineCode: TrackerNetLineCode,
  stationCode: string
): Promise<TrackerNetTrain[]> {
  const url = buildUrl(`/TrackerNet/PredictionDetailed/${lineCode}/${stationCode}`);
  console.log('Fetching trains from:', url);

  // Add timeout to prevent hanging on slow/non-responsive endpoints
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. This line may not support real-time train data.');
    }
    throw err;
  }
  clearTimeout(timeoutId);
  console.log('Response status:', response.status);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TFL API key required for TrackerNet access. Please add your API key to .env');
    }
    throw new Error(`Failed to fetch TrackerNet data: ${response.statusText}`);
  }

  const xml = await response.text();
  console.log('XML length:', xml.length);

  const trains = parseTrackerNetXml(xml);
  console.log('Parsed trains:', trains.length);

  return trains;
}

// Fetch all trains on a line with 5-digit LCIDs
// This requires fetching from multiple stations
export async function getTrainsOnLine(lineId: LineId): Promise<TrackerNetTrain[]> {
  const line = LINES[lineId];
  if (!line.hasReliableLcid) {
    throw new Error(`Line ${line.name} does not have reliable LCID data`);
  }

  // For now, use the Unified API and note that LCIDs require TrackerNet
  // Full implementation would fetch from multiple stations
  const arrivals = await getArrivals(lineId);

  // Map to TrackerNetTrain format (vehicleId is 3-digit set number, not LCID)
  // This is a fallback - real LCID data requires TrackerNet endpoint
  return arrivals.map(a => ({
    lcid: '', // Not available from Unified API
    setNo: a.vehicleId,
    tripNo: '',
    secondsTo: a.timeToStation,
    location: a.currentLocation,
    destination: a.destinationName,
    destCode: a.destinationNaptanId,
    departed: false,
    direction: a.direction,
    trackCode: '',
    line: line.code,
  }));
}

// Fetch station list for a line
export async function getStationsForLine(lineId: LineId): Promise<Station[]> {
  const url = buildUrl(`/Line/${lineId}/StopPoints`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch stations: ${response.statusText}`);
  }

  const data = await response.json();

  return data.map((s: Record<string, unknown>) => ({
    id: s.naptanId as string,
    name: (s.commonName as string).replace(' Underground Station', ''),
    lines: (s.lines as Array<{ id: string }>)?.map(l => l.id as LineId) || [lineId],
    lat: s.lat as number,
    lng: s.lon as number,
  }));
}

// Fetch all tube stations
export async function getAllTubeStations(): Promise<Station[]> {
  const url = buildUrl('/StopPoint/Mode/tube');
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch stations: ${response.statusText}`);
  }

  const data = await response.json();

  return data.stopPoints.map((s: Record<string, unknown>) => ({
    id: s.naptanId as string,
    name: (s.commonName as string).replace(' Underground Station', ''),
    lines: (s.lines as Array<{ id: string }>)?.map(l => l.id as LineId) || [],
    lat: s.lat as number,
    lng: s.lon as number,
  }));
}

// Find trains by LCID across all supported lines
export async function findTrainByLcid(lcid: string): Promise<{
  train: TrackerNetTrain;
  lineId: LineId;
} | null> {
  // Determine likely line from LCID prefix
  const prefix = lcid.substring(0, 2);
  let possibleLines: LineId[] = [];

  if (prefix === '11') possibleLines = ['victoria'];
  else if (prefix === '96') possibleLines = ['jubilee'];
  else if (prefix === '51') possibleLines = ['northern'];
  else if (prefix === '91') possibleLines = ['central'];
  else if (prefix === '21') possibleLines = ['metropolitan', 'district', 'hammersmith-city', 'circle'];

  // This is a simplified implementation
  // Full implementation would search TrackerNet endpoints
  console.log(`Searching for train ${lcid} on lines:`, possibleLines);

  return null; // Would return train data if found
}

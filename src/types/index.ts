// TfL API Types
export interface TflArrival {
  id: string;
  vehicleId: string;
  naptanId: string;
  stationName: string;
  lineId: string;
  lineName: string;
  platformName: string;
  direction: string;
  destinationNaptanId: string;
  destinationName: string;
  timeToStation: number;
  currentLocation: string;
  towards: string;
  expectedArrival: string;
}

export interface TrackerNetTrain {
  lcid: string;          // 5-digit leading car ID
  setNo: string;         // 3-digit set number
  tripNo: string;
  secondsTo: number;
  location: string;
  destination: string;
  destCode: string;
  departed: boolean;
  direction: string;
  trackCode: string;
  line: string;
}

export interface Station {
  id: string;            // naptan ID e.g. "940GZZLUVIC"
  name: string;
  lines: LineId[];
  lat: number;
  lng: number;
}

// Line types
export type LineId =
  | 'victoria'
  | 'jubilee'
  | 'northern'
  | 'central'
  | 'metropolitan'
  | 'district'
  | 'hammersmith-city'
  | 'circle'
  | 'bakerloo'
  | 'piccadilly';

export type TrackerNetLineCode = 'V' | 'J' | 'N' | 'C' | 'M' | 'D' | 'H' | 'O' | 'B' | 'P';

export interface LineInfo {
  id: LineId;
  code: TrackerNetLineCode;
  trackerNetCode?: TrackerNetLineCode; // Override code for API calls (e.g., Circle uses District endpoint)
  name: string;
  color: string;
  hasReliableLcid: boolean;
  lcidPrefix: string;
}

// Journey types
export interface Journey {
  id: string;
  trainId: string;       // 5-digit LCN
  lineId: LineId;
  lineName: string;
  startedAt: string;
  endedAt?: string;
  originStation?: string;
  destinationStation?: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Stop {
  id: string;
  journeyId: string;
  stationId: string;
  stationName: string;
  arrivedAt: string;
  sequence: number;
}

// App state types
export interface ActiveJourneyState {
  journey: Journey | null;
  stops: Stop[];
  isTracking: boolean;
}

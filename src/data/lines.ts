import type { LineId, LineInfo, TrackerNetLineCode } from '../types';

export const LINES: Record<LineId, LineInfo> = {
  victoria: {
    id: 'victoria',
    code: 'V',
    name: 'Victoria',
    color: '#0098D4',
    hasReliableLcid: true,
    lcidPrefix: '11',
  },
  jubilee: {
    id: 'jubilee',
    code: 'J',
    name: 'Jubilee',
    color: '#A0A5A9',
    hasReliableLcid: true,
    lcidPrefix: '96',
  },
  northern: {
    id: 'northern',
    code: 'N',
    name: 'Northern',
    color: '#000000',
    hasReliableLcid: true,
    lcidPrefix: '51',
  },
  central: {
    id: 'central',
    code: 'C',
    name: 'Central',
    color: '#E32017',
    hasReliableLcid: true,
    lcidPrefix: '91',
  },
  metropolitan: {
    id: 'metropolitan',
    code: 'M',
    name: 'Metropolitan',
    color: '#9B0056',
    hasReliableLcid: false, // TrackerNet endpoint not available
    lcidPrefix: '21',
  },
  district: {
    id: 'district',
    code: 'D',
    name: 'District',
    color: '#00782A',
    hasReliableLcid: true,
    lcidPrefix: '21',
  },
  'hammersmith-city': {
    id: 'hammersmith-city',
    code: 'H',
    name: 'Hammersmith & City',
    color: '#F3A9BB',
    hasReliableLcid: false, // TrackerNet endpoint not available
    lcidPrefix: '21',
  },
  circle: {
    id: 'circle',
    code: 'O',
    name: 'Circle',
    color: '#FFD300',
    hasReliableLcid: false, // TrackerNet endpoint not available
    lcidPrefix: '21',
  },
  bakerloo: {
    id: 'bakerloo',
    code: 'B',
    name: 'Bakerloo',
    color: '#B36305',
    hasReliableLcid: false,
    lcidPrefix: '',
  },
  piccadilly: {
    id: 'piccadilly',
    code: 'P',
    name: 'Piccadilly',
    color: '#003688',
    hasReliableLcid: false,
    lcidPrefix: '',
  },
};

// All lines for manual check-in
export const ALL_LINES = Object.values(LINES);

// Lines with working TrackerNet endpoints for nearby trains feature
export const TRACKERNET_LINES = Object.values(LINES).filter(l => l.hasReliableLcid);

// Alias for backward compatibility
export const SUPPORTED_LINES = TRACKERNET_LINES;

export const LINE_CODE_MAP: Record<TrackerNetLineCode, LineId> = {
  V: 'victoria',
  J: 'jubilee',
  N: 'northern',
  C: 'central',
  M: 'metropolitan',
  D: 'district',
  H: 'hammersmith-city',
  O: 'circle',
  B: 'bakerloo',
  P: 'piccadilly',
};

export function getLineById(id: LineId): LineInfo {
  return LINES[id];
}

export function getLineByCode(code: TrackerNetLineCode): LineInfo {
  return LINES[LINE_CODE_MAP[code]];
}

export function isValidLcid(lcid: string, lineId: LineId): boolean {
  const line = LINES[lineId];
  if (!line.hasReliableLcid) return false;
  return lcid.startsWith(line.lcidPrefix) && lcid.length === 5;
}

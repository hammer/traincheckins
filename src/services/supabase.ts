import { createClient } from '@supabase/supabase-js';
import type { Journey, Stop, LineId } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not set. Database features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// Journey CRUD operations
export async function createJourney(
  trainId: string,
  lineId: LineId,
  lineName: string,
  originStation?: string
): Promise<Journey | null> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('journeys')
    .insert({
      train_id: trainId,
      line_id: lineId,
      line_name: lineName,
      origin_station: originStation,
      user_id: user?.id,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create journey:', error);
    return null;
  }

  return mapDbJourney(data);
}

export async function updateJourney(
  journeyId: string,
  updates: Partial<{
    destinationStation: string;
    status: 'active' | 'completed' | 'cancelled';
    endedAt: string;
  }>
): Promise<Journey | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('journeys')
    .update({
      destination_station: updates.destinationStation,
      status: updates.status,
      ended_at: updates.endedAt,
    })
    .eq('id', journeyId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update journey:', error);
    return null;
  }

  return mapDbJourney(data);
}

export async function getActiveJourney(): Promise<Journey | null> {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('journeys')
    .select()
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    console.error('Failed to get active journey:', error);
    return null;
  }

  return mapDbJourney(data);
}

export async function getJourneyHistory(limit = 50): Promise<Journey[]> {
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('journeys')
    .select()
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get journey history:', error);
    return [];
  }

  return data.map(mapDbJourney);
}

// Stops CRUD operations
export async function addStop(
  journeyId: string,
  stationId: string,
  stationName: string,
  sequence: number
): Promise<Stop | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('stops')
    .insert({
      journey_id: journeyId,
      station_id: stationId,
      station_name: stationName,
      sequence,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add stop:', error);
    return null;
  }

  return mapDbStop(data);
}

export async function getStopsForJourney(journeyId: string): Promise<Stop[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('stops')
    .select()
    .eq('journey_id', journeyId)
    .order('sequence', { ascending: true });

  if (error) {
    console.error('Failed to get stops:', error);
    return [];
  }

  return data.map(mapDbStop);
}

// Map database row to Journey type
function mapDbJourney(row: Record<string, unknown>): Journey {
  return {
    id: row.id as string,
    trainId: row.train_id as string,
    lineId: row.line_id as LineId,
    lineName: row.line_name as string,
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string | undefined,
    originStation: row.origin_station as string | undefined,
    destinationStation: row.destination_station as string | undefined,
    status: row.status as 'active' | 'completed' | 'cancelled',
  };
}

// Map database row to Stop type
function mapDbStop(row: Record<string, unknown>): Stop {
  return {
    id: row.id as string,
    journeyId: row.journey_id as string,
    stationId: row.station_id as string,
    stationName: row.station_name as string,
    arrivedAt: row.arrived_at as string,
    sequence: row.sequence as number,
  };
}

// Auth helpers
export async function signInAnonymously() {
  if (!supabase) return null;
  return supabase.auth.signInAnonymously();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

import { openDB, type IDBPDatabase } from 'idb';
import type { ReadingRecord, Settings } from './types';

const DB_NAME = 'prism';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('readings', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-timestamp', 'timestamp');
        store.createIndex('by-domain', 'domain');
        store.createIndex('by-url', 'url');
      },
    });
  }
  return dbPromise;
}

/** Store a new reading record. Returns true if new, false if duplicate URL today. */
export async function storeReading(record: Omit<ReadingRecord, 'id'>): Promise<boolean> {
  const db = await getDB();

  // Deduplicate: skip if we already logged this exact URL today.
  // Use a cursor on the by-url index to avoid fetching all historical records.
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayStartMs = dayStart.getTime();

  const tx = db.transaction('readings', 'readonly');
  const index = tx.store.index('by-url');
  let cursor = await index.openCursor(record.url);
  let duplicate = false;
  while (cursor) {
    if (cursor.value.timestamp >= dayStartMs) {
      duplicate = true;
      break;
    }
    cursor = await cursor.continue();
  }
  await tx.done;

  if (duplicate) return false;

  await db.add('readings', record);
  return true;
}

/** Get all readings within a time range. */
export async function getReadings(start: number, end: number): Promise<ReadingRecord[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(start, end);
  return db.getAllFromIndex('readings', 'by-timestamp', range);
}

/** Get the total number of readings. */
export async function getTotalCount(): Promise<number> {
  const db = await getDB();
  return db.count('readings');
}

/** Clear all reading data. */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('readings');
}

/** Prune readings older than a given timestamp. */
export async function pruneOldReadings(before: number): Promise<number> {
  const db = await getDB();
  const range = IDBKeyRange.upperBound(before);
  const keys = await db.getAllKeysFromIndex('readings', 'by-timestamp', range);
  const tx = db.transaction('readings', 'readwrite');
  for (const key of keys) {
    tx.store.delete(key);
  }
  await tx.done;
  return keys.length;
}

/** Get/set extension settings via chrome.storage.local. */
export async function getSettings(): Promise<Settings> {
  const defaults: Settings = { period: 'week', notifications: true };
  const result = await chrome.storage.local.get('settings');
  return { ...defaults, ...(result.settings || {}) };
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ settings: { ...current, ...settings } });
}

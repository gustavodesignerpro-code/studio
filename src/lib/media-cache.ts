"use client";

import { openDB, IDBPDatabase } from 'idb';
import type { PlaylistItem } from '@/types/playlist';

const CACHE_NAME = 'storecast-media-cache-v2'; // Cache version updated
const DB_NAME = 'storecast-indexeddb-cache';
const DB_VERSION = 1;
const OBJECT_STORE_NAME = 'media-store';
export const MAX_CONCURRENT_DOWNLOADS = 5;

let dbPromise: Promise<IDBPDatabase> | null = null;

// Lazy initialization of the database
function getDb() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB can only be used in the browser.'));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
          db.createObjectStore(OBJECT_STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

// --- Caching Logic ---

async function storeInCacheAPI(key: string, response: Response): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(new Request(key), response); // Use Request object as key
  } catch (error) {
    console.warn('Cache API not available or failed. Falling back to IndexedDB.', error);
    const blob = await response.blob();
    await storeInIndexedDB(key, blob);
  }
}

async function storeInIndexedDB(key: string, blob: Blob): Promise<void> {
  try {
    const db = await getDb();
    await db.put(OBJECT_STORE_NAME, blob, key);
  } catch (error) {
      console.error("Failed to store in IndexedDB", error);
  }
}

export async function cacheMedia(item: PlaylistItem): Promise<void> {
  if (item.tipo === 'texto' || !item.url) return;
  
  const cacheKey = `${item.url}_${item.versao}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); 

  try {
    const response = await fetch(item.url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${item.url}: ${response.statusText}`);
    }
    
    // Use response.clone() because a response can only be consumed once.
    await storeInCacheAPI(cacheKey, response.clone());
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Failed to cache media for ${cacheKey}`, error);
    throw error;
  }
}


// --- Retrieval Logic ---

async function getFromCacheAPI(key: string): Promise<Response | undefined> {
   try {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(new Request(key));
  } catch (error) {
    console.warn('Could not access Cache API.', error);
    return undefined;
  }
}

async function getFromIndexedDB(key: string): Promise<Blob | undefined> {
  try {
    const db = await getDb();
    return await db.get(OBJECT_STORE_NAME, key);
  } catch (error) {
    console.warn('Could not access IndexedDB.', error);
    return undefined;
  }
}

export async function getMediaUrl(key: string, fetchFromNetwork = false): Promise<string | null> {
  // Try Cache API first
  const cacheResponse = await getFromCacheAPI(key);
  if (cacheResponse) {
    const blob = await cacheResponse.blob();
    return URL.createObjectURL(blob);
  }

  // Fallback to IndexedDB
  const dbBlob = await getFromIndexedDB(key);
  if (dbBlob) {
    return URL.createObjectURL(dbBlob);
  }
  
  if (fetchFromNetwork) {
    console.warn(`Cache miss for ${key}. Fetching from network is disabled during playback.`);
    return null;
  }

  return null;
}

// --- Cache Management ---

export async function clearOldCache(validKeys: string[]): Promise<void> {
  const validKeySet = new Set(validKeys);

  // Clear Cache API
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedRequests = await cache.keys();
    for (const req of cachedRequests) {
      const keyFromUrl = req.url.split('/').pop();
      if (keyFromUrl && !validKeySet.has(keyFromUrl)) {
        await cache.delete(req);
        console.log('Deleted old key from Cache API:', keyFromUrl);
      }
    }
  } catch(e) { console.error('Failed to clean Cache API', e); }

  // Clear IndexedDB
  try {
    const db = await getDb();
    const allKeys = await db.getAllKeys(OBJECT_STORE_NAME);
    for (const key of allKeys) {
      if (typeof key === 'string' && !validKeySet.has(key)) {
        await db.delete(OBJECT_STORE_NAME, key);
        console.log('Deleted old key from IndexedDB:', key);
      }
    }
  } catch(e) { console.error('Failed to clean IndexedDB', e); }
}

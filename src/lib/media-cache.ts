"use client";

import { openDB } from 'idb';
import type { PlaylistItem } from '@/types/playlist';

const CACHE_NAME = 'storecast-media-cache-v1';
const DB_NAME = 'storecast-indexeddb-cache';
const DB_VERSION = 1;
const OBJECT_STORE_NAME = 'media-store';
export const MAX_CONCURRENT_DOWNLOADS = 3; // Reduced from 5 for stability on cheaper devices

// Initialize IndexedDB
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      db.createObjectStore(OBJECT_STORE_NAME);
    }
  },
});

function getGoogleDriveUrl(item: PlaylistItem): string {
  if (item.tipo === 'video') {
    return `https://drive.google.com/uc?export=view&id=${item.driveId}`;
  }
  // For images, 'download' is more reliable
  return `https://drive.google.com/uc?export=download&id=${item.driveId}`;
}

// --- Caching Logic ---

async function storeInCacheAPI(key: string, response: Response): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(key, response);
  } catch (error) {
    console.warn('Cache API not available or failed. Falling back to IndexedDB.', error);
    const blob = await response.blob();
    await storeInIndexedDB(key, blob);
  }
}

async function storeInIndexedDB(key: string, blob: Blob): Promise<void> {
  const db = await dbPromise;
  await db.put(OBJECT_STORE_NAME, blob, key);
}

export async function cacheMedia(item: PlaylistItem): Promise<void> {
  if (item.tipo === 'texto') return;
  
  const cacheKey = `${item.driveId}_${item.versao}`;
  const url = getGoogleDriveUrl(item);

  // Fetch with a timeout to prevent hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 1-minute timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    
    // We need to clone the response because it can only be consumed once.
    // One clone goes to the cache, the original is returned for immediate use if needed.
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
    return await cache.match(key);
  } catch (error) {
    console.warn('Could not access Cache API.');
    return undefined;
  }
}

async function getFromIndexedDB(key: string): Promise<Blob | undefined> {
  try {
    const db = await dbPromise;
    return await db.get(OBJECT_STORE_NAME, key);
  } catch (error) {
    console.warn('Could not access IndexedDB.');
    return undefined;
  }
}

export async function getMediaUrl(key: string, fetchFromNetwork = true): Promise<string | null> {
  // 1. Try Cache API first
  const cacheResponse = await getFromCacheAPI(key);
  if (cacheResponse) {
    const blob = await cacheResponse.blob();
    return URL.createObjectURL(blob);
  }

  // 2. Try IndexedDB as fallback
  const dbBlob = await getFromIndexedDB(key);
  if (dbBlob) {
    return URL.createObjectURL(dbBlob);
  }
  
  // 3. If not in cache and fetching is allowed, go to network (should not happen in normal flow)
  if (fetchFromNetwork) {
    console.warn(`Cache miss for ${key}. Fetching from network (unexpected).`);
    const [driveId, versao] = key.split('_');
    const url = `https://drive.google.com/uc?export=download&id=${driveId}`;
    try {
        const response = await fetch(url);
        if(!response.ok) return null;
        await storeInCacheAPI(key, response.clone());
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch {
        return null;
    }
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
    cachedRequests.forEach(req => {
      const key = req.url.split('/').pop()!; // Heuristic to get key from URL
      if (!validKeySet.has(key)) {
        cache.delete(req);
      }
    });
  } catch(e) { console.error('Failed to clean Cache API', e); }

  // Clear IndexedDB
  try {
    const db = await dbPromise;
    const allKeys = await db.getAllKeys(OBJECT_STORE_NAME);
    allKeys.forEach(key => {
      if (typeof key === 'string' && !validKeySet.has(key)) {
        db.delete(OBJECT_STORE_NAME, key);
      }
    });
  } catch(e) { console.error('Failed to clean IndexedDB', e); }
}

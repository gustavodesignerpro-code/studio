"use client";

import { openDB, IDBPDatabase } from 'idb';
import type { PlaylistItem } from '@/types/playlist';

const CACHE_NAME = 'storecast-media-cache-v1';
const DB_NAME = 'storecast-indexeddb-cache';
const DB_VERSION = 1;
const OBJECT_STORE_NAME = 'media-store';
export const MAX_CONCURRENT_DOWNLOADS = 3;

let dbPromise: Promise<IDBPDatabase> | null = null;

// Lazy initialization of the database
function getDb() {
  if (typeof window === 'undefined') {
    // Return a dummy promise on the server side
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


function getGoogleDriveUrl(item: PlaylistItem): string {
  if (item.tipo === 'video') {
    return `https://drive.google.com/uc?export=view&id=${item.driveId}`;
  }
  return `https://drive.google.com/uc?export=download&id=${item.driveId}`;
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
  const db = await getDb();
  await db.put(OBJECT_STORE_NAME, blob, key);
}

export async function cacheMedia(item: PlaylistItem): Promise<void> {
  if (item.tipo === 'texto') return;
  
  const cacheKey = `${item.driveId}_${item.versao}`;
  const url = getGoogleDriveUrl(item);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); 

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    
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
    console.warn('Could not access Cache API.');
    return undefined;
  }
}

async function getFromIndexedDB(key: string): Promise<Blob | undefined> {
  try {
    const db = await getDb();
    return await db.get(OBJECT_STORE_NAME, key);
  } catch (error) {
    console.warn('Could not access IndexedDB.');
    return undefined;
  }
}

export async function getMediaUrl(key: string, fetchFromNetwork = true): Promise<string | null> {
  const cacheResponse = await getFromCacheAPI(key);
  if (cacheResponse) {
    const blob = await cacheResponse.blob();
    return URL.createObjectURL(blob);
  }

  const dbBlob = await getFromIndexedDB(key);
  if (dbBlob) {
    return URL.createObjectURL(dbBlob);
  }
  
  if (fetchFromNetwork) {
    console.warn(`Cache miss for ${key}. Fetching from network (unexpected).`);
    const [driveId] = key.split('_');
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
    for (const req of cachedRequests) {
       // A chave está embutida no final da URL do request do cache.
      const keyFromUrl = req.url.split('/').pop();
      if (keyFromUrl && !validKeySet.has(keyFromUrl)) {
        await cache.delete(req);
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
      }
    }
  } catch(e) { console.error('Failed to clean IndexedDB', e); }
}
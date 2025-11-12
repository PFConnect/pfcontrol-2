import { getUserById } from '../db/users.js';

interface UserData {
  id: string;
  username: string;
  avatar: string | null;
  vatsim_rating_id: number | null;
  hasVatsimRating: boolean;
  avatarUrl: string | null;
}

interface CacheEntry {
  data: UserData;
  timestamp: number;
}

// In-memory cache with 5 minute TTL
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user data from cache or database
 */
export async function getCachedUserData(userId: string): Promise<UserData | null> {
  const now = Date.now();
  const cached = cache.get(userId);

  // Return cached data if still valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  // Fetch from database
  try {
    const userData = await getUserById(userId);
    if (!userData) {
      return null;
    }

    const userDataResult: UserData = {
      id: userData.id,
      username: userData.username || 'Unknown',
      avatar: userData.avatar || null,
      vatsim_rating_id: userData.vatsim_rating_id || null,
      hasVatsimRating: userData.vatsim_rating_id && userData.vatsim_rating_id > 1,
      avatarUrl: userData.avatar
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : null
    };

    // Cache the result
    cache.set(userId, {
      data: userDataResult,
      timestamp: now
    });

    return userDataResult;
  } catch (error) {
    console.error(`Error fetching user data for ${userId}:`, error);
    return null;
  }
}

/**
 * Batch fetch multiple users with caching
 */
export async function getCachedUserDataBatch(userIds: string[]): Promise<Map<string, UserData>> {
  const result = new Map<string, UserData>();
  const uncachedIds: string[] = [];
  const now = Date.now();

  // Check cache first
  for (const userId of userIds) {
    const cached = cache.get(userId);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      result.set(userId, cached.data);
    } else {
      uncachedIds.push(userId);
    }
  }

  // Fetch uncached users in parallel
  if (uncachedIds.length > 0) {
    const fetchPromises = uncachedIds.map(async (userId) => {
      const userData = await getCachedUserData(userId);
      if (userData) {
        result.set(userId, userData);
      }
    });

    await Promise.all(fetchPromises);
  }

  return result;
}

/**
 * Invalidate cache for a specific user
 */
export function invalidateUserCache(userId: string): void {
  cache.delete(userId);
}

/**
 * Clear all cache entries
 */
export function clearUserCache(): void {
  cache.clear();
}

/**
 * Clean up expired cache entries (run periodically)
 */
export function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [userId, entry] of cache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL) {
      cache.delete(userId);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanExpiredCache, 10 * 60 * 1000);

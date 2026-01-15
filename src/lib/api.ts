// API Configuration
// In development: uses Vite proxy (empty BASE_URL)
// In production: uses the full API URL from environment variable or defaults
const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL || "https://apith-git-main-popetza38s-projects.vercel.app";
const BASE_URL = isDev ? "" : API_BASE;

// Share token for Vercel protected deployments
// In production with public API, this can be removed
const SHARE_TOKEN = import.meta.env.VITE_API_TOKEN || "_vercel_share=uiENtXou7f4OnJccq0DSmCP7hsAoxTwD";

// Helper to add share token to URLs
function apiUrl(path: string, params?: string): string {
  const separator = params ? "&" : "?";
  return `${BASE_URL}${path}${params ? "?" + params : ""}${separator}${SHARE_TOKEN}`;
}

export interface Drama {
  bookId: string;
  bookName: string;
  coverWap: string;
  chapterCount: number;
  introduction: string;
  tags: (string | { tagId: number; tagName: string; tagEnName: string })[];
  tagV3s: { tagId: number; tagName: string; tagEnName: string }[];
  playCount?: string;
  corner?: { cornerType: number; name: string; color: string };
  rankVo?: { rankType: number; hotCode: string; recCopy: string; sort: number };
  shelfTime?: string;
}

export interface VideoPath {
  quality: number;
  videoPath: string;
  isDefault: number;
}

export interface CdnItem {
  cdnDomain: string;
  isDefault: number;
  videoPathList: VideoPath[];
}

export interface Episode {
  chapterId: string;
  chapterName: string;
  chapterIndex: number;
  cdnList?: CdnItem[];
  chapterImg?: string;
  isCharge?: number;
}

// Helper function to extract video URL from episode data
export function getVideoUrl(episode: Episode | undefined, preferredQuality: number = 720): string | null {
  if (!episode?.cdnList?.length) return null;

  // Find default CDN or use first one
  const cdn = episode.cdnList.find((c) => c.isDefault === 1) || episode.cdnList[0];
  if (!cdn?.videoPathList?.length) return null;

  // Try to find preferred quality, then default, then any available
  const videoList = cdn.videoPathList;
  const preferredVideo = videoList.find((v) => v.quality === preferredQuality);
  const defaultVideo = videoList.find((v) => v.isDefault === 1);
  const fallbackVideo = videoList[0];

  const selectedVideo = preferredVideo || defaultVideo || fallbackVideo;
  return selectedVideo?.videoPath || null;
}

// Normalize drama from different API formats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDrama(item: any): Drama {
  return {
    bookId: item.bookId || item.id || String(item.bookId || item.id || ''),
    bookName: item.bookName || item.name || item.title || '',
    coverWap: item.coverWap || item.cover || item.coverImg || '',
    chapterCount: item.chapterCount || item.totalChapter || item.episodeCount || 0,
    introduction: item.introduction || item.description || item.synopsis || '',
    tags: item.tags || [],
    tagV3s: item.tagV3s || [],
    playCount: item.playCount || item.viewCount,
    corner: item.corner || (item.cornerName ? { cornerType: 0, name: item.cornerName, color: '' } : undefined),
    rankVo: item.rankVo,
    shelfTime: item.shelfTime || item.updateTime,
  };
}

// Normalize array of dramas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeArray(items: any[]): Drama[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeDrama);
}

export async function fetchForYou(): Promise<Drama[]> {
  const response = await fetch(apiUrl("/api/recommend"));
  if (!response.ok) throw new Error("Failed to fetch recommended dramas");
  const data = await response.json();
  const items = Array.isArray(data) ? data : data.data || data.dramas || [];
  return normalizeArray(items);
}

export async function fetchTrending(): Promise<Drama[]> {
  const response = await fetch(apiUrl("/api/home"));
  if (!response.ok) throw new Error("Failed to fetch trending dramas");
  const data = await response.json();
  const items = Array.isArray(data) ? data : data.data || data.dramas || [];
  return normalizeArray(items);
}

export async function fetchLatest(): Promise<Drama[]> {
  const response = await fetch(apiUrl("/api/home"));
  if (!response.ok) throw new Error("Failed to fetch latest dramas");
  const data = await response.json();
  const items = Array.isArray(data) ? data : data.data || data.dramas || [];
  return normalizeArray(items);
}

// Fetch categories - can be used to find Thai content if available
export async function fetchCategories(): Promise<{ id: string; name: string }[]> {
  const response = await fetch(apiUrl("/api/categories"));
  if (!response.ok) throw new Error("Failed to fetch categories");
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.categories || [];
}

// Fetch dramas by category
export async function fetchByCategory(categoryId: string): Promise<Drama[]> {
  const response = await fetch(apiUrl(`/api/category/${categoryId}`));
  if (!response.ok) throw new Error("Failed to fetch category dramas");
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.dramas || [];
}

// Fetch VIP content
export async function fetchVIP(): Promise<Drama[]> {
  const response = await fetch(apiUrl("/api/vip"));
  if (!response.ok) throw new Error("Failed to fetch VIP dramas");
  const data = await response.json();

  // VIP API returns nested structure: data.data.columnVoList[].bookList[]
  try {
    if (data?.data?.data?.columnVoList) {
      // Flatten all bookList arrays from columnVoList
      const allBooks: unknown[] = [];
      for (const column of data.data.data.columnVoList) {
        if (column.bookList && Array.isArray(column.bookList)) {
          allBooks.push(...column.bookList);
        }
      }
      return normalizeArray(allBooks);
    }
    // Fallback to standard parsing
    if (Array.isArray(data)) return normalizeArray(data);
    if (data?.data && Array.isArray(data.data)) return normalizeArray(data.data);
    if (data?.dramas && Array.isArray(data.dramas)) return normalizeArray(data.dramas);
  } catch {
    // If parsing fails, return empty array
  }
  return [];
}

export async function fetchDramaDetail(bookId: string): Promise<Drama> {
  // The /api/detail endpoint doesn't return drama metadata, so we need to find it from other sources
  try {
    // First try search with bookId
    const searchResponse = await fetch(apiUrl("/api/search", `keyword=${bookId}`));
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const items = Array.isArray(searchData) ? searchData : searchData.data || [];
      const found = items.find((item: { bookId?: string; id?: string }) =>
        String(item.bookId || item.id) === String(bookId)
      );
      if (found) return normalizeDrama(found);
    }
  } catch {
    // Continue to next source
  }

  try {
    // Try recommend API
    const recommendResponse = await fetch(apiUrl("/api/recommend"));
    if (recommendResponse.ok) {
      const recommendData = await recommendResponse.json();
      const items = Array.isArray(recommendData) ? recommendData : recommendData.data || [];
      const found = items.find((item: { bookId?: string; id?: string }) =>
        String(item.bookId || item.id) === String(bookId)
      );
      if (found) return normalizeDrama(found);
    }
  } catch {
    // Continue to next source
  }

  try {
    // Try home API
    const homeResponse = await fetch(apiUrl("/api/home"));
    if (homeResponse.ok) {
      const homeData = await homeResponse.json();
      const items = Array.isArray(homeData) ? homeData : homeData.data || [];
      const found = items.find((item: { bookId?: string; id?: string }) =>
        String(item.bookId || item.id) === String(bookId)
      );
      if (found) return normalizeDrama(found);
    }
  } catch {
    // Continue to next source
  }

  try {
    // Try VIP API
    const vipResponse = await fetch(apiUrl("/api/vip"));
    if (vipResponse.ok) {
      const vipData = await vipResponse.json();
      // VIP API has nested structure: data.data.columnVoList[].bookList[]
      if (vipData?.data?.data?.columnVoList) {
        for (const column of vipData.data.data.columnVoList) {
          if (column.bookList && Array.isArray(column.bookList)) {
            const found = column.bookList.find((item: { bookId?: string; id?: string }) =>
              String(item.bookId || item.id) === String(bookId)
            );
            if (found) return normalizeDrama(found);
          }
        }
      }
    }
  } catch {
    // No more sources
  }

  // Return minimal drama object if not found
  return {
    bookId: bookId,
    bookName: 'Loading...',
    coverWap: '',
    chapterCount: 0,
    introduction: '',
    tags: [],
    tagV3s: [],
  };
}

export async function fetchAllEpisodes(bookId: string): Promise<Episode[]> {
  try {
    const response = await fetch(apiUrl(`/api/chapters/${bookId}`));
    if (!response.ok) return [];
    const data = await response.json();
    // Handle both array and object response formats
    return Array.isArray(data) ? data : data.data || data.chapters || data.episodes || [];
  } catch {
    return [];
  }
}

// Get stream URL for a specific episode
export async function getStreamUrl(bookId: string, chapterId: string): Promise<string | null> {
  try {
    const response = await fetch(apiUrl("/api/stream", `bookId=${bookId}&chapterId=${chapterId}`));
    if (!response.ok) return null;
    const data = await response.json();
    return data.url || data.streamUrl || data.videoPath || null;
  } catch {
    return null;
  }
}

export async function searchDramas(query: string): Promise<Drama[]> {
  const response = await fetch(apiUrl("/api/search", `keyword=${encodeURIComponent(query)}`));
  if (!response.ok) throw new Error("Failed to search dramas");
  const data = await response.json();
  const items = Array.isArray(data) ? data : data.data || data.dramas || [];
  return normalizeArray(items);
}

export async function fetchPopularSearch(): Promise<string[]> {
  // This endpoint might not exist in the new API, return empty array
  try {
    const response = await fetch(apiUrl("/api/populersearch"));
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

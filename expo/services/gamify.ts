import AsyncStorage from '@react-native-async-storage/async-storage';

const WP_BASE_URL = 'https://example.com';
const USE_MOCK_DATA = process.env.GAMIFY_MOCK === '1' || true; // Default to mock for now

export interface UserStats {
  userId: number;
  name?: string;
  avatar?: string;
  points: number;
  rank: number;
  level?: string;
  badges?: string[];
}

export interface LeaderboardRow {
  userId: number;
  name: string;
  avatar?: string;
  points: number;
  rank: number;
  rankDelta?: number;
}

export interface LeaderboardResponse {
  items: LeaderboardRow[];
  nextCursor: string | null;
}

class GamifyService {
  private token: string | null = null;

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (USE_MOCK_DATA) {
      return this.mockRequest<T>(endpoint, options);
    }

    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${WP_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  private mockLeaderboardData: LeaderboardRow[] = [
    {
      userId: 1,
      name: 'Ahmet Yılmaz',
      avatar: 'https://i.pravatar.cc/150?img=1',
      points: 1250,
      rank: 1,
      rankDelta: 2
    },
    {
      userId: 2,
      name: 'Zeynep Kaya',
      avatar: 'https://i.pravatar.cc/150?img=2',
      points: 980,
      rank: 2,
      rankDelta: -1
    },
    {
      userId: 3,
      name: 'Mehmet Demir',
      avatar: 'https://i.pravatar.cc/150?img=3',
      points: 875,
      rank: 3,
      rankDelta: 1
    },
    {
      userId: 4,
      name: 'Ayşe Özkan',
      avatar: 'https://i.pravatar.cc/150?img=4',
      points: 720,
      rank: 4,
      rankDelta: 0
    },
    {
      userId: 5,
      name: 'Can Yıldız',
      avatar: 'https://i.pravatar.cc/150?img=5',
      points: 650,
      rank: 5,
      rankDelta: -2
    },
    {
      userId: 6,
      name: 'Elif Şahin',
      avatar: 'https://i.pravatar.cc/150?img=6',
      points: 580,
      rank: 6,
      rankDelta: 1
    },
    {
      userId: 7,
      name: 'Burak Özen',
      avatar: 'https://i.pravatar.cc/150?img=7',
      points: 520,
      rank: 7,
      rankDelta: 0
    },
    {
      userId: 8,
      name: 'Selin Koç',
      avatar: 'https://i.pravatar.cc/150?img=8',
      points: 480,
      rank: 8,
      rankDelta: 3
    },
    {
      userId: 9,
      name: 'Emre Arslan',
      avatar: 'https://i.pravatar.cc/150?img=9',
      points: 420,
      rank: 9,
      rankDelta: -1
    },
    {
      userId: 10,
      name: 'Deniz Çelik',
      avatar: 'https://i.pravatar.cc/150?img=10',
      points: 380,
      rank: 10,
      rankDelta: 0
    }
  ];

  private mockWeeklyData: LeaderboardRow[] = [
    {
      userId: 2,
      name: 'Zeynep Kaya',
      avatar: 'https://i.pravatar.cc/150?img=2',
      points: 180,
      rank: 1,
      rankDelta: 1
    },
    {
      userId: 1,
      name: 'Ahmet Yılmaz',
      avatar: 'https://i.pravatar.cc/150?img=1',
      points: 150,
      rank: 2,
      rankDelta: -1
    },
    {
      userId: 8,
      name: 'Selin Koç',
      avatar: 'https://i.pravatar.cc/150?img=8',
      points: 120,
      rank: 3,
      rankDelta: 5
    },
    {
      userId: 3,
      name: 'Mehmet Demir',
      avatar: 'https://i.pravatar.cc/150?img=3',
      points: 95,
      rank: 4,
      rankDelta: -1
    },
    {
      userId: 5,
      name: 'Can Yıldız',
      avatar: 'https://i.pravatar.cc/150?img=5',
      points: 80,
      rank: 5,
      rankDelta: 0
    }
  ];

  private mockMonthlyData: LeaderboardRow[] = [
    {
      userId: 1,
      name: 'Ahmet Yılmaz',
      avatar: 'https://i.pravatar.cc/150?img=1',
      points: 850,
      rank: 1,
      rankDelta: 0
    },
    {
      userId: 3,
      name: 'Mehmet Demir',
      avatar: 'https://i.pravatar.cc/150?img=3',
      points: 720,
      rank: 2,
      rankDelta: 1
    },
    {
      userId: 2,
      name: 'Zeynep Kaya',
      avatar: 'https://i.pravatar.cc/150?img=2',
      points: 680,
      rank: 3,
      rankDelta: -1
    },
    {
      userId: 8,
      name: 'Selin Koç',
      avatar: 'https://i.pravatar.cc/150?img=8',
      points: 420,
      rank: 4,
      rankDelta: 4
    },
    {
      userId: 5,
      name: 'Can Yıldız',
      avatar: 'https://i.pravatar.cc/150?img=5',
      points: 380,
      rank: 5,
      rankDelta: 0
    },
    {
      userId: 6,
      name: 'Elif Şahin',
      avatar: 'https://i.pravatar.cc/150?img=6',
      points: 320,
      rank: 6,
      rankDelta: 0
    }
  ];

  private mockUserStats: UserStats = {
    userId: 1,
    name: 'Ahmet Yılmaz',
    avatar: 'https://i.pravatar.cc/150?img=1',
    points: 1250,
    rank: 1,
    level: 'Blueprint Ustası',
    badges: ['İlk Gönderi', 'Aktif Üye', 'Yardımsever']
  };

  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    console.log('Gamify Mock Request:', endpoint, options.method || 'GET');

    if (endpoint.includes('/gamify/me')) {
      return this.mockUserStats as T;
    }

    if (endpoint.includes('/gamify/leaderboard')) {
      const url = new URL(`http://example.com${endpoint}`);
      const range = url.searchParams.get('range') || 'weekly';
      const cursor = url.searchParams.get('cursor');

      let data: LeaderboardRow[];
      if (range === 'weekly') {
        data = this.mockWeeklyData;
      } else if (range === 'monthly') {
        data = this.mockMonthlyData;
      } else {
        data = this.mockLeaderboardData;
      }
      
      // Simple pagination simulation
      const startIndex = cursor ? parseInt(cursor) : 0;
      const pageSize = 20;
      const items = data.slice(startIndex, startIndex + pageSize);
      const nextCursor = startIndex + pageSize < data.length ? 
        (startIndex + pageSize).toString() : null;

      return {
        items,
        nextCursor
      } as T;
    }

    if (endpoint.includes('/gamify/event') && options.method === 'POST') {
      // Mock event recording - in real implementation this would update points
      return { ok: true } as T;
    }

    throw new Error(`Mock gamify endpoint not implemented: ${endpoint}`);
  }

  async getMyStats(): Promise<UserStats> {
    return this.request<UserStats>('/wp-json/nisai/v1/gamify/me');
  }

  async getLeaderboard(range: 'weekly' | 'monthly' | 'all' = 'weekly', cursor?: string): Promise<LeaderboardResponse> {
    const params = new URLSearchParams();
    params.append('range', range);
    if (cursor) params.append('cursor', cursor);
    
    const queryString = params.toString();
    const endpoint = `/wp-json/nisai/v1/gamify/leaderboard?${queryString}`;
    
    return this.request<LeaderboardResponse>(endpoint);
  }

  async recordEvent(type: 'post' | 'comment' | 'like'): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/wp-json/nisai/v1/gamify/event', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }
}

export const gamifyService = new GamifyService();

// Helper function to get level name from points
export function getLevelFromPoints(points: number): string {
  if (points >= 500) return 'Akademi Mentoru';
  if (points >= 200) return 'Blueprint Ustası';
  if (points >= 50) return 'Otomasyon Kaşifi';
  return 'AI Çaylağı';
}

// Helper function to get level progress
export function getLevelProgress(points: number): { current: number; next: number; progress: number } {
  const levels = [0, 50, 200, 500];
  let currentLevel = 0;
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i]) {
      currentLevel = i;
      break;
    }
  }
  
  const current = levels[currentLevel];
  const next = levels[currentLevel + 1] || levels[levels.length - 1];
  const progress = currentLevel === levels.length - 1 ? 1 : (points - current) / (next - current);
  
  return { current, next, progress };
}
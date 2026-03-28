import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FeedResponse,
  Post,
  Comment,
  CreatePostRequest,
  LikeRequest,
  CommentRequest,
  ReportRequest,
  BlockUserRequest,
  ReportUserRequest,
  MediaUploadResponse,
  Author,
  Media,
} from '@/types/api';

const WP_BASE_URL = 'https://example.com';
const USE_MOCK_DATA = process.env.COMMUNITY_MOCK === '1' || true; // Default to mock for now

class CommunityService {
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

  private mockPosts: Post[] = [
    {
      id: 1,
      author: { id: 1, name: 'Ahmet Yılmaz', avatar: 'https://i.pravatar.cc/150?img=1' },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      text: 'AI otomasyon ile iş süreçlerimi optimize ettim. Günde 3 saat zaman kazanıyorum! 🚀 Zapier ve Make.com kombinasyonu harika çalışıyor.',
      media: [
        {
          id: 1,
          url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
          mime: 'image/jpeg',
          name: 'automation-workflow.jpg'
        }
      ],
      likeCount: 12,
      commentCount: 3,
      likedByMe: false,
      group: 'Genel'
    },
    {
      id: 2,
      author: { id: 2, name: 'Zeynep Kaya', avatar: 'https://i.pravatar.cc/150?img=2' },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      text: 'ChatGPT ile müşteri hizmetleri otomasyonu kurdum. Müşteri memnuniyeti %40 arttı! Blueprint dosyasını paylaşıyorum.',
      media: [
        {
          id: 2,
          url: 'https://example.com/chatgpt-blueprint.json',
          mime: 'application/json',
          name: 'chatgpt-customer-service.json'
        }
      ],
      likeCount: 8,
      commentCount: 5,
      likedByMe: true,
      group: 'Blueprint Paylaşımları'
    },
    {
      id: 3,
      author: { id: 3, name: 'Mehmet Demir', avatar: 'https://i.pravatar.cc/150?img=3' },
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      text: 'Yeni başlayanlar için soru: AI otomasyon araçları arasında hangisini önerirsiniz? Zapier mi Make.com mi?',
      media: [],
      likeCount: 15,
      commentCount: 8,
      likedByMe: false,
      group: 'Soru-Cevap'
    }
  ];

  private mockUploadedMedia = new Map<number, MediaUploadResponse>();

  private mockComments: { [postId: number]: Comment[] } = {
    1: [
      {
        id: 1,
        author: { id: 4, name: 'Ayşe Özkan', avatar: 'https://i.pravatar.cc/150?img=4' },
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        text: 'Harika! Hangi süreçleri otomatikleştirdin?',
        postId: 1
      },
      {
        id: 2,
        author: { id: 1, name: 'Ahmet Yılmaz', avatar: 'https://i.pravatar.cc/150?img=1' },
        createdAt: new Date(Date.now() - 1200000).toISOString(),
        text: 'E-posta pazarlama, sosyal medya paylaşımları ve müşteri takibi. Detayları yakında paylaşacağım.',
        postId: 1
      }
    ],
    2: [
      {
        id: 3,
        author: { id: 5, name: 'Can Yıldız', avatar: 'https://i.pravatar.cc/150?img=5' },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        text: 'Blueprint dosyasını inceledim, çok faydalı! Teşekkürler.',
        postId: 2
      }
    ]
  };

  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    console.log('Community Mock Request:', endpoint, options.method || 'GET');

    if (endpoint.includes('/community/feed')) {
      const url = new URL(`http://example.com${endpoint}`);
      const cursor = url.searchParams.get('cursor');
      const group = url.searchParams.get('group');
      const q = url.searchParams.get('q');

      let filteredPosts = [...this.mockPosts];
      
      if (group && group !== 'Tümü') {
        filteredPosts = filteredPosts.filter(post => post.group === group);
      }
      
      if (q) {
        filteredPosts = filteredPosts.filter(post => 
          post.text.toLowerCase().includes(q.toLowerCase()) ||
          post.author.name.toLowerCase().includes(q.toLowerCase())
        );
      }

      // Simple pagination simulation
      const startIndex = cursor ? parseInt(cursor) : 0;
      const pageSize = 10;
      const items = filteredPosts.slice(startIndex, startIndex + pageSize);
      const nextCursor = startIndex + pageSize < filteredPosts.length ? 
        (startIndex + pageSize).toString() : null;

      return {
        items,
        nextCursor
      } as T;
    }

    if (endpoint.includes('/community/post') && options.method === 'POST') {
      const body = JSON.parse(options.body as string) as CreatePostRequest;
      
      // Simulate fetching media by mediaIds
      const media = body.mediaIds.map(mediaId => ({
        id: mediaId,
        url: this.mockUploadedMedia.get(mediaId)?.source_url || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        mime: this.mockUploadedMedia.get(mediaId)?.mime_type || 'image/jpeg',
        name: `media_${mediaId}`
      }));
      
      const newPost: Post = {
        id: Date.now(),
        author: { id: 1, name: 'Ben', avatar: 'https://i.pravatar.cc/150?img=1' },
        createdAt: new Date().toISOString(),
        text: body.text,
        media,
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
        group: body.group || 'Genel'
      };
      this.mockPosts.unshift(newPost);
      return { id: newPost.id } as T;
    }

    if (endpoint.includes('/community/like') && options.method === 'POST') {
      const body = JSON.parse(options.body as string) as LikeRequest;
      const post = this.mockPosts.find(p => p.id === body.postId);
      if (post) {
        if (body.like && !post.likedByMe) {
          post.likeCount++;
          post.likedByMe = true;
        } else if (!body.like && post.likedByMe) {
          post.likeCount--;
          post.likedByMe = false;
        }
      }
      return { ok: true } as T;
    }

    if (endpoint.includes('/community/comment') && options.method === 'POST') {
      const body = JSON.parse(options.body as string) as CommentRequest;
      const newComment: Comment = {
        id: Date.now(),
        author: { id: 1, name: 'Ben', avatar: 'https://i.pravatar.cc/150?img=1' },
        createdAt: new Date().toISOString(),
        text: body.text,
        postId: body.postId
      };
      
      if (!this.mockComments[body.postId]) {
        this.mockComments[body.postId] = [];
      }
      this.mockComments[body.postId].push(newComment);
      
      // Update comment count
      const post = this.mockPosts.find(p => p.id === body.postId);
      if (post) {
        post.commentCount++;
      }
      
      return newComment as T;
    }

    if (endpoint.includes('/community/report') && options.method === 'POST') {
      return { ok: true } as T;
    }

    if (endpoint.includes('/community/report-user') && options.method === 'POST') {
      return { ok: true } as T;
    }

    if (endpoint.includes('/community/block-user') && options.method === 'POST') {
      return { ok: true } as T;
    }

    if (endpoint.includes('/community/unblock-user') && options.method === 'POST') {
      return { ok: true } as T;
    }

    if (endpoint.includes('/community/user/')) {
      const userId = parseInt(endpoint.split('/').pop() || '0');
      const mockUser = {
        id: userId,
        name: `User ${userId}`,
        avatar: `https://i.pravatar.cc/150?img=${userId}`,
        isBlocked: false
      };
      return mockUser as T;
    }

    if (endpoint.includes('/wp/v2/media') && options.method === 'POST') {
      // Mock media upload - this will be handled by uploadMedia method
      return {
        id: Date.now(),
        source_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        mime_type: 'image/jpeg'
      } as T;
    }

    if (endpoint.includes('/community/comments/')) {
      const postId = parseInt(endpoint.split('/').pop() || '0');
      return (this.mockComments[postId] || []) as T;
    }

    throw new Error(`Mock endpoint not implemented: ${endpoint}`);
  }

  async getFeed(group?: string, query?: string, cursor?: string): Promise<FeedResponse> {
    const params = new URLSearchParams();
    if (group) params.append('group', group);
    if (query) params.append('q', query);
    if (cursor) params.append('cursor', cursor);
    
    const queryString = params.toString();
    const endpoint = `/wp-json/nisai/v1/community/feed${queryString ? `?${queryString}` : ''}`;
    
    return this.request<FeedResponse>(endpoint);
  }

  async createPost(post: CreatePostRequest): Promise<{ id: number }> {
    return this.request<{ id: number }>('/wp-json/nisai/v1/community/post', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  async likePost(postId: number, like: boolean = true): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/wp-json/nisai/v1/community/like', {
      method: 'POST',
      body: JSON.stringify({ postId, like }),
    });
  }

  async addComment(postId: number, text: string): Promise<Comment> {
    return this.request<Comment>('/wp-json/nisai/v1/community/comment', {
      method: 'POST',
      body: JSON.stringify({ postId, text }),
    });
  }

  async reportPost(postId: number, reason?: string): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/wp-json/nisai/v1/community/report', {
      method: 'POST',
      body: JSON.stringify({ postId, reason }),
    });
  }

  async reportUser(userId: number, reason?: string): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/wp-json/nisai/v1/community/report-user', {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    });
  }

  async blockUser(userId: number): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/wp-json/nisai/v1/community/block-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async unblockUser(userId: number): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/wp-json/nisai/v1/community/unblock-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getUserProfile(userId: number): Promise<Author & { isBlocked?: boolean }> {
    return this.request<Author & { isBlocked?: boolean }>(`/wp-json/nisai/v1/community/user/${userId}`);
  }

  async uploadMedia(fileUri: string, fileName: string, mimeType: string): Promise<MediaUploadResponse> {
    if (USE_MOCK_DATA) {
      // Simulate different types of media uploads
      const mockResponse: MediaUploadResponse = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        source_url: this.getMockMediaUrl(mimeType, fileName),
        mime_type: mimeType
      };
      
      // Store the uploaded media for later use in posts
      this.mockUploadedMedia.set(mockResponse.id, mockResponse);
      
      return this.mockRequest<MediaUploadResponse>('/wp-json/wp/v2/media', { method: 'POST' }).then(() => mockResponse);
    }

    const token = await this.getToken();
    const formData = new FormData();
    
    try {
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      const response = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData, let the browser set it
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Media upload failed: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Media upload error:', error);
      throw new Error('Medya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  private getMockMediaUrl(mimeType: string, fileName: string): string {
    if (mimeType.startsWith('image/')) {
      return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400';
    }
    if (mimeType.startsWith('video/')) {
      return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    }

    // For documents/files, return a placeholder URL
    return `https://example.com/files/${fileName}`;
  }

  async getComments(postId: number): Promise<Comment[]> {
    return this.request<Comment[]>(`/wp-json/nisai/v1/community/comments/${postId}`);
  }
}

export const communityService = new CommunityService();

// Helper function to format relative time in Turkish
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Az önce';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} saat önce`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} gün önce`;
  }
  
  return date.toLocaleDateString('tr-TR');
}

// Helper function to get user initials for avatar fallback
export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
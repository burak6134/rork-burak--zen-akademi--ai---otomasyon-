import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AuthResponse, Course, CourseDetail, CoursesResponse, MyCoursesResponse, Notification, ProgressUpdate, Quiz, User, VideoNote } from '@/types/api';

const WP_BASE_URL = 'https://example.com';
const USE_MOCK_DATA = true; // Set to false when real API is ready

class ApiService {
  private token: string | null = null;

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
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

  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Minimal delay for web compatibility
    if (Platform.OS === 'web') {
      await new Promise(resolve => setTimeout(resolve, 10));
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (endpoint === '/wp-json/jwt-auth/v1/token' && options.method === 'POST') {
      return {
        token: 'mock_jwt_token_12345',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test Kullanıcı',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
      } as T;
    }

    if (endpoint === '/wp-json/wp/v2/users' && options.method === 'POST') {
      const body = JSON.parse(options.body as string);
      return {
        token: 'mock_jwt_token_12345',
        user: {
          id: Math.floor(Math.random() * 1000) + 1,
          email: body.email,
          name: body.name,
          avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
        },
      } as T;
    }

    if (endpoint === '/wp-json/nisai/v1/my-courses') {
      return { courseIds: [101, 205] } as T;
    }

    if (endpoint === '/wp-json/nisai/v1/courses') {
      return {
        items: this.getMockCourses(),
        nextCursor: null,
      } as T;
    }

    if (endpoint.startsWith('/wp-json/nisai/v1/courses/')) {
      const courseId = parseInt(endpoint.split('/').pop() || '0');
      return this.getMockCourseDetail(courseId) as T;
    }

    if (endpoint === '/wp-json/nisai/v1/notifications') {
      return this.getMockNotifications() as T;
    }

    if (endpoint === '/wp-json/nisai/v1/progress' && options.method === 'POST') {
      return { success: true } as T;
    }

    if (endpoint === '/wp-json/nisai/v1/delete-account' && options.method === 'DELETE') {
      // Simulate account deletion
      return { success: true, message: 'Account deleted successfully' } as T;
    }

    if (endpoint.startsWith('/wp-json/burak/v1/notes/sync') && options.method === 'POST') {
      // Mock note sync - validate the data and return success
      const body = JSON.parse(options.body as string);
      console.log('Mock API: Syncing note:', body);
      
      // Validate required fields
      if (!body.id || !body.userId || !body.courseId || !body.videoId || body.tSec === undefined || !body.text) {
        throw new Error('Missing required fields for note sync');
      }
      
      return { success: true } as T;
    }

    if (endpoint.startsWith('/wp-json/burak/v1/notes/') && options.method === 'DELETE') {
      // Mock note deletion - just return success
      return { success: true } as T;
    }

    if (endpoint.startsWith('/wp-json/burak/v1/notes') && options.method === 'GET') {
      // Mock get notes - return empty array for now
      return [] as T;
    }

    throw new Error(`Mock endpoint not implemented: ${endpoint}`);
  }

  private getMockCourses(): Course[] {
    return [
      {
        id: 101,
        title: 'AI Otomasyon Temelleri ve Make Otomasyon Geçişleri',
        coverUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        coverPortrait: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=600&fit=crop',
        coverLandscape: {
          w800: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop&ar=16:9',
          w1200: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=675&fit=crop&ar=16:9'
        },
        level: 'Başlangıç',
        tags: ['AI', 'Otomasyon', 'Temel'],
        genres: ['Extreme', 'Extreme'],
        totalLessons: 24,
        totalDurationMin: 360,
        isPurchased: true,
        progress: 42,
        description: 'İşinizi otopilota alın ve zaman kazanın. AI otomasyon araçlarını öğrenin.',
      },
      {
        id: 205,
        title: 'ChatGPT ile İş Süreçleri',
        coverUrl: 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=400',
        coverPortrait: 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=400&h=600&fit=crop',
        coverLandscape: {
          w800: 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=800&h=450&fit=crop&ar=16:9',
          w1200: 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=1200&h=675&fit=crop&ar=16:9'
        },
        level: 'Orta',
        tags: ['ChatGPT', 'İş Süreçleri', 'Verimlilik'],
        genres: ['Extreme', 'Extreme'],
        totalLessons: 18,
        totalDurationMin: 270,
        isPurchased: true,
        progress: 78,
        description: 'ChatGPT ile iş süreçlerinizi optimize edin ve verimliliğinizi artırın.',
      },
      {
        id: 309,
        title: 'Zapier ile Otomasyon',
        coverUrl: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400',
        coverPortrait: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=600&fit=crop',
        coverLandscape: {
          w800: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=450&fit=crop&ar=16:9',
          w1200: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1200&h=675&fit=crop&ar=16:9'
        },
        level: 'İleri',
        tags: ['Zapier', 'Otomasyon', 'Entegrasyon'],
        genres: ['Extreme', 'Extreme'],
        totalLessons: 32,
        totalDurationMin: 480,
        isPurchased: false,
        progress: 0,
        description: 'Zapier ile farklı uygulamaları entegre edin ve iş akışlarınızı otomatikleştirin.',
      },
      {
        id: 410,
        title: 'Make.com ile Gelişmiş Otomasyon',
        coverUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        coverPortrait: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop',
        coverLandscape: {
          w800: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&ar=16:9',
          w1200: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop&ar=16:9'
        },
        level: 'İleri',
        tags: ['Make.com', 'Otomasyon', 'API'],
        genres: ['Extreme', 'Extreme'],
        totalLessons: 28,
        totalDurationMin: 420,
        isPurchased: false,
        progress: 0,
        description: 'Make.com ile karmaşık otomasyon senaryoları oluşturun.',
      },
    ];
  }

  private getMockCourseDetail(courseId: number): CourseDetail {
    const course = this.getMockCourses().find(c => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    return {
      ...course,
      sections: [
        {
          title: 'Giriş',
          lessons: [
            {
              id: 1001,
              title: 'Hoş Geldiniz',
              durationSec: 420,
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              attachments: [
                { title: 'Kurs Sunumu.pdf', url: 'https://example.com/presentation.pdf' },
              ],
              hasQuiz: true,
              transcript: 'Bu derste AI otomasyon dünyasına giriş yapacağız...',
              isCompleted: true,
            },
            {
              id: 1002,
              title: 'AI Nedir?',
              durationSec: 680,
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
              attachments: [],
              hasQuiz: false,
              transcript: 'Yapay zeka teknolojilerinin temellerini öğrenelim...',
              isCompleted: false,
            },
          ],
        },
        {
          title: 'Temel Kavramlar',
          lessons: [
            {
              id: 1003,
              title: 'Otomasyon Türleri',
              durationSec: 540,
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              attachments: [
                { title: 'Otomasyon Şablonları.xlsx', url: 'https://example.com/templates.xlsx' },
              ],
              hasQuiz: true,
              transcript: 'Farklı otomasyon türlerini inceleyelim...',
              isCompleted: false,
            },
          ],
        },
      ],
    };
  }

  private getMockNotifications(): Notification[] {
    return [
      {
        id: 1,
        title: 'Yeni Ders Yayınlandı',
        message: 'AI Otomasyon Temelleri kursuna yeni ders eklendi.',
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'course',
        courseId: 101,
        lessonId: 1002,
      },
      {
        id: 2,
        title: 'Quiz Hatırlatması',
        message: 'ChatGPT ile İş Süreçleri kursundaki quiz sizi bekliyor.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        isRead: true,
        type: 'quiz',
        courseId: 205,
        lessonId: 1003,
      },
      {
        id: 3,
        title: 'Yeni Topluluk Gönderisi',
        message: 'Takip ettiğiniz bir kullanıcı yeni bir gönderi paylaştı.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        isRead: false,
        type: 'community',
        postId: 123,
        userId: 456,
      },
      {
        id: 4,
        title: 'Sistem Duyurusu',
        message: 'Uygulama güncellendi! Yeni özellikler keşfedin.',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        isRead: false,
        type: 'announcement',
      },
    ];
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/wp-json/jwt-auth/v1/token', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/wp-json/wp/v2/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async refreshToken(): Promise<AuthResponse> {
    const token = await this.getToken();
    return this.request<AuthResponse>('/wp-json/jwt-auth/v1/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getMyCourses(): Promise<MyCoursesResponse> {
    return this.request<MyCoursesResponse>('/wp-json/nisai/v1/my-courses');
  }

  async getCourses(): Promise<CoursesResponse> {
    return this.request<CoursesResponse>('/wp-json/nisai/v1/courses');
  }

  async getCourseDetail(courseId: number): Promise<CourseDetail> {
    return this.request<CourseDetail>(`/wp-json/nisai/v1/courses/${courseId}`);
  }

  async updateProgress(progress: ProgressUpdate): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/wp-json/nisai/v1/progress', {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }

  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/wp-json/nisai/v1/notifications');
  }

  async getQuiz(lessonId: number): Promise<Quiz> {
    // Mock quiz data with shorter delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      id: lessonId * 10,
      lessonId,
      title: 'Ders Quiz',
      questions: [
        {
          id: 1,
          question: 'AI otomasyon nedir?',
          options: [
            'Yapay zeka ile otomatik süreçler',
            'Manuel işlemler',
            'Sadece robot kullanımı',
            'Hiçbiri'
          ],
          correctAnswer: 0,
        },
        {
          id: 2,
          question: 'Hangi araç otomasyon için kullanılır?',
          options: [
            'Word',
            'Zapier',
            'Paint',
            'Calculator'
          ],
          correctAnswer: 1,
        },
      ],
    };
  }

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/wp-json/nisai/v1/delete-account', {
      method: 'DELETE',
    });
  }

  // Video Notes API methods
  async syncNote(noteData: Omit<VideoNote, 'isDirty' | 'op'>): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/wp-json/burak/v1/notes/sync', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async deleteNote(noteId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/wp-json/burak/v1/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  async getNotes(userId: string): Promise<VideoNote[]> {
    return this.request<VideoNote[]>(`/wp-json/burak/v1/notes?userId=${userId}`);
  }
}

export const apiService = new ApiService();
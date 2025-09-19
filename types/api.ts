export interface Course {
  id: number;
  title: string;
  coverUrl: string;
  coverPortrait?: string;
  coverLandscape?: {
    w800: string;
    w1200: string;
  };
  level: 'Başlangıç' | 'Orta' | 'İleri';
  tags: string[];
  genres: string[];
  totalLessons: number;
  totalDurationMin: number;
  isPurchased: boolean;
  progress: number;
  description?: string;
}

export interface Lesson {
  id: number;
  title: string;
  durationSec: number;
  videoUrl: string;
  attachments: Attachment[];
  hasQuiz: boolean;
  transcript?: string;
  isCompleted?: boolean;
}

export interface CourseSection {
  title: string;
  lessons: Lesson[];
}

export interface CourseDetail extends Course {
  sections: CourseSection[];
}

export interface Attachment {
  title: string;
  url: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CoursesResponse {
  items: Course[];
  nextCursor?: string;
}

export interface MyCoursesResponse {
  courseIds: number[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: 'course' | 'quiz' | 'announcement' | 'community';
  courseId?: number;
  lessonId?: number;
  postId?: number;
  userId?: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  questions: QuizQuestion[];
}

export interface ProgressUpdate {
  courseId: number;
  lessonId: number;
  status: 'started' | 'completed';
}

// Community Types
export interface Media {
  id: number;
  url: string;
  mime: string;
  name?: string;
}

export interface Author {
  id: number;
  name: string;
  avatar?: string;
}

export interface Post {
  id: number;
  author: Author;
  createdAt: string;
  text: string;
  media: Media[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  group?: string;
}

export interface Comment {
  id: number;
  author: Author;
  createdAt: string;
  text: string;
  postId: number;
}

export interface FeedResponse {
  items: Post[];
  nextCursor: string | null;
}

export interface CreatePostRequest {
  text: string;
  mediaIds: number[];
  group?: string;
}

export interface LikeRequest {
  postId: number;
  like: boolean;
}

export interface CommentRequest {
  postId: number;
  text: string;
}

export interface ReportRequest {
  postId: number;
  reason?: string;
}

export interface BlockUserRequest {
  userId: number;
}

export interface ReportUserRequest {
  userId: number;
  reason?: string;
}

export interface MediaUploadResponse {
  id: number;
  source_url: string;
  mime_type: string;
}

// Certificate Types
export interface Certificate {
  id: string;                // db/local id
  certificateId: string;     // human-visible, e.g., "CER-<course>-<ts>"
  userName: string;
  courseId: string;
  courseTitle: string;
  completedAtUTC: string;    // ISO
  deepLink: string;          // e.g., exp://.../course/<id>
  pdfUri?: string;           // local file uri
  pngUri?: string;           // local file uri (preview)
}

// Video Notes Types
export interface VideoNote {
  id: string;
  userId: string;
  courseId: string;
  videoId: string;
  tSec: number;
  text: string;
  createdAtUTC: string;
  updatedAtUTC: string;
  isDirty?: boolean;
  op?: 'create' | 'update' | 'delete';
}
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { VideoNote } from '@/types/api';
import { NotesStore } from './notes.store';
import dayjs from 'dayjs';

export class NotesExport {
  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  static async exportVideoNotes(
    userId: string,
    courseId: string,
    videoId: string,
    videoTitle: string
  ): Promise<void> {
    const notes = await NotesStore.listNotesByVideo(userId, courseId, videoId);
    
    if (notes.length === 0) {
      throw new Error('Bu video için not bulunamadı');
    }

    const markdown = this.generateVideoMarkdown(notes, videoTitle);
    const filename = `${this.sanitizeFilename(videoTitle)}_notlar.md`;
    
    await this.saveAndShare(markdown, filename);
  }

  static async exportCourseNotes(
    userId: string,
    courseId: string,
    courseTitle: string
  ): Promise<void> {
    const notes = await NotesStore.listNotesByCourse(userId, courseId);
    
    if (notes.length === 0) {
      throw new Error('Bu kurs için not bulunamadı');
    }

    const markdown = this.generateCourseMarkdown(notes, courseTitle);
    const filename = `${this.sanitizeFilename(courseTitle)}_kurs_notlari.md`;
    
    await this.saveAndShare(markdown, filename);
  }

  private static generateVideoMarkdown(notes: VideoNote[], videoTitle: string): string {
    const header = `# ${videoTitle} - Video Notları\n\n`;
    const exportDate = `*Dışa aktarma tarihi: ${dayjs().format('DD/MM/YYYY HH:mm')}*\n\n`;
    
    const notesContent = notes
      .map(note => {
        const timestamp = this.formatTime(note.tSec);
        const createdDate = dayjs(note.createdAtUTC).format('DD/MM/YYYY HH:mm');
        return `- **[${timestamp}]** ${note.text}\n  *${createdDate}*\n`;
      })
      .join('\n');

    return header + exportDate + notesContent;
  }

  private static generateCourseMarkdown(notes: VideoNote[], courseTitle: string): string {
    const header = `# ${courseTitle} - Kurs Notları\n\n`;
    const exportDate = `*Dışa aktarma tarihi: ${dayjs().format('DD/MM/YYYY HH:mm')}*\n\n`;
    
    // Group notes by video
    const notesByVideo = notes.reduce((acc, note) => {
      if (!acc[note.videoId]) {
        acc[note.videoId] = [];
      }
      acc[note.videoId].push(note);
      return acc;
    }, {} as Record<string, VideoNote[]>);

    let content = '';
    
    Object.entries(notesByVideo).forEach(([videoId, videoNotes]) => {
      content += `## Video ${videoId}\n\n`;
      
      videoNotes.forEach(note => {
        const timestamp = this.formatTime(note.tSec);
        const createdDate = dayjs(note.createdAtUTC).format('DD/MM/YYYY HH:mm');
        content += `- **[${timestamp}]** ${note.text}\n  *${createdDate}*\n\n`;
      });
      
      content += '\n';
    });

    return header + exportDate + content;
  }

  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
  }

  private static async saveAndShare(content: string, filename: string): Promise<void> {
    try {
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Write file
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/markdown',
          dialogTitle: 'Notları Paylaş',
        });
      } else {
        // Fallback: just save the file
        console.log(`Notlar kaydedildi: ${fileUri}`);
        throw new Error(`Notlar kaydedildi ancak paylaşım mevcut değil. Dosya konumu: ${fileUri}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Notlar dışa aktarılırken bir hata oluştu');
    }
  }

  static async getExportStats(userId: string, courseId?: string): Promise<{
    totalNotes: number;
    totalVideos: number;
    oldestNote: string | null;
    newestNote: string | null;
  }> {
    const notes = courseId 
      ? await NotesStore.listNotesByCourse(userId, courseId)
      : await NotesStore.getAllNotes(userId);

    const filteredNotes = notes.filter(note => note.op !== 'delete');
    
    const uniqueVideos = new Set(filteredNotes.map(note => note.videoId));
    
    const sortedByDate = filteredNotes.sort((a, b) => 
      dayjs(a.createdAtUTC).valueOf() - dayjs(b.createdAtUTC).valueOf()
    );

    return {
      totalNotes: filteredNotes.length,
      totalVideos: uniqueVideos.size,
      oldestNote: sortedByDate.length > 0 ? sortedByDate[0].createdAtUTC : null,
      newestNote: sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].createdAtUTC : null,
    };
  }
}
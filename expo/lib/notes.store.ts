import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoNote } from '@/types/api';
import dayjs from 'dayjs';

// Simple React Native compatible ID generator
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
};

const NOTES_PREFIX = 'notes:';

export class NotesStore {
  private static getKey(userId: string): string {
    return `${NOTES_PREFIX}${userId}`;
  }

  static async getAllNotes(userId: string): Promise<VideoNote[]> {
    try {
      const key = this.getKey(userId);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  static async listNotesByVideo(
    userId: string,
    courseId: string,
    videoId: string
  ): Promise<VideoNote[]> {
    const allNotes = await this.getAllNotes(userId);
    return allNotes
      .filter(note => 
        note.courseId === courseId && 
        note.videoId === videoId &&
        note.op !== 'delete'
      )
      .sort((a, b) => a.tSec - b.tSec);
  }

  static async listNotesByCourse(
    userId: string,
    courseId: string
  ): Promise<VideoNote[]> {
    const allNotes = await this.getAllNotes(userId);
    return allNotes
      .filter(note => 
        note.courseId === courseId &&
        note.op !== 'delete'
      )
      .sort((a, b) => a.tSec - b.tSec);
  }

  static async upsertNote(
    userId: string,
    noteData: Omit<VideoNote, 'id' | 'createdAtUTC' | 'updatedAtUTC' | 'isDirty' | 'op'> & {
      id?: string;
    }
  ): Promise<VideoNote> {
    try {
      console.log('NotesStore.upsertNote called with:', {
        userId,
        noteData,
        noteDataKeys: Object.keys(noteData)
      });
      
      // Validate required fields
      if (!userId || !userId.trim()) {
        throw new Error('userId is required');
      }
      if (!noteData.courseId || !noteData.courseId.trim()) {
        throw new Error('courseId is required');
      }
      if (!noteData.videoId || !noteData.videoId.trim()) {
        throw new Error('videoId is required');
      }
      if (noteData.tSec === undefined || noteData.tSec < 0) {
        throw new Error('tSec is required and must be >= 0');
      }
      if (!noteData.text || !noteData.text.trim()) {
        throw new Error('text is required');
      }
      
      const allNotes = await this.getAllNotes(userId);
      const now = dayjs().toISOString();
      
      let note: VideoNote;
      
      if (noteData.id) {
        // Update existing note
        const existingIndex = allNotes.findIndex(n => n.id === noteData.id);
        if (existingIndex >= 0) {
          note = {
            ...allNotes[existingIndex],
            ...noteData,
            updatedAtUTC: now,
            isDirty: true,
            op: 'update'
          };
          allNotes[existingIndex] = note;
        } else {
          throw new Error('Note not found');
        }
      } else {
        // Create new note
        note = {
          id: generateId(),
          userId: userId,
          courseId: noteData.courseId,
          videoId: noteData.videoId,
          tSec: noteData.tSec,
          text: noteData.text.trim(),
          createdAtUTC: now,
          updatedAtUTC: now,
          isDirty: true,
          op: 'create'
        };
        console.log('Created new note:', note);
        allNotes.push(note);
      }

      await this.saveNotes(userId, allNotes);
      console.log('Note saved successfully to local storage');
      return note;
    } catch (error) {
      console.error('Error in NotesStore.upsertNote:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        noteData
      });
      throw error;
    }
  }

  static async deleteNote(userId: string, noteId: string): Promise<void> {
    const allNotes = await this.getAllNotes(userId);
    const noteIndex = allNotes.findIndex(n => n.id === noteId);
    
    if (noteIndex >= 0) {
      const note = allNotes[noteIndex];
      if (note.op === 'create') {
        // If it was created locally and not synced, just remove it
        allNotes.splice(noteIndex, 1);
      } else {
        // Mark for deletion
        allNotes[noteIndex] = {
          ...note,
          updatedAtUTC: dayjs().toISOString(),
          isDirty: true,
          op: 'delete'
        };
      }
      
      await this.saveNotes(userId, allNotes);
    }
  }

  static async getDirtyNotes(userId: string): Promise<VideoNote[]> {
    const allNotes = await this.getAllNotes(userId);
    return allNotes.filter(note => note.isDirty);
  }

  static async markNotesSynced(userId: string, noteIds: string[]): Promise<void> {
    const allNotes = await this.getAllNotes(userId);
    let hasChanges = false;
    
    for (const noteId of noteIds) {
      const noteIndex = allNotes.findIndex(n => n.id === noteId);
      if (noteIndex >= 0) {
        const note = allNotes[noteIndex];
        if (note.op === 'delete') {
          // Remove deleted notes after sync
          allNotes.splice(noteIndex, 1);
        } else {
          // Mark as synced
          allNotes[noteIndex] = {
            ...note,
            isDirty: false,
            op: undefined
          };
        }
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await this.saveNotes(userId, allNotes);
    }
  }

  static async updateNotesFromServer(
    userId: string,
    serverNotes: VideoNote[]
  ): Promise<void> {
    const localNotes = await this.getAllNotes(userId);
    const mergedNotes = [...localNotes];
    
    for (const serverNote of serverNotes) {
      const localIndex = mergedNotes.findIndex(n => n.id === serverNote.id);
      
      if (localIndex >= 0) {
        const localNote = mergedNotes[localIndex];
        // Only update if server version is newer and local is not dirty
        if (!localNote.isDirty && 
            dayjs(serverNote.updatedAtUTC).isAfter(dayjs(localNote.updatedAtUTC))) {
          mergedNotes[localIndex] = serverNote;
        }
      } else {
        // Add new note from server
        mergedNotes.push(serverNote);
      }
    }
    
    await this.saveNotes(userId, mergedNotes);
  }

  private static async saveNotes(userId: string, notes: VideoNote[]): Promise<void> {
    try {
      const key = this.getKey(userId);
      console.log('Saving notes to AsyncStorage:', {
        key,
        notesCount: notes.length,
        notes: notes.map(n => ({ id: n.id, text: n.text.substring(0, 50), isDirty: n.isDirty, op: n.op }))
      });
      
      const serializedNotes = JSON.stringify(notes);
      await AsyncStorage.setItem(key, serializedNotes);
      
      console.log('Notes saved successfully to AsyncStorage');
    } catch (error) {
      console.error('Error saving notes to AsyncStorage:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        userId,
        notesCount: notes.length
      });
      throw error;
    }
  }

  static async clearAllNotes(userId: string): Promise<void> {
    try {
      const key = this.getKey(userId);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing notes:', error);
    }
  }
}
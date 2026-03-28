import NetInfo from '@react-native-community/netinfo';
import { VideoNote } from '@/types/api';
import { NotesStore } from './notes.store';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';

class NotesSyncClass {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private initialized: boolean = false;

  private initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    
    // Monitor network status
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // If we just came back online, sync
      if (wasOffline && this.isOnline) {
        this.queueSync('network_reconnected');
      }
    });
  }

  async queueSync(reason: string): Promise<void> {
    this.initialize();
    
    if (this.syncInProgress || !this.isOnline) {
      console.log(`Sync skipped: ${reason} (inProgress: ${this.syncInProgress}, online: ${this.isOnline})`);
      return;
    }

    const user = useAuthStore.getState().user;
    if (!user) {
      console.log('Sync skipped: no user');
      return;
    }

    console.log(`Starting sync: ${reason}`);
    this.syncInProgress = true;

    try {
      await this.performSync(user.id.toString());
      console.log(`Sync completed: ${reason}`);
    } catch (error) {
      console.error(`Sync failed: ${reason}`, error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async performSync(userId: string): Promise<void> {
    // Get dirty notes to push
    const dirtyNotes = await NotesStore.getDirtyNotes(userId);
    
    if (dirtyNotes.length > 0) {
      await this.pushNotes(userId, dirtyNotes);
    }

    // Pull latest notes from server
    await this.pullNotes(userId);
  }

  private async pushNotes(userId: string, notes: VideoNote[]): Promise<void> {
    const token = await apiService.getToken();
    if (!token) throw new Error('No auth token');

    const syncedIds: string[] = [];

    for (const note of notes) {
      try {
        if (note.op === 'create' || note.op === 'update') {
          await this.syncNoteToServer(note, token);
          syncedIds.push(note.id);
        } else if (note.op === 'delete') {
          await this.deleteNoteOnServer(note.id, token);
          syncedIds.push(note.id);
        }
      } catch (error) {
        console.error(`Failed to sync note ${note.id}:`, error);
        // Continue with other notes
      }
    }

    if (syncedIds.length > 0) {
      await NotesStore.markNotesSynced(userId, syncedIds);
    }
  }

  private async syncNoteToServer(note: VideoNote, token: string): Promise<void> {
    // Use the apiService which handles mock data properly
    try {
      console.log('Syncing note to server:', {
        id: note.id,
        userId: note.userId,
        courseId: note.courseId,
        videoId: note.videoId,
        tSec: note.tSec,
        text: note.text,
        createdAtUTC: note.createdAtUTC,
        updatedAtUTC: note.updatedAtUTC,
      });
      
      await apiService.syncNote({
        id: note.id,
        userId: note.userId,
        courseId: note.courseId,
        videoId: note.videoId,
        tSec: note.tSec,
        text: note.text,
        createdAtUTC: note.createdAtUTC,
        updatedAtUTC: note.updatedAtUTC,
      });
      
      console.log('Note synced successfully to server');
    } catch (error) {
      console.error('Failed to sync note to server:', error);
      throw error;
    }
  }

  private async deleteNoteOnServer(noteId: string, token: string): Promise<void> {
    // Use the apiService which handles mock data properly
    try {
      await apiService.deleteNote(noteId);
    } catch (error) {
      console.error('Failed to delete note on server:', error);
      // Don't throw for 404 errors
      if (error instanceof Error && !error.message.includes('404')) {
        throw error;
      }
    }
  }

  private async pullNotes(userId: string): Promise<void> {
    try {
      const serverNotes = await apiService.getNotes(userId);
      await NotesStore.updateNotesFromServer(userId, serverNotes);
    } catch (error) {
      console.error('Failed to pull notes from server:', error);
      // Don't throw - this is not critical
    }
  }

  // Public methods for manual sync triggers
  async syncOnAppStart(): Promise<void> {
    await this.queueSync('app_start');
  }

  async syncOnAppForeground(): Promise<void> {
    await this.queueSync('app_foreground');
  }

  async syncOnNoteChange(): Promise<void> {
    await this.queueSync('note_change');
  }
}

// Export singleton instance
export const NotesSync = new NotesSyncClass();
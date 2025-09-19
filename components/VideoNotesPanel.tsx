import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Keyboard,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import {
  Plus,
  Edit3,
  Trash2,
  Download,
  Clock,
  FileText,
} from 'lucide-react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { VideoNote } from '@/types/api';
import { NotesStore } from '@/lib/notes.store';
import { NotesExport } from '@/lib/notes.export';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface VideoNotesPanelProps {
  userId: string;
  courseId: string;
  videoId: string;
  videoRef: React.RefObject<Video>;
  videoTitle?: string;
}

interface EditingNote {
  id: string;
  text: string;
}

export function VideoNotesPanel({
  userId,
  courseId,
  videoId,
  videoRef,
  videoTitle = 'Video',
}: VideoNotesPanelProps) {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isLandscape, setIsLandscape] = useState(screenWidth > screenHeight);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => subscription?.remove();
  }, []);
  
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [editingNote, setEditingNote] = useState<EditingNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);

  const loadNotes = useCallback(async () => {
    try {
      const videoNotes = await NotesStore.listNotesByVideo(userId, courseId, videoId);
      setNotes(videoNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }, [userId, courseId, videoId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (videoRef.current) {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded) {
          setCurrentTime(Math.floor((status.positionMillis || 0) / 1000));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [videoRef]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    
    setIsLoading(true);
    try {
      console.log('Adding note with data:', {
        userId,
        courseId,
        videoId,
        tSec: currentTime,
        text: newNoteText.trim(),
      });
      
      const note = await NotesStore.upsertNote(userId, {
        userId,
        courseId,
        videoId,
        tSec: currentTime,
        text: newNoteText.trim(),
      });
      
      console.log('Note created successfully:', note);
      
      setNotes(prev => [...prev, note].sort((a, b) => a.tSec - b.tSec));
      setNewNoteText('');
      Keyboard.dismiss();
      
      // Try to sync the note to backend
      try {
        const { NotesSync } = await import('@/lib/notes.sync');
        await NotesSync.syncOnNoteChange();
        console.log('Note synced to backend successfully');
      } catch (syncError) {
        console.warn('Note sync failed, but note saved locally:', syncError);
        // Don't show error to user since note is saved locally
      }
      
      // Analytics
      console.log('Video_Note_Add', {
        courseId,
        videoId,
        positionSec: currentTime,
        length: newNoteText.trim().length,
      });
    } catch (error) {
      console.error('Error adding note - Full error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        courseId,
        videoId,
        currentTime,
        noteText: newNoteText.trim()
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      Alert.alert('Hata', `Not eklenirken bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNote = async (noteId: string, newText: string) => {
    if (!newText.trim()) return;
    
    try {
      const existingNote = notes.find(n => n.id === noteId);
      if (!existingNote) return;
      
      const updatedNote = await NotesStore.upsertNote(userId, {
        ...existingNote,
        text: newText.trim(),
      });
      
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      setEditingNote(null);
      
      // Try to sync the note to backend
      try {
        const { NotesSync } = await import('@/lib/notes.sync');
        await NotesSync.syncOnNoteChange();
        console.log('Note edit synced to backend successfully');
      } catch (syncError) {
        console.warn('Note edit sync failed, but note saved locally:', syncError);
      }
      
      // Analytics
      console.log('Video_Note_Edit', {
        courseId,
        videoId,
        positionSec: existingNote.tSec,
        length: newText.trim().length,
      });
    } catch (error) {
      console.error('Error editing note:', error);
      Alert.alert('Hata', 'Not düzenlenirken bir hata oluştu');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    Alert.alert(
      'Notu Sil',
      'Bu notu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotesStore.deleteNote(userId, noteId);
              setNotes(prev => prev.filter(n => n.id !== noteId));
              
              // Try to sync the deletion to backend
              try {
                const { NotesSync } = await import('@/lib/notes.sync');
                await NotesSync.syncOnNoteChange();
                console.log('Note deletion synced to backend successfully');
              } catch (syncError) {
                console.warn('Note deletion sync failed, but note deleted locally:', syncError);
              }
              
              // Analytics
              console.log('Video_Note_Delete', {
                courseId,
                videoId,
                positionSec: note.tSec,
              });
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Hata', 'Not silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleSeekToTime = async (seconds: number) => {
    if (videoRef.current) {
      try {
        await videoRef.current.setPositionAsync(seconds * 1000);
      } catch (error) {
        console.error('Error seeking video:', error);
      }
    }
  };

  const handleExportNotes = async () => {
    try {
      await NotesExport.exportVideoNotes(userId, courseId, videoId, videoTitle);
      
      // Analytics
      console.log('Notes_Export', {
        scope: 'video',
        count: notes.length,
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Hata', error instanceof Error ? error.message : 'Dışa aktarma başarısız');
    }
  };

  const renderNoteItem = ({ item }: { item: VideoNote }) => {
    const isEditing = editingNote?.id === item.id;
    const relativeTime = dayjs(item.createdAtUTC).fromNow();
    
    return (
      <View style={[styles.noteItem, { backgroundColor: theme.surface }]}>
        <View style={styles.noteHeader}>
          <TouchableOpacity
            style={[styles.timestampButton, { backgroundColor: theme.primary }]}
            onPress={() => handleSeekToTime(item.tSec)}
            accessibilityLabel={`${formatTime(item.tSec)} zamanına git`}
          >
            <Clock size={12} color={theme.background} />
            <ThemedText
              type="caption"
              style={[styles.timestampText, { color: theme.background }]}
            >
              {formatTime(item.tSec)}
            </ThemedText>
          </TouchableOpacity>
          
          <View style={styles.noteActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setEditingNote({ id: item.id, text: item.text });
                setTimeout(() => editInputRef.current?.focus(), 100);
              }}
              accessibilityLabel="Notu düzenle"
            >
              <Edit3 size={16} color={theme.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteNote(item.id)}
              accessibilityLabel="Notu sil"
            >
              <Trash2 size={16} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              ref={editInputRef}
              style={[
                styles.editInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={editingNote.text}
              onChangeText={(text) => setEditingNote(prev => prev ? { ...prev, text } : null)}
              onSubmitEditing={() => handleEditNote(item.id, editingNote.text)}
              onBlur={() => setEditingNote(null)}
              multiline
              placeholder="Notunuzu düzenleyin..."
              placeholderTextColor={theme.textMuted}
            />
          </View>
        ) : (
          <ThemedText type="body" style={styles.noteText}>
            {item.text}
          </ThemedText>
        )}
        
        <ThemedText type="caption" color="muted" style={styles.noteTime}>
          {relativeTime}
        </ThemedText>
      </View>
    );
  };

  const getContainerStyle = () => {
    if (isLandscape) {
      return [styles.container, styles.landscapeContainer];
    }
    return styles.container;
  };

  const getHeaderStyle = () => {
    if (isLandscape) {
      return [styles.header, styles.landscapeHeader];
    }
    return styles.header;
  };

  const getInputContainerStyle = () => {
    if (isLandscape) {
      return [styles.inputContainer, styles.landscapeInputContainer];
    }
    return styles.inputContainer;
  };

  return (
    <ThemedView style={getContainerStyle()}>
      <View style={getHeaderStyle()}>
        <View style={styles.headerLeft}>
          <FileText size={isLandscape ? 18 : 20} color={theme.primary} />
          <ThemedText type={isLandscape ? 'body' : 'h3'}>Video Notları</ThemedText>
        </View>
        
        {notes.length > 0 && (
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportNotes}
            accessibilityLabel="Notları dışa aktar"
          >
            <Download size={isLandscape ? 14 : 16} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={getInputContainerStyle()}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isLandscape && styles.landscapeInput,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={newNoteText}
          onChangeText={setNewNoteText}
          placeholder="Not yazın..."
          placeholderTextColor={theme.textMuted}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          style={[
            styles.addButton,
            isLandscape && styles.landscapeAddButton,
            {
              backgroundColor: newNoteText.trim() ? theme.primary : theme.border,
            },
          ]}
          onPress={handleAddNote}
          disabled={!newNoteText.trim() || isLoading}
          accessibilityLabel={`${formatTime(currentTime)} zamanında not ekle`}
        >
          <Plus
            size={isLandscape ? 16 : 20}
            color={newNoteText.trim() ? theme.background : theme.textMuted}
          />
          <ThemedText
            type="caption"
            style={[
              styles.addButtonText,
              {
                color: newNoteText.trim() ? theme.background : theme.textMuted,
                fontSize: isLandscape ? 11 : 12,
              },
            ]}
          >
            {formatTime(currentTime)}
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {notes.length === 0 ? (
        <View style={[styles.emptyState, isLandscape && styles.landscapeEmptyState]}>
          <FileText size={isLandscape ? 32 : 48} color={theme.textMuted} />
          <ThemedText type="body" color="muted" style={styles.emptyText}>
            Henüz not eklenmemiş
          </ThemedText>
          <ThemedText type="caption" color="muted" style={styles.emptySubtext}>
            Video izlerken istediğiniz anda not ekleyebilirsiniz
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteItem}
          style={styles.notesList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  landscapeContainer: {
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  landscapeHeader: {
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exportButton: {
    padding: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  landscapeInputContainer: {
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    minHeight: 40,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  landscapeInput: {
    minHeight: 32,
    maxHeight: 60,
    padding: spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    minHeight: 40,
  },
  landscapeAddButton: {
    minHeight: 32,
    paddingHorizontal: spacing.xs,
  },
  notesList: {
    flex: 1,
  },
  noteItem: {
    padding: spacing.md,
    borderRadius: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timestampButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  timestampText: {
    fontWeight: '600',
  },
  noteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
  editContainer: {
    marginBottom: spacing.sm,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  noteText: {
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  noteTime: {
    fontSize: 11,
  },
  separator: {
    height: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  landscapeEmptyState: {
    paddingVertical: spacing.md,
  },
  emptyText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 200,
  },
  addButtonText: {
    // Base style for add button text
  },
});
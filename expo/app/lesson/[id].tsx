import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Download, FileText, Award, CheckCircle } from 'lucide-react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { VideoPlayer } from '@/components/VideoPlayer';
import { QuizComponent } from '@/components/QuizComponent';
import { VideoNotesPanel } from '@/components/VideoNotesPanel';
import { CourseDetail, Lesson, Quiz } from '@/types/api';
import { apiService } from '@/services/api';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

export default function LessonScreen() {
  const { id, courseId } = useLocalSearchParams<{ id: string; courseId: string }>();
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = React.useRef<any>(null);

  useEffect(() => {
    if (id && courseId) {
      loadLessonData();
    }
  }, [id, courseId]);

  const loadLessonData = async () => {
    try {
      const courseData = await apiService.getCourseDetail(parseInt(courseId!));
      setCourse(courseData);
      
      // Find the lesson in course sections
      let foundLesson: Lesson | null = null;
      for (const section of courseData.sections) {
        foundLesson = section.lessons.find(l => l.id === parseInt(id!)) || null;
        if (foundLesson) break;
      }
      
      if (foundLesson) {
        setLesson(foundLesson);
        
        // Load quiz if lesson has one
        if (foundLesson.hasQuiz) {
          const quizData = await apiService.getQuiz(foundLesson.id);
          setQuiz(quizData);
        }
      } else {
        Alert.alert('Hata', 'Ders bulunamadı');
        router.back();
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      Alert.alert('Hata', 'Ders yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress);
  };

  const handleVideoComplete = async () => {
    if (!lesson || !course) return;
    
    try {
      await apiService.updateProgress({
        courseId: course.id,
        lessonId: lesson.id,
        status: 'completed',
      });
      
      // Update local state
      setLesson({ ...lesson, isCompleted: true });
      
      if (lesson.hasQuiz && quiz) {
        setShowQuiz(true);
      } else {
        Alert.alert('Tebrikler!', 'Ders tamamlandı', [
          { text: 'Sonraki Ders', onPress: goToNextLesson },
          { text: 'Kursa Dön', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleQuizComplete = (score: number) => {
    const passed = score >= 70;
    
    Alert.alert(
      passed ? 'Tebrikler!' : 'Quiz Tamamlandı',
      passed 
        ? `Quiz başarıyla tamamlandı! Puanınız: %${Math.round(score)}`
        : `Quiz tamamlandı. Puanınız: %${Math.round(score)}. Geçmek için en az %70 gerekiyor.`,
      [
        { text: 'Sonraki Ders', onPress: goToNextLesson },
        { text: 'Kursa Dön', onPress: () => router.back() },
      ]
    );
    
    setShowQuiz(false);
  };

  const goToNextLesson = () => {
    if (!course || !lesson) return;
    
    // Find next lesson
    let nextLesson: Lesson | null = null;
    let found = false;
    
    for (const section of course.sections) {
      for (const l of section.lessons) {
        if (found) {
          nextLesson = l;
          break;
        }
        if (l.id === lesson.id) {
          found = true;
        }
      }
      if (nextLesson) break;
    }
    
    if (nextLesson) {
      router.replace(`/lesson/${nextLesson.id}?courseId=${course.id}`);
    } else {
      Alert.alert('Tebrikler!', 'Kursun son dersini tamamladınız!', [
        { text: 'Kursa Dön', onPress: () => router.back() },
      ]);
    }
  };

  const handleAttachmentPress = (url: string) => {
    Linking.openURL(url);
  };

  if (isLoading || !lesson || !course) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Yükleniyor...' }} />
        <View style={styles.loadingContainer}>
          <ThemedText type="body" color="muted">Ders yükleniyor...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (showQuiz && quiz) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: quiz.title }} />
        <QuizComponent quiz={quiz} onComplete={handleQuizComplete} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: lesson.title }} />
      
      <ScrollView style={styles.scrollView}>
        {/* Video Player */}
        <VideoPlayer
          videoUrl={lesson.videoUrl}
          title={lesson.title}
          onProgress={handleVideoProgress}
          onComplete={handleVideoComplete}
          videoRef={videoRef}
        />

        {/* Lesson Info */}
        <View style={styles.contentContainer}>
          <View style={styles.lessonHeader}>
            <ThemedText type="h2">{lesson.title}</ThemedText>
            {lesson.isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
                <CheckCircle size={16} color={theme.background} />
                <ThemedText type="caption" style={{ color: theme.background }}>
                  Tamamlandı
                </ThemedText>
              </View>
            )}
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <ThemedText type="body" color="muted">
              Video İlerlemesi: %{Math.round(videoProgress)}
            </ThemedText>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${videoProgress}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Attachments */}
          {lesson.attachments.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Ders Kaynakları
              </ThemedText>
              {lesson.attachments.map((attachment, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.attachmentItem, { backgroundColor: theme.surface }]}
                  onPress={() => handleAttachmentPress(attachment.url)}
                >
                  <FileText size={20} color={theme.primary} />
                  <ThemedText type="body" style={styles.attachmentTitle}>
                    {attachment.title}
                  </ThemedText>
                  <Download size={16} color={theme.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Transcript */}
          {lesson.transcript && (
            <View style={styles.section}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Ders Metni
              </ThemedText>
              <ThemedView surface style={styles.transcriptContainer}>
                <ThemedText type="body" style={styles.transcript}>
                  {lesson.transcript}
                </ThemedText>
              </ThemedView>
            </View>
          )}

          {/* Quiz Info */}
          {lesson.hasQuiz && !showQuiz && (
            <View style={styles.section}>
              <ThemedView surface style={styles.quizInfo}>
                <View style={styles.quizHeader}>
                  <Award size={24} color={theme.secondary} />
                  <View style={styles.quizText}>
                    <ThemedText type="h3">Quiz Mevcut</ThemedText>
                    <ThemedText type="body" color="muted">
                      Videoyu tamamladıktan sonra quiz açılacak
                    </ThemedText>
                  </View>
                </View>
              </ThemedView>
            </View>
          )}

          {/* Video Notes */}
          {user && (
            <View style={styles.section}>
              <VideoNotesPanel
                userId={user.id.toString()}
                courseId={courseId!}
                videoId={id!}
                videoRef={videoRef}
                videoTitle={lesson.title}
              />
            </View>
          )}

          {/* Complete Lesson Button */}
          {!lesson.isCompleted && videoProgress >= 90 && (
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: theme.primary }]}
              onPress={handleVideoComplete}
            >
              <CheckCircle size={20} color={theme.background} />
              <ThemedText
                type="body"
                style={[styles.completeButtonText, { color: theme.background }]}
              >
                Dersi Tamamla
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: spacing.md,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  attachmentTitle: {
    flex: 1,
  },
  transcriptContainer: {
    padding: spacing.md,
    borderRadius: 8,
  },
  transcript: {
    lineHeight: 24,
  },
  quizInfo: {
    padding: spacing.md,
    borderRadius: 8,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quizText: {
    flex: 1,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  completeButtonText: {
    fontWeight: '600',
  },
});
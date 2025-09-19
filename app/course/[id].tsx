import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Play, Clock, BookOpen, Award, Download, ExternalLink } from 'lucide-react-native';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { CourseDetail, Lesson } from '@/types/api';
import { apiService } from '@/services/api';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCourse();
    }
  }, [id]);

  const loadCourse = async () => {
    try {
      const courseData = await apiService.getCourseDetail(parseInt(id!));
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course:', error);
      Alert.alert('Hata', 'Kurs yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonPress = (lesson: Lesson) => {
    if (!course?.isPurchased) {
      Alert.alert(
        'Kurs Kilitli',
        'Bu içerik kilitlidir.',
        [
          { text: 'Tamam', style: 'default' },
        ]
      );
      return;
    }

    router.push(`/lesson/${lesson.id}?courseId=${course.id}`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  const getTotalLessons = () => {
    return course?.sections.reduce((total, section) => total + section.lessons.length, 0) || 0;
  };

  const getCompletedLessons = () => {
    return course?.sections.reduce((total, section) => 
      total + section.lessons.filter(lesson => lesson.isCompleted).length, 0
    ) || 0;
  };

  if (isLoading || !course) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Yükleniyor...' }} />
        <View style={styles.loadingContainer}>
          <ThemedText type="body" color="muted">Kurs yükleniyor...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: course.title }} />
      
      <ScrollView style={styles.scrollView}>
        {/* Course Header */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: course.coverUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />
          <View style={styles.headerOverlay}>
            <View style={styles.headerContent}>
              <ThemedText type="h1" style={styles.courseTitle}>
                {course.title}
              </ThemedText>
              <View style={styles.courseMeta}>
                <View style={[styles.levelBadge, { backgroundColor: theme.primary + '20' }]}>
                  <ThemedText type="caption" color="primary">
                    {course.level}
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={16} color={theme.textMuted} />
                  <ThemedText type="caption" color="muted">
                    {formatDuration(course.totalDurationMin)}
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <BookOpen size={16} color={theme.textMuted} />
                  <ThemedText type="caption" color="muted">
                    {getTotalLessons()} ders
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Course Info */}
        <View style={styles.infoContainer}>
          <ThemedText type="body" style={styles.description}>
            {course.description}
          </ThemedText>

          {/* Progress */}
          {course.isPurchased && (
            <ThemedView surface style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <ThemedText type="h3">İlerleme</ThemedText>
                <ThemedText type="body" color="primary">
                  %{course.progress}
                </ThemedText>
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.primary,
                        width: `${course.progress}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <ThemedText type="caption" color="muted">
                {getCompletedLessons()} / {getTotalLessons()} ders tamamlandı
              </ThemedText>
            </ThemedView>
          )}

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {course.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.surfaceVariant }]}>
                <ThemedText type="caption" color="muted">
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Course Content */}
        <View style={styles.contentContainer}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Kurs İçeriği
          </ThemedText>

          {course.sections.map((section, sectionIndex) => (
            <ThemedView key={sectionIndex} surface style={styles.sectionCard}>
              <ThemedText type="h3" style={styles.sectionName}>
                {section.title}
              </ThemedText>
              
              {section.lessons.map((lesson, lessonIndex) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonItem,
                    {
                      backgroundColor: lesson.isCompleted 
                        ? theme.success + '10' 
                        : course.isPurchased 
                        ? theme.surface 
                        : theme.surfaceVariant,
                    },
                  ]}
                  onPress={() => handleLessonPress(lesson)}
                >
                  <View style={styles.lessonContent}>
                    <View style={styles.lessonInfo}>
                      <ThemedText
                        type="body"
                        style={[
                          styles.lessonTitle,
                          { opacity: course.isPurchased ? 1 : 0.6 },
                        ]}
                      >
                        {lesson.title}
                      </ThemedText>
                      <View style={styles.lessonMeta}>
                        <Clock size={12} color={theme.textMuted} />
                        <ThemedText type="small" color="muted">
                          {Math.floor(lesson.durationSec / 60)} dk
                        </ThemedText>
                        {lesson.hasQuiz && (
                          <>
                            <Award size={12} color={theme.secondary} />
                            <ThemedText type="small" color="muted">
                              Quiz
                            </ThemedText>
                          </>
                        )}
                        {lesson.attachments.length > 0 && (
                          <>
                            <Download size={12} color={theme.textMuted} />
                            <ThemedText type="small" color="muted">
                              {lesson.attachments.length} ek
                            </ThemedText>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={styles.lessonAction}>
                      {lesson.isCompleted ? (
                        <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
                          <ThemedText type="small" style={{ color: theme.background }}>
                            ✓
                          </ThemedText>
                        </View>
                      ) : course.isPurchased ? (
                        <Play size={20} color={theme.primary} />
                      ) : (
                        <ExternalLink size={16} color={theme.textMuted} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ThemedView>
          ))}
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
  headerContainer: {
    position: 'relative',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.md,
  },
  headerContent: {
    gap: spacing.sm,
  },
  courseTitle: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  description: {
    lineHeight: 24,
  },
  progressCard: {
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  contentContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  sectionCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionName: {
    marginBottom: spacing.md,
  },
  lessonItem: {
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    marginBottom: spacing.xs,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lessonAction: {
    marginLeft: spacing.md,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
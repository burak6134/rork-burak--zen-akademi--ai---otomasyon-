import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Play, TrendingUp, Clock } from 'lucide-react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { CourseCard } from '@/components/CourseCard';
import { BurakOzenLogo } from '@/components/BurakOzenLogo';
import { Course } from '@/types/api';
import { apiService } from '@/services/api';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

export default function HomeScreen() {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourseIds, setMyCourseIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [coursesResponse, myCoursesResponse] = await Promise.all([
        apiService.getCourses(),
        apiService.getMyCourses(),
      ]);
      setCourses(coursesResponse.items);
      setMyCourseIds(myCoursesResponse.courseIds);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const myCourses = courses.filter(course => myCourseIds.includes(course.id));
  const continueCourse = myCourses.find(course => course.progress > 0 && course.progress < 100);
  const featuredCourses = courses.filter(course => !myCourseIds.includes(course.id)).slice(0, 4);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <ThemedText type="h1">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'Öğrenci'}!
              </ThemedText>
              <ThemedText type="body" color="muted">
                Öğrenmeye devam etmeye hazır mısın?
              </ThemedText>
            </View>
            <BurakOzenLogo 
              variant="icon" 
              size={48} 
              style={styles.headerLogo}
            />
          </View>
        </View>

        {/* Continue Learning */}
        {continueCourse && (
          <View style={styles.section}>
            <ThemedText type="h2" style={styles.sectionTitle}>
              Kaldığın Yerden Devam Et
            </ThemedText>
            <TouchableOpacity
              style={[styles.continueCard, { backgroundColor: theme.primary + '20' }]}
              onPress={() => router.push(`/course/${continueCourse.id}`)}
            >
              <View style={styles.continueContent}>
                <View style={styles.continueInfo}>
                  <ThemedText type="h3" color="primary">
                    {continueCourse.title}
                  </ThemedText>
                  <ThemedText type="caption" color="muted">
                    %{continueCourse.progress} tamamlandı
                  </ThemedText>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: theme.primary,
                            width: `${continueCourse.progress}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <View style={[styles.playButton, { backgroundColor: theme.primary }]}>
                  <Play size={24} color={theme.background} fill={theme.background} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        <View style={styles.section}>
          <View style={styles.statsContainer}>
            <ThemedView surface style={styles.statCard}>
              <TrendingUp size={24} color={theme.primary} />
              <ThemedText type="h3">{myCourses.length}</ThemedText>
              <ThemedText type="caption" color="muted">Aktif Kurs</ThemedText>
            </ThemedView>
            <ThemedView surface style={styles.statCard}>
              <Clock size={24} color={theme.secondary} />
              <ThemedText type="h3">
                {Math.round(myCourses.reduce((total, course) => total + (course.totalDurationMin * course.progress / 100), 0) / 60)}s
              </ThemedText>
              <ThemedText type="caption" color="muted">Tamamlanan</ThemedText>
            </ThemedView>
          </View>
        </View>

        {/* My Courses */}
        {myCourses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h2">Kurslarım</ThemedText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/my-courses')}>
                <ThemedText type="body" color="primary">Tümünü Gör</ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {myCourses.slice(0, 3).map((course) => (
                <View key={course.id} style={styles.courseCardContainer}>
                  <CourseCard
                    course={course}
                    onPress={() => router.push(`/course/${course.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h2">Öne Çıkan Kurslar</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <ThemedText type="body" color="primary">Tümünü Gör</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.coursesGrid}>
            {featuredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={() => router.push(`/course/${course.id}`)}
                showProgress={false}
              />
            ))}
          </View>
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
  header: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerLogo: {
    marginLeft: spacing.md,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  continueCard: {
    padding: spacing.md,
    borderRadius: 16,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueInfo: {
    flex: 1,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.sm,
  },
  horizontalScroll: {
    marginHorizontal: -spacing.md,
  },
  courseCardContainer: {
    marginLeft: spacing.md,
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
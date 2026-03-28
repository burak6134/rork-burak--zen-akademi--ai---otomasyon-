import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, RefreshControl, useWindowDimensions, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { CourseCard } from '@/components/CourseCard';
import { Course } from '@/types/api';
import { apiService } from '@/services/api';
import { spacing } from '@/constants/theme';

export default function MyCoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourseIds, setMyCourseIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isLandscape, setIsLandscape] = useState(screenWidth > screenHeight);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => subscription?.remove();
  }, []);

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

  const filteredCourses = myCourses.filter(course => {
    switch (filter) {
      case 'in-progress':
        return course.progress > 0 && course.progress < 100;
      case 'completed':
        return course.progress === 100;
      default:
        return true;
    }
  });

  const getFilterText = (filterType: typeof filter) => {
    switch (filterType) {
      case 'in-progress':
        return 'Devam Eden';
      case 'completed':
        return 'Tamamlanan';
      default:
        return 'Tümü';
    }
  };

  const getCoursesContainerStyle = () => {
    if (isLandscape) {
      return [styles.coursesContainer, styles.landscapeCoursesContainer];
    }
    return styles.coursesContainer;
  };

  const getHeaderStyle = () => {
    if (isLandscape) {
      return [styles.header, styles.landscapeHeader];
    }
    return styles.header;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={getHeaderStyle()}>
        <ThemedText type={isLandscape ? 'h2' : 'h1'}>Kurslarım</ThemedText>
        <ThemedText type="body" color="muted">
          {myCourses.length} kurs
        </ThemedText>
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, isLandscape && styles.landscapeFiltersContainer]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'in-progress', 'completed'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                isLandscape && styles.landscapeFilterButton,
                filter === filterType && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(filterType)}
            >
              <ThemedText
                type={isLandscape ? 'caption' : 'body'}
                color={filter === filterType ? 'primary' : 'muted'}
              >
                {getFilterText(filterType)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCourses.length === 0 ? (
          <View style={[styles.emptyState, isLandscape && styles.landscapeEmptyState]}>
            <ThemedText type={isLandscape ? 'body' : 'h3'} color="muted">
              {filter === 'all' 
                ? 'Henüz kursunuz yok'
                : filter === 'in-progress'
                ? 'Devam eden kursunuz yok'
                : 'Tamamlanan kursunuz yok'
              }
            </ThemedText>
            <ThemedText type={isLandscape ? 'caption' : 'body'} color="muted" style={styles.emptyDescription}>
              {filter === 'all' 
                ? 'Katalogdan yeni kurslar keşfedin'
                : 'Kurslarınıza devam edin'
              }
            </ThemedText>
            {filter === 'all' && (
              <TouchableOpacity
                style={[styles.exploreButton, isLandscape && styles.landscapeExploreButton]}
                onPress={() => router.push('/(tabs)/catalog')}
              >
                <ThemedText type={isLandscape ? 'caption' : 'body'} color="primary">
                  Katalogı Keşfet
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={getCoursesContainerStyle()}>
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                layout="horizontal"
                onPress={() => router.push(`/course/${course.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
  },
  landscapeHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  landscapeFiltersContainer: {
    marginBottom: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  landscapeFilterButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  activeFilterButton: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  coursesContainer: {
    padding: spacing.md,
  },
  landscapeCoursesContainer: {
    padding: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  landscapeEmptyState: {
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  emptyDescription: {
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  exploreButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  landscapeExploreButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
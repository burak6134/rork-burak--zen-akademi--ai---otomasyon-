import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, RefreshControl, useWindowDimensions, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { CourseCard } from '@/components/CourseCard';
import { Course } from '@/types/api';
import { apiService } from '@/services/api';
import { colors, spacing, getResponsiveValue } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function CatalogScreen() {
  const { isDark } = useThemeStore();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isLandscape, setIsLandscape] = useState(screenWidth > screenHeight);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourseIds, setMyCourseIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | 'purchased' | 'available'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'Başlangıç' | 'Orta' | 'İleri'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const filteredCourses = courses.filter(course => {
    // Purchase filter
    if (filter === 'purchased' && !myCourseIds.includes(course.id)) return false;
    if (filter === 'available' && myCourseIds.includes(course.id)) return false;
    
    // Level filter
    if (levelFilter !== 'all' && course.level !== levelFilter) return false;
    
    return true;
  });

  const handleCoursePress = (course: Course) => {
    router.push(`/course/${course.id}`);
  };

  const getFilterText = (filterType: typeof filter) => {
    switch (filterType) {
      case 'purchased':
        return 'Sahip Olunan';
      case 'available':
        return 'Kilitli';
      default:
        return 'Tümü';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="h1">Kurs Kataloğu</ThemedText>
        <ThemedText type="body" color="muted">
          {courses.length} kurs mevcut
        </ThemedText>
      </View>

      {/* Purchase Status Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'purchased', 'available'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.activeFilterButton,
              ]}
              onPress={() => setFilter(filterType)}
            >
              <ThemedText
                type="body"
                color={filter === filterType ? 'primary' : 'muted'}
              >
                {getFilterText(filterType)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Level Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'Başlangıç', 'Orta', 'İleri'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterButton,
                levelFilter === level && styles.activeFilterButton,
              ]}
              onPress={() => setLevelFilter(level)}
            >
              <ThemedText
                type="body"
                color={levelFilter === level ? 'primary' : 'muted'}
              >
                {level === 'all' ? 'Tüm Seviyeler' : level}
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
        <View style={[styles.coursesContainer, isLandscape && styles.landscapeCoursesContainer]}>
          <View style={[styles.coursesGrid, isLandscape && styles.landscapeCoursesGrid]}>
            {filteredCourses.map((course) => {
              const columns = getResponsiveValue(
                { phone: 2, tablet: 3, desktop: 4 },
                screenWidth
              );
              const cardWidth = (screenWidth - spacing.md * 2 - spacing.md * (columns - 1)) / columns;
              
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  onPress={() => handleCoursePress(course)}
                  showProgress={course.isPurchased}
                  width={cardWidth}
                />
              );
            })}
          </View>
        </View>

        {filteredCourses.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText type="h3" color="muted">
              Bu filtrelere uygun kurs bulunamadı
            </ThemedText>
            <ThemedText type="body" color="muted" style={styles.emptyDescription}>
              Farklı filtreler deneyebilirsiniz
            </ThemedText>
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
    marginBottom: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'transparent',
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
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  landscapeCoursesGrid: {
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyDescription: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
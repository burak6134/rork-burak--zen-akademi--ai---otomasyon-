import React from 'react';
import { View, FlatList, useWindowDimensions, StyleSheet } from 'react-native';
import { Course } from '@/types/api';
import { CourseCard } from './CourseCard';
import { spacing } from '@/constants/theme';

interface CourseCarouselProps {
  data: Course[];
  onCoursePress: (course: Course) => void;
  showProgress?: boolean;
}

export function CourseCarousel({ data, onCoursePress, showProgress = true }: CourseCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(320, width * 0.8);
  const gap = spacing.md;

  const renderCourseCard = ({ item }: { item: Course }) => (
    <View style={[styles.cardContainer, { width: cardWidth, marginRight: gap }]}>
      <CourseCard
        course={item}
        onPress={() => onCoursePress(item)}
        showProgress={showProgress}
        width={cardWidth}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + gap}
        snapToAlignment="start"
        contentContainerStyle={styles.contentContainer}
        renderItem={renderCourseCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
  },
  cardContainer: {
    // Dynamic width and marginRight are set inline due to responsive calculations
  },
});
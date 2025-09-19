import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Lock, Play } from 'lucide-react-native';
import { Course } from '@/types/api';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  showProgress?: boolean;
  width?: number;
  layout?: 'vertical' | 'horizontal';
}

export function CourseCard({ course, onPress, showProgress = true, width: cardWidth, layout = 'vertical' }: CourseCardProps) {
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
  
  const getCardDimensions = () => {
    if (layout === 'horizontal') {
      const horizontalHeight = isLandscape ? 140 : 180;
      return {
        width: cardWidth || screenWidth - spacing.md * 2,
        height: horizontalHeight,
      };
    }
    
    // For vertical layout, adjust based on orientation and screen size
    let columns = 2;
    if (isLandscape) {
      columns = screenWidth > 1024 ? 4 : 3; // More columns in landscape
    } else {
      columns = screenWidth > 768 ? 3 : 2; // Tablet vs phone
    }
    
    const defaultCardWidth = (screenWidth - spacing.md * (columns + 1)) / columns;
    return {
      width: cardWidth || defaultCardWidth,
      height: undefined,
    };
  };
  
  const cardDimensions = getCardDimensions();
  
  const progressText = useMemo(() => {
    return course.progress.toString() + '%';
  }, [course.progress]);

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, cardDimensions]}>
      <ThemedView surface style={[styles.card, layout === 'horizontal' && styles.horizontalCard]}>
        <View style={[styles.imageContainer, layout === 'horizontal' && styles.horizontalImageContainer]}>
          <Image
            source={{ 
              uri: course.coverLandscape?.w800 || course.coverUrl 
            }}
            style={styles.image}
            contentFit="cover"
          />
          {!course.isPurchased && (
            <View style={[styles.lockOverlay, { backgroundColor: theme.background + '80' }]}>
              <Lock size={24} color={theme.text} />
            </View>
          )}
          {course.isPurchased && course.progress > 0 && (
            <View style={[styles.playOverlay, { backgroundColor: theme.primary + '20' }]}>
              <Play size={20} color={theme.primary} fill={theme.primary} />
            </View>
          )}
        </View>

        <View style={[styles.content, layout === 'horizontal' && styles.horizontalContent]}>
          <ThemedText 
            type={layout === 'horizontal' ? 'body' : 'h3'} 
            numberOfLines={layout === 'horizontal' ? (isLandscape ? 1 : 2) : 2} 
            style={[styles.title, layout === 'horizontal' && styles.horizontalTitle]}
          >
            {course.title}
          </ThemedText>

          {layout === 'horizontal' && (
            <ThemedText 
              type="caption" 
              color="muted" 
              numberOfLines={isLandscape ? 2 : 0} 
              style={styles.horizontalDescription}
            >
              {course.description}
            </ThemedText>
          )}

          {layout === 'vertical' && (
            <ThemedText 
              type="caption" 
              color="muted" 
              numberOfLines={isLandscape ? 2 : 0} 
              style={styles.description}
            >
              {course.description}
            </ThemedText>
          )}

          <View style={styles.bottomSection}>
            {showProgress && course.isPurchased && course.progress > 0 && (
              <View style={[styles.progressContainer, layout === 'horizontal' && styles.horizontalProgressContainer]}>
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
                <ThemedText type="caption" color="muted">
                  {progressText}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  horizontalCard: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    height: 100,
    aspectRatio: 16 / 9,
  },
  horizontalImageContainer: {
    width: 120,
    minWidth: 120,
    height: '100%',
    aspectRatio: undefined,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  horizontalContent: {
    flex: 1,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    justifyContent: 'flex-start',
  },
  bottomSection: {
    marginTop: 'auto',
  },
  title: {
    marginBottom: spacing.sm,
    minHeight: 48,
  },
  horizontalTitle: {
    marginBottom: spacing.xs,
    minHeight: 20,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  description: {
    marginBottom: spacing.sm,
    minHeight: 32,
  },
  horizontalDescription: {
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'left',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  horizontalProgressContainer: {
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

});
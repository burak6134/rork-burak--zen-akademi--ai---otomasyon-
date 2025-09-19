import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize } from 'lucide-react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  videoRef?: React.RefObject<Video>;
}

const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height, isLandscape: width > height };
};

export function VideoPlayer({ videoUrl, title, onProgress, onComplete, videoRef: externalVideoRef }: VideoPlayerProps) {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  const internalVideoRef = useRef<Video>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [screenData, setScreenData] = useState(getScreenDimensions());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      const newScreenData = getScreenDimensions();
      setScreenData(newScreenData);
      
      // Auto-fullscreen in landscape on phones
      if (newScreenData.isLandscape && newScreenData.width < 768) {
        setIsFullscreen(true);
      } else if (!newScreenData.isLandscape) {
        setIsFullscreen(false);
      }
    });

    return () => subscription?.remove();
  }, []);

  const isPlaying = status?.isLoaded && status.isPlaying;
  const duration = status?.isLoaded ? status.durationMillis || 0 : 0;
  const position = status?.isLoaded ? status.positionMillis || 0 : 0;

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  };

  const handleSkip = (seconds: number) => {
    if (status?.isLoaded) {
      const newPosition = Math.max(0, Math.min(duration, position + seconds * 1000));
      videoRef.current?.setPositionAsync(newPosition);
    }
  };

  const handleStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status) return;
    
    setStatus(status);
    
    if (status.isLoaded) {
      const progress = status.durationMillis ? (status.positionMillis / status.durationMillis) * 100 : 0;
      onProgress?.(progress);
      
      if (status.didJustFinish) {
        onComplete?.();
      }
    }
  };

  const toggleFullscreen = () => {
    try {
      setIsFullscreen((prev) => !prev);
    } catch (e) {
      console.log('toggleFullscreen error', e);
    }
  };

  const getVideoContainerStyle = () => {
    if (isFullscreen || screenData.isLandscape) {
      return {
        width: screenData.width,
        height: screenData.height,
        position: 'absolute' as const,
        top: 0,
        left: 0,
        zIndex: 1000,
      };
    }
    return {
      width: screenData.width,
      height: screenData.width * 9 / 16,
    };
  };

  return (
    <ThemedView style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <View style={[styles.videoContainer, getVideoContainerStyle()]}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={handleStatusUpdate}
          onTouchStart={() => setShowControls(!showControls)}
        />
        
        {showControls && (
          <View style={[styles.controlsOverlay, { backgroundColor: theme.background + '80' }]}>
            <View style={styles.topControls}>
              <ThemedText type="h3" style={styles.videoTitle}>
                {title}
              </ThemedText>
              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize size={24} color={theme.text} />
                ) : (
                  <Maximize size={24} color={theme.text} />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSkip(-10)}
              >
                <SkipBack size={24} color={theme.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.primary }]}
                onPress={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause size={32} color={theme.background} />
                ) : (
                  <Play size={32} color={theme.background} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSkip(10)}
              >
                <SkipForward size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bottomControls}>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.primary,
                        width: duration ? `${(position / duration) * 100}%` : '0%',
                      },
                    ]}
                  />
                </View>
              </View>
              
              <View style={styles.timeContainer}>
                <ThemedText type="caption" color="muted">
                  {formatTime(position)} / {formatTime(duration)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  videoContainer: {
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fullscreenButton: {
    padding: spacing.sm,
  },
  videoTitle: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  controlButton: {
    padding: spacing.md,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    gap: spacing.sm,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
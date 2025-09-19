import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';


interface BurakOzenLogoProps {
  size?: number;
  variant?: 'icon' | 'horizontal' | 'vertical';
  style?: any;
}

export function BurakOzenLogo({ 
  size = 120, 
  variant = 'icon',
  style 
}: BurakOzenLogoProps) {


  const getLogoSource = () => {
    switch (variant) {
      case 'horizontal':
        return 'https://r2-pub.rork.com/generated-images/02503f46-2667-4a7e-bb85-6d2c86553ec0.png';
      case 'vertical':
        return 'https://r2-pub.rork.com/generated-images/02503f46-2667-4a7e-bb85-6d2c86553ec0.png';
      case 'icon':
      default:
        return 'https://r2-pub.rork.com/generated-images/02503f46-2667-4a7e-bb85-6d2c86553ec0.png';
    }
  };

  const getDimensions = () => {
    switch (variant) {
      case 'horizontal':
        return { width: size * 2.5, height: size };
      case 'vertical':
        return { width: size * 1.2, height: size * 1.5 };
      case 'icon':
      default:
        return { width: size, height: size };
    }
  };

  const dimensions = getDimensions();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: getLogoSource() }}
        style={[styles.logo, dimensions]}
        contentFit="contain"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Base styles, dimensions set dynamically
  },
});
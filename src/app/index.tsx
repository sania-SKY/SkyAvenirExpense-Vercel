import { useEffect, useRef } from 'react';
import {
    Animated,
    Image,
    StyleSheet,
    View,
} from 'react-native';

import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const splashImage = require('../../assets/images/sky-avenir-splash.png');

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1.015)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),

      Animated.timing(scale, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 2800);

    return () => clearTimeout(timer);
  }, [opacity, scale]);

  return (
    <View style={styles.container}>
      <StatusBar
        style="light"
        translucent
        backgroundColor="transparent"
      />

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Image
          source={splashImage}
          style={styles.backgroundImage}
          resizeMode="cover"
          fadeDuration={0}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#062B4A',
    overflow: 'hidden',
  },

  backgroundImage: {
    width: '100%',
    height: '100%',
  },
});
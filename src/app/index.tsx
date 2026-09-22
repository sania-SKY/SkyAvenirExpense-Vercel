import { useEffect } from 'react';
import {
    Image,
    StyleSheet,
    View,
} from 'react-native';

import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const splashImage = require('../../assets/images/sky-avenir-splash.png');

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        style="light"
        translucent
        backgroundColor="transparent"
      />

      <Image
        source={splashImage}
        style={styles.image}
        resizeMode="cover"
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#062B4A',
  },

  image: {
    width: '100%',
    height: '100%',
  },
});
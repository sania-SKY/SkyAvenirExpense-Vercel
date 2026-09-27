import {
  useEffect,
} from 'react';

import {
  Image,
  StyleSheet,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  restoreSession,
} from '../../services/auth';

const splashImage =
  require(
    '../../assets/images/sky-avenir-splash.png',
  );

const MIN_SPLASH_MS =
  1800;

export default function SplashScreen() {
  useEffect(() => {
    let mounted =
      true;

    async function initializeApp() {
      const startedAt =
        Date.now();

      try {
        const user =
          await restoreSession();

        const elapsed =
          Date.now() -
          startedAt;

        const remaining =
          Math.max(
            MIN_SPLASH_MS -
              elapsed,
            0,
          );

        if (
          remaining >
          0
        ) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                remaining,
              ),
          );
        }

        if (!mounted) {
          return;
        }

        if (user) {
          router.replace(
            '/(tabs)/home',
          );

          return;
        }

        router.replace(
          '/(auth)/login',
        );
      } catch (error) {
        console.error(
          'App initialization failed:',
          error,
        );

        if (!mounted) {
          return;
        }

        router.replace(
          '/(auth)/login',
        );
      }
    }

    initializeApp();

    return () => {
      mounted =
        false;
    };
  }, []);

  return (
    <View
      style={
        styles.container
      }
    >
      <StatusBar
        style="light"
      />

      <Image
        source={
          splashImage
        }
        style={
          styles.image
        }
        resizeMode="cover"
        fadeDuration={
          0
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        '#062B4A',
    },

    image: {
      width:
        '100%',

      height:
        '100%',
    },
  });
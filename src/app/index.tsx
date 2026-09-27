import {
  useEffect,
  useState,
} from 'react';

import {
  Image,
  StyleSheet,
  View,
} from 'react-native';

import {
  Redirect,
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

type StartupDestination =
  | 'home'
  | 'login'
  | null;

const MIN_SPLASH_TIME_MS =
  1200;

export default function SplashScreen() {
  const [
    destination,
    setDestination,
  ] =
    useState<StartupDestination>(
      null,
    );

  useEffect(() => {
    let mounted =
      true;

    async function startApp() {
      const startedAt =
        Date.now();

      let nextDestination:
        StartupDestination =
        'login';

      try {
        const user =
          await restoreSession();

        nextDestination =
          user
            ? 'home'
            : 'login';
      } catch (error) {
        console.error(
          'Startup session restore failed:',
          error,
        );

        nextDestination =
          'login';
      }

      const elapsed =
        Date.now() -
        startedAt;

      const remaining =
        Math.max(
          MIN_SPLASH_TIME_MS -
            elapsed,
          0,
        );

      if (
        remaining >
        0
      ) {
        await new Promise<void>(
          (resolve) => {
            setTimeout(
              resolve,
              remaining,
            );
          },
        );
      }

      if (
        mounted
      ) {
        setDestination(
          nextDestination,
        );
      }
    }

    void startApp();

    return () => {
      mounted =
        false;
    };
  }, []);

  if (
    destination ===
    'home'
  ) {
    return (
      <Redirect
        href="/(tabs)/home"
      />
    );
  }

  if (
    destination ===
    'login'
  ) {
    return (
      <Redirect
        href="/(auth)/login"
      />
    );
  }

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
import {
  Image,
  StyleSheet,
  View,
} from 'react-native';

import {
  StatusBar,
} from 'expo-status-bar';

const splashImage =
  require(
    '../../assets/images/sky-avenir-splash.png',
  );

/*
 * ------------------------------------------------
 * APP SPLASH
 * ------------------------------------------------
 *
 * Shown while the stored session is being restored,
 * before any route is allowed to mount.
 * ------------------------------------------------
 */
export function AppSplash() {
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

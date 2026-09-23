import { useRef, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
    Animated,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { signInWithMicrosoft } from '../../../services/auth';

const backgroundImage = require('../../../assets/images/login-bg.png');

export default function LoginScreen() {
  const [backgroundReady, setBackgroundReady] =
    useState(false);

  const [isSigningIn, setIsSigningIn] =
    useState(false);

  const [loginError, setLoginError] =
    useState('');

  const screenOpacity = useRef(
    new Animated.Value(0),
  ).current;

  function handleBackgroundLoaded() {
    if (backgroundReady) {
      return;
    }

    setBackgroundReady(true);

    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }

  async function handleMicrosoftSignIn() {
    if (isSigningIn) {
      return;
    }

    try {
      setIsSigningIn(true);
      setLoginError('');

      const user =
        await signInWithMicrosoft();

      router.replace({
        pathname: '/(tabs)/home',

        params: {
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(
        'Microsoft sign-in error:',
        error,
      );

      setLoginError(
        'Unable to sign in. Please check your connection and try again.',
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar
        style="dark"
        translucent
        backgroundColor="transparent"
      />

      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
        onLoadEnd={handleBackgroundLoaded}
      >
        {backgroundReady && (
          <Animated.View
            style={[
              styles.screen,
              {
                opacity: screenOpacity,
              },
            ]}
          >
            <View style={styles.content}>
              {/* Logo already exists inside login-bg.png */}

              <View style={styles.logoSpace} />

              {/* EXPENSE */}

              <Text style={styles.expenseText}>
                E X P E N S E
              </Text>

              <View style={styles.goldLine} />

              {/* WELCOME */}

              <View style={styles.welcomeSection}>
                <Text style={styles.welcome}>
                  Welcome
                </Text>

                <Text style={styles.subtitle}>
                  Sign in with your company account
                  {'\n'}
                  to continue
                </Text>
              </View>

              {/* MICROSOFT BUTTON */}

              <Pressable
                onPress={handleMicrosoftSignIn}
                disabled={isSigningIn}
                style={({ pressed }) => [
                  styles.microsoftButton,

                  pressed &&
                    !isSigningIn &&
                    styles.microsoftPressed,

                  isSigningIn &&
                    styles.microsoftDisabled,
                ]}
              >
                <LinearGradient
                  colors={[
                    '#0866B3',
                    '#1385D2',
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 0,
                  }}
                  style={styles.microsoftGradient}
                >
                  <View
                    style={
                      styles.microsoftContent
                    }
                  >
                    <MicrosoftLogo />

                    <Text
                      style={
                        styles.microsoftText
                      }
                    >
                      {isSigningIn
                        ? 'Signing in...'
                        : 'Sign in with Microsoft'}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>

              {loginError ? (
                <Text style={styles.error}>
                  {loginError}
                </Text>
              ) : null}

              {/* FEATURES */}

              <View style={styles.features}>
                <FeatureItem
                  icon="shield-checkmark"
                  title="Secure Access"
                  subtitle="Your company data stays protected"
                />

                <FeatureItem
                  icon="people"
                  title="For Sky Avenir Employees"
                  subtitle="Fast and simple expense submission"
                />

                <FeatureItem
                  icon="sparkles"
                  title="More Time for What Matters"
                  subtitle="Less admin, more impact"
                />
              </View>
            </View>

            {/* FOOTER */}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                PEOPLE  |  PROGRESS  |  A HIGHER TOMORROW
              </Text>

              <View style={styles.footerLine} />
            </View>
          </Animated.View>
        )}
      </ImageBackground>
    </View>
  );
}

/* MICROSOFT LOGO */

function MicrosoftLogo() {
  return (
    <View style={styles.microsoftLogo}>
      <View style={styles.microsoftRow}>
        <View
          style={[
            styles.microsoftSquare,
            styles.microsoftRed,
          ]}
        />

        <View
          style={[
            styles.microsoftSquare,
            styles.microsoftGreen,
          ]}
        />
      </View>

      <View style={styles.microsoftRow}>
        <View
          style={[
            styles.microsoftSquare,
            styles.microsoftBlue,
          ]}
        />

        <View
          style={[
            styles.microsoftSquare,
            styles.microsoftYellow,
          ]}
        />
      </View>
    </View>
  );
}

type FeatureItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

function FeatureItem({
  icon,
  title,
  subtitle,
}: FeatureItemProps) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={23}
          color="#075A98"
        />
      </View>

      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5FAFE',
  },

  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  screen: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 27,
  },

  /*
   * Logo is inside login-bg.png.
   *
   * Reduced from 205 because the previous
   * version created too much vertical space.
   */

  logoSpace: {
    height: 185,
  },

  expenseText: {
    textAlign: 'center',

    fontSize: 9.5,
    fontWeight: '500',

    letterSpacing: 6,

    color: '#6E8BA5',
  },

  goldLine: {
    alignSelf: 'center',

    width: 48,
    height: 2,

    marginTop: 13,

    borderRadius: 10,

    backgroundColor: '#DCA52E',
  },

  welcomeSection: {
    alignItems: 'center',

    marginTop: 21,
  },

  welcome: {
    fontSize: 32,
    lineHeight: 38,

    fontWeight: '700',

    color: '#06345C',
  },

  subtitle: {
    marginTop: 7,

    textAlign: 'center',

    fontSize: 14.5,
    lineHeight: 20,

    color: '#42637F',
  },

  microsoftButton: {
    marginTop: 22,

    borderRadius: 17,

    overflow: 'hidden',

    elevation: 4,

    shadowColor: '#075F9E',
    shadowOpacity: 0.15,
    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  microsoftGradient: {
    height: 58,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 17,
  },

  microsoftContent: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',
  },

  microsoftText: {
    marginLeft: 12,

    fontSize: 16.5,
    fontWeight: '700',

    color: '#FFFFFF',
  },

  microsoftPressed: {
    opacity: 0.94,

    transform: [
      {
        scale: 0.997,
      },
    ],
  },

  microsoftDisabled: {
    opacity: 0.7,
  },

  microsoftLogo: {
    width: 24,
    height: 24,

    justifyContent: 'space-between',
  },

  microsoftRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',
  },

  microsoftSquare: {
    width: 11,
    height: 11,
  },

  microsoftRed: {
    backgroundColor: '#F35325',
  },

  microsoftGreen: {
    backgroundColor: '#81BC06',
  },

  microsoftBlue: {
    backgroundColor: '#05A6F0',
  },

  microsoftYellow: {
    backgroundColor: '#FFBA08',
  },

  error: {
    marginTop: 8,

    paddingHorizontal: 12,

    textAlign: 'center',

    fontSize: 11.5,
    lineHeight: 16,

    color: '#B42318',
  },

  /*
   * Slightly higher and tighter than before
   * so the mountains do not interfere
   * with the last feature.
   */

  features: {
    marginTop: 19,
  },

  featureRow: {
    minHeight: 58,

    marginBottom: 12,

    flexDirection: 'row',
    alignItems: 'center',
  },

  featureIcon: {
    width: 49,
    height: 49,

    borderRadius: 25,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,

    backgroundColor:
      'rgba(220,238,250,0.93)',
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 14.5,
    fontWeight: '700',

    color: '#07365F',
  },

  featureSubtitle: {
    marginTop: 2,

    fontSize: 12,
    lineHeight: 16,

    color: '#4E6F8B',
  },

  footer: {
    position: 'absolute',

    left: 20,
    right: 20,
    bottom: 21,

    alignItems: 'center',
  },

  footerText: {
    textAlign: 'center',

    fontSize: 7.2,
    fontWeight: '600',

    letterSpacing: 1.45,

    color: '#315A7D',
  },

  footerLine: {
    width: 42,
    height: 2,

    marginTop: 9,

    borderRadius: 10,

    backgroundColor: '#DCA52E',
  },
});
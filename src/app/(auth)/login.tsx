import { useRef, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import {
    Animated,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const backgroundImage = require('../../../assets/images/login-bg.png');

export default function LoginScreen() {
  const [backgroundReady, setBackgroundReady] = useState(false);

  const screenOpacity = useRef(new Animated.Value(0)).current;

  function handleBackgroundLoaded() {
    setBackgroundReady(true);

    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
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
        <View style={styles.softOverlay} />

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
              <View style={styles.brandSection}>
                <View style={styles.logoWrap}>
                  <Ionicons
                    name="paper-plane"
                    size={46}
                    color="#DDAA42"
                  />
                </View>

                <View style={styles.brandRow}>
                  <Text style={styles.skyText}>SKY</Text>
                  <Text style={styles.avenirText}>AVENIR</Text>
                </View>

                <Text style={styles.expenseText}>
                  E X P E N S E
                </Text>

                <View style={styles.goldLine} />
              </View>

              <View style={styles.welcomeSection}>
                <Text style={styles.welcome}>
                  Welcome
                </Text>

                <Text style={styles.subtitle}>
                  Sign in with your company account{'\n'}
                  to continue
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.microsoftButton,
                  pressed && styles.microsoftButtonPressed,
                ]}
              >
                <LinearGradient
                  colors={['#075EAA', '#0879CA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.microsoftGradient}
                >
                  <View style={styles.microsoftLogo}>
                    <View style={styles.msRow}>
                      <View style={[styles.msSquare, styles.red]} />
                      <View style={[styles.msSquare, styles.green]} />
                    </View>

                    <View style={styles.msRow}>
                      <View style={[styles.msSquare, styles.blue]} />
                      <View style={[styles.msSquare, styles.yellow]} />
                    </View>
                  </View>

                  <Text style={styles.microsoftText}>
                    Sign in with Microsoft
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={23}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </Pressable>

              <View style={styles.features}>
                <FeatureItem
                  icon="shield-checkmark"
                  title="Secure Access"
                  subtitle="Your company data stays safe"
                />

                <FeatureItem
                  icon="people"
                  title="For Sky Avenir Employees"
                  subtitle="Fast and easy expense submission"
                />

                <FeatureItem
                  icon="bar-chart"
                  title="More Time for What Matters"
                  subtitle="Less admin, more impact"
                />
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                PEOPLE   |   PROGRESS   |   A HIGHER TOMORROW
              </Text>
            </View>
          </Animated.View>
        )}
      </ImageBackground>
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
          size={27}
          color="#07518D"
        />
      </View>

      <View style={styles.featureText}>
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
    backgroundColor: '#F7FBFF',
  },

  background: {
    flex: 1,
  },

  softOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.44)',
  },

  screen: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
  },

  brandSection: {
    alignItems: 'center',
  },

  logoWrap: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  skyText: {
    fontSize: 31,
    fontWeight: '300',
    letterSpacing: 3.2,
    color: '#73A9CF',
    marginRight: 9,
  },

  avenirText: {
    fontSize: 31,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: '#062E56',
  },

  expenseText: {
    marginTop: 4,
    fontSize: 10,
    letterSpacing: 7,
    color: '#7189A0',
  },

  goldLine: {
    width: 50,
    height: 2,
    marginTop: 17,
    borderRadius: 20,
    backgroundColor: '#DDA83C',
  },

  welcomeSection: {
    alignItems: 'center',
    marginTop: 27,
  },

  welcome: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: '#062E56',
  },

  subtitle: {
    marginTop: 9,
    fontSize: 15.5,
    lineHeight: 22,
    textAlign: 'center',
    color: '#405F7C',
  },

  microsoftButton: {
    marginTop: 26,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 5,
  },

  microsoftButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.996 }],
  },

  microsoftGradient: {
    height: 58,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  microsoftLogo: {
    width: 26,
    height: 26,
    marginRight: 13,
    justifyContent: 'space-between',
  },

  msRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  msSquare: {
    width: 12,
    height: 12,
  },

  red: {
    backgroundColor: '#F35325',
  },

  green: {
    backgroundColor: '#81BC06',
  },

  blue: {
    backgroundColor: '#05A6F0',
  },

  yellow: {
    backgroundColor: '#FFBA08',
  },

  microsoftText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  features: {
    marginTop: 25,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 21,
  },

  featureIcon: {
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: 'rgba(220,236,248,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#082F56',
  },

  featureSubtitle: {
    marginTop: 3,
    fontSize: 13.5,
    lineHeight: 18,
    color: '#4B6A88',
  },

  footer: {
    position: 'absolute',
    bottom: 26,
    left: 20,
    right: 20,
    alignItems: 'center',
  },

  footerText: {
    fontSize: 8.5,
    letterSpacing: 2,
    color: '#173F66',
    fontWeight: '500',
  },
});
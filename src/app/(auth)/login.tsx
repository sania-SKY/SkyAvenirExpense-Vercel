import {
  useRef,
  useState,
} from 'react';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import {
  router,
} from 'expo-router';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  signInWithGoogle,
  signInWithMicrosoft,
  signInWithWorkEmail,
} from '../../../services/auth';

const backgroundImage =
  require(
    '../../../assets/images/login-bg.png',
  );

type Provider =
  | 'microsoft'
  | 'google'
  | 'email';

export default function LoginScreen() {
  const [
    backgroundReady,
    setBackgroundReady,
  ] =
    useState(false);

  const [
    activeProvider,
    setActiveProvider,
  ] =
    useState<Provider | null>(
      null,
    );

  const [
    loginError,
    setLoginError,
  ] =
    useState('');

  const [
    workEmail,
    setWorkEmail,
  ] =
    useState('');

  const screenOpacity =
    useRef(
      new Animated.Value(0),
    ).current;

  function handleBackgroundLoaded() {
    if (backgroundReady) {
      return;
    }

    setBackgroundReady(
      true,
    );

    Animated.timing(
      screenOpacity,
      {
        toValue:
          1,

        duration:
          350,

        useNativeDriver:
          true,
      },
    ).start();
  }

  function goToProcessing(
    provider:
      Provider,

    user: {
      name: string;
      email: string;
    },
  ) {
    router.replace({
      pathname:
        '/(auth)/auth-processing',

      params: {
        provider,

        name:
          user.name,

        email:
          user.email,
      },
    });
  }

  async function handleProviderSignIn(
    provider:
      | 'microsoft'
      | 'google',
  ) {
    if (activeProvider) {
      return;
    }

    try {
      setLoginError('');

      setActiveProvider(
        provider,
      );

      const user =
        provider ===
        'microsoft'
          ? await signInWithMicrosoft()
          : await signInWithGoogle();

      goToProcessing(
        provider,
        user,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '';

      /*
       * Normal Google cancellation should
       * NOT create a red LogBox.
       */
      if (
        message ===
        'GOOGLE_SIGN_IN_CANCELLED'
      ) {
        setLoginError('');

        return;
      }

      console.log(
        `${provider} sign-in issue:`,
        error,
      );

      setLoginError(
        message ||
          'Unable to sign in. Please try again.',
      );
    } finally {
      setActiveProvider(
        null,
      );
    }
  }

  async function handleWorkEmail() {
    if (activeProvider) {
      return;
    }

    try {
      setLoginError('');

      setActiveProvider(
        'email',
      );

      const user =
        await signInWithWorkEmail(
          workEmail,
        );

      goToProcessing(
        'email',
        user,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '';

      setLoginError(
        message ||
          'Unable to continue with work email.',
      );
    } finally {
      setActiveProvider(
        null,
      );
    }
  }

  return (
    <View
      style={
        styles.root
      }
    >
      <StatusBar
        style="dark"
      />

      <ImageBackground
        source={
          backgroundImage
        }
        style={
          styles.background
        }
        resizeMode="cover"
        onLoadEnd={
          handleBackgroundLoaded
        }
      >
        {backgroundReady && (
          <Animated.View
            style={[
              styles.screen,
              {
                opacity:
                  screenOpacity,
              },
            ]}
          >
            <KeyboardAvoidingView
              style={
                styles.screen
              }
              behavior={
                Platform.OS ===
                'ios'
                  ? 'padding'
                  : undefined
              }
            >
              <ScrollView
                contentContainerStyle={
                  styles.scrollContent
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={
                  false
                }
              >
                {/* Logo is embedded in login-bg.png */}

                <View
                  style={
                    styles.logoSpace
                  }
                />

                <Text
                  style={
                    styles.expenseText
                  }
                >
                  E X P E N S E
                </Text>

                <View
                  style={
                    styles.goldLine
                  }
                />

                <View
                  style={
                    styles.welcomeSection
                  }
                >
                  <Text
                    style={
                      styles.welcome
                    }
                  >
                    Welcome
                  </Text>

                  <Text
                    style={
                      styles.subtitle
                    }
                  >
                    Sign in with your company account
                    {'\n'}
                    to continue
                  </Text>
                </View>

                {/* MICROSOFT */}

                <Pressable
                  disabled={
                    activeProvider !==
                    null
                  }
                  onPress={() =>
                    handleProviderSignIn(
                      'microsoft',
                    )
                  }
                  style={
                    styles.providerWrapper
                  }
                >
                  <LinearGradient
                    colors={[
                      '#075FA8',
                      '#1385D2',
                    ]}
                    start={{
                      x:
                        0,
                      y:
                        0,
                    }}
                    end={{
                      x:
                        1,
                      y:
                        0,
                    }}
                    style={
                      styles.microsoftButton
                    }
                  >
                    <MicrosoftLogo />

                    <Text
                      style={
                        styles.microsoftText
                      }
                    >
                      {activeProvider ===
                      'microsoft'
                        ? 'Signing in...'
                        : 'Continue with Microsoft'}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* GOOGLE */}

                <Pressable
                  disabled={
                    activeProvider !==
                    null
                  }
                  onPress={() =>
                    handleProviderSignIn(
                      'google',
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.googleButton,

                    pressed &&
                      !activeProvider &&
                      styles.googlePressed,
                  ]}
                >
                  <GoogleLogo />

                  <Text
                    style={
                      styles.googleText
                    }
                  >
                    {activeProvider ===
                    'google'
                      ? 'Opening Google...'
                      : 'Continue with Google'}
                  </Text>
                </Pressable>

                {/* DIVIDER */}

                <View
                  style={
                    styles.dividerRow
                  }
                >
                  <View
                    style={
                      styles.dividerLine
                    }
                  />

                  <Text
                    style={
                      styles.dividerText
                    }
                  >
                    OR
                  </Text>

                  <View
                    style={
                      styles.dividerLine
                    }
                  />
                </View>

                {/* WORK EMAIL */}

                <Text
                  style={
                    styles.workEmailLabel
                  }
                >
                  Work Email
                </Text>

                <View
                  style={
                    styles.emailInputContainer
                  }
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#527590"
                  />

                  <TextInput
                    value={
                      workEmail
                    }
                    onChangeText={
                      setWorkEmail
                    }
                    placeholder="name@skyavenir.com"
                    placeholderTextColor="#8DA3B5"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={
                      false
                    }
                    editable={
                      activeProvider ===
                      null
                    }
                    returnKeyType="done"
                    onSubmitEditing={
                      handleWorkEmail
                    }
                    style={
                      styles.emailInput
                    }
                  />
                </View>

                <Pressable
                  disabled={
                    activeProvider !==
                    null
                  }
                  onPress={
                    handleWorkEmail
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.emailButton,

                    pressed &&
                      !activeProvider &&
                      styles.emailButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="arrow-forward-circle-outline"
                    size={21}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.emailButtonText
                    }
                  >
                    {activeProvider ===
                    'email'
                      ? 'Verifying...'
                      : 'Continue with Work Email'}
                  </Text>
                </Pressable>

                {loginError ? (
                  <Text
                    style={
                      styles.error
                    }
                  >
                    {loginError}
                  </Text>
                ) : null}

                {/* SECURITY */}

                <View
                  style={
                    styles.infoCard
                  }
                >
                  <View
                    style={
                      styles.infoIcon
                    }
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={21}
                      color="#0868AE"
                    />
                  </View>

                  <View
                    style={
                      styles.infoContent
                    }
                  >
                    <Text
                      style={
                        styles.infoTitle
                      }
                    >
                      Secure company access
                    </Text>

                    <Text
                      style={
                        styles.infoSubtitle
                      }
                    >
                      Use your approved Microsoft,
                      Google or company work email
                      account.
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.accessText
                  }
                >
                  Need access? Contact your administrator.
                </Text>

                {/* FOOTER */}

                <View
                  style={
                    styles.footer
                  }
                >
                  <Text
                    style={
                      styles.footerText
                    }
                  >
                    PEOPLE  |  PROGRESS  |  A HIGHER TOMORROW
                  </Text>

                  <View
                    style={
                      styles.footerLine
                    }
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        )}
      </ImageBackground>
    </View>
  );
}

function MicrosoftLogo() {
  return (
    <View
      style={
        styles.microsoftLogo
      }
    >
      <View
        style={
          styles.microsoftRow
        }
      >
        <View
          style={[
            styles.microsoftSquare,
            styles.red,
          ]}
        />

        <View
          style={[
            styles.microsoftSquare,
            styles.green,
          ]}
        />
      </View>

      <View
        style={
          styles.microsoftRow
        }
      >
        <View
          style={[
            styles.microsoftSquare,
            styles.blue,
          ]}
        />

        <View
          style={[
            styles.microsoftSquare,
            styles.yellow,
          ]}
        />
      </View>
    </View>
  );
}

function GoogleLogo() {
  return (
    <View
      style={
        styles.googleLogo
      }
    >
      <Text
        style={
          styles.googleG
        }
      >
        G
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex:
        1,

      backgroundColor:
        '#F5FAFE',
    },

    background: {
      flex:
        1,

      width:
        '100%',

      height:
        '100%',
    },

    screen: {
      flex:
        1,
    },

    scrollContent: {
      flexGrow:
        1,

      paddingHorizontal:
        27,

      paddingBottom:
        28,
    },

    /*
     * Important:
     * Leave room for the logo embedded
     * inside login-bg.png.
     */
    logoSpace: {
      height:
        215,
    },

    expenseText: {
      textAlign:
        'center',

      fontSize:
        9.5,

      fontWeight:
        '500',

      letterSpacing:
        6,

      color:
        '#6E8BA5',
    },

    goldLine: {
      width:
        48,

      height:
        2,

      alignSelf:
        'center',

      marginTop:
        10,

      borderRadius:
        10,

      backgroundColor:
        '#DCA52E',
    },

    welcomeSection: {
      alignItems:
        'center',

      marginTop:
        15,
    },

    welcome: {
      fontSize:
        29,

      lineHeight:
        35,

      fontWeight:
        '700',

      color:
        '#06345C',
    },

    subtitle: {
      marginTop:
        4,

      textAlign:
        'center',

      fontSize:
        13,

      lineHeight:
        18,

      color:
        '#42637F',
    },

    providerWrapper: {
      marginTop:
        18,

      borderRadius:
        16,

      overflow:
        'hidden',

      elevation:
        3,
    },

    microsoftButton: {
      height:
        54,

      paddingHorizontal:
        20,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        16,
    },

    microsoftLogo: {
      width:
        24,

      height:
        24,

      marginRight:
        12,

      justifyContent:
        'space-between',
    },

    microsoftRow: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',
    },

    microsoftSquare: {
      width:
        11,

      height:
        11,
    },

    red: {
      backgroundColor:
        '#F35325',
    },

    green: {
      backgroundColor:
        '#81BC06',
    },

    blue: {
      backgroundColor:
        '#05A6F0',
    },

    yellow: {
      backgroundColor:
        '#FFBA08',
    },

    microsoftText: {
      fontSize:
        15.5,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },

    googleButton: {
      height:
        54,

      marginTop:
        10,

      paddingHorizontal:
        20,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        16,

      borderWidth:
        1.2,

      borderColor:
        '#C7D9E6',

      backgroundColor:
        'rgba(255,255,255,0.94)',

      elevation:
        1,
    },

    googlePressed: {
      backgroundColor:
        '#F5F9FC',
    },

    googleLogo: {
      width:
        25,

      height:
        25,

      marginRight:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    googleG: {
      fontSize:
        21,

      fontWeight:
        '700',

      color:
        '#4285F4',
    },

    googleText: {
      fontSize:
        15.5,

      fontWeight:
        '700',

      color:
        '#183F60',
    },

    dividerRow: {
      marginTop:
        12,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    dividerLine: {
      flex:
        1,

      height:
        1,

      backgroundColor:
        'rgba(91,126,151,0.30)',
    },

    dividerText: {
      marginHorizontal:
        13,

      fontSize:
        10.5,

      fontWeight:
        '700',

      color:
        '#577790',
    },

    workEmailLabel: {
      marginTop:
        8,

      marginBottom:
        6,

      textAlign:
        'center',

      fontSize:
        12.5,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    emailInputContainer: {
      height:
        48,

      paddingHorizontal:
        15,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderRadius:
        14,

      borderWidth:
        1.2,

      borderColor:
        '#BFD3E1',

      backgroundColor:
        'rgba(255,255,255,0.94)',
    },

    emailInput: {
      flex:
        1,

      height:
        '100%',

      marginLeft:
        10,

      fontSize:
        14,

      color:
        '#163D5C',
    },

    emailButton: {
      height:
        48,

      marginTop:
        8,

      flexDirection:
        'row',

      gap:
        8,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        14,

      backgroundColor:
        '#0878BF',

      elevation:
        2,
    },

    emailButtonPressed: {
      opacity:
        0.9,
    },

    emailButtonText: {
      fontSize:
        14,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },

    error: {
      marginTop:
        8,

      textAlign:
        'center',

      fontSize:
        11,

      lineHeight:
        15,

      color:
        '#B42318',
    },

    infoCard: {
      marginTop:
        12,

      paddingHorizontal:
        14,

      paddingVertical:
        10,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderRadius:
        17,

      backgroundColor:
        'rgba(232,244,251,0.90)',
    },

    infoIcon: {
      width:
        40,

      height:
        40,

      borderRadius:
        14,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(215,235,247,0.96)',
    },

    infoContent: {
      flex:
        1,

      marginLeft:
        11,
    },

    infoTitle: {
      fontSize:
        12.5,

      fontWeight:
        '700',

      color:
        '#174966',
    },

    infoSubtitle: {
      marginTop:
        2,

      fontSize:
        10.2,

      lineHeight:
        14,

      color:
        '#648196',
    },

    accessText: {
      marginTop:
        8,

      textAlign:
        'center',

      fontSize:
        10.5,

      fontWeight:
        '500',

      color:
        '#56758D',
    },

    footer: {
      marginTop:
        22,

      paddingBottom:
        4,

      alignItems:
        'center',
    },

    footerText: {
      textAlign:
        'center',

      fontSize:
        7.2,

      fontWeight:
        '600',

      letterSpacing:
        1.45,

      color:
        '#315A7D',
    },

    footerLine: {
      width:
        42,

      height:
        2,

      marginTop:
        9,

      borderRadius:
        10,

      backgroundColor:
        '#DCA52E',
    },
  });
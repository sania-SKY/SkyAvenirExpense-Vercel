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
  Alert,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  signInWithWorkEmail,
} from '../../../services/auth';

const backgroundImage =
  require(
    '../../../assets/images/login-bg.png',
  );

export default function LoginScreen() {
  const [
    backgroundReady,
    setBackgroundReady,
  ] =
    useState(false);

  const [
    workEmail,
    setWorkEmail,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    isSigningIn,
    setIsSigningIn,
  ] =
    useState(false);

  const [
    loginError,
    setLoginError,
  ] =
    useState('');

  const screenOpacity =
    useRef(
      new Animated.Value(
        0,
      ),
    ).current;

  function handleBackgroundLoaded() {
    if (
      backgroundReady
    ) {
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

  async function handleSignIn() {
    if (
      isSigningIn
    ) {
      return;
    }

    try {
      setLoginError(
        '',
      );

      setIsSigningIn(
        true,
      );

      const user =
        await signInWithWorkEmail(
          workEmail,
          password,
        );

     await signInWithWorkEmail(
  workEmail,
  password,
);

router.replace(
  '/(tabs)/home',
);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to sign in.';

      console.log(
        'Work email sign-in:',
        error,
      );

      setLoginError(
        message,
      );
    } finally {
      setIsSigningIn(
        false,
      );
    }
  }

  const canSubmit =
    workEmail
      .trim()
      .length >
      0 &&
    password.length >
      0 &&
    !isSigningIn;

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
                    Sign in with your
                    Sky Avenir work account
                    {'\n'}
                    to continue
                  </Text>
                </View>

                <View
                  style={
                    styles.loginCard
                  }
                >
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    Work Email
                  </Text>

                  <View
                    style={
                      styles.inputContainer
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
                      autoComplete="email"
                      editable={
                        !isSigningIn
                      }
                      returnKeyType="next"
                      style={
                        styles.input
                      }
                    />
                  </View>

                  <Text
                    style={[
                      styles.fieldLabel,
                      styles.passwordLabel,
                    ]}
                  >
                    Password
                  </Text>

                  <View
                    style={
                      styles.inputContainer
                    }
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#527590"
                    />

                    <TextInput
                      value={
                        password
                      }
                      onChangeText={
                        setPassword
                      }
                      placeholder="Enter your password"
                      placeholderTextColor="#8DA3B5"
                      secureTextEntry={
                        !showPassword
                      }
                      autoCapitalize="none"
                      autoCorrect={
                        false
                      }
                      autoComplete="password"
                      editable={
                        !isSigningIn
                      }
                      returnKeyType="done"
                      onSubmitEditing={
                        handleSignIn
                      }
                      style={
                        styles.input
                      }
                    />

                    <Pressable
                      onPress={() =>
                        setShowPassword(
                          (current) =>
                            !current,
                        )
                      }
                      hitSlop={
                        10
                      }
                    >
                      <Ionicons
                        name={
                          showPassword
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={21}
                        color="#527590"
                      />
                    </Pressable>
                  </View>

                  <Pressable
                    disabled={
                      !canSubmit
                    }
                    onPress={
                      handleSignIn
                    }
                    style={
                      styles.signInWrapper
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
                      style={[
                        styles.signInButton,

                        !canSubmit &&
                          styles.signInButtonDisabled,
                      ]}
                    >
                      <Ionicons
                        name="log-in-outline"
                        size={21}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.signInText
                        }
                      >
                        {isSigningIn
                          ? 'Signing in...'
                          : 'Sign In'}
                      </Text>
                    </LinearGradient>
                  </Pressable>

                  {loginError ? (
                    <View
                      style={
                        styles.errorBox
                      }
                    >
                      <Ionicons
                        name="alert-circle-outline"
                        size={17}
                        color="#B42318"
                      />

                      <Text
                        style={
                          styles.errorText
                        }
                      >
                        {loginError}
                      </Text>
                    </View>
                  ) : null}
                </View>

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
                      Sign in using your approved
                      Sky Avenir employee account.
                    </Text>
                  </View>
                </View>

                <View 
  style={ 
    styles.accountActions 
  } 
> 
  <Pressable 
    onPress={() => 
      Alert.alert( 
        'Forgot Password', 
        'Password reset by email is not configured yet. This feature will be enabled after the login and account creation flow is verified.', 
      ) 
    } 
  > 
    <Text 
      style={ 
        styles.forgotPasswordText 
      } 
    > 
      Forgot Password? 
    </Text> 
  </Pressable> 
 
  <Pressable 
    onPress={() => 
      router.push( 
        '/(auth)/create-account', 
      ) 
    } 
  > 
    <Text 
      style={ 
        styles.createAccountText 
      } 
    > 
      First time here?{' '} 
      <Text 
        style={ 
          styles.createAccountStrong 
        } 
      > 
        Create Account 
      </Text> 
    </Text> 
  </Pressable> 
</View>

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

    loginCard: {
      marginTop:
        20,

      padding:
        17,

      borderRadius:
        20,

      borderWidth:
        1,

      borderColor:
        'rgba(183,207,223,0.76)',

      backgroundColor:
        'rgba(255,255,255,0.94)',

      elevation:
        2,
    },

    fieldLabel: {
      marginBottom:
        7,

      fontSize:
        12.5,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    passwordLabel: {
      marginTop:
        14,
    },

    inputContainer: {
      height:
        52,

      paddingHorizontal:
        14,

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
        '#FFFFFF',
    },

    input: {
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

    signInWrapper: {
      marginTop:
        18,

      borderRadius:
        15,

      overflow:
        'hidden',

      elevation:
        3,
    },

    signInButton: {
      height:
        54,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        8,

      borderRadius:
        15,
    },

    signInButtonDisabled: {
      opacity:
        0.55,
    },

    signInText: {
      fontSize:
        15,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },

    errorBox: {
      marginTop:
        13,

      paddingHorizontal:
        11,

      paddingVertical:
        9,

      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap:
        7,

      borderRadius:
        12,

      backgroundColor:
        '#FFF0EF',
    },

    errorText: {
      flex:
        1,

      fontSize:
        11,

      lineHeight:
        16,

      color:
        '#B42318',
    },

    infoCard: {
      marginTop:
        14,

      paddingHorizontal:
        14,

      paddingVertical:
        11,

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

    accountActions: {
  marginTop: 14,
  alignItems: 'center',
  gap: 12,
},

forgotPasswordText: {
  fontSize: 11.5,
  fontWeight: '600',
  color: '#0868AE',
},

createAccountText: {
  fontSize: 11.5,
  color: '#56758D',
},

createAccountStrong: {
  fontWeight: '700',
  color: '#0868AE',
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
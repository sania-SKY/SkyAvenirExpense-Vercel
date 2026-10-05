import {
    useState,
} from 'react';

import {
    Ionicons,
} from '@expo/vector-icons';

import {
    router,
    useLocalSearchParams,
} from 'expo-router';

import {
    StatusBar,
} from 'expo-status-bar';

import {
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
    resendEmailVerification,
    verifyWorkEmail,
} from '../../../services/auth';

export default function VerifyEmailScreen() {
  const params =
    useLocalSearchParams<{
      email?:
        string;

      notice?:
        string;
    }>();

  const email =
    typeof params.email ===
      'string'
      ? params.email
          .trim()
          .toLowerCase()
      : '';

  const initialNotice =
    typeof params.notice ===
      'string'
      ? params.notice
      : '';

  const [
    code,
    setCode,
  ] =
    useState('');

  const [
    isVerifying,
    setIsVerifying,
  ] =
    useState(false);

  const [
    isResending,
    setIsResending,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState(
      initialNotice,
    );

  async function handleVerify() {
    if (
      isVerifying
    ) {
      return;
    }

    const cleanCode =
      code.trim();

    setErrorMessage('');

    if (!email) {
      setErrorMessage(
        'Your work email is unavailable. Please create your account again.',
      );

      return;
    }

    if (
      !/^\d{6}$/.test(
        cleanCode,
      )
    ) {
      setErrorMessage(
        'Please enter the 6-digit verification code.',
      );

      return;
    }

    try {
      setIsVerifying(
        true,
      );

      await verifyWorkEmail(
        email,
        cleanCode,
      );

      router.replace({
        pathname:
          '/(auth)/login',

        params: {
          verified:
            'success',
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to verify your email.',
      );
    } finally {
      setIsVerifying(
        false,
      );
    }
  }

  async function handleResend() {
    if (
      isResending
    ) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      setIsResending(
        true,
      );

      const message =
        await resendEmailVerification(
          email,
        );

      setSuccessMessage(
        message,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to resend the verification code.',
      );
    } finally {
      setIsResending(
        false,
      );
    }
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <StatusBar
        style="dark"
      />

      <KeyboardAvoidingView
        style={
          styles.container
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
              styles.header
            }
          >
            <Pressable
              onPress={() =>
                router.replace(
                  '/(auth)/login',
                )
              }
              style={
                styles.backButton
              }
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#0A3558"
              />
            </Pressable>

            <View
              style={
                styles.headerCenter
              }
            >
              <Text
                style={
                  styles.headerTitle
                }
              >
                Verify Email
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Secure account verification
              </Text>
            </View>

            <View
              style={
                styles.headerSpacer
              }
            />
          </View>

          <View
            style={
              styles.content
            }
          >
            <View
              style={
                styles.iconCircle
              }
            >
              <Ionicons
                name="mail-open-outline"
                size={31}
                color="#0868AE"
              />
            </View>

            <Text
              style={
                styles.title
              }
            >
              Check your work email
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Enter the 6-digit verification code
              sent to your work email.
            </Text>

            <View
              style={
                styles.emailCard
              }
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color="#0868AE"
              />

              <Text
                numberOfLines={1}
                style={
                  styles.emailText
                }
              >
                {email ||
                  'Work email unavailable'}
              </Text>
            </View>

            <View
              style={
                styles.formCard
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                Verification Code
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="keypad-outline"
                  size={19}
                  color="#70879A"
                />

                <TextInput
                  value={
                    code
                  }
                  onChangeText={(
                    value,
                  ) =>
                    setCode(
                      value
                        .replace(
                          /\D/g,
                          '',
                        )
                        .slice(
                          0,
                          6,
                        ),
                    )
                  }
                  placeholder="6-digit code"
                  placeholderTextColor="#91A3B1"
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={
                    !isVerifying
                  }
                  returnKeyType="done"
                  onSubmitEditing={
                    handleVerify
                  }
                  style={[
                    styles.input,
                    styles.codeInput,
                  ]}
                />
              </View>

              {errorMessage ? (
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
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {successMessage ? (
                <View
                  style={
                    styles.successBox
                  }
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={17}
                    color="#16845B"
                  />

                  <Text
                    style={
                      styles.successText
                    }
                  >
                    {successMessage}
                  </Text>
                </View>
              ) : null}

              <Pressable
                disabled={
                  isVerifying
                }
                onPress={
                  handleVerify
                }
                style={[
                  styles.primaryButton,

                  isVerifying &&
                    styles.primaryButtonDisabled,
                ]}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {isVerifying
                    ? 'Verifying...'
                    : 'Verify Email'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              disabled={
                isResending
              }
              onPress={
                handleResend
              }
              style={
                styles.resendButton
              }
            >
              <Text
                style={
                  styles.resendText
                }
              >
                {isResending
                  ? 'Sending...'
                  : "Didn't receive a code? "}

                {!isResending && (
                  <Text
                    style={
                      styles.resendStrong
                    }
                  >
                    Send Again
                  </Text>
                )}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        '#F4F8FB',
    },

    scrollContent: {
      flexGrow:
        1,
    },

    header: {
      paddingTop:
        50,

      paddingHorizontal:
        18,

      paddingBottom:
        15,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth:
        1,

      borderBottomColor:
        '#E8EEF3',

      backgroundColor:
        '#FFFFFF',
    },

    backButton: {
      width:
        44,

      height:
        44,

      borderRadius:
        22,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#EFF5F9',
    },

    headerCenter: {
      flex:
        1,

      alignItems:
        'center',
    },

    headerTitle: {
      fontSize:
        18,

      fontWeight:
        '700',

      color:
        '#0A3558',
    },

    headerSubtitle: {
      marginTop:
        2,

      fontSize:
        10.5,

      color:
        '#8498A8',
    },

    headerSpacer: {
      width:
        44,
    },

    content: {
      flex:
        1,

      paddingHorizontal:
        24,

      paddingTop:
        32,

      paddingBottom:
        34,
    },

    iconCircle: {
      width:
        66,

      height:
        66,

      alignSelf:
        'center',

      borderRadius:
        22,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#E4F1F9',
    },

    title: {
      marginTop:
        17,

      textAlign:
        'center',

      fontSize:
        25,

      fontWeight:
        '700',

      color:
        '#0A3558',
    },

    subtitle: {
      marginTop:
        8,

      textAlign:
        'center',

      fontSize:
        13,

      lineHeight:
        19,

      color:
        '#71879A',
    },

    emailCard: {
      minHeight:
        48,

      marginTop:
        20,

      paddingHorizontal:
        14,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        9,

      borderRadius:
        15,

      backgroundColor:
        '#E8F3FA',
    },

    emailText: {
      flex:
        1,

      fontSize:
        12.5,

      fontWeight:
        '600',

      color:
        '#41647D',
    },

    formCard: {
      marginTop:
        16,

      padding:
        18,

      borderRadius:
        22,

      borderWidth:
        1,

      borderColor:
        '#E0EAF0',

      backgroundColor:
        '#FFFFFF',

      elevation:
        2,
    },

    label: {
      marginBottom:
        8,

      fontSize:
        12.5,

      fontWeight:
        '700',

      color:
        '#294E69',
    },

    inputContainer: {
      height:
        55,

      paddingHorizontal:
        14,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        9,

      borderRadius:
        15,

      borderWidth:
        1,

      borderColor:
        '#D5E2EA',

      backgroundColor:
        '#FBFDFE',
    },

    input: {
      flex:
        1,

      height:
        '100%',

      fontSize:
        14,

      color:
        '#173F60',
    },

    codeInput: {
      letterSpacing:
        5,

      fontWeight:
        '700',
    },

    errorBox: {
      marginTop:
        15,

      padding:
        10,

      flexDirection:
        'row',

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

      color:
        '#B42318',
    },

    successBox: {
      marginTop:
        15,

      padding:
        10,

      flexDirection:
        'row',

      gap:
        7,

      borderRadius:
        12,

      backgroundColor:
        '#EAF7F0',
    },

    successText: {
      flex:
        1,

      fontSize:
        11,

      color:
        '#16845B',
    },

    primaryButton: {
      height:
        58,

      marginTop:
        20,

      borderRadius:
        17,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#0868AE',
    },

    primaryButtonDisabled: {
      opacity:
        0.6,
    },

    primaryButtonText: {
      fontSize:
        15,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },

    resendButton: {
      marginTop:
        20,

      alignItems:
        'center',
    },

    resendText: {
      fontSize:
        12.5,

      color:
        '#627E91',
    },

    resendStrong: {
      fontWeight:
        '700',

      color:
        '#0868AE',
    },
  });
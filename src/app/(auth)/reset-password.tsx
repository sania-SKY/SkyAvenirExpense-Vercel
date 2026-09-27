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
    resetPassword,
} from '../../../services/auth';

export default function ResetPasswordScreen() {
  const params =
    useLocalSearchParams<{
      email?:
        string;
    }>();

  const email =
    typeof params.email ===
      'string'
      ? params.email
          .trim()
          .toLowerCase()
      : '';

  const [
    code,
    setCode,
  ] =
    useState('');

  const [
    newPassword,
    setNewPassword,
  ] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  async function handleResetPassword() {
    if (
      isSubmitting
    ) {
      return;
    }

    setErrorMessage('');

    const cleanCode =
      code
        .trim();

    if (!email) {
      setErrorMessage(
        'Your work email is unavailable. Please request a new reset code.',
      );

      return;
    }

    if (
      !/^\d{6}$/.test(
        cleanCode,
      )
    ) {
      setErrorMessage(
        'Please enter the 6-digit reset code.',
      );

      return;
    }

    if (
      newPassword.length <
      8
    ) {
      setErrorMessage(
        'Password must contain at least 8 characters.',
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setErrorMessage(
        'Passwords do not match.',
      );

      return;
    }

    try {
      setIsSubmitting(
        true,
      );

      await resetPassword({
        email,

        code:
          cleanCode,

        newPassword,
      });

      router.replace({
        pathname:
          '/(auth)/login',

        params: {
          reset:
            'success',
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to reset your password.',
      );
    } finally {
      setIsSubmitting(
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
                router.back()
              }
              style={
                styles.backButton
              }
              hitSlop={
                10
              }
            >
              <Ionicons
                name="chevron-back"
                size={
                  24
                }
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
                Reset Password
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Verify your reset code
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
                name="lock-open-outline"
                size={
                  31
                }
                color="#0868AE"
              />
            </View>

            <Text
              style={
                styles.title
              }
            >
              Create a new password
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Enter the 6-digit code sent to your
              work email and choose a new password.
            </Text>

            <View
              style={
                styles.emailCard
              }
            >
              <Ionicons
                name="mail-outline"
                size={
                  18
                }
                color="#0868AE"
              />

              <Text
                numberOfLines={
                  1
                }
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
                Reset Code
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="keypad-outline"
                  size={
                    19
                  }
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
                  maxLength={
                    6
                  }
                  editable={
                    !isSubmitting
                  }
                  style={[
                    styles.input,
                    styles.codeInput,
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.label,
                  styles.fieldSpacing,
                ]}
              >
                New Password
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={
                    19
                  }
                  color="#70879A"
                />

                <TextInput
                  value={
                    newPassword
                  }
                  onChangeText={
                    setNewPassword
                  }
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#91A3B1"
                  secureTextEntry={
                    !showPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  editable={
                    !isSubmitting
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
                    size={
                      20
                    }
                    color="#70879A"
                  />
                </Pressable>
              </View>

              <Text
                style={[
                  styles.label,
                  styles.fieldSpacing,
                ]}
              >
                Confirm Password
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={
                    19
                  }
                  color="#70879A"
                />

                <TextInput
                  value={
                    confirmPassword
                  }
                  onChangeText={
                    setConfirmPassword
                  }
                  placeholder="Re-enter new password"
                  placeholderTextColor="#91A3B1"
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  editable={
                    !isSubmitting
                  }
                  returnKeyType="done"
                  onSubmitEditing={
                    handleResetPassword
                  }
                  style={
                    styles.input
                  }
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(
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
                      showConfirmPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={
                      20
                    }
                    color="#70879A"
                  />
                </Pressable>
              </View>

              {errorMessage ? (
                <View
                  style={
                    styles.errorBox
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={
                      17
                    }
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

              <Pressable
                disabled={
                  isSubmitting
                }
                onPress={
                  handleResetPassword
                }
                style={[
                  styles.primaryButton,

                  isSubmitting &&
                    styles.primaryButtonDisabled,
                ]}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {isSubmitting
                    ? 'Updating password...'
                    : 'Update Password'}
                </Text>

                {!isSubmitting && (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={
                      20
                    }
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={() =>
                router.replace(
                  '/(auth)/forgot-password',
                )
              }
              style={
                styles.requestAgain
              }
            >
              <Text
                style={
                  styles.requestAgainText
                }
              >
                Didn&apos;t receive a code?{' '}
                <Text
                  style={
                    styles.requestAgainStrong
                  }
                >
                  Request Again
                </Text>
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
        30,

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

      paddingHorizontal:
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

    fieldSpacing: {
      marginTop:
        15,
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

      paddingHorizontal:
        11,

      paddingVertical:
        10,

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

    primaryButton: {
      height:
        58,

      marginTop:
        20,

      borderRadius:
        17,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        8,

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

    requestAgain: {
      marginTop:
        20,

      alignItems:
        'center',
    },

    requestAgainText: {
      fontSize:
        12.5,

      color:
        '#627E91',
    },

    requestAgainStrong: {
      fontWeight:
        '700',

      color:
        '#0868AE',
    },
  });
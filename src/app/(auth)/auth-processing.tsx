import {
  useEffect,
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
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Provider =
  | 'microsoft'
  | 'google'
  | 'email';

export default function AuthProcessingScreen() {
  const params =
    useLocalSearchParams<{
      provider?: Provider;
      name?: string;
      email?: string;
    }>();

  const provider:
    Provider =
    params.provider ===
    'google'
      ? 'google'
      : params.provider ===
          'email'
        ? 'email'
        : 'microsoft';

  const providerLabel =
    provider ===
    'google'
      ? 'Google'
      : provider ===
          'email'
        ? 'work email'
        : 'Microsoft';

  useEffect(() => {
    /*
     * This is deliberately short.
     * Authentication has already completed
     * before arriving here.
     */
    const timer =
      setTimeout(
        () => {
          router.replace({
            pathname:
              '/(tabs)/home',

            params: {
              name:
                params.name ??
                '',

              email:
                params.email ??
                '',

              provider,
            },
          });
        },
        450,
      );

    return () =>
      clearTimeout(
        timer,
      );
  }, [
    params.email,
    params.name,
    provider,
  ]);

  return (
    <View
      style={
        styles.container
      }
    >
      <StatusBar
        style="dark"
      />

      <View
        style={
          styles.brandMark
        }
      >
        <Ionicons
          name="paper-plane"
          size={32}
          color="#D6A23A"
        />
      </View>

      <Text
        style={
          styles.brand
        }
      >
        SKY AVENIR
      </Text>

      <Text
        style={
          styles.expense
        }
      >
        E X P E N S E
      </Text>

      <View
        style={
          styles.card
        }
      >
        <View
          style={
            styles.providerIcon
          }
        >
          <Ionicons
            name={
              provider ===
              'google'
                ? 'logo-google'
                : provider ===
                    'email'
                  ? 'mail-outline'
                  : 'logo-microsoft'
            }
            size={30}
            color="#0868AE"
          />
        </View>

        <Text
          style={
            styles.title
          }
        >
          Completing sign-in
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Your {providerLabel} account
          has been verified.
          {'\n'}
          Preparing your workspace.
        </Text>

        <ActivityIndicator
          size="small"
          color="#0868AE"
          style={
            styles.loader
          }
        />
      </View>

      <View
        style={
          styles.securityRow
        }
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={18}
          color="#16845B"
        />

        <Text
          style={
            styles.securityText
          }
        >
          Secure authentication
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      paddingHorizontal:
        28,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F4F8FB',
    },

    brandMark: {
      width:
        58,

      height:
        58,

      borderRadius:
        20,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#E8F3FA',
    },

    brand: {
      marginTop:
        16,

      fontSize:
        22,

      fontWeight:
        '700',

      letterSpacing:
        2,

      color:
        '#0A3558',
    },

    expense: {
      marginTop:
        4,

      fontSize:
        8.5,

      letterSpacing:
        4.5,

      color:
        '#7B91A3',
    },

    card: {
      width:
        '100%',

      marginTop:
        38,

      paddingHorizontal:
        24,

      paddingVertical:
        28,

      alignItems:
        'center',

      borderRadius:
        24,

      backgroundColor:
        '#FFFFFF',

      elevation:
        2,
    },

    providerIcon: {
      width:
        64,

      height:
        64,

      borderRadius:
        22,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#E8F3FA',
    },

    title: {
      marginTop:
        18,

      fontSize:
        21,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    subtitle: {
      marginTop:
        8,

      maxWidth:
        280,

      textAlign:
        'center',

      fontSize:
        13,

      lineHeight:
        19,

      color:
        '#71879A',
    },

    loader: {
      marginTop:
        20,
    },

    securityRow: {
      marginTop:
        22,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        7,
    },

    securityText: {
      fontSize:
        11,

      fontWeight:
        '600',

      color:
        '#5C788A',
    },
  });
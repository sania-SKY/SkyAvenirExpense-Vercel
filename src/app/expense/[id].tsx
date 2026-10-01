import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    Ionicons,
} from '@expo/vector-icons';

import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from 'expo-router';

import {
    ActivityIndicator,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    authenticatedFetch,
} from '../../../services/auth';

import {
    useReceipt,
} from '../../context/ReceiptContext';

import type {
    AttendeeType,
} from '../../context/ReceiptContext';

import {
    BLURRY_RECEIPT_MESSAGE,
    isBlurryReceiptError,
} from '../../utils/blur-detection';

type Expense = {
  id: string;

  category: string;

  business_purpose: string;

  comments:
    string | null;

  receipt_storage_key:
    string | null;

  status:
    string;

  external_reference:
    string | null;

  external_status:
    string | null;

  external_error:
    string | null;

  last_sync_at:
    string | null;

  submitted_at:
    string;

  created_at:
    string;

  updated_at:
    string;

  attendees:
    string[];

  attendee_details?:
    {
      name: string;
      attendeeType: AttendeeType;
    }[];
};

export default function ExpenseDetailsScreen() {
  const {
    startRetake,
  } = useReceipt();

  const params =
    useLocalSearchParams<{
      id?: string;
    }>();

  const expenseId =
    typeof params.id ===
    'string'
      ? params.id
      : '';

  const [
    expense,
    setExpense,
  ] = useState<Expense | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    receiptUri,
    setReceiptUri,
  ] = useState<
    string | null
  >(null);

  const [
    receiptLoading,
    setReceiptLoading,
  ] = useState(false);

  const [
    receiptError,
    setReceiptError,
  ] = useState<
    string | null
  >(null);

  /*
   * ------------------------------------------------
   * LOAD EXPENSE JSON
   * ------------------------------------------------
   */

  const loadExpense =
    useCallback(
      async () => {
        if (!expenseId) {
          setError(
            'Expense ID is missing.',
          );

          setLoading(
            false,
          );

          return;
        }

        try {
          setLoading(
            true,
          );

          setError(
            null,
          );

          const response =
            await authenticatedFetch(
              `/api/expenses/${expenseId}`,
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ??
                'Unable to load expense.',
            );
          }

          setExpense(
            data.expense,
          );
        } catch (error) {
          console.error(
            'Expense detail error:',
            error,
          );

          setError(
            error instanceof Error
              ? error.message
              : 'Unable to load expense.',
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        expenseId,
      ],
    );

  useFocusEffect(
    useCallback(
      () => {
        void loadExpense();
      },
      [
        loadExpense,
      ],
    ),
  );

  /*
   * ------------------------------------------------
   * LOAD PROTECTED RECEIPT
   * ------------------------------------------------
   *
   * Instead of asking <Image> itself to perform
   * authenticated HTTP, we fetch through our
   * authenticated API helper first.
   *
   * Response:
   * backend receipt bytes
   *      ↓
   * Blob
   *      ↓
   * Data URL
   *      ↓
   * React Native Image
   * ------------------------------------------------
   */

  useEffect(
    () => {
      if (
        !expense ||
        !expense.id ||
        !expense.receipt_storage_key
      ) {
        setReceiptUri(
          null,
        );

        return;
      }

      /*
       * Old development records stored a phone
       * file:/// URI. The backend cannot retrieve
       * those old phone-local files.
       */
      if (
        expense.receipt_storage_key.startsWith(
          'file:',
        ) ||
        expense.receipt_storage_key.includes(
          '://',
        )
      ) {
        setReceiptUri(
          null,
        );

        setReceiptError(
          'This receipt was created before server receipt storage was enabled.',
        );

        return;
      }

      let cancelled =
        false;

      async function loadReceipt() {
        try {
          setReceiptLoading(
            true,
          );

          setReceiptError(
            null,
          );

          setReceiptUri(
            null,
          );

          console.log(
            '[Receipt Detail] Fetching receipt:',
            expense?.id,
          );

          const response =
            await authenticatedFetch(
              `/api/expenses/${expense?.id}/receipt`,
            );

          if (!response.ok) {
            let message =
              `Unable to load receipt (${response.status}).`;

            try {
              const data =
                await response.json();

              if (
                typeof data?.message ===
                'string'
              ) {
                message =
                  data.message;
              }
            } catch {
              // Receipt error response was not JSON.
            }

            throw new Error(
              message,
            );
          }

          const blob =
            await response.blob();

          if (
            !blob ||
            blob.size === 0
          ) {
            throw new Error(
              'The receipt file returned by the server is empty.',
            );
          }

          const dataUri =
            await blobToDataUri(
              blob,
            );

          if (!cancelled) {
            setReceiptUri(
              dataUri,
            );

            console.log(
              '[Receipt Detail] Receipt loaded successfully.',
            );
          }
        } catch (error) {
          console.error(
            '[Receipt Detail] Receipt load error:',
            error,
          );

          if (!cancelled) {
            setReceiptUri(
              null,
            );

            setReceiptError(
              error instanceof Error
                ? error.message
                : 'Unable to load receipt.',
            );
          }
        } finally {
          if (!cancelled) {
            setReceiptLoading(
              false,
            );
          }
        }
      }

      void loadReceipt();

      return () => {
        cancelled =
          true;
      };
    },
    [
      expense?.id,
      expense?.receipt_storage_key,
    ],
  );

  /*
   * ------------------------------------------------
   * LOADING
   * ------------------------------------------------
   */

  if (loading) {
    return (
      <View
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
          color="#0868AE"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading expense...
        </Text>
      </View>
    );
  }

  /*
   * ------------------------------------------------
   * EXPENSE ERROR
   * ------------------------------------------------
   */

  if (
    error ||
    !expense
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Ionicons
          name="alert-circle-outline"
          size={44}
          color="#B23B34"
        />

        <Text
          style={
            styles.errorTitle
          }
        >
          Expense unavailable
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error ??
            'Expense not found.'}
        </Text>

        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const needsBlurRetake =
    (
      expense.status ===
        'FAILED' ||
      expense.status ===
        'REJECTED'
    ) &&
    isBlurryReceiptError(
      expense.external_error,
    );

  return (
    <View
      style={
        styles.container
      }
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* HEADER */}

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
            styles.headerButton
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
            styles.headerText
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Expense Details
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Submitted expense
          </Text>
        </View>

        <View
          style={
            styles.headerSpacer
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {needsBlurRetake && (
          <View
            style={
              styles.blurBanner
            }
          >
            <View
              style={
                styles.blurBannerHeader
              }
            >
              <Ionicons
                name="alert-circle"
                size={22}
                color="#A66A00"
              />

              <Text
                style={
                  styles.blurBannerTitle
                }
              >
                Blurry receipt
              </Text>
            </View>

            <Text
              style={
                styles.blurBannerText
              }
            >
              {expense.external_error ||
                BLURRY_RECEIPT_MESSAGE}
            </Text>

            <Pressable
              onPress={() => {
                startRetake({
                  expenseId:
                    expense.id,

                  category:
                    expense.category,

                  businessPurpose:
                    expense.business_purpose,

                  comments:
                    expense.comments ??
                    '',

                  attendees:
                    expense.attendee_details ??
                    expense.attendees.map(
                      (name) => ({
                        name,

                        attendeeType:
                          'WAVETRONIX_EMPLOYEE' as const,
                      }),
                    ),
                });

                router.replace(
                  '/expense/capture',
                );
              }}
              style={
                styles.retakeButton
              }
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.retakeButtonText
                }
              >
                Retake clear photo
              </Text>
            </Pressable>
          </View>
        )}

        {/* RECEIPT */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitle
            }
          >
            Receipt
          </Text>

          {receiptLoading ? (
            <View
              style={
                styles.receiptLoading
              }
            >
              <ActivityIndicator
                size="large"
                color="#0868AE"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading receipt...
              </Text>
            </View>
          ) : receiptUri ? (
            <Image
              source={{
                uri:
                  receiptUri,
              }}
              style={
                styles.receiptImage
              }
              resizeMode="contain"
            />
          ) : (
            <View
              style={
                styles.noReceipt
              }
            >
              <Ionicons
                name="receipt-outline"
                size={36}
                color="#8CA3B5"
              />

              <Text
                style={
                  styles.noReceiptTitle
                }
              >
                Receipt unavailable
              </Text>

              <Text
                style={
                  styles.noReceiptText
                }
              >
                {receiptError ??
                  'No receipt is attached to this expense.'}
              </Text>
            </View>
          )}
        </View>

        {/* EXPENSE INFO */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitle
            }
          >
            Expense Information
          </Text>

          <InfoRow
            label="Category"
            value={
              expense.category
            }
          />

          <InfoRow
            label="Business Purpose"
            value={
              expense.business_purpose
            }
          />

          <InfoRow
            label="Comments"
            value={
              expense.comments ||
              '—'
            }
          />

          <InfoRow
            label="Submitted At"
            value={
              formatDateTime(
                expense.submitted_at,
              )
            }
          />
        </View>

        {/* ATTENDEES */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitle
            }
          >
            Attendees
          </Text>

          {expense.attendees
            ?.length ? (
            expense.attendees.map(
              (
                attendee,
                index,
              ) => (
                <View
                  key={
                    `${attendee}-${index}`
                  }
                  style={
                    styles.attendee
                  }
                >
                  <Ionicons
                    name="person-outline"
                    size={17}
                    color="#0868AE"
                  />

                  <Text
                    style={
                      styles.attendeeText
                    }
                  >
                    {attendee}
                  </Text>
                </View>
              ),
            )
          ) : (
            <Text
              style={
                styles.muted
              }
            >
              No attendees
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/*
 * ------------------------------------------------
 * BLOB → IMAGE DATA URI
 * ------------------------------------------------
 */

function blobToDataUri(
  blob: Blob,
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const reader =
        new FileReader();

      reader.onloadend =
        () => {
          if (
            typeof reader.result ===
            'string'
          ) {
            resolve(
              reader.result,
            );

            return;
          }

          reject(
            new Error(
              'Unable to decode receipt image.',
            ),
          );
        };

      reader.onerror =
        () => {
          reject(
            new Error(
              'Unable to read receipt image.',
            ),
          );
        };

      reader.readAsDataURL(
        blob,
      );
    },
  );
}

function InfoRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <View
      style={
        styles.infoRow
      }
    >
      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        selectable
        style={
          styles.infoValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function formatDateTime(
  value:
    string,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date
    .toLocaleString();
}

const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        '#F4F8FB',
    },

    center: {
      flex:
        1,

      paddingHorizontal:
        30,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F4F8FB',
    },

    loadingText: {
      marginTop:
        12,

      fontSize:
        12,

      color:
        '#7890A3',
    },

    errorTitle: {
      marginTop:
        12,

      fontSize:
        19,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    errorText: {
      marginTop:
        7,

      textAlign:
        'center',

      color:
        '#B23B34',
    },

    backButton: {
      marginTop:
        20,

      paddingHorizontal:
        22,

      paddingVertical:
        11,

      borderRadius:
        16,

      backgroundColor:
        '#0868AE',
    },

    backButtonText: {
      fontWeight:
        '700',

      color:
        '#FFFFFF',
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

    headerButton: {
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

    headerText: {
      flex:
        1,

      alignItems:
        'center',
    },

    headerTitle: {
      fontSize:
        18.5,

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
      padding:
        18,

      paddingBottom:
        45,
    },

    blurBanner: {
      marginBottom:
        14,

      padding:
        16,

      borderRadius:
        20,

      backgroundColor:
        '#FFF4DD',

      borderWidth:
        1,

      borderColor:
        'rgba(166,106,0,0.22)',
    },

    blurBannerHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        8,
    },

    blurBannerTitle: {
      fontSize:
        15,

      fontWeight:
        '700',

      color:
        '#A66A00',
    },

    blurBannerText: {
      marginTop:
        8,

      fontSize:
        13,

      lineHeight:
        19,

      color:
        '#7A5608',
    },

    retakeButton: {
      marginTop:
        14,

      alignSelf:
        'flex-start',

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        8,

      paddingHorizontal:
        14,

      paddingVertical:
        11,

      borderRadius:
        14,

      backgroundColor:
        '#0868AE',
    },

    retakeButtonText: {
      fontSize:
        13.5,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },

    card: {
      marginBottom:
        14,

      padding:
        16,

      borderRadius:
        20,

      backgroundColor:
        '#FFFFFF',

      elevation:
        1,
    },

    cardHeadingRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    cardTitle: {
      fontSize:
        15,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    receiptAvailableBadge: {
      paddingHorizontal:
        9,

      paddingVertical:
        5,

      borderRadius:
        14,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        4,

      backgroundColor:
        '#E8F7EF',
    },

    receiptAvailableText: {
      fontSize:
        9.5,

      fontWeight:
        '700',

      color:
        '#16845B',
    },

    receiptLoading: {
      height:
        220,

      marginTop:
        14,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        16,

      backgroundColor:
        '#EDF3F7',
    },

    receiptImage: {
      width:
        '100%',

      height:
        380,

      marginTop:
        14,

      borderRadius:
        16,

      backgroundColor:
        '#EDF3F7',
    },

    noReceipt: {
      minHeight:
        160,

      marginTop:
        14,

      paddingHorizontal:
        20,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        16,

      backgroundColor:
        '#EDF3F7',
    },

    noReceiptTitle: {
      marginTop:
        9,

      fontSize:
        13,

      fontWeight:
        '700',

      color:
        '#365A73',
    },

    noReceiptText: {
      marginTop:
        5,

      textAlign:
        'center',

      fontSize:
        11,

      lineHeight:
        16,

      color:
        '#7890A3',
    },

    infoRow: {
      paddingVertical:
        11,

      borderBottomWidth:
        1,

      borderBottomColor:
        '#EDF2F5',
    },

    infoLabel: {
      fontSize:
        10,

      fontWeight:
        '700',

      color:
        '#8398A8',
    },

    infoValue: {
      marginTop:
        4,

      fontSize:
        12.5,

      lineHeight:
        18,

      color:
        '#254B69',
    },

    attendee: {
      marginTop:
        10,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        8,
    },

    attendeeText: {
      color:
        '#365A73',
    },

    muted: {
      marginTop:
        10,

      color:
        '#8CA0AF',
    },

    jsonHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    jsonBox: {
      marginTop:
        14,

      padding:
        13,

      borderRadius:
        14,

      backgroundColor:
        '#102B3E',
    },

    jsonText: {
      fontFamily:
        Platform.OS ===
        'ios'
          ? 'Menlo'
          : 'monospace',

      fontSize:
        11,

      lineHeight:
        16,

      color:
        '#EAF3F8',
    },
  });
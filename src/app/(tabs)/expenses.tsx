import {
  useCallback,
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
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  authenticatedFetch,
  getCurrentUser,
} from '../../../services/auth';

import {
  useReceipt,
} from '../../context/ReceiptContext';

type ExpenseStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED';

type Expense = {
  id: string;

  category: string;

  business_purpose: string;

  comments:
    string | null;

  receipt_storage_key:
    string | null;

  status:
    ExpenseStatus;

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
};

export default function ExpensesScreen() {
  const user =
    getCurrentUser();

  const params =
    useLocalSearchParams<{
      filter?:
        string;
    }>();

  const expenseFilter =
  params.filter === 'processed'
    ? 'processed'
    : params.filter === 'needs-review'
      ? 'needs-review'
      : 'all';

  const {
    beginNewExpense,
  } = useReceipt();

  /*
   * Capturing from the list always starts a fresh
   * expense, never a pending blurry retake.
   */
  function startExpenseCapture() {
    beginNewExpense();

    router.push(
      '/expense/capture',
    );
  }

  const [
    expenses,
    setExpenses,
  ] = useState<Expense[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  /*
   * ------------------------------------------------
   * LOAD REAL EXPENSES
   * ------------------------------------------------
   */

  const loadExpenses =
    useCallback(
      async (
        refresh = false,
      ) => {
        try {
          setErrorMessage(
            null,
          );

          if (refresh) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }

          const response =
            await authenticatedFetch(
              '/api/expenses/my',
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ??
                'Unable to load expenses.',
            );
          }

          setExpenses(
            Array.isArray(
              data.expenses,
            )
              ? data.expenses
              : [],
          );
        } catch (error) {
          console.error(
            'My Expenses load error:',
            error,
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load expenses.',
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [],
    );

  /*
   * Reload whenever this tab becomes active.
   *
   * This means:
   *
   * submit expense
   * → go back
   * → My Expenses refreshes automatically
   */

  useFocusEffect(
    useCallback(
      () => {
        void loadExpenses();
      },
      [
        loadExpenses,
      ],
    ),
  );

const visibleExpenses =
  expenseFilter === 'processed'
    ? expenses.filter(
        (expense) =>
          resolveDisplayStatus(
            expense,
          ) === 'Processed',
      )
    : expenseFilter ===
        'needs-review'
      ? expenses.filter(
          (expense) =>
            resolveDisplayStatus(
              expense,
            ) ===
            'Needs Review',
        )
      : expenses;

  return (
    <View
      style={
        styles.container
      }
    >
      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <Pressable
          onPress={() =>
            router.replace(
              '/(tabs)/home',
            )
          }
          style={
            styles.headerButton
          }
        >
          <Ionicons
            name="chevron-back"
            size={23}
            color="#0B3558"
          />
        </Pressable>

        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={
              styles.title
            }
          >
           {expenseFilter === 'processed'
  ? 'Processed'
  : expenseFilter ===
      'needs-review'
    ? 'Needs Review'
    : 'Submitted'}
          </Text>

          <Text
            style={
              styles.subtitle
            }
            numberOfLines={1}
          >
           {expenseFilter === 'processed'
  ? 'Receipts successfully processed'
  : expenseFilter ===
      'needs-review'
    ? 'Receipts that need attention'
    : user?.name
      ? `${user.name}'s submitted expenses`
      : 'All your submitted expenses'}
          </Text>
        </View>

        <Pressable
          onPress={
            startExpenseCapture
          }
          style={
            styles.addButton
          }
        >
          <Ionicons
            name="add"
            size={24}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      {/* CONTENT */}

      {loading ? (
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color="#0868AE"
          />

          <Text
            style={
              styles.stateText
            }
          >
            Loading expenses...
          </Text>
        </View>
      ) : errorMessage ? (
        <View
          style={
            styles.centerState
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color="#B23B34"
          />

          <Text
            style={
              styles.errorTitle
            }
          >
            Unable to load expenses
          </Text>

          <Text
            style={
              styles.errorText
            }
          >
            {errorMessage}
          </Text>

          <Pressable
            onPress={() =>
              void loadExpenses()
            }
            style={
              styles.retryButton
            }
          >
            <Text
              style={
                styles.retryText
              }
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : visibleExpenses.length ===
        0 ? (
        <View
          style={
            styles.centerState
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="receipt-outline"
              size={34}
              color="#0868AE"
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
           {expenseFilter === 'processed'
  ? 'No processed expenses'
  : expenseFilter ===
      'needs-review'
    ? 'Nothing needs review'
    : 'No submitted expenses'}
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {expenseFilter === 'processed'
  ? 'Processed receipts will appear here.'
  : expenseFilter ===
      'needs-review'
    ? 'Receipts that require attention will appear here.'
    : 'Capture and submit a receipt. It will appear here after the backend saves it.'}
          </Text>

          <Pressable
            onPress={
              startExpenseCapture
            }
            style={
              styles.captureButton
            }
          >
            <Ionicons
              name="camera-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.captureButtonText
              }
            >
              Capture Receipt
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                void loadExpenses(
                  true,
                )
              }
            />
          }
        >
          <View
            style={
              styles.summaryCard
            }
          >
            <Text
              style={
                styles.summaryCount
              }
            >
              {expenses.length}
            </Text>

            <View>
              <Text
                style={
                  styles.summaryTitle
                }
              >
                Expense Records
              </Text>

              <Text
                style={
                  styles.summarySubtitle
                }
              >
                Pull down to refresh
                integration status
              </Text>
            </View>
          </View>

          {visibleExpenses.map(
            (expense) => (
              <ExpenseCard
                key={
                  expense.id
                }
                expense={
                  expense
                }
              />
            ),
          )}
        </ScrollView>
      )}
    </View>
  );
}

/*
 * ------------------------------------------------
 * EXPENSE CARD
 * ------------------------------------------------
 */

function ExpenseCard({
  expense,
}: {
  expense:
    Expense;
}) {
  const displayStatus =
    resolveDisplayStatus(
      expense,
    );

  const theme =
    getStatusTheme(
      displayStatus,
    );

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname:
            '/expense/[id]',

          params: {
            id:
              expense.id,
          },
        })
      }
      style={({
        pressed,
      }) => [
        styles.expenseCard,

        pressed &&
          styles.expenseCardPressed,
      ]}
    >
      <View
        style={
          styles.expenseTop
        }
      >
        <View
          style={
            styles.categoryIcon
          }
        >
          <Ionicons
            name={
              getCategoryIcon(
                expense.category,
              )
            }
            size={22}
            color="#0868AE"
          />
        </View>

        <View
          style={
            styles.expenseMain
          }
        >
          <Text
            style={
              styles.category
            }
            numberOfLines={1}
          >
            {expense.category}
          </Text>

          <Text
            style={
              styles.purpose
            }
            numberOfLines={2}
          >
            {
              expense.business_purpose
            }
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,

            {
              backgroundColor:
                theme.background,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,

              {
                color:
                  theme.foreground,
              },
            ]}
          >
            {displayStatus}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.divider
        }
      />

      <View
        style={
          styles.metaRow
        }
      >
        <View
          style={
            styles.metaItem
          }
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color="#7890A3"
          />

          <Text
            style={
              styles.metaText
            }
          >
            {formatDate(
              expense.submitted_at ??
                expense.created_at,
            )}
          </Text>
        </View>

        {expense.attendees
          ?.length > 0 && (
          <View
            style={
              styles.metaItem
            }
          >
            <Ionicons
              name="people-outline"
              size={15}
              color="#7890A3"
            />

            <Text
              style={
                styles.metaText
              }
            >
              {
                expense.attendees
                  .length
              }{' '}
              attendee
              {expense.attendees
                .length === 1
                ? ''
                : 's'}
            </Text>
          </View>
        )}
      </View>

      {expense.external_status && (
        <View
          style={
            styles.externalRow
          }
        >
          <Ionicons
            name="sync-outline"
            size={15}
            color="#0868AE"
          />

          <Text
            style={
              styles.externalText
            }
          >
            External system:{' '}
            {
              expense.external_status
            }
          </Text>
        </View>
      )}

      {expense.external_reference && (
        <Text
          style={
            styles.referenceText
          }
        >
          Reference:{' '}
          {
            expense.external_reference
          }
        </Text>
      )}

      {expense.external_error && (
        <View
          style={
            styles.externalError
          }
        >
          <Ionicons
            name="warning-outline"
            size={16}
            color="#B23B34"
          />

          <Text
            style={
              styles.externalErrorText
            }
          >
            {
              expense.external_error
            }
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/*
 * ------------------------------------------------
 * STATUS
 * ------------------------------------------------
 */

function resolveDisplayStatus(
  expense:
    Expense,
) {
  const external =
    expense.external_status
      ?.trim()
      .toUpperCase();

  if (
    external ===
      'NEEDS_REVIEW' ||
    external ===
      'FAILED' ||
    external ===
      'REJECTED' ||
    external ===
      'ERROR'
  ) {
    return 'Needs Review';
  }

  if (
    expense.status ===
      'FAILED' ||
    expense.status ===
      'REJECTED'
  ) {
    return 'Needs Review';
  }

  /*
   * Any successfully submitted receipt that
   * does not need review is shown as Processed.
   *
   * "Submitted" is a summary/count only.
   */
  return 'Processed';
}

function getStatusTheme(
  status:
    string,
) {
  switch (status) {
    case 'Completed':
    case 'Processed':
      return {
        background:
          '#E8F7EF',

        foreground:
          '#17875D',
      };

    case 'Processing':
      return {
        background:
          '#E8F7EF',

        foreground:
          '#17875D',
      };

    case 'Needs Review':
      return {
        background:
          '#FDECEA',

        foreground:
          '#B23B34',
      };

    case 'Submitted':
    default:
      return {
        background:
          '#FFF4DD',

        foreground:
          '#A66A00',
      };
  }
}

/*
 * ------------------------------------------------
 * HELPERS
 * ------------------------------------------------
 */

function formatDate(
  value?:
    string,
) {
  if (!value) {
    return '';
  }

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
    .toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    );
}

function getCategoryIcon(
  category:
    string,
):
  keyof typeof Ionicons.glyphMap {
  const value =
    category
      .toLowerCase();

  if (
    value.includes(
      'lodg',
    ) ||
    value.includes(
      'hotel',
    )
  ) {
    return 'bed-outline';
  }

  if (
    value.includes(
      'meal',
    ) ||
    value.includes(
      'food',
    ) ||
    value.includes(
      'entertain',
    )
  ) {
    return 'restaurant-outline';
  }

  if (
    value.includes(
      'air',
    ) ||
    value.includes(
      'flight',
    )
  ) {
    return 'airplane-outline';
  }

  if (
    value.includes(
      'fuel',
    ) ||
    value.includes(
      'car',
    ) ||
    value.includes(
      'parking',
    ) ||
    value.includes(
      'ground',
    )
  ) {
    return 'car-outline';
  }

  return 'receipt-outline';
}

/*
 * ------------------------------------------------
 * STYLES
 * ------------------------------------------------
 */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        '#F4F8FB',
    },

    header: {
      paddingTop:
        52,

      paddingBottom:
        16,

      paddingHorizontal:
        18,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth:
        1,

      borderBottomColor:
        '#E5EDF3',

      backgroundColor:
        '#FFFFFF',
    },

    headerButton: {
      width: 44,

      height: 44,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        22,

      backgroundColor:
        '#EFF5F9',
    },

    headerText: {
      flex: 1,

      paddingHorizontal:
        12,
    },

    title: {
      fontSize: 21,

      fontWeight:
        '700',

      color:
        '#0B3558',
    },

    subtitle: {
      marginTop: 2,

      fontSize: 11,

      color:
        '#8196A6',
    },

    addButton: {
      width: 44,

      height: 44,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        22,

      backgroundColor:
        '#0868AE',
    },

    centerState: {
      flex: 1,

      paddingHorizontal:
        30,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    stateText: {
      marginTop: 12,

      fontSize: 13,

      color:
        '#7D92A3',
    },

    errorTitle: {
      marginTop: 13,

      fontSize: 18,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    errorText: {
      marginTop: 7,

      textAlign:
        'center',

      fontSize: 12.5,

      lineHeight: 18,

      color:
        '#B23B34',
    },

    retryButton: {
      marginTop: 18,

      paddingHorizontal:
        20,

      paddingVertical:
        10,

      borderRadius:
        16,

      backgroundColor:
        '#E7F2FA',
    },

    retryText: {
      fontSize: 12,

      fontWeight:
        '700',

      color:
        '#0868AE',
    },

    emptyIcon: {
      width: 70,

      height: 70,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        24,

      backgroundColor:
        '#E7F2FA',
    },

    emptyTitle: {
      marginTop: 16,

      fontSize: 19,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    emptyText: {
      marginTop: 7,

      maxWidth: 280,

      textAlign:
        'center',

      fontSize: 12.5,

      lineHeight: 19,

      color:
        '#8296A6',
    },

    captureButton: {
      marginTop: 22,

      paddingHorizontal:
        22,

      height: 52,

      flexDirection:
        'row',

      gap: 8,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        16,

      backgroundColor:
        '#0868AE',
    },

    captureButtonText: {
      fontSize: 14,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },

    listContent: {
      paddingHorizontal:
        18,

      paddingTop:
        18,

      paddingBottom:
        110,
    },

    summaryCard: {
      marginBottom:
        16,

      padding:
        17,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        13,

      borderRadius:
        20,

      backgroundColor:
        '#E8F3FA',
    },

    summaryCount: {
      fontSize:
        30,

      fontWeight:
        '700',

      color:
        '#0868AE',
    },

    summaryTitle: {
      fontSize:
        14,

      fontWeight:
        '700',

      color:
        '#173F60',
    },

    summarySubtitle: {
      marginTop:
        2,

      fontSize:
        10.5,

      color:
        '#6F8798',
    },

    expenseCard: {
      marginBottom:
        13,

      padding:
        15,

      borderRadius:
        20,

      backgroundColor:
        '#FFFFFF',

      elevation:
        1,
    },

    expenseCardPressed: {
      opacity:
        0.92,

      transform: [
        {
          scale:
            0.995,
        },
      ],
    },

    expenseTop: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',
    },

    categoryIcon: {
      width: 46,

      height: 46,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        15,

      backgroundColor:
        '#E7F2FA',
    },

    expenseMain: {
      flex: 1,

      marginLeft:
        11,

      paddingRight:
        8,
    },

    category: {
      fontSize:
        13.5,

      fontWeight:
        '700',

      color:
        '#183F60',
    },

    purpose: {
      marginTop:
        3,

      fontSize:
        11,

      lineHeight:
        16,

      color:
        '#6B8497',
    },

    statusBadge: {
      paddingHorizontal:
        9,

      paddingVertical:
        5,

      borderRadius:
        13,
    },

    statusText: {
      fontSize:
        9,

      fontWeight:
        '700',
    },

    divider: {
      height:
        1,

      marginVertical:
        12,

      backgroundColor:
        '#EDF2F5',
    },

    metaRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap:
        14,
    },

    metaItem: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        5,
    },

    metaText: {
      fontSize:
        10.5,

      color:
        '#7890A3',
    },

    externalRow: {
      marginTop:
        11,

      paddingTop:
        10,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        6,

      borderTopWidth:
        1,

      borderTopColor:
        '#EDF2F5',
    },

    externalText: {
      fontSize:
        10.5,

      fontWeight:
        '600',

      color:
        '#52738A',
    },

    referenceText: {
      marginTop:
        5,

      fontSize:
        9.5,

      color:
        '#8297A7',
    },

    externalError: {
      marginTop:
        10,

      padding:
        10,

      flexDirection:
        'row',

      gap:
        7,

      alignItems:
        'flex-start',

      borderRadius:
        12,

      backgroundColor:
        '#FDECEA',
    },

    externalErrorText: {
      flex:
        1,

      fontSize:
        10.5,

      lineHeight:
        15,

      color:
        '#9B3430',
    },
  });
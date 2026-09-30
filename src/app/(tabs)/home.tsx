import {
  Ionicons,
} from '@expo/vector-icons';

import {
  Link,
  router,
  useFocusEffect,
} from 'expo-router';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  authenticatedFetch,
} from '../../../services/auth';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  confirmAction,
} from '../../utils/confirm';

type ExpenseStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED';

type Expense = {
  id: string;

  category: string;

  business_purpose:
    string;

  comments:
    string | null;

  receipt_storage_key:
    string | null;

  status:
    ExpenseStatus;

  external_reference?:
    string | null;

  external_status?:
    string | null;

  external_error?:
    string | null;

  last_sync_at?:
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

type HomeStatus =
  | 'Submitted'
  | 'Processed'
  | 'Needs Review';

export default function HomeScreen() {
  const {
    user,
    status,
    signOutUser,
  } = useAuth();

  /*
   * ------------------------------------------------
   * SIGN OUT
   * ------------------------------------------------
   *
   * Clears the in-memory token and the stored
   * session, then the root layout guard sends the
   * user back to the login screen.
   * ------------------------------------------------
   */
  function confirmSignOut() {
    confirmAction({
      title:
        'Sign out',

      message:
        'You will need to sign in again to submit expenses.',

      confirmLabel:
        'Sign out',

      destructive:
        true,

      onConfirm:
        () => {
          void signOutUser();
        },
    });
  }

  const [
    expenses,
    setExpenses,
  ] =
    useState<Expense[]>([]);

  const [
    loadingExpenses,
    setLoadingExpenses,
  ] =
    useState(true);

  const [
    expenseError,
    setExpenseError,
  ] =
    useState<
      string | null
    >(null);

  /*
   * ------------------------------------------------
   * Load REAL expenses from PostgreSQL through
   * GET /api/expenses/my.
   *
   * useFocusEffect means Home reloads when the
   * employee returns after submitting an expense.
   * ------------------------------------------------
   */

  const loadExpenses =
    useCallback(
      async () => {
        try {
          setExpenseError(
            null,
          );

          setLoadingExpenses(
            true,
          );

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
            'Home expense loading error:',
            error,
          );

          setExpenseError(
            error instanceof Error
              ? error.message
              : 'Unable to load expenses.',
          );
        } finally {
          setLoadingExpenses(
            false,
          );
        }
      },
      [],
    );

  useFocusEffect(
    useCallback(
      () => {
        /*
         * Child effects run before the root layout's
         * redirect guard, so without this check a
         * signed-out visitor landing directly on
         * /home would fire one doomed request and
         * flash a session error before being sent to
         * the login screen.
         */
        if (
          status !==
          'authenticated'
        ) {
          return;
        }

        loadExpenses();
      },
      [
        loadExpenses,
        status,
      ],
    ),
  );

  /*
   * ------------------------------------------------
   * REAL STATUS COUNTS
   * ------------------------------------------------
   */

  const submitted =
    expenses.filter(
      (expense) =>
        expense.status ===
          'SUBMITTED' ||
        expense.status ===
          'COMPLETED',
    ).length;

  const processing =
    expenses.filter(
      (expense) =>
        expense.status ===
        'PROCESSING',
    ).length;

  const review =
    expenses.filter(
      (expense) =>
        expense.status ===
          'REJECTED' ||
        expense.status ===
          'FAILED',
    ).length;

  /*
   * ------------------------------------------------
   * Employee display
   * ------------------------------------------------
   */

  const firstName =
    getFirstName(
      user?.name,
      user?.email,
    );

  const dayName =
    new Date().toLocaleDateString(
      'en-US',
      {
        weekday:
          'long',
      },
    );

  const initials =
    getInitials(
      user?.name,
    );

  return (
    <View
      style={
        styles.container
      }
    >
      <StatusBar
        style="light"
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* PREMIUM HEADER */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerGlowOne
            }
          />

          <View
            style={
              styles.headerGlowTwo
            }
          />

          <View
            style={
              styles.headerTop
            }
          >
            <View
              style={
                styles.headerText
              }
            >
              <Text
                style={
                  styles.brandMini
                }
              >
                SKY AVENIR EXPENSE
              </Text>

              <Text
                style={
                  styles.greeting
                }
              >
                Happy {dayName},
              </Text>

              <Text
                style={
                  styles.employeeName
                }
                numberOfLines={
                  1
                }
              >
                {firstName}
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Let&apos;s take care of
                your expenses.
              </Text>
            </View>

            <View
              style={
                styles.headerActions
              }
            >
              <Pressable
                onPress={
                  confirmSignOut
                }
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                style={({
                  pressed,
                }) => [
                  styles.avatar,

                  pressed &&
                    styles.avatarPressed,
                ]}
              >
                <Text
                  style={
                    styles.avatarText
                  }
                >
                  {initials}
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  confirmSignOut
                }
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                style={({
                  pressed,
                }) => [
                  styles.signOutButton,

                  pressed &&
                    styles.signOutButtonPressed,
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={14}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.signOutText
                  }
                >
                  Sign out
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* CAPTURE RECEIPT */}

        <Pressable
          onPress={() =>
            router.push(
              '/expense/capture',
            )
          }
          style={({
            pressed,
          }) => [
            styles.captureCard,

            pressed &&
              styles.pressedCard,
          ]}
        >
          <View
            style={
              styles.captureIconOuter
            }
          >
            <View
              style={
                styles.captureIconInner
              }
            >
              <Ionicons
                name="camera"
                size={
                  31
                }
                color="#FFFFFF"
              />
            </View>
          </View>

          <View
            style={
              styles.captureContent
            }
          >
            <Text
              style={
                styles.captureTitle
              }
            >
              Capture Receipt
            </Text>

            <Text
              style={
                styles.captureDescription
              }
            >
              Take a photo or upload
              from gallery
            </Text>
          </View>

          <View
            style={
              styles.arrowCircle
            }
          >
            <Ionicons
              name="arrow-forward"
              size={
                20
              }
              color="#0767A7"
            />
          </View>
        </Pressable>

        {/* STATUS */}

        <View
          style={
            styles.statusRow
          }
        >
          <StatusCard
            value={
              submitted
            }
            label="Submitted"
            status="Submitted"
            icon="checkmark-circle-outline"
          />

          <StatusCard
            value={
              processing
            }
            label="Processed"
            status="Processed"
            icon="time-outline"
          />

          <StatusCard
            value={
              review
            }
            label="Needs Review"
            status="Needs Review"
            icon="alert-circle-outline"
            onPress={() =>
              router.push(
                '/(tabs)/expenses?filter=needs-review',
              )
            }
          />
        </View>

        {/* RECENT HEADER */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Recent Expenses
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Your latest submissions
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push(
                '/(tabs)/expenses',
              )
            }
          >
            <Text
              style={
                styles.viewAll
              }
            >
              View All
            </Text>
          </Pressable>
        </View>

        {/* REAL EXPENSE DATA */}

        <View
          style={
            styles.expenseCard
          }
        >
          {loadingExpenses ? (
            <View
              style={
                styles.stateContainer
              }
            >
              <ActivityIndicator
                size="small"
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
          ) : expenseError ? (
            <View
              style={
                styles.stateContainer
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={
                  24
                }
                color="#B23B34"
              />

              <Text
                style={
                  styles.errorText
                }
              >
                {expenseError}
              </Text>

              <Pressable
                onPress={
                  loadExpenses
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
          ) : expenses.length ===
            0 ? (
            <View
              style={
                styles.stateContainer
              }
            >
              <Ionicons
                name="receipt-outline"
                size={
                  27
                }
                color="#8DA2B3"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No expenses yet
              </Text>

              <Text
                style={
                  styles.stateText
                }
              >
                Your submitted
                expenses will appear
                here.
              </Text>
            </View>
          ) : (
            expenses
              .slice(
                0,
                4,
              )
              .map(
                (
                  expense,
                  index,
                ) => (
                  <ExpenseRow
                    key={
                      expense.id
                    }
                    expense={
                      expense
                    }
                    last={
                      index ===
                      Math.min(
                        expenses.length,
                        4,
                      ) -
                        1
                    }
                  />
                ),
              )
          )}
        </View>
      </ScrollView>

      {/* BOTTOM NAVIGATION */}

      <View
        style={
          styles.bottomNav
        }
      >
        <Pressable
          style={
            styles.navItem
          }
        >
          <Ionicons
            name="home"
            size={
              22
            }
            color="#0868AE"
          />

          <Text
            style={
              styles.navActive
            }
          >
            Home
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push(
              '/expense/capture',
            )
          }
          style={
            styles.mainCameraButton
          }
        >
          <Ionicons
            name="camera"
            size={
              28
            }
            color="#FFFFFF"
          />
        </Pressable>

        <Pressable
          onPress={() =>
            router.push(
              '/(tabs)/expenses',
            )
          }
          style={
            styles.navItem
          }
        >
          <Ionicons
            name="receipt-outline"
            size={
              22
            }
            color="#8DA2B3"
          />

          <Text
            style={
              styles.navInactive
            }
          >
            My Expenses
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/*
 * ------------------------------------------------
 * STATUS CARD
 * ------------------------------------------------
 */

type StatusCardProps = {
  value:
    number;

  label:
    string;

  status:
    HomeStatus;

  icon:
    keyof typeof Ionicons.glyphMap;

  onPress?:
    () => void;
};

function StatusCard({
  value,
  label,
  status,
  icon,
  onPress,
}: StatusCardProps) {
  const theme =
    status ===
    'Submitted'
      ? {
          /*
           * Submitted uses the previous
           * Processing yellow palette.
           */
          background:
            '#FFF4DD',

          foreground:
            '#A66A00',
        }
      : status ===
          'Processed'
        ? {
            /*
             * Processed uses the previous
             * Submitted green palette.
             */
            background:
              '#E8F7EF',

            foreground:
              '#17875D',
          }
        : {
            background:
              '#FDECEA',

            foreground:
              '#B23B34',
          };

  const content =
    (
      <>
        <Ionicons
          name={
            icon
          }
          size={
            18
          }
          color={
            theme.foreground
          }
        />

        <Text
          style={[
            styles.statusValue,

            {
              color:
                theme.foreground,
            },
          ]}
        >
          {value}
        </Text>

        <Text
          style={
            styles.statusLabel
          }
        >
          {label}
        </Text>
      </>
    );

  if (onPress) {
    return (
      <Pressable
        onPress={
          onPress
        }
        accessibilityRole="button"
        accessibilityLabel={`View ${label} expenses`}
        style={({
          pressed,
        }) => [
          styles.statusCard,

          {
            backgroundColor:
              theme.background,

            opacity:
              pressed
                ? 0.85
                : 1,
          },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.statusCard,

        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      {content}
    </View>
  );
}

/*
 * ------------------------------------------------
 * EXPENSE ROW
 * ------------------------------------------------
 */

type ExpenseRowProps = {
  expense:
    Expense;

  last:
    boolean;
};

function ExpenseRow({
  expense,
  last,
}: ExpenseRowProps) {
  const displayStatus =
    getStatusLabel(
      expense.status,
    );

  const statusTheme =
    expense.status ===
      'SUBMITTED'
      ? {
          /*
           * Match the Home status cards:
           * Submitted = yellow.
           */
          background:
            '#FFF4DD',

          foreground:
            '#A66A00',
        }
      : expense.status ===
            'PROCESSING' ||
          expense.status ===
            'COMPLETED'
        ? {
            /*
             * Processed / completed = green.
             */
            background:
              '#E8F7EF',

            foreground:
              '#17875D',
          }
        : {
            background:
              '#FDECEA',

            foreground:
              '#B23B34',
          };

  return (
    <Link
      href={{
        pathname:
          '/expense/[id]',

        params: {
          id:
            expense.id,
        },
      }}
      asChild
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${expense.category} expense`}
        style={({
          pressed,
        }) => [
          styles.expenseRow,

          !last &&
            styles.expenseDivider,

          pressed &&
            styles.expenseRowPressed,
        ]}
      >
        <View
          style={
            styles.expenseIcon
          }
        >
          <Ionicons
            name={
              getCategoryIcon(
                expense.category,
              )
            }
            size={
              22
            }
            color="#0868AE"
          />
        </View>

        <View
          style={
            styles.expenseInfo
          }
        >
          <Text
            numberOfLines={
              1
            }
            style={
              styles.expenseCategory
            }
          >
            {expense.category}
          </Text>

          <Text
            numberOfLines={
              1
            }
            style={
              styles.expensePurpose
            }
          >
            {
              expense.business_purpose
            }
          </Text>

          <Text
            style={
              styles.expenseDate
            }
          >
            {
              formatExpenseDate(
                expense.submitted_at ??
                  expense.created_at,
              )
            }
          </Text>
        </View>

        <View
          style={
            styles.expenseRight
          }
        >
          <View
            style={[
              styles.statusChip,

              {
                backgroundColor:
                  statusTheme.background,
              },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,

                {
                  color:
                    statusTheme.foreground,
                },
              ]}
            >
              {displayStatus}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

/*
 * ------------------------------------------------
 * HELPERS
 * ------------------------------------------------
 */

function getFirstName(
  name?: string,
  email?: string,
): string {
  const cleanName =
    name
      ?.trim();

  if (cleanName) {
    const parts =
      cleanName
        .split(
          /\s+/,
        )
        .filter(
          Boolean,
        );

    if (
      parts.length >
      0
    ) {
      return parts[0];
    }
  }

  const emailUsername =
    email
      ?.trim()
      .split(
        '@',
      )[0]
      ?.trim();

  if (
    emailUsername
  ) {
    return emailUsername;
  }

  return 'Employee';
}

function getInitials(
  name?: string,
) {
  if (!name) {
    return 'SA';
  }

  const parts =
    name
      .trim()
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      );

  if (
    parts.length ===
    0
  ) {
    return 'SA';
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[
      parts.length -
        1
    ][0]
  ).toUpperCase();
}

function getStatusLabel(
  status:
    ExpenseStatus,
) {
  switch (
    status
  ) {
    case 'SUBMITTED':
      return 'Submitted';

    case 'PROCESSING':
      return 'Processed';

    case 'COMPLETED':
      return 'Processed';

    case 'REJECTED':
      return 'Needs Review';

    case 'FAILED':
      return 'Needs Review';

    default:
      return status;
  }
}

function formatExpenseDate(
  value?: string,
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

  return date.toLocaleDateString(
    undefined,
    {
      month:
        'short',

      day:
        'numeric',

      year:
        'numeric',
    },
  );
}

function getCategoryIcon(
  category:
    string,
):
  keyof typeof Ionicons.glyphMap {
  const normalized =
    category
      .toLowerCase();

  if (
    normalized.includes(
      'lodg',
    ) ||
    normalized.includes(
      'hotel',
    )
  ) {
    return 'bed-outline';
  }

  if (
    normalized.includes(
      'meal',
    ) ||
    normalized.includes(
      'food',
    ) ||
    normalized.includes(
      'entertain',
    )
  ) {
    return 'restaurant-outline';
  }

  if (
    normalized.includes(
      'air',
    ) ||
    normalized.includes(
      'flight',
    )
  ) {
    return 'airplane-outline';
  }

  if (
    normalized.includes(
      'fuel',
    ) ||
    normalized.includes(
      'car',
    ) ||
    normalized.includes(
      'ground',
    ) ||
    normalized.includes(
      'parking',
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
      flex:
        1,

      backgroundColor:
        '#F4F8FB',
    },

    scrollContent: {
      paddingBottom:
        125,
    },

    header: {
      minHeight:
        230,

      paddingTop:
        55,

      paddingHorizontal:
        22,

      paddingBottom:
        48,

      overflow:
        'hidden',

      backgroundColor:
        '#06395E',
    },

    headerGlowOne: {
      position:
        'absolute',

      width:
        200,

      height:
        200,

      right:
        -70,

      top:
        -60,

      borderRadius:
        100,

      backgroundColor:
        'rgba(35,133,190,0.18)',
    },

    headerGlowTwo: {
      position:
        'absolute',

      width:
        170,

      height:
        170,

      left:
        -100,

      bottom:
        -100,

      borderRadius:
        85,

      backgroundColor:
        'rgba(255,255,255,0.05)',
    },

    headerTop: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',
    },

    headerText: {
      flex:
        1,
    },

    brandMini: {
      marginBottom:
        18,

      fontSize:
        9,

      fontWeight:
        '700',

      letterSpacing:
        2.6,

      color:
        'rgba(255,255,255,0.58)',
    },

    greeting: {
      fontSize:
        14,

      color:
        'rgba(255,255,255,0.78)',
    },

    employeeName: {
      marginTop:
        2,

      paddingRight:
        10,

      fontSize:
        27,

      lineHeight:
        33,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },

    subtitle: {
      marginTop:
        5,

      fontSize:
        13,

      color:
        'rgba(255,255,255,0.74)',
    },

    headerActions: {
      alignItems:
        'center',

      gap:
        8,
    },

    avatar: {
      width:
        48,

      height:
        48,

      borderRadius:
        24,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',

      borderWidth:
        3,

      borderColor:
        'rgba(255,255,255,0.20)',
    },

    avatarPressed: {
      opacity:
        0.75,
    },

    signOutButton: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        4,

      paddingVertical:
        5,

      paddingHorizontal:
        9,

      borderRadius:
        14,

      backgroundColor:
        'rgba(255,255,255,0.14)',

      borderWidth:
        1,

      borderColor:
        'rgba(255,255,255,0.22)',
    },

    signOutButtonPressed: {
      backgroundColor:
        'rgba(255,255,255,0.26)',
    },

    signOutText: {
      fontSize:
        11,

      fontWeight:
        '600',

      color:
        '#FFFFFF',
    },

    avatarText: {
      fontSize:
        14,

      fontWeight:
        '700',

      color:
        '#06395E',
    },

    captureCard: {
      marginTop:
        -40,

      marginHorizontal:
        20,

      minHeight:
        120,

      paddingHorizontal:
        17,

      paddingVertical:
        18,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderRadius:
        23,

      backgroundColor:
        '#FFFFFF',

      elevation:
        6,

      shadowColor:
        '#07304E',

      shadowOpacity:
        0.12,

      shadowRadius:
        17,

      shadowOffset: {
        width:
          0,

        height:
          8,
      },
    },

    pressedCard: {
      opacity:
        0.96,

      transform: [
        {
          scale:
            0.997,
        },
      ],
    },

    captureIconOuter: {
      width:
        72,

      height:
        72,

      borderRadius:
        36,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#E6F2FA',
    },

    captureIconInner: {
      width:
        54,

      height:
        54,

      borderRadius:
        27,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#0868AE',
    },

    captureContent: {
      flex:
        1,

      marginLeft:
        15,
    },

    captureTitle: {
      fontSize:
        20,

      fontWeight:
        '700',

      color:
        '#0B3558',
    },

    captureDescription: {
      marginTop:
        5,

      maxWidth:
        190,

      fontSize:
        12,

      lineHeight:
        17,

      color:
        '#71889B',
    },

    arrowCircle: {
      width:
        36,

      height:
        36,

      borderRadius:
        18,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#EEF6FB',
    },

    statusRow: {
      marginTop:
        18,

      paddingHorizontal:
        20,

      flexDirection:
        'row',

      gap:
        10,
    },

    statusCard: {
      flex:
        1,

      height:
        108,

      borderRadius:
        19,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    statusValue: {
      marginTop:
        3,

      fontSize:
        25,

      lineHeight:
        29,

      fontWeight:
        '700',
    },

    statusLabel: {
      marginTop:
        4,

      fontSize:
        10.5,

      lineHeight:
        14,

      textAlign:
        'center',

      fontWeight:
        '600',

      color:
        '#647B8D',
    },

    sectionHeader: {
      marginTop:
        29,

      paddingHorizontal:
        20,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    sectionTitle: {
      fontSize:
        19,

      fontWeight:
        '700',

      color:
        '#0B3558',
    },

    sectionSubtitle: {
      marginTop:
        3,

      fontSize:
        11,

      color:
        '#899CAB',
    },

    viewAll: {
      fontSize:
        12,

      fontWeight:
        '700',

      color:
        '#0868AE',
    },

    expenseCard: {
      marginTop:
        13,

      marginHorizontal:
        20,

      borderRadius:
        22,

      overflow:
        'hidden',

      backgroundColor:
        '#FFFFFF',

      elevation:
        1,
    },

    stateContainer: {
      minHeight:
        150,

      paddingHorizontal:
        25,

      paddingVertical:
        28,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    stateText: {
      marginTop:
        9,

      fontSize:
        11.5,

      lineHeight:
        17,

      textAlign:
        'center',

      color:
        '#8296A6',
    },

    emptyTitle: {
      marginTop:
        9,

      fontSize:
        14,

      fontWeight:
        '700',

      color:
        '#294F6D',
    },

    errorText: {
      marginTop:
        8,

      fontSize:
        11.5,

      lineHeight:
        17,

      textAlign:
        'center',

      color:
        '#B23B34',
    },

    retryButton: {
      marginTop:
        12,

      paddingHorizontal:
        15,

      paddingVertical:
        8,

      borderRadius:
        15,

      backgroundColor:
        '#EEF6FB',
    },

    retryText: {
      fontSize:
        11,

      fontWeight:
        '700',

      color:
        '#0868AE',
    },

    expenseRow: {
      minHeight:
        83,

      paddingHorizontal:
        13,

      paddingVertical:
        13,

      flexDirection:
        'row',

      alignItems:
        'center',

      width:
        '100%',
    },

    expenseRowPressed: {
      backgroundColor:
        '#F3F8FC',
    },

    expenseDivider: {
      borderBottomWidth:
        1,

      borderBottomColor:
        '#EDF2F5',
    },

    expenseIcon: {
      width:
        46,

      height:
        46,

      borderRadius:
        15,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#E8F3FA',

      flexShrink:
        0,
    },

    expenseInfo: {
      flex:
        1,

      marginLeft:
        11,

      paddingRight:
        8,

      minWidth:
        0,
    },

    expenseCategory: {
      fontSize:
        12.5,

      fontWeight:
        '700',

      color:
        '#183F60',
    },

    expensePurpose: {
      marginTop:
        2,

      fontSize:
        10.5,

      color:
        '#668095',
    },

    expenseDate: {
      marginTop:
        3,

      fontSize:
        9.5,

      color:
        '#94A6B4',
    },

    expenseRight: {
      alignItems:
        'flex-end',

      justifyContent:
        'center',

      flexShrink:
        0,
    },

    statusChip: {
      paddingHorizontal:
        8,

      paddingVertical:
        4,

      borderRadius:
        12,
    },

    statusChipText: {
      fontSize:
        8.5,

      fontWeight:
        '700',
    },

    bottomNav: {
      position:
        'absolute',

      left:
        0,

      right:
        0,

      bottom:
        0,

      height:
        82,

      paddingHorizontal:
        30,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-around',

      borderTopWidth:
        1,

      borderTopColor:
        '#E8EEF3',

      backgroundColor:
        '#FFFFFF',
    },

    navItem: {
      minWidth:
        82,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    navActive: {
      marginTop:
        4,

      fontSize:
        10,

      fontWeight:
        '700',

      color:
        '#0868AE',
    },

    navInactive: {
      marginTop:
        4,

      fontSize:
        10,

      fontWeight:
        '600',

      color:
        '#8DA2B3',
    },

    mainCameraButton: {
      width:
        64,

      height:
        64,

      marginTop:
        -38,

      borderRadius:
        32,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#0868AE',

      borderWidth:
        5,

      borderColor:
        '#FFFFFF',

      elevation:
        6,

      shadowColor:
        '#073C64',

      shadowOpacity:
        0.2,

      shadowRadius:
        10,
    },
  });
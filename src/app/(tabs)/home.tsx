import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    ExpenseStatus,
    MockExpense,
    mockExpenses,
} from '../../../data/mockExpenses';

export default function HomeScreen() {
  const submitted =
    mockExpenses.filter(
      (item) =>
        item.status === 'Submitted',
    ).length;

  const processing =
    mockExpenses.filter(
      (item) =>
        item.status === 'Processing',
    ).length;

  const review =
    mockExpenses.filter(
      (item) =>
        item.status === 'Needs Review',
    ).length;

  return (
    <View style={styles.container}>
      <StatusBar
        style="light"
        backgroundColor="#06395E"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* PREMIUM HEADER */}

        <View style={styles.header}>
          <View style={styles.headerGlowOne} />
          <View style={styles.headerGlowTwo} />

          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.brandMini}>
                SKY AVENIR EXPENSE
              </Text>

              <Text style={styles.greeting}>
                Good morning,
              </Text>

              <Text style={styles.employeeName}>
                Sky Avenir Employee
              </Text>

              <Text style={styles.subtitle}>
                Let's take care of your expenses.
              </Text>
            </View>

            <Pressable style={styles.avatar}>
              <Text style={styles.avatarText}>
                SA
              </Text>
            </Pressable>
          </View>
        </View>

        {/* CAPTURE RECEIPT */}

        <Pressable
          onPress={() =>
            router.push('/expense/capture')
          }
          style={({ pressed }) => [
            styles.captureCard,

            pressed &&
              styles.pressedCard,
          ]}
        >
          <View style={styles.captureIconOuter}>
            <View
              style={styles.captureIconInner}
            >
              <Ionicons
                name="camera"
                size={31}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.captureContent}>
            <Text style={styles.captureTitle}>
              Capture Receipt
            </Text>

            <Text style={styles.captureDescription}>
              Take a photo or upload from gallery
            </Text>
          </View>

          <View style={styles.arrowCircle}>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#0767A7"
            />
          </View>
        </Pressable>

        {/* STATUS */}

        <View style={styles.statusRow}>
          <StatusCard
            value={submitted}
            label="Submitted"
            status="Submitted"
            icon="checkmark-circle-outline"
          />

          <StatusCard
            value={processing}
            label="Processing"
            status="Processing"
            icon="time-outline"
          />

          <StatusCard
            value={review}
            label="Needs Review"
            status="Needs Review"
            icon="alert-circle-outline"
          />
        </View>

        {/* RECENT HEADER */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Recent Expenses
            </Text>

            <Text style={styles.sectionSubtitle}>
              Your latest submissions
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push('/(tabs)/expenses')
            }
          >
            <Text style={styles.viewAll}>
              View All
            </Text>
          </Pressable>
        </View>

        {/* RECENT EXPENSES */}

        <View style={styles.expenseCard}>
          {mockExpenses
            .slice(0, 4)
            .map((expense, index) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                last={
                  index ===
                  Math.min(
                    mockExpenses.length,
                    4,
                  ) -
                    1
                }
              />
            ))}
        </View>
      </ScrollView>

      {/* BOTTOM NAVIGATION */}

      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
        >
          <Ionicons
            name="home"
            size={22}
            color="#0868AE"
          />

          <Text style={styles.navActive}>
            Home
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push('/expense/capture')
          }
          style={styles.mainCameraButton}
        >
          <Ionicons
            name="camera"
            size={28}
            color="#FFFFFF"
          />
        </Pressable>

        <Pressable
          onPress={() =>
            router.push('/(tabs)/expenses')
          }
          style={styles.navItem}
        >
          <Ionicons
            name="receipt-outline"
            size={22}
            color="#8DA2B3"
          />

          <Text style={styles.navInactive}>
            My Expenses
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type StatusCardProps = {
  value: number;
  label: string;
  status: ExpenseStatus;
  icon:
    keyof typeof Ionicons.glyphMap;
};

function StatusCard({
  value,
  label,
  status,
  icon,
}: StatusCardProps) {
  const theme =
    status === 'Submitted'
      ? {
          background: '#E8F7EF',
          foreground: '#17875D',
        }
      : status === 'Processing'
        ? {
            background: '#FFF4DD',
            foreground: '#A66A00',
          }
        : {
            background: '#FDECEA',
            foreground: '#B23B34',
          };

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
      <Ionicons
        name={icon}
        size={18}
        color={theme.foreground}
      />

      <Text
        style={[
          styles.statusValue,
          {
            color: theme.foreground,
          },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.statusLabel}>
        {label}
      </Text>
    </View>
  );
}

type ExpenseRowProps = {
  expense: MockExpense;
  last: boolean;
};

function ExpenseRow({
  expense,
  last,
}: ExpenseRowProps) {
  const statusTheme =
    expense.status === 'Submitted'
      ? {
          background: '#E8F7EF',
          foreground: '#16845B',
        }
      : expense.status ===
          'Processing'
        ? {
            background: '#FFF4DD',
            foreground: '#A66A00',
          }
        : {
            background: '#FDECEA',
            foreground: '#B23B34',
          };

  return (
    <Pressable
      style={[
        styles.expenseRow,

        !last &&
          styles.expenseDivider,
      ]}
    >
      <View style={styles.expenseIcon}>
        <Ionicons
          name={expense.icon}
          size={22}
          color="#0868AE"
        />
      </View>

      <View style={styles.expenseInfo}>
        <Text
          numberOfLines={1}
          style={styles.expenseCategory}
        >
          {expense.category}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.expensePurpose}
        >
          {expense.businessPurpose}
        </Text>

        <Text style={styles.expenseDate}>
          {expense.date}
        </Text>
      </View>

      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>
          {expense.amount}
        </Text>

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
            {expense.status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F4F8FB',
    },

    scrollContent: {
      paddingBottom: 125,
    },

    header: {
      minHeight: 230,

      paddingTop: 55,
      paddingHorizontal: 22,
      paddingBottom: 48,

      overflow: 'hidden',

      backgroundColor: '#06395E',
    },

    headerGlowOne: {
      position: 'absolute',

      width: 200,
      height: 200,

      right: -70,
      top: -60,

      borderRadius: 100,

      backgroundColor:
        'rgba(35,133,190,0.18)',
    },

    headerGlowTwo: {
      position: 'absolute',

      width: 170,
      height: 170,

      left: -100,
      bottom: -100,

      borderRadius: 85,

      backgroundColor:
        'rgba(255,255,255,0.05)',
    },

    headerTop: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'flex-start',
    },

    headerText: {
      flex: 1,
    },

    brandMini: {
      marginBottom: 18,

      fontSize: 9,
      fontWeight: '700',

      letterSpacing: 2.6,

      color:
        'rgba(255,255,255,0.58)',
    },

    greeting: {
      fontSize: 14,

      color:
        'rgba(255,255,255,0.78)',
    },

    employeeName: {
      marginTop: 2,

      fontSize: 27,
      lineHeight: 33,

      fontWeight: '700',

      color: '#FFFFFF',
    },

    subtitle: {
      marginTop: 5,

      fontSize: 13,

      color:
        'rgba(255,255,255,0.74)',
    },

    avatar: {
      width: 48,
      height: 48,

      borderRadius: 24,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#FFFFFF',

      borderWidth: 3,
      borderColor:
        'rgba(255,255,255,0.20)',
    },

    avatarText: {
      fontSize: 14,
      fontWeight: '700',

      color: '#06395E',
    },

    captureCard: {
      marginTop: -40,
      marginHorizontal: 20,

      minHeight: 120,

      paddingHorizontal: 17,
      paddingVertical: 18,

      flexDirection: 'row',
      alignItems: 'center',

      borderRadius: 23,

      backgroundColor: '#FFFFFF',

      elevation: 6,

      shadowColor: '#07304E',
      shadowOpacity: 0.12,
      shadowRadius: 17,
      shadowOffset: {
        width: 0,
        height: 8,
      },
    },

    pressedCard: {
      opacity: 0.96,
      transform: [
        {
          scale: 0.997,
        },
      ],
    },

    captureIconOuter: {
      width: 72,
      height: 72,

      borderRadius: 36,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#E6F2FA',
    },

    captureIconInner: {
      width: 54,
      height: 54,

      borderRadius: 27,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#0868AE',
    },

    captureContent: {
      flex: 1,

      marginLeft: 15,
    },

    captureTitle: {
      fontSize: 20,
      fontWeight: '700',

      color: '#0B3558',
    },

    captureDescription: {
      marginTop: 5,

      maxWidth: 190,

      fontSize: 12,
      lineHeight: 17,

      color: '#71889B',
    },

    arrowCircle: {
      width: 36,
      height: 36,

      borderRadius: 18,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#EEF6FB',
    },

    statusRow: {
      marginTop: 18,

      paddingHorizontal: 20,

      flexDirection: 'row',

      gap: 10,
    },

    statusCard: {
      flex: 1,

      height: 108,

      borderRadius: 19,

      alignItems: 'center',
      justifyContent: 'center',
    },

    statusValue: {
      marginTop: 3,

      fontSize: 25,
      lineHeight: 29,

      fontWeight: '700',
    },

    statusLabel: {
      marginTop: 4,

      fontSize: 10.5,
      lineHeight: 14,

      textAlign: 'center',

      fontWeight: '600',

      color: '#647B8D',
    },

    sectionHeader: {
      marginTop: 29,

      paddingHorizontal: 20,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight: '700',

      color: '#0B3558',
    },

    sectionSubtitle: {
      marginTop: 3,

      fontSize: 11,

      color: '#899CAB',
    },

    viewAll: {
      fontSize: 12,
      fontWeight: '700',

      color: '#0868AE',
    },

    expenseCard: {
      marginTop: 13,
      marginHorizontal: 20,

      borderRadius: 22,

      overflow: 'hidden',

      backgroundColor: '#FFFFFF',

      elevation: 1,
    },

    expenseRow: {
      minHeight: 83,

      paddingHorizontal: 13,
      paddingVertical: 13,

      flexDirection: 'row',
      alignItems: 'center',
    },

    expenseDivider: {
      borderBottomWidth: 1,
      borderBottomColor: '#EDF2F5',
    },

    expenseIcon: {
      width: 46,
      height: 46,

      borderRadius: 15,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#E8F3FA',
    },

    expenseInfo: {
      flex: 1,

      marginLeft: 11,
      paddingRight: 5,
    },

    expenseCategory: {
      fontSize: 12.5,
      fontWeight: '700',

      color: '#183F60',
    },

    expensePurpose: {
      marginTop: 2,

      fontSize: 10.5,

      color: '#668095',
    },

    expenseDate: {
      marginTop: 3,

      fontSize: 9.5,

      color: '#94A6B4',
    },

    expenseRight: {
      alignItems: 'flex-end',
    },

    expenseAmount: {
      marginBottom: 6,

      fontSize: 12.5,
      fontWeight: '700',

      color: '#173D5D',
    },

    statusChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,

      borderRadius: 12,
    },

    statusChipText: {
      fontSize: 8.5,
      fontWeight: '700',
    },

    bottomNav: {
      position: 'absolute',

      left: 0,
      right: 0,
      bottom: 0,

      height: 82,

      paddingHorizontal: 30,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-around',

      borderTopWidth: 1,
      borderTopColor: '#E8EEF3',

      backgroundColor: '#FFFFFF',
    },

    navItem: {
      minWidth: 82,

      alignItems: 'center',
      justifyContent: 'center',
    },

    navActive: {
      marginTop: 4,

      fontSize: 10,
      fontWeight: '700',

      color: '#0868AE',
    },

    navInactive: {
      marginTop: 4,

      fontSize: 10,
      fontWeight: '600',

      color: '#8DA2B3',
    },

    mainCameraButton: {
      width: 64,
      height: 64,

      marginTop: -38,

      borderRadius: 32,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#0868AE',

      borderWidth: 5,
      borderColor: '#FFFFFF',

      elevation: 6,

      shadowColor: '#073C64',
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
  });
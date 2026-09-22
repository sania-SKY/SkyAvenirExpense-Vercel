import { useState } from 'react';

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

type Filter =
  | 'All'
  | ExpenseStatus;

export default function ExpensesScreen() {
  const [filter, setFilter] =
    useState<Filter>('All');

  const filteredExpenses =
    filter === 'All'
      ? mockExpenses
      : mockExpenses.filter(
          (expense) =>
            expense.status === filter,
        );

  return (
    <View style={styles.container}>
      <StatusBar
        style="dark"
        backgroundColor="#F4F8FB"
      />

      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#0A3558"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            My Expenses
          </Text>

          <Text style={styles.subtitle}>
            Track your submitted expenses
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* FILTERS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filters
          }
        >
          <FilterChip
            text="All"
            selected={filter === 'All'}
            onPress={() =>
              setFilter('All')
            }
          />

          <FilterChip
            text="Submitted"
            selected={
              filter === 'Submitted'
            }
            onPress={() =>
              setFilter('Submitted')
            }
          />

          <FilterChip
            text="Processing"
            selected={
              filter === 'Processing'
            }
            onPress={() =>
              setFilter('Processing')
            }
          />

          <FilterChip
            text="Needs Review"
            selected={
              filter === 'Needs Review'
            }
            onPress={() =>
              setFilter(
                'Needs Review',
              )
            }
          />
        </ScrollView>

        {/* SUMMARY */}

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>
              Showing
            </Text>

            <Text style={styles.summaryValue}>
              {filteredExpenses.length}
            </Text>
          </View>

          <View style={styles.summaryIcon}>
            <Ionicons
              name="receipt-outline"
              size={25}
              color="#0868AE"
            />
          </View>
        </View>

        {/* EXPENSES */}

        <View style={styles.list}>
          {filteredExpenses.map(
            (expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
              />
            ),
          )}
        </View>
      </ScrollView>
    </View>
  );
}

type FilterChipProps = {
  text: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({
  text,
  selected,
  onPress,
}: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,

        selected &&
          styles.filterChipSelected,
      ]}
    >
      <Text
        style={[
          styles.filterText,

          selected &&
            styles.filterTextSelected,
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

function ExpenseCard({
  expense,
}: {
  expense: MockExpense;
}) {
  const theme =
    expense.status === 'Submitted'
      ? {
          bg: '#E8F7EF',
          fg: '#17875D',
        }
      : expense.status ===
          'Processing'
        ? {
            bg: '#FFF4DD',
            fg: '#A66A00',
          }
        : {
            bg: '#FDECEA',
            fg: '#B23B34',
          };

  return (
    <Pressable style={styles.expenseCard}>
      <View style={styles.iconBox}>
        <Ionicons
          name={expense.icon}
          size={23}
          color="#0868AE"
        />
      </View>

      <View style={styles.expenseInfo}>
        <Text
          numberOfLines={2}
          style={styles.category}
        >
          {expense.category}
        </Text>

        <Text style={styles.purpose}>
          {expense.businessPurpose}
        </Text>

        <Text style={styles.date}>
          {expense.date}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>
          {expense.amount}
        </Text>

        <View
          style={[
            styles.status,
            {
              backgroundColor: theme.bg,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: theme.fg,
              },
            ]}
          >
            {expense.status}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={17}
          color="#A1B1BD"
          style={styles.chevron}
        />
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

    header: {
      paddingTop: 50,
      paddingHorizontal: 18,
      paddingBottom: 18,

      flexDirection: 'row',
      alignItems: 'center',

      backgroundColor: '#FFFFFF',

      borderBottomWidth: 1,
      borderBottomColor: '#E8EEF3',
    },

    backButton: {
      width: 44,
      height: 44,

      borderRadius: 22,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#EFF5F9',
    },

    headerText: {
      flex: 1,
      alignItems: 'center',
    },

    title: {
      fontSize: 19,
      fontWeight: '700',

      color: '#0A3558',
    },

    subtitle: {
      marginTop: 2,

      fontSize: 10.5,

      color: '#8498A8',
    },

    headerSpacer: {
      width: 44,
    },

    content: {
      paddingBottom: 35,
    },

    filters: {
      gap: 8,

      paddingHorizontal: 20,
      paddingVertical: 18,
    },

    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 9,

      borderRadius: 18,

      borderWidth: 1,
      borderColor: '#D6E2EA',

      backgroundColor: '#FFFFFF',
    },

    filterChipSelected: {
      borderColor: '#0868AE',

      backgroundColor: '#0868AE',
    },

    filterText: {
      fontSize: 11.5,
      fontWeight: '600',

      color: '#60798C',
    },

    filterTextSelected: {
      color: '#FFFFFF',
    },

    summaryCard: {
      marginHorizontal: 20,
      marginBottom: 16,

      paddingHorizontal: 18,
      paddingVertical: 16,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',

      borderRadius: 18,

      backgroundColor: '#E8F3FA',
    },

    summaryLabel: {
      fontSize: 11,

      color: '#6D8597',
    },

    summaryValue: {
      marginTop: 1,

      fontSize: 24,
      fontWeight: '700',

      color: '#0B436D',
    },

    summaryIcon: {
      width: 45,
      height: 45,

      borderRadius: 15,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#D6EAF6',
    },

    list: {
      paddingHorizontal: 20,

      gap: 11,
    },

    expenseCard: {
      minHeight: 110,

      padding: 14,

      flexDirection: 'row',
      alignItems: 'center',

      borderRadius: 20,

      backgroundColor: '#FFFFFF',

      elevation: 1,
    },

    iconBox: {
      width: 50,
      height: 50,

      borderRadius: 16,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#E8F3FA',
    },

    expenseInfo: {
      flex: 1,

      marginLeft: 12,
      paddingRight: 7,
    },

    category: {
      fontSize: 13,
      lineHeight: 17,

      fontWeight: '700',

      color: '#183F60',
    },

    purpose: {
      marginTop: 4,

      fontSize: 10.5,

      color: '#698195',
    },

    date: {
      marginTop: 4,

      fontSize: 9.5,

      color: '#94A6B4',
    },

    right: {
      alignItems: 'flex-end',
    },

    amount: {
      fontSize: 13,
      fontWeight: '700',

      color: '#183F60',
    },

    status: {
      marginTop: 7,

      paddingHorizontal: 8,
      paddingVertical: 4,

      borderRadius: 12,
    },

    statusText: {
      fontSize: 8.5,
      fontWeight: '700',
    },

    chevron: {
      marginTop: 8,
    },
  });
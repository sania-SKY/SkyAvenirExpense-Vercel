import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function HomeScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    email?: string;
  }>();

  const employeeName =
    typeof params.name === 'string'
      ? params.name
      : 'Sky Avenir Employee';

  const firstName =
    employeeName.split(' ')[0] || 'Employee';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              SKY AVENIR EXPENSE
            </Text>

            <Text style={styles.greeting}>
              Welcome, {firstName}
            </Text>

            <Text style={styles.subtitle}>
              Ready to submit an expense?
            </Text>
          </View>

          <View style={styles.profile}>
            <Ionicons
              name="person"
              size={24}
              color="#07518D"
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.captureCard,
            pressed && styles.capturePressed,
          ]}
          onPress={() => router.push('/expense/capture')}
        >
          <View style={styles.cameraCircle}>
            <Ionicons
              name="camera"
              size={34}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.captureText}>
            <Text style={styles.captureTitle}>
              Capture Receipt
            </Text>

            <Text style={styles.captureSubtitle}>
              Take a photo and submit your expense
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={25}
            color="#FFFFFF"
          />
        </Pressable>

        <Text style={styles.sectionTitle}>
          Your Expenses
        </Text>

        <View style={styles.statusRow}>
          <View style={styles.statusCard}>
            <Text style={styles.statusNumber}>0</Text>
            <Text style={styles.statusLabel}>
              Submitted
            </Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusNumber}>0</Text>
            <Text style={styles.statusLabel}>
              Processing
            </Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusNumber}>0</Text>
            <Text style={styles.statusLabel}>
              Review
            </Text>
          </View>
        </View>

        <View style={styles.emptyState}>
          <Ionicons
            name="receipt-outline"
            size={36}
            color="#8CA5BA"
          />

          <Text style={styles.emptyTitle}>
            No recent expenses
          </Text>

          <Text style={styles.emptyText}>
            Your submitted expenses will appear here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FC',
  },

  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.2,
    color: '#6D879E',
    fontWeight: '600',
  },

  greeting: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '700',
    color: '#062E56',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#678097',
  },

  profile: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E1EEF7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  captureCard: {
    marginTop: 30,
    minHeight: 116,
    borderRadius: 22,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0767AC',
  },

  capturePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },

  cameraCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.17)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  captureText: {
    flex: 1,
    marginLeft: 16,
  },

  captureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  captureSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
  },

  sectionTitle: {
    marginTop: 32,
    marginBottom: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#062E56',
  },

  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },

  statusCard: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  statusNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#07518D',
  },

  statusLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#70879A',
  },

  emptyState: {
    marginTop: 18,
    paddingVertical: 30,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#234A6A',
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12.5,
    color: '#8295A5',
  },
});
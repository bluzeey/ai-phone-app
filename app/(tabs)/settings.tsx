import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/appStore';
import { useRouter } from 'expo-router';
import { BorderRadius, Colors, Spacing } from '../../constants/colors';
import { getDatabase } from '../../services/database';

export default function Settings() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);
  const apiKey = process.env.EXPO_PUBLIC_UMANS_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.startsWith('sk-'));

  const handleClearData = useCallback(async () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all folders and notes. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM notes');
              await db.runAsync('DELETE FROM folders');
              useAppStore.setState({ folders: [], notes: [] });
              setCleared(true);
              setTimeout(() => setCleared(false), 2000);
            } catch (error) {
              Alert.alert('Error', 'Could not clear data.');
            }
          },
        },
      ]
    );
  }, []);

  const openUmans = useCallback(async () => {
    const url = 'https://app.umans.ai/billing';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Could not open the Umans dashboard.');
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Provider</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <MaterialIcons name="psychology" size={24} color={Colors.primary} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Umans Code</Text>
                <Text style={styles.rowSubtitle}>umans-coder</Text>
              </View>
              <View style={[styles.badge, isConfigured ? styles.badgeSuccess : styles.badgeWarning]}>
                <Text style={[styles.badgeText, isConfigured ? styles.badgeSuccessText : styles.badgeWarningText]}>
                  {isConfigured ? 'Ready' : 'Missing Key'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <MaterialIcons name="vpn-key" size={24} color={Colors.textSecondary} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>API Key</Text>
                <Text style={styles.rowSubtitle}>
                  {isConfigured ? 'Configured via .env' : 'Add EXPO_PUBLIC_UMANS_API_KEY to .env'}
                </Text>
              </View>
            </View>
          </View>

          {!isConfigured && (
            <Pressable onPress={openUmans} style={styles.hintButton}>
              <Text style={styles.hintText}>
                Get your API key from app.umans.ai/billing
              </Text>
              <MaterialIcons name="open-in-new" size={14} color={Colors.primary} />
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <Pressable onPress={handleClearData} style={styles.dangerRow}>
              <MaterialIcons name="delete-forever" size={24} color={Colors.danger} />
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, styles.dangerText]}>Clear All Data</Text>
                <Text style={styles.rowSubtitle}>Delete all folders and notes</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.danger} />
            </Pressable>
          </View>
          {cleared && (
            <Text style={styles.clearedText}>All data cleared</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <MaterialIcons name="info-outline" size={24} color={Colors.textSecondary} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Digital Notes</Text>
                <Text style={styles.rowSubtitle}>Version 1.0.0</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeSuccess: {
    backgroundColor: `${Colors.success}20`,
  },
  badgeWarning: {
    backgroundColor: `${Colors.warning}20`,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSuccessText: {
    color: Colors.success,
  },
  badgeWarningText: {
    color: Colors.warning,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 44,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  hintText: {
    fontSize: 13,
    color: Colors.primary,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  dangerText: {
    color: Colors.danger,
  },
  clearedText: {
    fontSize: 13,
    color: Colors.success,
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
  },
});

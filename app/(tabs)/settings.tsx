import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/appStore';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { BorderRadius, Colors, Spacing } from '../../constants/colors';
import { getDatabase, getFolders, getNotes, getCards } from '../../services/database';
import {
  shareExport,
  shareCardsCsv,
  importAllData,
} from '../../services/exportImport';
import {
  getStudyMode,
  setStudyMode,
  getStudyModeLabel,
  getStudyModeDescription,
  StudyMode,
  STUDY_MODES,
} from '../../services/studyPlan';

export default function Settings() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);
  const [studyMode, setStudyModeState] = useState<StudyMode>('normal');
  const [studyModalVisible, setStudyModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const apiKey = process.env.EXPO_PUBLIC_UMANS_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.startsWith('sk-'));

  useEffect(() => {
    getStudyMode().then(setStudyModeState);
  }, []);

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

  const handleSetStudyMode = useCallback(async (mode: StudyMode) => {
    await setStudyMode(mode);
    setStudyModeState(mode);
    setStudyModalVisible(false);
  }, []);

  const handleExportJson = useCallback(async () => {
    try {
      await shareExport();
    } catch (error) {
      // User cancelled share
    }
  }, []);

  const handleExportCsv = useCallback(async () => {
    try {
      await shareCardsCsv();
    } catch (error) {
      // User cancelled share
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      await importAllData(importText.trim());
      const [folders, notes, cards] = await Promise.all([
        getFolders(),
        getNotes(),
        getCards(),
      ]);
      useAppStore.setState({ folders, notes, cards });
      setImportText('');
      setImportModalVisible(false);
      Alert.alert('Import complete', 'Your backup has been restored.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not import backup.';
      Alert.alert('Import failed', message);
    } finally {
      setIsImporting(false);
    }
  }, [importText]);

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
          <Text style={styles.sectionTitle}>Data portability</Text>
          <View style={styles.card}>
            <Pressable onPress={handleExportJson} style={styles.row}>
              <MaterialIcons name="upload" size={24} color={Colors.primary} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Export backup</Text>
                <Text style={styles.rowSubtitle}>Share all notes and cards as JSON</Text>
              </View>
              <MaterialIcons name="share" size={20} color={Colors.textTertiary} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable onPress={handleExportCsv} style={styles.row}>
              <MaterialIcons name="description" size={24} color={Colors.primary} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Export CSV</Text>
                <Text style={styles.rowSubtitle}>Anki-compatible card list</Text>
              </View>
              <MaterialIcons name="share" size={20} color={Colors.textTertiary} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable onPress={() => setImportModalVisible(true)} style={styles.row}>
              <MaterialIcons name="download" size={24} color={Colors.primary} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Import backup</Text>
                <Text style={styles.rowSubtitle}>Restore from a JSON backup</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => setStudyModalVisible(true)}
              style={styles.row}
            >
              <MaterialIcons name="school" size={24} color={Colors.primary} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Study mode</Text>
                <Text style={styles.rowSubtitle}>{getStudyModeLabel(studyMode)}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textTertiary} />
            </Pressable>
          </View>
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

      <Modal
        visible={studyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStudyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Study mode</Text>
              <Pressable onPress={() => setStudyModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {STUDY_MODES.map((mode) => (
              <Pressable
                key={mode}
                onPress={() => handleSetStudyMode(mode)}
                style={styles.modeOption}
              >
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, studyMode === mode && styles.activeModeText]}>
                    {getStudyModeLabel(mode)}
                  </Text>
                  <Text style={styles.rowSubtitle}>{getStudyModeDescription(mode)}</Text>
                </View>
                {studyMode === mode && (
                  <MaterialIcons name="check" size={20} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={importModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setImportModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import backup</Text>
              <Pressable onPress={() => setImportModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.importHint}>
              Paste your JSON backup below. This will replace all current data.
            </Text>

            <TextInput
              value={importText}
              onChangeText={setImportText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              placeholder='{"version":1,...}'
              placeholderTextColor={Colors.textTertiary}
              style={styles.importInput}
            />

            <Button
              title={isImporting ? 'Importing...' : 'Import'}
              onPress={handleImport}
              loading={isImporting}
              disabled={!importText.trim() || isImporting}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  activeModeText: {
    color: Colors.primary,
  },
  importHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  importInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 160,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
});

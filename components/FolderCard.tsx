import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Folder } from '../types';
import { BorderRadius, Colors, Spacing } from '../constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

interface FolderCardProps {
  folder: Folder;
  noteCount: number;
  onPress: (folder: Folder) => void;
  onLongPress?: (folder: Folder) => void;
}

export function FolderCard({ folder, noteCount, onPress, onLongPress }: FolderCardProps) {
  return (
    <Pressable
      onPress={() => onPress(folder)}
      onLongPress={onLongPress ? () => onLongPress(folder) : undefined}
      style={styles.container}
    >
      <View style={[styles.iconContainer, { backgroundColor: folder.color }]}>
        <MaterialIcons name="folder" size={28} color={Colors.surface} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {folder.name}
        </Text>
        {folder.topic ? (
          <Text style={styles.topic} numberOfLines={1}>
            {folder.topic}
          </Text>
        ) : null}
        <Text style={styles.count}>
          {noteCount} {noteCount === 1 ? 'note' : 'notes'}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  topic: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  count: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});

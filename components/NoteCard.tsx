import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Note } from '../types';
import { BorderRadius, Colors, Spacing } from '../constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onLongPress?: (note: Note) => void;
}

export function NoteCard({ note, onPress, onLongPress }: NoteCardProps) {
  return (
    <Pressable
      onPress={() => onPress(note)}
      onLongPress={onLongPress ? () => onLongPress(note) : undefined}
      style={styles.container}
    >
      {note.imageUri ? (
        <Image
          source={{ uri: note.imageUri }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      ) : null}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          {note.isFavorite && (
            <MaterialIcons name="star" size={16} color={Colors.warning} />
          )}
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {note.body || note.extractedText}
        </Text>
        <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>
      </View>
    </Pressable>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});

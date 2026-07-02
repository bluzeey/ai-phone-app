import { View, Pressable, StyleSheet } from 'react-native';
import { FolderColors, BorderRadius, Spacing } from '../../constants/colors';

interface ColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  return (
    <View style={styles.container}>
      {FolderColors.map((color) => (
        <Pressable
          key={color}
          onPress={() => onSelect(color)}
          style={[
            styles.swatch,
            { backgroundColor: color },
            selected === color && styles.selected,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#000',
  },
});

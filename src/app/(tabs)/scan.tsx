import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface UploadOption {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

// Camera capture, gallery/PDF picking, and upload-to-storage are built in
// Phase 3. This screen is the real navigational home for "Scan" from day
// one, but each option is honest about not being wired up yet rather than
// pretending to work.
const UPLOAD_OPTIONS: UploadOption[] = [
  { icon: 'camera', label: 'Take a photo' },
  { icon: 'image', label: 'Choose from gallery' },
  { icon: 'document', label: 'Upload a PDF' },
];

export default function ScanScreen() {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Scan a document
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Document capture and OCR arrive in a later phase of this build.
      </ThemedText>

      <View style={styles.options}>
        {UPLOAD_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            onPress={() => Alert.alert(option.label, 'Coming in Phase 3 — document upload.')}>
            <Card style={styles.optionCard}>
              <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name={option.icon} size={22} color={theme.text} />
              </View>
              <ThemedText>{option.label}</ThemedText>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 32, marginTop: Spacing.two },
  options: { gap: Spacing.two },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

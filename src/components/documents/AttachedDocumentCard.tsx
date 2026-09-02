import { FileText } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DocumentRow } from '@/types/database';
import { formatFileSize } from '@/utils/file';

interface AttachedDocumentCardProps {
  document: DocumentRow;
  onPress?: () => void;
}

export function AttachedDocumentCard({ document, onPress }: AttachedDocumentCardProps) {
  const theme = useTheme();

  const content = (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
        <FileText size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.info}>
        <ThemedText type="small" themeColor="textSecondary">
          Attached document
        </ThemedText>
        <ThemedText numberOfLines={1}>{document.file_name}</ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {formatFileSize(document.file_size)}
        </ThemedText>
      </View>
    </Card>
  );

  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
});

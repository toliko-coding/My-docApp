import { FileText } from 'lucide-react-native';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PickedFile } from '@/utils/file';
import { formatFileSize } from '@/utils/file';

export function DocumentPreview({ file }: { file: PickedFile }) {
  const theme = useTheme();
  const isImage = file.mimeType.startsWith('image/');

  return (
    <Card style={styles.card}>
      {isImage ? (
        <Image source={{ uri: file.uri }} style={styles.thumbnail} contentFit="cover" />
      ) : (
        <View style={[styles.thumbnail, styles.pdfIcon, { backgroundColor: theme.backgroundElement }]}>
          <FileText size={32} color={theme.textSecondary} />
        </View>
      )}
      <View style={styles.info}>
        <ThemedText numberOfLines={1}>{file.fileName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatFileSize(file.fileSize)}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbnail: { width: 64, height: 64, borderRadius: Radii.md },
  pdfIcon: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, gap: 4 },
});

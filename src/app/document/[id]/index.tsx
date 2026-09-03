import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDeleteDocument, useDocument, useDocumentSignedUrl } from '@/hooks/use-documents';
import { formatFileSize } from '@/utils/file';

export default function DocumentViewerScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: document, isLoading, isError } = useDocument(id);
  const { data: signedUrl } = useDocumentSignedUrl(document?.storage_path);
  const deleteDocument = useDeleteDocument();
  const [isSharing, setIsSharing] = useState(false);

  if (isLoading || !document) {
    return (
      <ScreenContainer>
        {isError ? <ErrorState /> : <ActivityIndicator style={styles.loading} />}
      </ScreenContainer>
    );
  }

  const isImage = document.mime_type.startsWith('image/');

  async function handleShare() {
    if (!signedUrl || !document) return;
    setIsSharing(true);
    try {
      const localUri = `${FileSystem.cacheDirectory}${document.file_name}`;
      await FileSystem.downloadAsync(signedUrl, localUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri);
      } else {
        Alert.alert('Sharing unavailable', 'This device does not support sharing files.');
      }
    } catch {
      Alert.alert('Could not share document', 'Please try again.');
    } finally {
      setIsSharing(false);
    }
  }

  function handleOpenPdf() {
    if (!signedUrl) return;
    WebBrowser.openBrowserAsync(signedUrl);
  }

  function handleDelete() {
    if (!document) return;
    Alert.alert('Delete document', 'This removes the original file. Bills referencing it keep their other data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDocument.mutateAsync(document);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScreenContainer scroll>
      {isImage ? (
        signedUrl ? (
          <Image source={{ uri: signedUrl }} style={styles.imagePreview} contentFit="contain" />
        ) : (
          <ActivityIndicator style={styles.loading} />
        )
      ) : (
        <Card style={styles.pdfCard}>
          <View style={[styles.pdfIcon, { backgroundColor: theme.backgroundElement }]}>
            <FileText size={32} color={theme.textSecondary} />
          </View>
          <Button label="Open PDF" onPress={handleOpenPdf} disabled={!signedUrl} />
        </Card>
      )}

      <Card style={styles.infoCard}>
        <ThemedText numberOfLines={1}>{document.file_name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatFileSize(document.file_size)}
        </ThemedText>
      </Card>

      <View style={styles.actions}>
        <Button label="Share / Download" variant="secondary" onPress={handleShare} loading={isSharing} disabled={!signedUrl} />
        <Button label="Delete" variant="ghost" onPress={handleDelete} loading={deleteDocument.isPending} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing.six },
  imagePreview: { width: '100%', aspectRatio: 3 / 4, borderRadius: Radii.lg },
  pdfCard: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five },
  pdfIcon: {
    width: 72,
    height: 72,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: { gap: 4 },
  actions: { gap: Spacing.two },
});

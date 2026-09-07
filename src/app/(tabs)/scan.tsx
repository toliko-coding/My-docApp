import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUploadDocument } from '@/hooks/use-documents';
import { useTranslation } from '@/i18n';
import type { DocumentSource } from '@/types/database';
import { FileValidationError, guessMimeTypeFromUri, type PickedFile } from '@/utils/file';

async function normalizeAsset(
  uri: string,
  fileName: string,
  mimeTypeHint: string | null | undefined,
  fileSizeHint: number | null | undefined,
  source: DocumentSource,
): Promise<PickedFile> {
  let fileSize = fileSizeHint ?? undefined;
  if (fileSize == null) {
    const info = await FileSystem.getInfoAsync(uri);
    fileSize = info.exists ? (info.size ?? 0) : 0;
  }
  return { uri, fileName, mimeType: mimeTypeHint ?? guessMimeTypeFromUri(uri), fileSize, source };
}

export default function ScanScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { action } = useLocalSearchParams<{ action?: string }>();
  const uploadDocument = useUploadDocument();
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('scan.cameraAccessTitle'), t('scan.cameraAccessMessage'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPickedFile(
      await normalizeAsset(asset.uri, asset.fileName ?? `photo-${Date.now()}.jpg`, asset.mimeType, asset.fileSize, 'camera'),
    );
  }

  async function handlePickGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('scan.photoAccessTitle'), t('scan.photoAccessMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? `image-${Date.now()}.jpg`;
    setPickedFile(await normalizeAsset(asset.uri, fileName, asset.mimeType, asset.fileSize, 'gallery'));
  }

  async function handlePickPdf() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPickedFile(await normalizeAsset(asset.uri, asset.name, asset.mimeType ?? 'application/pdf', asset.size, 'pdf'));
  }

  // Unified "Upload" entry point (the Bills tab's + menu) — the system file
  // picker itself lets the user browse photos or PDFs from one place, so
  // there's no need to ask gallery-vs-PDF as a separate app-level step.
  async function handlePickAnyFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? guessMimeTypeFromUri(asset.uri);
    const source: DocumentSource = mimeType === 'application/pdf' ? 'pdf' : 'gallery';
    setPickedFile(await normalizeAsset(asset.uri, asset.name, mimeType, asset.size, source));
  }

  // Reached from the Bills tab's "+" menu, which skips this screen's own
  // picker grid and jumps straight to the requested picker.
  const triggeredActionRef = useRef(false);
  useEffect(() => {
    if (triggeredActionRef.current || !action) return;
    triggeredActionRef.current = true;
    (async () => {
      if (action === 'camera') await handleTakePhoto();
      else if (action === 'upload') await handlePickAnyFile();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const options: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => Promise<void> }[] = [
    { icon: 'camera', label: t('scan.takePhoto'), onPress: handleTakePhoto },
    { icon: 'image', label: t('scan.chooseFromGallery'), onPress: handlePickGallery },
    { icon: 'document', label: t('scan.uploadPdf'), onPress: handlePickPdf },
  ];

  async function handleConfirmUpload() {
    if (!pickedFile) return;
    try {
      const { document, isDuplicate } = await uploadDocument.mutateAsync(pickedFile);
      setPickedFile(null);
      if (isDuplicate) {
        Alert.alert(t('scan.duplicateTitle'), t('scan.duplicateMessage'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.continue'),
            onPress: () => router.push(`/document/${document.id}/review`),
          },
        ]);
        return;
      }
      router.push(`/document/${document.id}/review`);
    } catch (error) {
      console.error('Document upload failed', error);
      const message = error instanceof FileValidationError ? error.message : t('scan.uploadFailedMessage');
      Alert.alert(t('scan.uploadFailedTitle'), message);
    }
  }

  if (pickedFile) {
    return (
      <ScreenContainer>
        <ThemedText type="title" style={styles.title}>
          {t('scan.reviewTitle')}
        </ThemedText>
        <DocumentPreview file={pickedFile} />
        <View style={styles.previewActions}>
          <Button label={t('scan.useThisDocument')} onPress={handleConfirmUpload} loading={uploadDocument.isPending} />
          <Button
            label={t('scan.chooseDifferentFile')}
            variant="ghost"
            onPress={() => setPickedFile(null)}
            disabled={uploadDocument.isPending}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {t('scan.title')}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{t('scan.subtitle')}</ThemedText>

      <View style={styles.options}>
        {options.map((option) => (
          <Pressable key={option.label} accessibilityRole="button" onPress={option.onPress}>
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
  previewActions: { gap: Spacing.two, marginTop: Spacing.two },
});

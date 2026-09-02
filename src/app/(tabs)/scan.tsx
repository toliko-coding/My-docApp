import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUploadDocument } from '@/hooks/use-documents';
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
  const uploadDocument = useUploadDocument();
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Enable camera access in Settings to scan a document.');
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
      Alert.alert('Photo access needed', 'Enable photo library access in Settings to attach an image.');
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

  const options: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => Promise<void> }[] = [
    { icon: 'camera', label: 'Take a photo', onPress: handleTakePhoto },
    { icon: 'image', label: 'Choose from gallery', onPress: handlePickGallery },
    { icon: 'document', label: 'Upload a PDF', onPress: handlePickPdf },
  ];

  async function handleConfirmUpload() {
    if (!pickedFile) return;
    try {
      const { document, isDuplicate } = await uploadDocument.mutateAsync(pickedFile);
      setPickedFile(null);
      if (isDuplicate) {
        Alert.alert(
          'This document may already exist',
          "A file with identical content was already uploaded. You can still attach it to a bill, or cancel and pick a different file.",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: () => router.push({ pathname: '/bill/new', params: { documentId: document.id } }),
            },
          ],
        );
        return;
      }
      router.push({ pathname: '/bill/new', params: { documentId: document.id } });
    } catch (error) {
      console.error('Document upload failed', error);
      const message =
        error instanceof FileValidationError ? error.message : 'Could not upload this document. Please try again.';
      Alert.alert('Upload failed', message);
    }
  }

  if (pickedFile) {
    return (
      <ScreenContainer>
        <ThemedText type="title" style={styles.title}>
          Review document
        </ThemedText>
        <DocumentPreview file={pickedFile} />
        <View style={styles.previewActions}>
          <Button label="Use this document" onPress={handleConfirmUpload} loading={uploadDocument.isPending} />
          <Button
            label="Choose a different file"
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
        Scan a document
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Add a bill or receipt from your camera, photos, or a PDF file.
      </ThemedText>

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

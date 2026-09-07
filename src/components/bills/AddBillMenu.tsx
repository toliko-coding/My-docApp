import { Camera, PenLine, Upload } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

interface AddBillMenuProps {
  visible: boolean;
  onClose: () => void;
  onScan: () => void;
  onUpload: () => void;
  onManual: () => void;
}

/** Bottom sheet opened by the Bills tab's "+" button — pick how a bill gets added. */
export function AddBillMenu({ visible, onClose, onScan, onUpload, onManual }: AddBillMenuProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const options: { icon: ComponentType<{ size?: number; color?: string }>; label: string; onPress: () => void }[] = [
    { icon: Camera, label: t('bills.addBillScan'), onPress: onScan },
    { icon: Upload, label: t('bills.addBillUpload'), onPress: onUpload },
    { icon: PenLine, label: t('bills.addBillManual'), onPress: onManual },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} accessibilityRole="button" onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
                style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
                  <Icon size={20} color={theme.text} />
                </View>
                <ThemedText>{option.label}</ThemedText>
              </Pressable>
            );
          })}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelRow}>
            <ThemedText themeColor="textSecondary">{t('common.cancel')}</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelRow: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
});

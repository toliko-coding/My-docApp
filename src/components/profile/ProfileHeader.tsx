import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

interface ProfileHeaderProps {
  email: string;
  fullName: string | null;
  onSaveName: (name: string) => void;
  isSaving?: boolean;
}

function initialsFor(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return email[0]?.toUpperCase() ?? '?';
}

export function ProfileHeader({ email, fullName, onSaveName, isSaving }: ProfileHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [draftName, setDraftName] = useState(fullName ?? '');
  const isDirty = draftName.trim() !== (fullName ?? '').trim();

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={[styles.avatarText, { color: theme.primaryText }]}>
            {initialsFor(fullName, email)}
          </ThemedText>
        </View>
        <View style={styles.identity}>
          <ThemedText numberOfLines={1}>{fullName?.trim() || email}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {email}
          </ThemedText>
        </View>
      </View>

      <View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {t('profile.displayName')}
        </ThemedText>
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <TextField
              value={draftName}
              onChangeText={setDraftName}
              placeholder={t('profile.displayNamePlaceholder')}
              autoCorrect={false}
            />
          </View>
          {isDirty ? (
            <Button
              label={t('common.save')}
              variant="secondary"
              loading={isSaving}
              onPress={() => onSaveName(draftName.trim())}
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  identity: { flex: 1, minWidth: 0, gap: 2 },
  label: { marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  nameField: { flex: 1 },
});

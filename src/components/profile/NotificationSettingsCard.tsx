import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useBills } from '@/hooks/use-bills';
import { useNotificationPermission } from '@/hooks/use-notification-permission';
import { useTheme } from '@/hooks/use-theme';
import { useUpdateUserSettings, useUserSettings } from '@/hooks/use-user-settings';
import { resyncAllReminders } from '@/services/bill-reminders';

const REMINDER_OPTIONS: { days: number; label: string }[] = [
  { days: 7, label: '7 days before' },
  { days: 3, label: '3 days before' },
  { days: 1, label: '1 day before' },
  { days: 0, label: 'On due date' },
];

export function NotificationSettingsCard() {
  const theme = useTheme();
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  const { data: bills } = useBills();
  const updateSettings = useUpdateUserSettings();
  const { granted, available, request } = useNotificationPermission();

  if (!settings) return null;

  const isDisabled = available === false;

  async function resync(notificationsEnabled: boolean, reminderDaysBefore: number[]) {
    if (!user || !bills) return;
    await resyncAllReminders(user.id, bills, notificationsEnabled, reminderDaysBefore);
  }

  async function handleToggle(value: boolean) {
    if (!settings) return;
    if (value && granted === false) {
      const result = await request();
      if (!result) {
        Alert.alert(
          'Notifications blocked',
          'Enable notifications for DocApp in your device Settings to get payment reminders.',
        );
        return;
      }
    }
    await updateSettings.mutateAsync({ notifications_enabled: value });
    await resync(value, settings.reminder_days_before);
  }

  async function toggleDay(days: number) {
    if (!settings) return;
    const current = settings.reminder_days_before;
    const next = current.includes(days)
      ? current.filter((d) => d !== days)
      : [...current, days].sort((a, b) => b - a);
    await updateSettings.mutateAsync({ reminder_days_before: next });
    await resync(settings.notifications_enabled, next);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <ThemedText>Payment reminders</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {isDisabled ? 'Requires a development build — unavailable in Expo Go on Android' : 'Get notified before a bill is due'}
          </ThemedText>
        </View>
        <Switch
          value={isDisabled ? false : settings.notifications_enabled}
          onValueChange={handleToggle}
          disabled={isDisabled}
          trackColor={{ true: theme.primary }}
        />
      </View>

      {settings.notifications_enabled && !isDisabled ? (
        <View style={styles.chips}>
          {REMINDER_OPTIONS.map((option) => {
            const selected = settings.reminder_days_before.includes(option.days);
            return (
              <Pressable
                key={option.days}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggleDay(option.days)}
                style={[
                  styles.chip,
                  { backgroundColor: selected ? theme.primary : theme.backgroundElement, borderColor: theme.border },
                ]}>
                <ThemedText type="small" style={{ color: selected ? theme.primaryText : theme.text }}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1, minWidth: 0, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
});

import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';

// Payment schedule grouped by due date lands in Phase 7 alongside
// notifications, once bills carry real due dates.
export default function CalendarScreen() {
  return (
    <ScreenContainer>
      <EmptyState
        icon="🗓️"
        title="No upcoming payments"
        subtitle="Once you add bills with due dates, they'll show up here on a timeline."
      />
    </ScreenContainer>
  );
}

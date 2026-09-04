import { useCallback, useEffect, useState } from 'react';

import {
  getNotificationPermissionGranted,
  isNotificationsAvailable,
  requestNotificationPermission,
} from '@/services/notifications';

/** Local (not React Query) state — permission/availability live in the OS and native module, not the database. */
export function useNotificationPermission() {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    isNotificationsAvailable().then((isAvailable) => {
      setAvailable(isAvailable);
      if (isAvailable) getNotificationPermissionGranted().then(setGranted);
      else setGranted(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const request = useCallback(async () => {
    const result = await requestNotificationPermission();
    setGranted(result);
    return result;
  }, []);

  return { granted, available, refresh, request };
}

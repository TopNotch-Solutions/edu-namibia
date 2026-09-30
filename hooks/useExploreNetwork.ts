import * as Network from 'expo-network';
import { useEffect, useRef, useState } from 'react';

function isOnlineFromState(state: Network.NetworkState): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

/**
 * Explore-only network status. Calls `onOnline` on first online check
 * and whenever connectivity is restored after being offline.
 */
export function useExploreNetwork(onOnline?: () => void) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const onOnlineRef = useRef(onOnline);
  const wasOfflineRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    onOnlineRef.current = onOnline;
  }, [onOnline]);

  useEffect(() => {
    let mounted = true;

    const apply = (state: Network.NetworkState) => {
      if (!mounted) return;
      const online = isOnlineFromState(state);

      if (online) {
        const shouldFetch = wasOfflineRef.current || !initializedRef.current;
        initializedRef.current = true;
        wasOfflineRef.current = false;
        setIsOnline(true);
        if (shouldFetch) {
          onOnlineRef.current?.();
        }
        return;
      }

      initializedRef.current = true;
      wasOfflineRef.current = true;
      setIsOnline(false);
    };

    void Network.getNetworkStateAsync().then(apply);
    const subscription = Network.addNetworkStateListener(apply);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return { isOnline };
}

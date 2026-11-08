import { Tabs } from 'expo-router';
import React from 'react';

import { BottomNavBar } from '@/components/BottomNavBar';
import { UnlockDoor } from '@/components/unlock/UnlockDoor';
import { useTourFinished } from '@/lib/tour/store';
import { useUnlockProgress } from '@/lib/unlock';

export default function TabLayout() {
  // Progressive locks: hydrate per user and turn usage into unlocks.
  useUnlockProgress();
  // The door of Práticas plays once, right after the first-run tour (never during it).
  const tourFinished = useTourFinished();
  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNavBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Practices' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Rewards' }} />
      <Tabs.Screen name="character" options={{ title: 'Hero' }} />
      <Tabs.Screen name="learning" options={{ title: 'Learn' }} />
      <Tabs.Screen name="profile" options={{ title: 'Settings' }} />
    </Tabs>
    {tourFinished ? <UnlockDoor feature="practices" /> : null}
    </>
  );
}

import { Tabs } from 'expo-router';
import React from 'react';

import { BottomNavBar } from '@/components/BottomNavBar';
import { useUnlockProgress } from '@/lib/unlock';

export default function TabLayout() {
  // Progressive locks: hydrate per user and turn usage into unlocks.
  useUnlockProgress();
  return (
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
  );
}

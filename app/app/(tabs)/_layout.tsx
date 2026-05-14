import { Tabs } from 'expo-router';
import React from 'react';

import { BottomNavBar } from '@/components/BottomNavBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNavBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Rewards' }} />
      <Tabs.Screen name="character" options={{ title: 'Hero' }} />
      <Tabs.Screen name="learning" options={{ title: 'Learn' }} />
      <Tabs.Screen name="profile" options={{ title: 'Settings' }} />
      {/*
        History stays routable as /(tabs)/history but is hidden from the
        tab bar. Entry point is the calendar icon in CompactHeader on the
        Tasks tab. See V3 roadmap: "embed history inside Tasks".
      */}
      <Tabs.Screen name="history" options={{ href: null, title: 'History' }} />
    </Tabs>
  );
}

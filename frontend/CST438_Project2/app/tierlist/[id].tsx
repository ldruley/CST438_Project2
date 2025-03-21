import React from 'react';
import { Stack } from 'expo-router';
import TierlistView from '@/components/TierListView';

export default function TierlistScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <TierlistView />
        </>
    );
}
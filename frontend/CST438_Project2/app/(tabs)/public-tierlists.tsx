import React from 'react';
import { Stack } from 'expo-router';
import PublicTierlistsScreen from '@/components/PublicTierlistsScreen';

export default function PublicTierlistsRoute() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                }}
            />
            <PublicTierlistsScreen />
        </>
    );
}
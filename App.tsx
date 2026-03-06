import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';
import { Colors } from './src/theme';
import { NeonText } from './src/components/NeonText';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setReady(true);
      } catch (err: any) {
        console.error('Database init error:', err);
        setError(err.message || 'Failed to initialize database');
      }
    };
    init();
  }, []);

  if (error) {
    return (
      <View style={styles.splash}>
        <NeonText variant="title" color={Colors.neonPink}>Error</NeonText>
        <NeonText variant="body" color={Colors.textSecondary}>{error}</NeonText>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.splash}>
        <NeonText variant="display" glow glowColor={Colors.neonPurple} color={Colors.neonPurple}>
          NeonBudget
        </NeonText>
        <ActivityIndicator size="large" color={Colors.electricBlue} style={{ marginTop: 20 }} />
        <NeonText variant="caption" color={Colors.textTertiary} style={{ marginTop: 10 }}>
          Initializing...
        </NeonText>
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

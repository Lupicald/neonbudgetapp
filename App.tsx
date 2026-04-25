import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';
import { getSetting, setSetting } from './src/database/settingsService';
import { getRecurringItems } from './src/database/recurringService';
import { refreshRecurringReminders } from './src/services/notificationService';
import { Colors } from './src/theme';
import { LanguageProvider } from './src/context/LanguageContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import {
  useFonts,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';

export default function App() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();

        const onboardingDone = await getSetting('onboarding_complete');
        setNeedsOnboarding(!onboardingDone);

        try {
          const items = await getRecurringItems();
          await refreshRecurringReminders(items as any);
        } catch {}

        setReady(true);
      } catch (err: any) {
        console.error('Database init error:', err);
        setError(err.message || 'Failed to initialize database');
      }
    };
    init();
  }, []);

  const handleOnboardingComplete = async () => {
    await setSetting('onboarding_complete', '1');
    setNeedsOnboarding(false);
  };

  if (error) {
    return (
      <View style={styles.splash}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  if (!ready || !fontsLoaded) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>Sumari</Text>
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (needsOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <LanguageProvider>
      <AppNavigator />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 56,
    color: Colors.textPrimary,
    letterSpacing: -1.5,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.negative,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { EditTransactionScreen } from '../screens/EditTransactionScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { TransferScreen } from '../screens/TransferScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { MerchantsScreen } from '../screens/MerchantsScreen';
import { RecurringScreen } from '../screens/RecurringScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AppTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: Colors.cyberGreen,
        background: Colors.background,
        card: Colors.tabBarBackground,
        text: Colors.textPrimary,
        border: 'rgba(255, 255, 255, 0.06)',
        notification: Colors.neonPink,
    },
};

const DashboardStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DashboardHome" component={DashboardScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
);

const TransactionsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TransactionsHome" component={TransactionsScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="EditTransaction" component={EditTransactionScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
);

const AccountsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AccountsHome" component={AccountsScreen} />
        <Stack.Screen name="TransferMoney" component={TransferScreen} />
    </Stack.Navigator>
);

const RecurringStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RecurringHome" component={RecurringScreen} />
    </Stack.Navigator>
);

const AnalyticsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AnalyticsHome" component={AnalyticsScreen} />
    </Stack.Navigator>
);

const SettingsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SettingsHome" component={SettingsScreen} />
        <Stack.Screen name="CategoriesManage" component={CategoriesScreen} />
        <Stack.Screen name="MerchantsManage" component={MerchantsScreen} />
        <Stack.Screen name="BudgetsManage" component={BudgetsScreen} />
        <Stack.Screen name="GoalsManage" component={GoalsScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Timeline" component={TimelineScreen} />
        <Stack.Screen name="Transfers" component={TransferScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
    </Stack.Navigator>
);

// Tab config
const tabCfg: Record<string, { active: string; inactive: string; grad: [string, string] }> = {
    Dashboard:    { active: 'grid',            inactive: 'grid-outline',            grad: ['#3B82F6', '#60A5FA'] },
    Transactions: { active: 'swap-horizontal', inactive: 'swap-horizontal-outline', grad: ['#7C3AED', '#8B5CF6'] },
    Accounts:     { active: 'wallet',          inactive: 'wallet-outline',          grad: ['#10B981', '#059669'] },
    Recurring:    { active: 'repeat',          inactive: 'repeat-outline',          grad: ['#F59E0B', '#D97706'] },
    Analytics:    { active: 'analytics',       inactive: 'analytics-outline',       grad: ['#EF4444', '#7C3AED'] },
    Settings:     { active: 'settings',        inactive: 'settings-outline',        grad: ['#4B5563', '#374151'] },
};

const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ name, focused, color }) => {
    const cfg = tabCfg[name];
    if (focused && cfg) {
        return (
            <View style={ts.activeWrap}>
                <LinearGradient colors={cfg.grad} style={ts.pill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name={cfg.active as any} size={19} color="#FFF" />
                </LinearGradient>
            </View>
        );
    }
    return (
        <View style={ts.inactiveWrap}>
            <Ionicons name={(cfg?.inactive ?? 'ellipse-outline') as any} size={21} color={color} />
        </View>
    );
};

const ts = StyleSheet.create({
    activeWrap: { alignItems: 'center', justifyContent: 'center', marginTop: -5 },
    pill: {
        width: 46, height: 30, borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    inactiveWrap: { alignItems: 'center', justifyContent: 'center', width: 44, height: 36 },
});

export const AppNavigator: React.FC = () => (
    <NavigationContainer theme={AppTheme}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'rgba(17, 17, 17, 0.97)',
                    borderTopColor: 'rgba(255, 255, 255, 0.06)',
                    borderTopWidth: 1,
                    height: Platform.OS === 'android' ? 66 : 78,
                    paddingBottom: Platform.OS === 'android' ? 10 : 20,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.cyberGreen,
                tabBarInactiveTintColor: Colors.tabBarInactive,
                tabBarLabelStyle: { fontSize: 9, fontWeight: '500', letterSpacing: 0.2 },
                tabBarIcon: ({ focused, color }) => <TabIcon name={route.name} focused={focused} color={color} />,
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardStack} />
            <Tab.Screen name="Transactions" component={TransactionsStack} />
            <Tab.Screen name="Accounts" component={AccountsStack} />
            <Tab.Screen name="Recurring" component={RecurringStack} />
            <Tab.Screen name="Analytics" component={AnalyticsStack} />
            <Tab.Screen name="Settings" component={SettingsStack} />
        </Tab.Navigator>
    </NavigationContainer>
);

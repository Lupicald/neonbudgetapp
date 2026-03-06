import React from 'react';
import { View, StyleSheet } from 'react-native';
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

const NeonTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: Colors.electricBlue,
        background: Colors.background,
        card: Colors.tabBarBackground,
        text: Colors.textPrimary,
        border: 'rgba(0, 212, 255, 0.1)',
        notification: Colors.neonPink,
    },
};

// -- Stack navigators --

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

const CalendarStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CalendarHome" component={CalendarScreen} />
    </Stack.Navigator>
);

const AnalyticsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AnalyticsHome" component={AnalyticsScreen} />
    </Stack.Navigator>
);

const RecurringIncomeWrapper = () => <RecurringScreen type="income" />;
const RecurringExpensesWrapper = () => <RecurringScreen type="expense" />;

const SettingsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SettingsHome" component={SettingsScreen} />
        <Stack.Screen name="CategoriesManage" component={CategoriesScreen} />
        <Stack.Screen name="MerchantsManage" component={MerchantsScreen} />
        <Stack.Screen name="RecurringIncome" component={RecurringIncomeWrapper} />
        <Stack.Screen name="RecurringExpenses" component={RecurringExpensesWrapper} />
        <Stack.Screen name="BudgetsManage" component={BudgetsScreen} />
        <Stack.Screen name="GoalsManage" component={GoalsScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Timeline" component={TimelineScreen} />
        <Stack.Screen name="Transfers" component={TransferScreen} />
    </Stack.Navigator>
);

// -- Tab Bar Icon with glow indicator --

const tabIcons: Record<string, { active: string; inactive: string }> = {
    Dashboard: { active: 'grid', inactive: 'grid-outline' },
    Transactions: { active: 'swap-horizontal', inactive: 'swap-horizontal-outline' },
    Accounts: { active: 'wallet', inactive: 'wallet-outline' },
    Calendar: { active: 'calendar', inactive: 'calendar-outline' },
    Analytics: { active: 'analytics', inactive: 'analytics-outline' },
    Settings: { active: 'settings', inactive: 'settings-outline' },
};

interface TabIconProps {
    routeName: string;
    focused: boolean;
    color: string;
}

const TabIcon: React.FC<TabIconProps> = ({ routeName, focused, color }) => {
    const icons = tabIcons[routeName];
    const iconName = focused ? icons?.active : icons?.inactive;
    return (
        <View style={tabIconStyles.wrapper}>
            {focused && (
                <LinearGradient
                    colors={['rgba(0,212,255,0.25)', 'rgba(0,212,255,0.05)'] as [string, string]}
                    style={tabIconStyles.indicator}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            )}
            <Ionicons
                name={iconName as any}
                size={22}
                color={color}
                style={focused ? tabIconStyles.activeIcon : undefined}
            />
        </View>
    );
};

const tabIconStyles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 36,
    },
    indicator: {
        position: 'absolute',
        top: -8,
        left: 0,
        right: 0,
        height: 3,
        borderRadius: 2,
    },
    activeIcon: {
        textShadowColor: Colors.electricBlue,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
});

// -- Root Navigator --

export const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer theme={NeonTheme}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: Colors.tabBarBackground,
                        borderTopColor: 'rgba(0, 212, 255, 0.1)',
                        borderTopWidth: 1,
                        height: 64,
                        paddingBottom: 8,
                        paddingTop: 6,
                    },
                    tabBarActiveTintColor: Colors.electricBlue,
                    tabBarInactiveTintColor: Colors.tabBarInactive,
                    tabBarLabelStyle: {
                        fontSize: 9,
                        fontWeight: '600',
                        letterSpacing: 0.5,
                    },
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon routeName={route.name} focused={focused} color={color} />
                    ),
                })}
            >
                <Tab.Screen name="Dashboard" component={DashboardStack} />
                <Tab.Screen name="Transactions" component={TransactionsStack} />
                <Tab.Screen name="Accounts" component={AccountsStack} />
                <Tab.Screen name="Calendar" component={CalendarStack} />
                <Tab.Screen name="Analytics" component={AnalyticsStack} />
                <Tab.Screen name="Settings" component={SettingsStack} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

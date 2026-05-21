import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'react-native';
import { NavigationContainer, NavigationContainerRef, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FAB } from '../components/FAB';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { YouScreen } from '../screens/YouScreen';
import { TransferScreen } from '../screens/TransferScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { EditTransactionScreen } from '../screens/EditTransactionScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { MerchantsScreen } from '../screens/MerchantsScreen';
import { RecurringScreen } from '../screens/RecurringScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Root = createNativeStackNavigator();

export const navigationRef = React.createRef<NavigationContainerRef<any>>();

const AppTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.accent,
    background: Colors.bg,
    card: Colors.bgCard,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.rust,
  },
};

// Home stack — Dashboard → Transactions / Analytics / Edit
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={DashboardScreen} />
    <Stack.Screen name="Transactions" component={TransactionsScreen} />
    <Stack.Screen name="EditTransaction" component={EditTransactionScreen} options={{ presentation: 'modal' }} />
    <Stack.Screen name="Analytics" component={AnalyticsScreen} />
  </Stack.Navigator>
);

// Accounts stack — Accounts → Movimientos / Transferencias / Merchants
const AccountsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AccountsMain" component={AccountsScreen} />
    <Stack.Screen name="Movements" component={TransactionsScreen} />
    <Stack.Screen name="TransferMoney" component={TransferScreen} />
    <Stack.Screen name="Merchants" component={MerchantsScreen} />
  </Stack.Navigator>
);

// Plan stack — Plan (budgets, goals, recurring, projection) + manage screens
const PlanStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PlanMain" component={PlanScreen} />
    <Stack.Screen name="CategoriesManage" component={CategoriesScreen} />
    <Stack.Screen name="BudgetsManage" component={BudgetsScreen} />
    <Stack.Screen name="GoalsManage" component={GoalsScreen} />
    <Stack.Screen name="RecurringManage" component={RecurringScreen} />
  </Stack.Navigator>
);

// You stack — profile / settings / achievements
const YouStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="YouMain" component={YouScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Achievements" component={AchievementsScreen} />
  </Stack.Navigator>
);

const TabIcon: React.FC<{ ionIcon: string; focused: boolean; color: string }> = ({ ionIcon, focused, color }) => (
  <View style={ts.iconWrap}>
    <Ionicons name={ionIcon as any} size={22} color={color} />
    <View style={[ts.dot, { opacity: focused ? 1 : 0 }]} />
  </View>
);

// Editorial tab bar — 4 tabs, FAB sits above as a separate root-level layer.
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: 'rgba(14,15,13,0.96)',
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: Platform.OS === 'android' ? 68 : 86,
        paddingBottom: Platform.OS === 'android' ? 10 : 22,
        paddingTop: 10,
      },
      tabBarActiveTintColor: Colors.textPrimary,
      tabBarInactiveTintColor: Colors.textTertiary,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '500', letterSpacing: 0.4, marginTop: 2 },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeStack}
      options={{
        tabBarLabel: 'Inicio',
        tabBarIcon: ({ focused, color }) => <TabIcon ionIcon={focused ? 'home' : 'home-outline'} focused={focused} color={color} />,
      }}
    />
    <Tab.Screen
      name="Accounts"
      component={AccountsStack}
      options={{
        tabBarLabel: 'Cuentas',
        tabBarIcon: ({ focused, color }) => <TabIcon ionIcon={focused ? 'wallet' : 'wallet-outline'} focused={focused} color={color} />,
      }}
    />
    <Tab.Screen
      name="Plan"
      component={PlanStack}
      options={{
        tabBarLabel: 'Plan',
        tabBarIcon: ({ focused, color }) => <TabIcon ionIcon={focused ? 'pie-chart' : 'pie-chart-outline'} focused={focused} color={color} />,
      }}
    />
    <Tab.Screen
      name="You"
      component={YouStack}
      options={{
        tabBarLabel: 'Tú',
        tabBarIcon: ({ focused, color }) => <TabIcon ionIcon={focused ? 'person' : 'person-outline'} focused={focused} color={color} />,
      }}
    />
  </Tab.Navigator>
);

// Root navigator — main tabs + the AddTransaction modal + a global FAB layer.
const TabsWithFAB = () => (
  <View style={{ flex: 1 }}>
    <MainTabs />
    <FAB onPress={() => navigationRef.current?.navigate('AddTransaction' as never)} />
  </View>
);

const RootNavigator = () => (
  <Root.Navigator screenOptions={{ headerShown: false }}>
    <Root.Screen name="MainTabs" component={TabsWithFAB} />
    <Root.Screen
      name="AddTransaction"
      component={AddTransactionScreen}
      options={{ presentation: 'modal', headerShown: false }}
    />
  </Root.Navigator>
);

export const AppNavigator: React.FC = () => (
  <NavigationContainer ref={navigationRef} theme={AppTheme}>
    <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
    <ErrorBoundary>
      <RootNavigator />
    </ErrorBoundary>
  </NavigationContainer>
);

const ts = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent },
});

import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'react-native';
import { NavigationContainer, NavigationContainerRef, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Screens — Sumari design
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
import { CalendarScreen } from '../screens/CalendarScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { RecurringScreen } from '../screens/RecurringScreen';
import { SubscriptionsScreen } from '../screens/SubscriptionsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { PlannedBudgetScreen } from '../screens/PlannedBudgetScreen';

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
    notification: Colors.negative,
  },
};

// ── Home stack (Dashboard → Transactions → Calendar → Timeline → Analytics)
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={DashboardScreen} />
    <Stack.Screen name="Transactions" component={TransactionsScreen} />
    <Stack.Screen name="EditTransaction" component={EditTransactionScreen} options={{ presentation: 'modal' }} />
    <Stack.Screen name="Calendar" component={CalendarScreen} />
    <Stack.Screen name="Timeline" component={TimelineScreen} />
    <Stack.Screen name="Analytics" component={AnalyticsScreen} />
  </Stack.Navigator>
);

// ── Accounts stack
const AccountsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AccountsMain" component={AccountsScreen} />
    <Stack.Screen name="TransferMoney" component={TransferScreen} />
    <Stack.Screen name="Merchants" component={MerchantsScreen} />
  </Stack.Navigator>
);

// ── Plan stack
const PlanStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PlanMain" component={PlanScreen} />
    <Stack.Screen name="CategoriesManage" component={CategoriesScreen} />
    <Stack.Screen name="BudgetsManage" component={BudgetsScreen} />
    <Stack.Screen name="GoalsManage" component={GoalsScreen} />
    <Stack.Screen name="RecurringManage" component={RecurringScreen} />
    <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
    <Stack.Screen name="IncomePlanner" component={PlannedBudgetScreen} />
  </Stack.Navigator>
);

// ── You stack
const YouStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="YouMain" component={YouScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Achievements" component={AchievementsScreen} />
  </Stack.Navigator>
);

// ── Center FAB
const CenterTabButton: React.FC<any> = () => (
  <TouchableOpacity
    onPress={() => navigationRef.current?.navigate('AddTransaction' as never)}
    activeOpacity={0.85}
    style={ts.centerBtnWrapper}
    accessibilityLabel="Add transaction"
    accessibilityRole="button"
  >
    <View style={ts.centerBtn}>
      <Ionicons name="add" size={26} color={Colors.onAccent} />
    </View>
  </TouchableOpacity>
);

const EmptyScreen = () => null;

// ── Tab icon component
const TabIcon: React.FC<{ ionIcon: string; focused: boolean; color: string }> = ({ ionIcon, focused, color }) => (
  <View style={ts.iconWrap}>
    <Ionicons name={ionIcon as any} size={22} color={color} />
    {focused && <View style={ts.dot} />}
  </View>
);

// ── Main tab navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.bgCard,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: Platform.OS === 'android' ? 68 : 80,
        paddingBottom: Platform.OS === 'android' ? 8 : 20,
        paddingTop: 8,
      },
      tabBarActiveTintColor: Colors.textPrimary,
      tabBarInactiveTintColor: Colors.textTertiary,
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 0,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeStack}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ focused, color }) => <TabIcon ionIcon={focused ? 'home' : 'home-outline'} focused={focused} color={color} />,
      }}
    />
    <Tab.Screen
      name="Accounts"
      component={AccountsStack}
      options={{
        tabBarLabel: 'Accounts',
        tabBarIcon: ({ focused, color }) => <TabIcon ionIcon={focused ? 'wallet' : 'wallet-outline'} focused={focused} color={color} />,
      }}
    />
    <Tab.Screen
      name="AddCenter"
      component={EmptyScreen}
      options={{
        tabBarLabel: '',
        tabBarButton: (props) => <CenterTabButton {...props} />,
        tabBarIcon: () => null,
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
        tabBarLabel: 'You',
        tabBarIcon: ({ focused, color }) => <TabIcon ionIcon={focused ? 'person' : 'person-outline'} focused={focused} color={color} />,
      }}
    />
  </Tab.Navigator>
);

// ── Root navigator
const RootNavigator = () => (
  <Root.Navigator screenOptions={{ headerShown: false }}>
    <Root.Screen name="MainTabs" component={MainTabs} />
    <Root.Screen
      name="AddTransaction"
      component={AddTransactionScreen}
      options={{ presentation: 'modal', headerShown: false }}
    />
  </Root.Navigator>
);

// ── Export
export const AppNavigator: React.FC = () => (
  <NavigationContainer ref={navigationRef} theme={AppTheme}>
    <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
    <ErrorBoundary>
      <RootNavigator />
    </ErrorBoundary>
  </NavigationContainer>
);

const ts = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  centerBtnWrapper: {
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 10,
  },
});

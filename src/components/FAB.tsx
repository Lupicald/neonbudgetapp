import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme';

interface FABProps {
  onPress: () => void;
  icon?: React.ReactNode;
  bottom?: number;
  accessibilityLabel?: string;
}
// Floating Action Button — centered above the tab bar, opens the AddTransaction modal.
export const FAB: React.FC<FABProps> = ({ onPress, icon, bottom, accessibilityLabel = 'Add transaction' }) => {
  const b = bottom ?? (Platform.OS === 'ios' ? 92 : 80);
  return (
    <View pointerEvents="box-none" style={[fs.host, { bottom: b }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={fs.btn}
      >
        {icon ?? <Ionicons name="add" size={26} color={Colors.bg} />}
      </TouchableOpacity>
    </View>
  );
};

const fs = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  btn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 6, borderColor: Colors.bg,
    ...Shadows.fab,
  },
});

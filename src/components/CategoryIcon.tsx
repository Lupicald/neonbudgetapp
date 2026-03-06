import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '../theme';

interface CategoryIconProps {
    icon: string;
    color: string;
    size?: number;
    style?: ViewStyle;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
    icon,
    color,
    size = 36,
    style,
}) => {
    return (
        <View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 3,
                    backgroundColor: `${color}20`,
                },
                style,
            ]}
        >
            <Ionicons
                name={icon as any}
                size={size * 0.5}
                color={color}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

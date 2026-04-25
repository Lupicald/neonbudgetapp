import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { BorderRadius, Spacing, Colors } from '../theme';
import { NeonText } from './NeonText';

interface ProgressBarProps {
    progress: number; // 0 to 1
    height?: number;
    gradientColors?: [string, string]; // kept for API compat — unused
    label?: string;
    valueLabel?: string;
    showPercentage?: boolean;
    style?: ViewStyle;
    animated?: boolean;
    warning?: boolean;
    danger?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    height = 8,
    gradientColors,
    label,
    valueLabel,
    showPercentage = false,
    style,
    animated = true,
    warning = false,
    danger = false,
}) => {
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const clampedProgress = Math.min(1, Math.max(0, progress));

    useEffect(() => {
        if (animated) {
            Animated.timing(animatedWidth, {
                toValue: clampedProgress,
                duration: 700,
                useNativeDriver: false,
            }).start();
        } else {
            animatedWidth.setValue(clampedProgress);
        }
    }, [clampedProgress]);

    const getFillColor = () => {
        if (danger) return '#FF4C6A';
        if (warning) return '#F0A040';
        return Colors.accent;
    };

    return (
        <View style={style}>
            {(label || valueLabel || showPercentage) && (
                <View style={styles.labelRow}>
                    {label && (
                        <NeonText variant="caption" color="#6B8F74">
                            {label}
                        </NeonText>
                    )}
                    <NeonText variant="caption" color="#6B8F74">
                        {valueLabel || (showPercentage ? `${Math.round(clampedProgress * 100)}%` : '')}
                    </NeonText>
                </View>
            )}
            <View style={[styles.track, { height, backgroundColor: Colors.accentSoft }]}>
                <Animated.View
                    style={[
                        styles.fill,
                        {
                            height,
                            width: animatedWidth.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                            backgroundColor: getFillColor(),
                        },
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    track: {
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    fill: {
        borderRadius: BorderRadius.full,
    },
});

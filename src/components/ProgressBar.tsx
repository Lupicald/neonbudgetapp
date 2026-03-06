import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '../theme';
import { NeonText } from './NeonText';

interface ProgressBarProps {
    progress: number; // 0 to 1
    height?: number;
    gradientColors?: [string, string];
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
                duration: 900,
                useNativeDriver: false,
            }).start();
        } else {
            animatedWidth.setValue(clampedProgress);
        }
    }, [clampedProgress]);

    const getColors = (): [string, string] => {
        if (gradientColors) return gradientColors;
        if (danger) return Colors.gradientExpense as [string, string];
        if (warning) return [Colors.neonOrange, Colors.neonYellow] as [string, string];
        return Colors.gradientBlue as [string, string];
    };

    const getGlowColor = () => {
        if (danger) return Colors.glowPink;
        if (warning) return Colors.glowOrange;
        return Colors.glowBlue;
    };

    return (
        <View style={style}>
            {(label || valueLabel || showPercentage) && (
                <View style={styles.labelRow}>
                    {label && (
                        <NeonText variant="caption" color={Colors.textSecondary}>
                            {label}
                        </NeonText>
                    )}
                    <NeonText variant="caption" color={Colors.textSecondary}>
                        {valueLabel || (showPercentage ? `${Math.round(clampedProgress * 100)}%` : '')}
                    </NeonText>
                </View>
            )}
            <View style={[styles.track, { height }]}>
                <Animated.View
                    style={[
                        styles.fill,
                        {
                            height,
                            width: animatedWidth.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                            shadowColor: getGlowColor(),
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.9,
                            shadowRadius: 8,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={getColors()}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />
                </Animated.View>
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
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    fill: {
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
});

import React, { Component, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../theme';
import { NeonText } from './NeonText';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    children: ReactNode;
    fallbackLabel?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error.message, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <View style={styles.container}>
                <Ionicons name="warning-outline" size={52} color={Colors.neonPink} />
                <NeonText variant="subtitle" color={Colors.neonPink} style={styles.title}>
                    {this.props.fallbackLabel || 'Something went wrong'}
                </NeonText>
                <NeonText variant="caption" color={Colors.textMuted} align="center" style={styles.msg}>
                    {this.state.error?.message || 'An unexpected error occurred.'}
                </NeonText>
                <TouchableOpacity style={styles.btn} onPress={this.handleRetry} activeOpacity={0.8}>
                    <Ionicons name="refresh-outline" size={16} color={Colors.accent} />
                    <NeonText variant="body" color={Colors.accent}> Retry</NeonText>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxl,
        gap: Spacing.md,
    },
    title: { marginTop: Spacing.sm },
    msg: { textAlign: 'center', lineHeight: 20 },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${Colors.accent}40`,
        backgroundColor: `${Colors.accent}10`,
    },
});

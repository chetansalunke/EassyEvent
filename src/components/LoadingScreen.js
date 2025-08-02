import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../utils/colors';
import { getFullScreenSafeArea } from '../utils/safeArea';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, getFullScreenSafeArea(insets)]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
});

export default LoadingScreen;

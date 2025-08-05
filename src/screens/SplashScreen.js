import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Navigate to Login screen after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.splashContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.jpeg')} // Update this path to your logo image
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoImage: {
    width: 150,
    height: 100,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    width: width - 60,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '70%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});

export default SplashScreen;

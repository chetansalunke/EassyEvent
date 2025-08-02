import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, Platform } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

// Import all screen components
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditBookingScreen from './src/screens/EditBookingScreen';
import DateTimePickerScreen from './src/screens/DateTimePickerScreen';

// Import Auth Context and Loading Screen
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoadingScreen from './src/components/LoadingScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'Home' : 'Splash'}
      screenOptions={{
        headerShown: false, // Default to no header
        animation: 'slide_from_right',
        gestureEnabled: true, // Enable swipe back gesture
        contentStyle: {
          backgroundColor: '#FFFFFF', // Ensure consistent background
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#333333',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      {/* Authentication Screens */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ gestureEnabled: true }} // Allow back from signup to login
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ gestureEnabled: true }} // Allow back from reset to login
      />

      {/* Authenticated Screens */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          gestureEnabled: false, // Prevent back navigation from home
          headerShown: false, // Home has custom header
        }}
      />
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={{
          gestureEnabled: true,
          headerShown: false, // Use custom header in component
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          gestureEnabled: true,
          headerShown: false, // Profile has custom header with back button
        }}
      />
      <Stack.Screen
        name="EditBooking"
        component={EditBookingScreen}
        options={{
          gestureEnabled: true,
          headerShown: false, // Use custom header in component
        }}
      />
      <Stack.Screen
        name="DateTimePicker"
        component={DateTimePickerScreen}
        options={{
          gestureEnabled: true,
          headerShown: false, // Use custom header in component
        }}
      />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            translucent={Platform.OS === 'android'}
          />
          <AuthNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;

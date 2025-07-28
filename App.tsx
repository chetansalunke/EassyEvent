import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

// Import all screen components
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
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
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false, // Disable swipe back gesture for better control
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
        options={{ gestureEnabled: false }} // Prevent back navigation from home
      />
      <Stack.Screen
        name="EditBooking"
        component={EditBookingScreen}
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen
        name="DateTimePicker"
        component={DateTimePickerScreen}
        options={{ gestureEnabled: true }}
      />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AuthNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;

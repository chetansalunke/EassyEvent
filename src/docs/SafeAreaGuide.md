/\*\*

- SafeArea Implementation Guide for EaseEvent App
-
- This guide shows how to properly implement safe area handling
- across different types of screens in the app.
  \*/

// 1. Main App Setup (App.tsx) ✅ DONE
/\*
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

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
\*/

// 2. Screen with Custom Layout (like HomeScreen) ✅ DONE
/\*
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScreenSafeArea, getTabBarSafeArea } from '../utils/safeArea';

const HomeScreen = ({ navigation }) => {
const insets = useSafeAreaInsets();

return (
<View style={[styles.container, getScreenSafeArea(insets)]}>
<StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header with safe area */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top * 0.3, 8) }]}>
        {/* Header content */}
      </View>

      {/* Scrollable content */}
      <ScrollView style={styles.content}>
        {/* Content */}
      </ScrollView>

      {/* Tab bar with safe area */}
      <View style={[styles.tabBar, getTabBarSafeArea(insets)]}>
        {/* Tab bar content */}
      </View>
    </View>

);
};
\*/

// 3. Simple Screen (like LoginScreen, ProfileScreen)
/\*
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFullScreenSafeArea } from '../utils/safeArea';

const LoginScreen = ({ navigation }) => {
const insets = useSafeAreaInsets();

return (
<View style={[styles.container, getFullScreenSafeArea(insets)]}>
<StatusBar barStyle="dark-content" backgroundColor={colors.background} />
<ScrollView>
{/_ Screen content _/}
</ScrollView>
</View>
);
};
\*/

// 4. Modal or Overlay Screen
/\*
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ModalScreen = ({ navigation }) => {
const insets = useSafeAreaInsets();

return (
<View style={[styles.modalContainer, { paddingTop: insets.top }]}>
{/_ Modal content _/}
</View>
);
};
\*/

// 5. Loading Screen (full screen)
/\*
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFullScreenSafeArea } from '../utils/safeArea';

const LoadingScreen = ({ message }) => {
const insets = useSafeAreaInsets();

return (
<View style={[styles.container, getFullScreenSafeArea(insets)]}>
<ActivityIndicator size="large" color={colors.primary} />
<Text>{message}</Text>
</View>
);
};
\*/

// Key Points:
// 1. Always wrap the root App component with SafeAreaProvider
// 2. Use useSafeAreaInsets() hook in individual screens
// 3. Apply safe area padding based on screen type and layout needs
// 4. Use the utility functions in safeArea.js for consistency
// 5. Handle status bar properly on both iOS and Android
// 6. Test on devices with notches, home indicators, and different screen sizes

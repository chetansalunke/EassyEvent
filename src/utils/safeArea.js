import { Platform, StatusBar, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Safe Area Utilities for consistent handling across the app
 */

// Device type detection
export const isTablet = width >= 768;
export const isSmallDevice = width < 375;
export const isLargeDevice = width > 414;

// Platform detection
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Status bar height calculation
export const getStatusBarHeight = () => {
  if (isIOS) {
    // For iOS, the safe area insets will handle this
    return 0;
  }
  return StatusBar.currentHeight || 24;
};

// Safe area utilities
export const getSafeAreaPadding = (insets, options = {}) => {
  const {
    includeTop = true,
    includeBottom = true,
    includeLeft = true,
    includeRight = true,
    minPadding = 16,
  } = options;

  return {
    paddingTop: includeTop ? Math.max(insets.top, minPadding) : 0,
    paddingBottom: includeBottom ? Math.max(insets.bottom, minPadding) : 0,
    paddingLeft: includeLeft ? Math.max(insets.left, minPadding) : 0,
    paddingRight: includeRight ? Math.max(insets.right, minPadding) : 0,
  };
};

// Header safe area padding
export const getHeaderSafeArea = insets => {
  return {
    paddingTop: isIOS ? Math.max(insets.top * 0.3, 8) : 8,
    minHeight: 60,
  };
};

// Tab bar safe area padding
export const getTabBarSafeArea = insets => {
  const basePadding = isSmallDevice ? 8 : 12;
  return {
    paddingBottom: Math.max(
      insets.bottom + basePadding,
      isSmallDevice ? 16 : 20,
    ),
  };
};

// Content safe area padding for ScrollViews
export const getContentSafeArea = insets => {
  return {
    paddingHorizontal: Math.max(20, insets.left + 20, insets.right + 20),
    paddingTop: 8,
  };
};

// Full screen safe area (for modal screens, loading screens, etc.)
export const getFullScreenSafeArea = insets => {
  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
};

// Screen container safe area (for main screens)
export const getScreenSafeArea = insets => {
  return {
    paddingTop: insets.top,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    // Don't include bottom padding here as it's handled by tab bar
  };
};

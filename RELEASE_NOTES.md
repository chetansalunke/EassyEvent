# EaseEvent Production Release Guide

## 🎉 Release Information
- **App Name**: EaseEvent
- **Version**: 1.0.0 (Version Code: 1)
- **Package Name**: com.eassyevent
- **Build Date**: August 9, 2025

## 📱 Release Files
The following production-ready files have been generated:

### APK File (Direct Installation)
- **File**: `releases/EaseEvent-v1.0.0-release.apk`
- **Size**: 46MB
- **Use**: Direct installation on Android devices

### AAB File (Google Play Store)
- **File**: `releases/EaseEvent-v1.0.0-release.aab`
- **Size**: 22MB
- **Use**: Upload to Google Play Store (recommended)

## 🔐 Security & Signing
- ✅ Production keystore generated (`upload-keystore.keystore`)
- ✅ APK and AAB files are signed for production
- ✅ Proguard enabled for code obfuscation
- ✅ Resource shrinking enabled to reduce file size

## 🚀 Google Play Store Upload Instructions

### 1. Prepare Your Google Play Console Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing app
3. Complete the app information, content rating, and privacy policy

### 2. Upload the AAB File
1. Navigate to **Production** in the left sidebar
2. Click **Create new release**
3. Upload `releases/EaseEvent-v1.0.0-release.aab`
4. Add release notes describing your app features
5. Review and roll out to production

### 3. App Store Listing Requirements
- App name: EaseEvent
- Short description: Event management made easy
- Category: Business/Productivity
- Screenshots: Prepare screenshots of your app in action
- Feature graphic: 1024 x 500 pixels
- App icon: 512 x 512 pixels

## 🛠️ Build Configuration

### Keystore Information
- **Keystore File**: `android/app/upload-keystore.keystore`
- **Alias**: upload
- **Validity**: 10,000 days (27+ years)

### App Permissions
The app requests the following permissions:
- `INTERNET` - For API communication
- `CAMERA` - For image capture features
- Additional permissions as required by dependencies

### Supported Architectures
- armeabi-v7a
- arm64-v8a
- x86
- x86_64

### Minimum Requirements
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 35 (Android 15)

## 📋 Build Commands

To rebuild the release files in the future:

```bash
# Clean build
npm run build:android:clean

# Build APK
npm run build:android

# Build AAB
npm run build:android:aab

# Build both
npm run build:android:all
```

## ⚠️ Important Notes

1. **Keystore Security**: Keep your keystore file (`upload-keystore.keystore`) safe and secure. If lost, you cannot update your app on Google Play Store.

2. **Version Management**: For future releases, increment the `versionCode` and `versionName` in `android/app/build.gradle`.

3. **Testing**: Test the APK on actual devices before publishing to ensure everything works correctly.

4. **Privacy Policy**: Google Play Store requires a privacy policy for apps that collect user data.

## 🔄 Future Updates

To create a new release:
1. Update version numbers in `android/app/build.gradle`
2. Run the build commands
3. Test thoroughly
4. Upload new AAB to Google Play Console

## 📞 Support

If you encounter issues:
1. Check the build logs for any errors
2. Verify keystore passwords are correct
3. Ensure all dependencies are properly installed
4. Test on emulator first, then real devices

---

**Generated on**: August 9, 2025
**Build Environment**: macOS with Android SDK
**React Native Version**: 0.80.0

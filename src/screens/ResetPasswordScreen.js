import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,          
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { validateForm, validationRules } from '../utils/validation';
import API_CONFIG from '../config/apiConfig';

const ResetPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'password'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // API call to send OTP
  const sendOTP = async userEmail => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/forgot-password/send-otp/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to send OTP');
      }

      return result;
    } catch (error) {
      if (error.message.includes('Network request failed')) {
        throw new Error(
          'Network error. Please check your internet connection.',
        );
      }
      throw error;
    }
  };

  // API call to verify OTP and reset password
  const verifyOTPAndResetPassword = async (userEmail, userOtp, password) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/forgot-password/verify-otp/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            otp: parseInt(userOtp),
            password: password,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || 'Failed to reset password',
        );
      }

      return result;
    } catch (error) {
      if (error.message.includes('Network request failed')) {
        throw new Error(
          'Network error. Please check your internet connection.',
        );
      }
      throw error;
    }
  };

  const validateEmail = () => {
    const { isValid, errors: formErrors } = validateForm(
      { email },
      { email: validationRules.email },
    );
    setErrors(formErrors);
    return isValid;
  };

  const validatePasswords = () => {
    const formErrors = {};

    // Validate new password
    const { isValid: passwordValid, errors: passwordErrors } = validateForm(
      { password: newPassword },
      { password: validationRules.password },
    );

    if (!passwordValid) {
      formErrors.newPassword = passwordErrors.password;
    }

    // Validate confirm password
    if (!confirmPassword) {
      formErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      formErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      await sendOTP(email.toLowerCase().trim());
      setStep('otp');
      Alert.alert(
        'OTP Sent!',
        'We have sent a verification code to your email address. Please check your inbox.',
        [{ text: 'OK' }],
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      setErrors({ otp: 'Please enter a valid OTP' });
      return;
    }

    setStep('password');
    setErrors({});
  };

  const handleResetPassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);

    try {
      await verifyOTPAndResetPassword(
        email.toLowerCase().trim(),
        otp,
        newPassword,
      );

      Alert.alert(
        'Password Reset Successful!',
        'Your password has been reset successfully. You can now login with your new password.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Reset Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field, value) => {
    if (field === 'email') setEmail(value);
    else if (field === 'otp') setOtp(value);
    else if (field === 'newPassword') setNewPassword(value);
    else if (field === 'confirmPassword') setConfirmPassword(value);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <Text style={styles.welcomeTitle}>Reset Your Password</Text>
            <Text style={styles.welcomeSubtitle}>
              Enter your email address and we'll send you a verification code to
              reset your password.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={value => updateField('email', value)}
                placeholder="Enter your registered email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Send Verification Code
                </Text>
              )}
            </TouchableOpacity>
          </>
        );

      case 'otp':
        return (
          <>
            <Text style={styles.welcomeTitle}>Enter Verification Code</Text>
            <Text style={styles.welcomeSubtitle}>
              We've sent a verification code to {email}. Please enter it below.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <TextInput
                style={[styles.input, errors.otp && styles.inputError]}
                value={otp}
                onChangeText={value => updateField('otp', value)}
                placeholder="Enter 6-digit verification code"
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
              />
              {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerifyOTP}
            >
              <Text style={styles.primaryButtonText}>Verify Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep('email')}
            >
              <Text style={styles.secondaryButtonText}>Back to Email</Text>
            </TouchableOpacity>
          </>
        );

      case 'password':
        return (
          <>
            <Text style={styles.welcomeTitle}>Create New Password</Text>
            <Text style={styles.welcomeSubtitle}>
              Your identity is verified. Create a strong new password for your
              account.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    errors.newPassword && styles.inputError,
                  ]}
                  value={newPassword}
                  onChangeText={value => updateField('newPassword', value)}
                  placeholder="Create a strong password"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
              <Text style={styles.passwordHint}>
                Password must be at least 8 characters and contain at least one
                uppercase letter, one lowercase letter, and one number.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  value={confirmPassword}
                  onChangeText={value => updateField('confirmPassword', value)}
                  placeholder="Re-enter your new password"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <View style={styles.logoPattern}>
                <View
                  style={[
                    styles.logoDiamond,
                    { transform: [{ rotate: '45deg' }] },
                  ]}
                />
                <View
                  style={[
                    styles.logoDiamond,
                    {
                      transform: [{ rotate: '45deg' }],
                      position: 'absolute',
                      top: 8,
                      left: 8,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.logoText}>ENCALM</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          {renderStepContent()}

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={16} color={colors.success} />
            <Text style={styles.securityText}>
              Your credentials are securely encrypted
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 30,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
    minHeight: 80,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 20 : 30,
    padding: 12,
    borderRadius: 25,
    backgroundColor: colors.lightGray,
    zIndex: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoPattern: {
    position: 'relative',
  },
  logoDiamond: {
    width: 20,
    height: 20,
    backgroundColor: colors.background,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    letterSpacing: 2,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.secondary,
  },
  inputError: {
    borderColor: colors.error,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.secondary,
  },
  eyeButton: {
    padding: 12,
  },
  passwordHint: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  securityText: {
    fontSize: 12,
    color: colors.gray,
    marginLeft: 8,
  },
});

export default ResetPasswordScreen;

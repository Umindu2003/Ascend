import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Hold up! 🛑', 'Please enter both email and password.');
      return;
    }
    if (!isLogin && !username) {
      Alert.alert('Missing Info! 🛑', 'We need your Player Name to create your profile!');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Login Failed ❌', error.message);
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username },
        },
      });

      if (authError) {
        Alert.alert('Sign Up Failed ❌', authError.message);
      } else if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              level: 1,
              xp: 0,
              health: 100,
              combo: 0,
            },
          ]);

        if (profileError) {
          console.error('Stats Generation Error:', profileError);
          Alert.alert('Stats Error ⚠️', 'Account created, but failed to init stats.');
        } else {
          Alert.alert('Success! 🎉', 'Player profile created! You are now Level 1.');
        }
      }
    }
    setLoading(false);
  };

  const togglePasswordVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        {/* Branding Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text style={styles.logoTitle}>ASCEND</Text>
          <Text style={styles.subtitle}>Level up your real life.</Text>
        </View>

        {/* Auth Form */}
        <View style={styles.formCard}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Player Name (Username)"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <AnimatedButton
              style={styles.eyeButton}
              onPress={togglePasswordVisibility}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color={COLORS.textMuted}
              />
            </AnimatedButton>
          </View>

          {/* Submit Button */}
          <AnimatedButton
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading... ⏳' : isLogin ? 'Enter the Game 🎮' : 'Create Player Profile 🏆'}
            </Text>
          </AnimatedButton>
        </View>

        {/* Toggle Mode */}
        <AnimatedButton
          style={styles.toggleContainer}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsLogin(!isLogin);
          }}
        >
          <Text style={styles.toggleText}>
            {isLogin ? 'New player? ' : 'Already have an account? '}
            <Text style={styles.toggleTextBold}>
              {isLogin ? 'Sign up here.' : 'Log in.'}
            </Text>
          </Text>
        </AnimatedButton>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  logoEmoji: {
    fontSize: 32,
  },
  logoTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  input: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: RADIUS.md,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    backgroundColor: COLORS.background,
    padding: 16,
    paddingRight: 50,
    borderRadius: RADIUS.md,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.button,
  },
  buttonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  toggleContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextBold: {
    color: COLORS.textPrimary,
    fontWeight: '900',
  },
});
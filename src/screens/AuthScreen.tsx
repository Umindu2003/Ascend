import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
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
      Alert.alert('Hold up, bro! 🛑', 'Please enter both email and password.');
      return;
    }
    if (!isLogin && !username) {
      Alert.alert('Missing Info! 🛑', 'We need your Player Name to create your profile!');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isLogin) {
      // 🔐 LOGIN FLOW
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Login Failed ❌', error.message);
    } else {
      // 📝 SIGN UP FLOW (NEW – with stats initialisation!)
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
        // 🎮 NEW: Initialize the player's RPG stats in the database!
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id, // Ties it perfectly to their secure login!
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
        {/* 🎮 Branding */}
        <View style={styles.header}>
          <Text style={styles.logo}>ASCEND ⚡</Text>
          <Text style={styles.subtitle}>Level up your real life.</Text>
        </View>

        {/* 📝 Inputs */}
        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Player Name (Username)"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#A0A0A0"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password field with eye toggle */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={togglePasswordVisibility}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {/* 🚀 Submit Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading... ⏳' : isLogin ? 'Enter the Game 🎮' : 'Create Player Profile 🏆'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔄 Toggle Auth Mode */}
        <TouchableOpacity
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
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    paddingRight: 56,
    borderRadius: 16,
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  toggleContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  toggleText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
  toggleTextBold: {
    color: '#111',
    fontWeight: '800',
  },
});
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native'; // 👈 Added View, Image, and StyleSheet!
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/services/supabase';

// 📱 Screen Imports
import HomeScreen from './src/screens/HomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ShopScreen from './src/screens/ShopScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true); // 👈 NEW: Tracks our loading screen!

  useEffect(() => {
    // 1. Check if the user is logged in 🚀
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      // ⏳ Keep the loading screen up for 2 seconds so the logo looks epic!
      setTimeout(() => {
        setIsAppLoading(false);
      }, 2000);
    });

    // 2. Listen in the background 🎧
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // 🛑 THE CUSTOM LOADING SCREEN!
  // If the app is still loading, show a pure black screen with your logo!
  if (isAppLoading) {
    return (
      <View style={styles.splashContainer}>
        <Image 
          source={require('./assets/splash.png')} 
          style={styles.splashImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Shop" component={ShopScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// 🎨 LOADING SCREEN STYLES
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000000', // Pitch black background 🖤
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: '60%', // Adjust this if you want the logo bigger or smaller!
    height: '60%',
  },
});
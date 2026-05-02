import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { setApiToken, setLogoutCallback } from '../services/api';

interface AuthContextType {
  token: string | null;
  role: string | null;
  user: { id: string; email: string; name?: string } | null;
  login: (token: string, role: string, user: { id: string; email: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAuthState = useCallback(async () => {
    try {
      const [storedToken, storedRole, storedUser] = await Promise.all([
        SecureStore.getItemAsync('auth_token'),
        SecureStore.getItemAsync('auth_role'),
        SecureStore.getItemAsync('auth_user'),
      ]);

      if (storedToken && storedRole && storedUser) {
        setApiToken(storedToken);
        setToken(storedToken);
        setRole(storedRole);
        setUser(JSON.parse(storedUser));
        setLogoutCallback(() => {
          setToken(null);
          setRole(null);
          setUser(null);
        });
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  const login = async (newToken: string, newRole: string, newUser: { id: string; email: string; name?: string }) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync('auth_token', newToken),
        SecureStore.setItemAsync('auth_role', newRole),
        SecureStore.setItemAsync('auth_user', JSON.stringify(newUser)),
      ]);
      setApiToken(newToken);
      setToken(newToken);
      setRole(newRole);
      setUser(newUser);
      setLogoutCallback(() => {
        setToken(null);
        setRole(null);
        setUser(null);
      });
    } catch (error) {
      console.error('Failed to save auth state:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('auth_token'),
        SecureStore.deleteItemAsync('auth_role'),
        SecureStore.deleteItemAsync('auth_user'),
        SecureStore.deleteItemAsync('refresh_token'),
      ]);
      setApiToken(null);
      setLogoutCallback(null);
      setToken(null);
      setRole(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to clear auth state:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0EA5E9" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0EA5E9',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
  },
});

// context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

interface User {
  _id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const loadAuthData = async () => {
      const storedAccessToken = await AsyncStorage.getItem("access_token");
      const storedRefreshToken = await AsyncStorage.getItem("refresh_token");
      if (storedAccessToken && storedRefreshToken) {
        try {
          const res = await api.get(`/me`);
          setUser(res.data.user);
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
        } catch (error) {
          await AsyncStorage.removeItem("access_token");
          await AsyncStorage.removeItem("refresh_token");
        }
      }
    };
    loadAuthData();
  }, []);

  const setAuth = (accessToken: string, refreshToken: string, user: User) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);
    AsyncStorage.setItem("access_token", accessToken);
    AsyncStorage.setItem("refresh_token", refreshToken);
  };

  const logout = async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
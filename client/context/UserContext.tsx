// frontend/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";

interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
}

interface UserContextType {
  user: IUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  fetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${SERVER_URI}/me`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      setUser(response.data.user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
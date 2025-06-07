import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signup: (email: string, password: string, metadata: any) => Promise<{ error?: { message: string } }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: any) => Promise<void>;
  isBlogEditor?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBlogEditor, setIsBlogEditor] = useState(false);

  const evaluateRoles = (user: User) => {
    const metadata = user.user_metadata || {};
    setIsBlogEditor(metadata.isBlogEditor === true);
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getUser();

        if (data && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          evaluateRoles(data.user);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsBlogEditor(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
        setIsAuthenticated(false);
        setIsBlogEditor(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          evaluateRoles(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setIsBlogEditor(false);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        evaluateRoles(data.user);
      }

      return {};
    } catch (error: any) {
      console.error('Error logging in:', error);
      return { error: { message: error.message || 'An error occurred during login' } };
    }
  };

  const signup = async (email: string, password: string, metadata: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return { error };
      }

      if (data && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        evaluateRoles(data.user);
      }

      return {};
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { error: { message: error.message || 'An error occurred during sign up' } };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setIsAuthenticated(false);
      setIsBlogEditor(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signOut = logout;

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: any) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        throw error;
      }

      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setUser(data.user);
        evaluateRoles(data.user);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    signup,
    logout,
    signOut,
    resetPassword,
    updateUserProfile,
    isBlogEditor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

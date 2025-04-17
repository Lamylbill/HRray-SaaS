import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error?: { message: string } }>;
  logout: () => Promise<void>;
  updateProfile: (data: Record<string, any>) => Promise<{ error?: { message: string } }>;
  updatePassword: (password: string) => Promise<{ error?: { message: string } }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({}),
  signup: async () => ({}),
  logout: async () => {},
  updateProfile: async () => ({}),
  updatePassword: async () => ({}),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Initialize authentication state
  useEffect(() => {
    let mounted = true;
    console.log('Auth Provider initialized');
    
    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (mounted) {
          if (initialSession) {
            console.log('Found existing session:', initialSession.user.id);
            setSession(initialSession);
            setUser(initialSession.user);
          } else {
            console.log('No session found');
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error setting up auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    setupAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        if (!mounted) return;
        
        try {
          if (newSession) {
            console.log('New session established:', newSession.user.id);
            setSession(newSession);
            setUser(newSession.user);
            
            // Only navigate on actual sign-in events, not session refreshes or focus changes
            if (event === 'SIGNED_IN') {
              // Only redirect if user is on the root path or login/signup pages and location.pathname exists
              const isAuthPage = ['/login', '/signup', '/'].includes(location.pathname);
              if (isAuthPage) {
                navigate('/dashboard');
              }
              
              toast({
                title: "Login successful",
                description: "Welcome to HRFlow!",
              });
            } else if (event === 'USER_UPDATED') {
              toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
              });
            }
          } else {
            console.log('Session ended');
            setSession(null);
            setUser(null);
            
            if (event === 'SIGNED_OUT') {
              toast({
                title: "Logged out",
                description: "You have been logged out successfully.",
              });
              navigate('/');
            }
          }
        } catch (error) {
          console.error('Error during auth state change:', error);
        }
      }
    );
    
    return () => {
      console.log('Auth Provider cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast, location.pathname]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with email:', email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return { error };
      }

      console.log('Login successful:', data.user?.id);
      setUser(data.user);
      setSession(data.session);

       // Store the JWT token in localStorage
      localStorage.setItem('jwt_token', data.session?.access_token || '');  // Store JWT token
      
      if (location.pathname) navigate('/dashboard');
      return {};
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred during login',
        } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Attempting signup with email:', email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        console.error('Signup error:', error.message);
        return { error };
      }

      if (data?.user?.identities?.length === 0) {
        console.log('User already exists with this email');
        return {
          error: {
            message: 'An account with this email already exists. Please log in instead.',
          }
        };
      }

      toast({
        title: "Account created",
        description: "Your account has been created successfully. Please log in.",
      });
      
      if (location.pathname) navigate('/login');
      return {};
    } catch (error: any) {
      console.error('Unexpected signup error:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred during signup',
        } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('Attempting logout');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during logout:', error);
        toast({
          title: "Logout failed",
          description: "There was an error logging you out. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      setUser(null);
      setSession(null);
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProfile = async (data: Record<string, any>) => {
    try {
      console.log('Updating user profile with data:', data);
      setIsLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        data
      });
      
      if (error) {
        console.error('Profile update error:', error.message);
        return { error };
      }
      
      return {};
    } catch (error: any) {
      console.error('Unexpected profile update error:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred during profile update',
        } 
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePassword = async (password: string) => {
    try {
      console.log('Updating user password');
      setIsLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        console.error('Password update error:', error.message);
        return { error };
      }
      
      return {};
    } catch (error: any) {
      console.error('Unexpected password update error:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred during password update',
        } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Compute authentication state
  const isAuthenticated = !!user && !!session;
  console.log('Auth state:', { isLoading, isAuthenticated, userId: user?.id });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

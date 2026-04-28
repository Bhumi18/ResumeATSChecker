/**
 * Client-side Authentication Context
 * Provides auth state and functions for the local session-based auth flow
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { safeConsole } from './logging';

export interface OAuthProvider {
  provider: string;
  provider_account_id: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  primaryEmailAddress?: { emailAddress: string };
  imageUrl?: string;
  oauthProviders?: OAuthProvider[];
  hasAiApiKey?: boolean;
  aiApiKeyLast4?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Transform the API response to match the client auth shape
            const transformedUser: AuthUser = {
              id: data.user.id,
              email: data.user.email,
              firstName: data.user.first_name,
              lastName: data.user.last_name,
              username: data.user.username,
              profileImageUrl: data.user.profile_image_url,
              primaryEmailAddress: { emailAddress: data.user.email },
              imageUrl: data.user.profile_image_url,
              oauthProviders: data.user.oauth_providers || [],
              hasAiApiKey: data.user.has_ai_api_key || false,
              aiApiKeyLast4: data.user.ai_api_key_last4 || null,
            };
            setUser(transformedUser);
          }
        }
      } catch (error) {
        safeConsole.error('Failed to load user:', error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.user) {
        const transformedUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          username: data.user.username,
          profileImageUrl: data.user.profile_image_url,
          primaryEmailAddress: { emailAddress: data.user.email },
          imageUrl: data.user.profile_image_url,
          hasAiApiKey: data.user.has_ai_api_key || false,
          aiApiKeyLast4: data.user.ai_api_key_last4 || null,
        };
        setUser(transformedUser);
        return { success: true };
      }

      return { success: false, error: data.error || 'Sign in failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.user) {
        const transformedUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          username: data.user.username,
          profileImageUrl: data.user.profile_image_url,
          primaryEmailAddress: { emailAddress: data.user.email },
          imageUrl: data.user.profile_image_url,
          hasAiApiKey: data.user.has_ai_api_key || false,
          aiApiKeyLast4: data.user.ai_api_key_last4 || null,
        };
        setUser(transformedUser);
        return { success: true };
      }

      return { success: false, error: data.error || 'Sign up failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      safeConsole.error('Sign out error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.user) {
        const preservedHasApiKey = user?.hasAiApiKey ?? false;
        const preservedLast4 = user?.aiApiKeyLast4 ?? null;
        const transformedUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          username: data.user.username,
          profileImageUrl: data.user.profile_image_url,
          primaryEmailAddress: { emailAddress: data.user.email },
          imageUrl: data.user.profile_image_url,
          hasAiApiKey: data.user.has_ai_api_key ?? preservedHasApiKey,
          aiApiKeyLast4: data.user.ai_api_key_last4 ?? preservedLast4,
        };
        setUser(transformedUser);
        return { success: true };
      }

      return { success: false, error: data.error || 'Update failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoaded,
      isSignedIn: !!user,
      signIn,
      signUp,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Hook to use user
export function useUser() {
  const { user, isLoaded } = useAuth();
  return { user, isLoaded };
}

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_PERMISSIONS, type AppRole } from '@/types/database';

// Helper function to get the appropriate dashboard based on user roles
export function getRoleDashboard(roles: AppRole[]): string {
  // Priority-based routing - highest priority roles first
  if (roles.includes('superadmin')) return '/dashboard';
  if (roles.includes('owner')) return '/dashboard';
  if (roles.includes('manager')) return '/dashboard';
  if (roles.includes('front_desk')) return '/front-desk';
  if (roles.includes('accountant')) return '/folios';
  if (roles.includes('night_auditor')) return '/night-audit';
  if (roles.includes('housekeeping')) return '/housekeeping';
  if (roles.includes('maintenance')) return '/maintenance';
  if (roles.includes('kitchen')) return '/pos';
  if (roles.includes('waiter')) return '/pos';
  return '/dashboard'; // fallback
}

interface Profile {
  id: string;
  tenant_id: string | null;
  full_name: string | null;
  username: string;
  email: string | null;
  is_active: boolean;
  must_change_password: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isSuperAdmin: boolean;
  tenantId: string | null;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      } else if (rolesData) {
        setRoles(rolesData.map((r) => r.role as AppRole));
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer data fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRoles([]);
        }

        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (username: string, password: string) => {
    let loginEmail = username;

    // If not already an email, look up the actual email from profiles table
    if (!username.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .maybeSingle();

      if (!profile?.email) {
        return { error: new Error('User not found') };
      }

      loginEmail = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    // Update last login after successful auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', authUser.id);
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isSuperAdmin = roles.includes('superadmin');
  const tenantId = profile?.tenant_id ?? null;

  const hasRole = (role: AppRole) => {
    if (isSuperAdmin) return true;
    return roles.includes(role);
  };

  const hasAnyRole = (checkRoles: AppRole[]) => {
    if (isSuperAdmin) return true;
    return checkRoles.some((role) => roles.includes(role));
  };

  const hasPermission = (permission: string) => {
    if (isSuperAdmin) return true;
    return roles.some((role) => {
      const perms = ROLE_PERMISSIONS[role] || [];
      return perms.includes('*') || perms.includes(permission);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isSuperAdmin,
        tenantId,
        signIn,
        signUp,
        signOut,
        hasRole,
        hasAnyRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
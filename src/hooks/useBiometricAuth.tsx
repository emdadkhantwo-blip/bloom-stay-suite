import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTenant } from './useTenant';
import { toast } from '@/hooks/use-toast';

export interface BiometricCredential {
  id: string;
  credential_id: string;
  device_name: string | null;
  created_at: string;
}

interface UseBiometricAuthReturn {
  isSupported: boolean;
  isRegistered: boolean;
  credentials: BiometricCredential[];
  registerBiometric: (deviceName?: string) => Promise<boolean>;
  authenticateBiometric: () => Promise<boolean>;
  removeCredential: (id: string) => Promise<void>;
  isLoading: boolean;
  isAuthenticating: boolean;
}

// Helper functions for base64url encoding/decoding
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random challenge - explicitly typed as ArrayBuffer for WebAuthn
function generateChallenge(): ArrayBuffer {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array.buffer;
}

// Get device name from user agent
function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android Device';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux Device';
  return 'Unknown Device';
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check if WebAuthn is supported
  const isSupported = typeof window !== 'undefined' && 
    window.PublicKeyCredential !== undefined &&
    typeof navigator.credentials !== 'undefined';

  // Fetch existing credentials
  const fetchCredentials = useCallback(async () => {
    if (!user?.id) {
      setCredentials([]);
      setIsLoading(false);
      return;
    }

    try {
      // Using 'as any' to handle dynamic table that's not in generated types yet
      const { data, error } = await (supabase as any)
        .from('biometric_credentials')
        .select('id, credential_id, device_name, created_at')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching biometric credentials:', error);
      setCredentials([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Register a new biometric credential
  const registerBiometric = async (deviceName?: string): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Your device doesn't support biometric authentication.",
        variant: "destructive",
      });
      return false;
    }

    if (!user?.id || !tenant?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to register biometrics.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsAuthenticating(true);

      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        toast({
          title: "Not Available",
          description: "No fingerprint sensor detected on this device.",
          variant: "destructive",
        });
        return false;
      }

      const challenge = generateChallenge();
      const userId = new TextEncoder().encode(user.id);

      // Create credential options
      const createOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: "BeeHotel Attendance",
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: user.email || user.id,
            displayName: deviceName || getDeviceName(),
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },  // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      };

      // Create the credential
      const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error("Failed to create credential");
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Extract and encode credential data
      const credentialId = arrayBufferToBase64url(credential.rawId);
      const publicKey = arrayBufferToBase64url(response.getPublicKey() || new ArrayBuffer(0));

      // Store in database - using 'as any' to handle dynamic table that's not in types yet
      const { error } = await (supabase as any)
        .from('biometric_credentials')
        .insert({
          tenant_id: tenant.id,
          profile_id: user.id,
          credential_id: credentialId,
          public_key: publicKey,
          device_name: deviceName || getDeviceName(),
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Fingerprint registered successfully.",
      });

      await fetchCredentials();
      return true;
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "Cancelled",
          description: "Fingerprint registration was cancelled.",
          variant: "destructive",
        });
      } else if (error.name === 'SecurityError') {
        toast({
          title: "Security Error",
          description: "This feature requires a secure connection (HTTPS).",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to register fingerprint.",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Authenticate using biometric
  const authenticateBiometric = async (): Promise<boolean> => {
    if (!isSupported || credentials.length === 0) {
      return false;
    }

    try {
      setIsAuthenticating(true);

      const challenge = generateChallenge();

      // Build allowed credentials list
      const allowCredentials: PublicKeyCredentialDescriptor[] = credentials.map(cred => ({
        type: "public-key" as const,
        id: base64urlToArrayBuffer(cred.credential_id),
        transports: ["internal" as AuthenticatorTransport],
      }));

      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials,
          userVerification: "required",
          timeout: 60000,
        },
      };

      // Request authentication
      const assertion = await navigator.credentials.get(getOptions) as PublicKeyCredential;

      if (!assertion) {
        throw new Error("Authentication failed");
      }

      // Authentication successful - the browser verified the fingerprint
      return true;
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "Cancelled",
          description: "Fingerprint authentication was cancelled.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Failed to verify fingerprint. Please try again.",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Remove a credential
  const removeCredential = async (id: string): Promise<void> => {
    try {
      const { error } = await (supabase as any)
        .from('biometric_credentials')
        .delete()
        .eq('id', id)
        .eq('profile_id', user?.id);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "Fingerprint credential removed.",
      });

      await fetchCredentials();
    } catch (error: any) {
      console.error('Error removing credential:', error);
      toast({
        title: "Error",
        description: "Failed to remove credential.",
        variant: "destructive",
      });
    }
  };

  return {
    isSupported,
    isRegistered: credentials.length > 0,
    credentials,
    registerBiometric,
    authenticateBiometric,
    removeCredential,
    isLoading,
    isAuthenticating,
  };
}

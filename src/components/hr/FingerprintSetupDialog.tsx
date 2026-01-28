import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Fingerprint, Loader2, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface FingerprintSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SetupStep = 'intro' | 'registering' | 'success' | 'error';

export function FingerprintSetupDialog({ open, onOpenChange }: FingerprintSetupDialogProps) {
  const { isSupported, isInIframe, registerBiometric, isAuthenticating } = useBiometricAuth();
  const [step, setStep] = useState<SetupStep>('intro');
  const [deviceName, setDeviceName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setStep('registering');
    const success = await registerBiometric(deviceName || undefined);
    
    if (success) {
      setStep('success');
      setTimeout(() => {
        onOpenChange(false);
        setStep('intro');
        setDeviceName('');
      }, 2000);
    } else {
      setStep('error');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('intro');
    setDeviceName('');
    setErrorMessage('');
  };

  const handleRetry = () => {
    setStep('intro');
    setErrorMessage('');
  };

  // Show iframe warning
  if (isInIframe) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Preview Limitation
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                Fingerprint authentication cannot work in the preview window due to browser security restrictions.
              </p>
              <p className="font-medium text-foreground">
                To use fingerprint clock-in, please:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Publish your app</li>
                <li>Open it in a new browser tab</li>
                <li>Register your fingerprint there</li>
              </ol>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Not Supported
            </DialogTitle>
            <DialogDescription>
              Your device or browser doesn't support biometric authentication.
              Please use a device with a fingerprint sensor and a modern browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'intro' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-primary" />
                Setup Fingerprint
              </DialogTitle>
              <DialogDescription>
                Use your device's fingerprint sensor to quickly clock in and out.
                Your fingerprint data never leaves your device.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">How it works</p>
                  <p className="text-muted-foreground">
                    Your device will prompt you to scan your fingerprint. 
                    Only a secure key is stored - your actual fingerprint stays on your device.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-name">Device Name (optional)</Label>
                <Input
                  id="device-name"
                  placeholder="e.g., My iPhone, Work Laptop"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Give this device a name to identify it later
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleRegister}>
                <Fingerprint className="h-4 w-4 mr-2" />
                Register Fingerprint
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'registering' && (
          <div className="py-8 text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <Fingerprint className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <p className="font-medium">Touch Your Fingerprint Sensor</p>
              <p className="text-sm text-muted-foreground">
                Follow the prompts on your device
              </p>
            </div>
            {isAuthenticating && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Waiting for fingerprint...</span>
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-600 dark:text-green-400">
                Fingerprint Registered!
              </p>
              <p className="text-sm text-muted-foreground">
                You can now use your fingerprint to clock in and out
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <>
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Registration Failed</p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage || "Something went wrong. Please try again."}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleRetry}>
                Try Again
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

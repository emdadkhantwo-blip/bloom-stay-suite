import { useState } from 'react';
import { format } from 'date-fns';
import { Fingerprint, Trash2, Smartphone, Laptop, Monitor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBiometricAuth, BiometricCredential } from '@/hooks/useBiometricAuth';

interface BiometricCredentialsListProps {
  onSetupClick: () => void;
}

function getDeviceIcon(deviceName: string | null) {
  const name = (deviceName || '').toLowerCase();
  if (name.includes('iphone') || name.includes('android') || name.includes('phone')) {
    return <Smartphone className="h-4 w-4" />;
  }
  if (name.includes('mac') || name.includes('laptop')) {
    return <Laptop className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
}

export function BiometricCredentialsList({ onSetupClick }: BiometricCredentialsListProps) {
  const { credentials, removeCredential, isLoading, isSupported } = useBiometricAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<BiometricCredential | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (credential: BiometricCredential) => {
    setCredentialToDelete(credential);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!credentialToDelete) return;
    
    setIsDeleting(true);
    await removeCredential(credentialToDelete.id);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setCredentialToDelete(null);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Fingerprint Authentication
          </CardTitle>
          <CardDescription>
            Your device doesn't support biometric authentication.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Fingerprint Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Fingerprint className="h-4 w-4" />
                Fingerprint Authentication
              </CardTitle>
              <CardDescription>
                {credentials.length === 0 
                  ? "Set up fingerprint for faster clock in/out" 
                  : `${credentials.length} device${credentials.length > 1 ? 's' : ''} registered`
                }
              </CardDescription>
            </div>
            <Button size="sm" onClick={onSetupClick}>
              <Fingerprint className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>
        </CardHeader>
        
        {credentials.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {getDeviceIcon(credential.device_name)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {credential.device_name || 'Unknown Device'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registered {format(new Date(credential.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteClick(credential)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Fingerprint?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{credentialToDelete?.device_name || 'Unknown Device'}" from your registered devices?
              You can always add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

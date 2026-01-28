import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Fingerprint, 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee, 
  Loader2,
  CheckCircle2,
  Hand
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { StaffWithAttendance } from '@/hooks/useAttendance';
import { FingerprintSetupDialog } from './FingerprintSetupDialog';
import { BiometricCredentialsList } from './BiometricCredentialsList';
import { toast } from '@/hooks/use-toast';

interface BiometricClockWidgetProps {
  todayRecord: StaffWithAttendance | null;
  onClockIn: () => void;
  onClockOut: () => void;
  onBreakStart: () => void;
  onBreakEnd: () => void;
  isLoading: boolean;
}

export function BiometricClockWidget({
  todayRecord,
  onClockIn,
  onClockOut,
  onBreakStart,
  onBreakEnd,
  isLoading,
}: BiometricClockWidgetProps) {
  const { 
    isSupported, 
    isInIframe,
    isRegistered, 
    authenticateBiometric, 
    isAuthenticating 
  } = useBiometricAuth();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isClockedIn = todayRecord?.status === 'present' || todayRecord?.status === 'on_break';
  const isOnBreak = todayRecord?.status === 'on_break';
  const isClockedOut = todayRecord?.status === 'clocked_out';

  // Handle fingerprint clock in
  const handleFingerprintClockIn = async () => {
    setActionInProgress('clock-in');
    const authenticated = await authenticateBiometric();
    
    if (authenticated) {
      toast({
        title: "Fingerprint Verified",
        description: "Clocking you in...",
      });
      onClockIn();
    }
    setActionInProgress(null);
  };

  // Handle fingerprint clock out
  const handleFingerprintClockOut = async () => {
    setActionInProgress('clock-out');
    const authenticated = await authenticateBiometric();
    
    if (authenticated) {
      toast({
        title: "Fingerprint Verified",
        description: "Clocking you out...",
      });
      onClockOut();
    }
    setActionInProgress(null);
  };

  // Handle fingerprint break start
  const handleFingerprintBreakStart = async () => {
    setActionInProgress('break-start');
    const authenticated = await authenticateBiometric();
    
    if (authenticated) {
      toast({
        title: "Fingerprint Verified",
        description: "Starting break...",
      });
      onBreakStart();
    }
    setActionInProgress(null);
  };

  // Handle fingerprint break end
  const handleFingerprintBreakEnd = async () => {
    setActionInProgress('break-end');
    const authenticated = await authenticateBiometric();
    
    if (authenticated) {
      toast({
        title: "Fingerprint Verified",
        description: "Ending break...",
      });
      onBreakEnd();
    }
    setActionInProgress(null);
  };

  const getStatusBadge = () => {
    if (!todayRecord || todayRecord.status === 'absent') {
      return <Badge variant="secondary">Not Clocked In</Badge>;
    }
    if (todayRecord.status === 'clocked_out') {
      return <Badge variant="outline" className="bg-muted">Clocked Out</Badge>;
    }
    if (todayRecord.status === 'on_break') {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">On Break</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Working</Badge>;
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Attendance
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Time Display */}
          <div className="text-center py-3 bg-muted/50 rounded-lg">
            <p className="text-3xl font-bold tracking-tight">
              {format(currentTime, 'HH:mm:ss')}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Today's Record Summary */}
          {todayRecord?.clock_in && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-green-500" />
                <span>In: {format(new Date(todayRecord.clock_in), 'HH:mm')}</span>
              </div>
              {isClockedOut && todayRecord.worked_hours > 0 && (
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span>Worked: {todayRecord.worked_hours.toFixed(1)} hrs</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Main Action Buttons */}
          <div className="space-y-3">
            {!isClockedIn && !isClockedOut ? (
              // Not clocked in - show clock in options
              <div className="grid grid-cols-2 gap-2">
                {isRegistered && (
                  <Button 
                    className="h-14 flex-col gap-1"
                    onClick={handleFingerprintClockIn}
                    disabled={isLoading || isAuthenticating || actionInProgress !== null}
                  >
                    {actionInProgress === 'clock-in' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Fingerprint className="h-5 w-5" />
                    )}
                    <span className="text-xs">Fingerprint</span>
                  </Button>
                )}
                <Button 
                  variant={isRegistered ? "outline" : "default"}
                  className={`h-14 flex-col gap-1 ${!isRegistered ? 'col-span-2' : ''}`}
                  onClick={onClockIn}
                  disabled={isLoading || actionInProgress !== null}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <LogIn className="h-5 w-5" />
                  )}
                  <span className="text-xs">Clock In{isRegistered ? ' (Manual)' : ''}</span>
                </Button>
              </div>
            ) : isClockedIn && !isClockedOut ? (
              // Clocked in, not clocked out - show break and clock out options
              <div className="space-y-2">
                {/* Break Buttons */}
                {!isOnBreak ? (
                  <div className="grid grid-cols-2 gap-2">
                    {isRegistered && (
                      <Button 
                        variant="secondary"
                        className="h-12 flex-col gap-1"
                        onClick={handleFingerprintBreakStart}
                        disabled={isLoading || isAuthenticating || actionInProgress !== null}
                      >
                        {actionInProgress === 'break-start' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Coffee className="h-4 w-4" />
                        )}
                        <span className="text-xs">Start Break</span>
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className={`h-12 flex-col gap-1 ${!isRegistered ? 'col-span-2' : ''}`}
                      onClick={onBreakStart}
                      disabled={isLoading || actionInProgress !== null}
                    >
                      <Coffee className="h-4 w-4" />
                      <span className="text-xs">Break{isRegistered ? ' (Manual)' : ''}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {isRegistered && (
                      <Button 
                        variant="secondary"
                        className="h-12 flex-col gap-1 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400"
                        onClick={handleFingerprintBreakEnd}
                        disabled={isLoading || isAuthenticating || actionInProgress !== null}
                      >
                        {actionInProgress === 'break-end' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Hand className="h-4 w-4" />
                        )}
                        <span className="text-xs">End Break</span>
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className={`h-12 flex-col gap-1 ${!isRegistered ? 'col-span-2' : ''}`}
                      onClick={onBreakEnd}
                      disabled={isLoading || actionInProgress !== null}
                    >
                      <Hand className="h-4 w-4" />
                      <span className="text-xs">End{isRegistered ? ' (Manual)' : ''}</span>
                    </Button>
                  </div>
                )}

                {/* Clock Out Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {isRegistered && (
                    <Button 
                      variant="destructive"
                      className="h-14 flex-col gap-1"
                      onClick={handleFingerprintClockOut}
                      disabled={isLoading || isAuthenticating || actionInProgress !== null}
                    >
                      {actionInProgress === 'clock-out' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Fingerprint className="h-5 w-5" />
                      )}
                      <span className="text-xs">Clock Out</span>
                    </Button>
                  )}
                  <Button 
                    variant={isRegistered ? "outline" : "destructive"}
                    className={`h-14 flex-col gap-1 ${!isRegistered ? 'col-span-2' : ''}`}
                    onClick={onClockOut}
                    disabled={isLoading || actionInProgress !== null}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <LogOut className="h-5 w-5" />
                    )}
                    <span className="text-xs">Clock Out{isRegistered ? ' (Manual)' : ''}</span>
                  </Button>
                </div>
              </div>
            ) : (
              // Already clocked out
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">You've completed your shift for today!</p>
              </div>
            )}
          </div>

          {/* Fingerprint Setup Prompt or Settings Toggle */}
          {(isSupported || isInIframe) && (
            <>
              <Separator />
              {isInIframe ? (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                  onClick={() => setSetupDialogOpen(true)}
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Fingerprint available after publishing
                </Button>
              ) : !isRegistered ? (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => setSetupDialogOpen(true)}
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Enable fingerprint for faster clock in
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCredentials(!showCredentials)}
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  {showCredentials ? 'Hide' : 'Manage'} fingerprint settings
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Credentials List */}
      {showCredentials && (
        <BiometricCredentialsList onSetupClick={() => setSetupDialogOpen(true)} />
      )}

      {/* Setup Dialog */}
      <FingerprintSetupDialog 
        open={setupDialogOpen} 
        onOpenChange={setSetupDialogOpen} 
      />
    </>
  );
}

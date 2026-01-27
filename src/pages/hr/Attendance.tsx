import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  LogIn, 
  LogOut,
  Coffee,
  UserCheck,
  UserX,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const HRAttendance = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);

  const handleClockIn = () => {
    setIsClockedIn(true);
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    setIsOnBreak(false);
  };

  const handleBreak = () => {
    setIsOnBreak(!isOnBreak);
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <UserCheck className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-rose/10 to-vibrant-pink/10 border-l-4 border-l-vibrant-rose">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <UserX className="h-8 w-8 text-vibrant-rose" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Late Arrivals</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <AlertCircle className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Break</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Coffee className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clock Widget */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Your Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{format(new Date(), 'HH:mm:ss')}</p>
              <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="flex gap-3">
              {!isClockedIn ? (
                <Button 
                  size="lg" 
                  className="bg-vibrant-green hover:bg-vibrant-green/90"
                  onClick={handleClockIn}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Clock In
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    variant={isOnBreak ? "default" : "outline"}
                    onClick={handleBreak}
                    className={isOnBreak ? "bg-vibrant-amber hover:bg-vibrant-amber/90" : ""}
                  >
                    <Coffee className="h-5 w-5 mr-2" />
                    {isOnBreak ? 'End Break' : 'Start Break'}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="destructive"
                    onClick={handleClockOut}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Clock Out
                  </Button>
                </>
              )}
            </div>
            <div className="ml-auto text-right">
              <Badge variant={isClockedIn ? "default" : "secondary"} className="text-sm">
                {isClockedIn ? (isOnBreak ? 'On Break' : 'Clocked In') : 'Not Clocked In'}
              </Badge>
              {isClockedIn && (
                <p className="text-sm text-muted-foreground mt-1">
                  Clocked in at {format(new Date(), 'HH:mm')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-vibrant-blue" />
            Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No attendance records yet</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Staff attendance will appear here once they start clocking in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRAttendance;

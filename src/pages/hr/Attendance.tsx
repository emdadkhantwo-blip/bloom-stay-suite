import { useState, useEffect } from 'react';
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
  Calendar,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { AttendanceTable } from '@/components/hr/AttendanceTable';

const HRAttendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, roles } = useAuth();
  const {
    staffAttendance,
    stats,
    isLoading,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    markPresent,
    isClockingIn,
    isClockingOut,
    isStartingBreak,
    isEndingBreak,
    isMarkingPresent,
  } = useAttendance();

  const isAdmin = roles.includes("owner") || roles.includes("manager");

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find current user's attendance
  const myAttendance = staffAttendance.find(s => s.profile_id === user?.id);

  const handleClockIn = () => {
    if (user?.id) {
      clockIn(user.id);
    }
  };

  const handleClockOut = () => {
    if (myAttendance?.attendance_id) {
      clockOut({ attendanceId: myAttendance.attendance_id, profileId: user?.id || "" });
    }
  };

  const handleStartBreak = () => {
    if (myAttendance?.attendance_id) {
      startBreak(myAttendance.attendance_id);
    }
  };

  const handleEndBreak = () => {
    if (myAttendance?.attendance_id) {
      endBreak(myAttendance.attendance_id);
    }
  };

  const handleMarkPresent = (profileId: string) => {
    markPresent({ profileId });
  };

  const handleAdminClockOut = (attendanceId: string, profileId: string) => {
    clockOut({ attendanceId, profileId });
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
                <p className="text-2xl font-bold">{stats.present}</p>
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
                <p className="text-2xl font-bold">{stats.absent}</p>
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
                <p className="text-2xl font-bold">{stats.late}</p>
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
                <p className="text-2xl font-bold">{stats.onBreak}</p>
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
              <p className="text-4xl font-bold font-mono">{format(currentTime, 'HH:mm:ss')}</p>
              <p className="text-muted-foreground">{format(currentTime, 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="flex gap-3">
              {!myAttendance || myAttendance.status === "absent" ? (
                <Button 
                  size="lg" 
                  className="bg-vibrant-green hover:bg-vibrant-green/90"
                  onClick={handleClockIn}
                  disabled={isClockingIn}
                >
                  {isClockingIn ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="h-5 w-5 mr-2" />
                  )}
                  Clock In
                </Button>
              ) : myAttendance.status !== "clocked_out" ? (
                <>
                  {myAttendance.status === "on_break" ? (
                    <Button 
                      size="lg" 
                      className="bg-vibrant-amber hover:bg-vibrant-amber/90"
                      onClick={handleEndBreak}
                      disabled={isEndingBreak}
                    >
                      {isEndingBreak ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Coffee className="h-5 w-5 mr-2" />
                      )}
                      End Break
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={handleStartBreak}
                      disabled={isStartingBreak}
                    >
                      {isStartingBreak ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Coffee className="h-5 w-5 mr-2" />
                      )}
                      Start Break
                    </Button>
                  )}
                  <Button 
                    size="lg" 
                    variant="destructive"
                    onClick={handleClockOut}
                    disabled={isClockingOut}
                  >
                    {isClockingOut ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="h-5 w-5 mr-2" />
                    )}
                    Clock Out
                  </Button>
                </>
              ) : (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Day Complete
                </Badge>
              )}
            </div>
            <div className="ml-auto text-right">
              <Badge 
                variant={myAttendance?.status === "present" ? "default" : "secondary"} 
                className={`text-sm ${
                  myAttendance?.status === "on_break" ? "bg-vibrant-amber text-white" : 
                  myAttendance?.status === "present" ? "bg-vibrant-green text-white" : ""
                }`}
              >
                {myAttendance?.status === "present" ? 'Clocked In' : 
                 myAttendance?.status === "on_break" ? 'On Break' : 
                 myAttendance?.status === "clocked_out" ? 'Clocked Out' : 'Not Clocked In'}
              </Badge>
              {myAttendance?.clock_in && (
                <p className="text-sm text-muted-foreground mt-1">
                  Clocked in at {format(new Date(myAttendance.clock_in), 'HH:mm')}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AttendanceTable
              staff={staffAttendance}
              isAdmin={isAdmin}
              onMarkPresent={handleMarkPresent}
              onClockOut={handleAdminClockOut}
              isMarkingPresent={isMarkingPresent}
              isClockingOut={isClockingOut}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HRAttendance;

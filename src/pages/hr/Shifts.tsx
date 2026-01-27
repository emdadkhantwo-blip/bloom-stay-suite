import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarClock, 
  Plus, 
  Sun,
  Sunset,
  Moon,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';

const SHIFT_TEMPLATES = [
  { id: 'morning', name: 'Morning', time: '6:00 AM - 2:00 PM', icon: Sun, color: 'bg-vibrant-amber' },
  { id: 'evening', name: 'Evening', time: '2:00 PM - 10:00 PM', icon: Sunset, color: 'bg-vibrant-orange' },
  { id: 'night', name: 'Night', time: '10:00 PM - 6:00 AM', icon: Moon, color: 'bg-vibrant-indigo' },
];

const HRShifts = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToCurrentWeek = () => setCurrentWeek(new Date());

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-cyan/10 to-vibrant-blue/10 border-l-4 border-l-vibrant-cyan">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shifts This Week</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <CalendarClock className="h-8 w-8 text-vibrant-cyan" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Staff Assigned</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Users className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overtime Alerts</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-purple/10 to-vibrant-indigo/10 border-l-4 border-l-vibrant-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shift Templates</p>
                <p className="text-2xl font-bold">{SHIFT_TEMPLATES.length}</p>
              </div>
              <CalendarClock className="h-8 w-8 text-vibrant-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-vibrant-purple" />
              Shift Templates
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SHIFT_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <div 
                  key={template.id}
                  className={`p-4 rounded-lg border-l-4 bg-card hover:bg-muted/50 transition-colors`}
                  style={{ borderLeftColor: `hsl(var(--${template.color.replace('bg-', '')}))` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${template.color}/20`}>
                      <Icon className={`h-5 w-5 ${template.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-vibrant-blue" />
              Weekly Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center">
                <div className="font-medium text-sm">{format(day, 'EEE')}</div>
                <div className={`text-xs text-muted-foreground ${
                  format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                    ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto' 
                    : ''
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 min-h-[200px] border rounded-lg p-4 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <CalendarClock className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No shifts scheduled for this week</p>
              <Button className="mt-3 bg-vibrant-blue hover:bg-vibrant-blue/90" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRShifts;

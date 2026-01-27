import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Plus, 
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Umbrella,
  Heart,
  Briefcase
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const LEAVE_TYPES = [
  { id: 'annual', name: 'Annual Leave', days: 15, color: 'bg-vibrant-blue', icon: Umbrella },
  { id: 'sick', name: 'Sick Leave', days: 10, color: 'bg-vibrant-rose', icon: Heart },
  { id: 'casual', name: 'Casual Leave', days: 5, color: 'bg-vibrant-amber', icon: Calendar },
  { id: 'unpaid', name: 'Unpaid Leave', days: 0, color: 'bg-muted', icon: Briefcase },
];

const HRLeave = () => {
  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Clock className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <CheckCircle className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-rose/10 to-vibrant-pink/10 border-l-4 border-l-vibrant-rose">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <XCircle className="h-8 w-8 text-vibrant-rose" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Leave Today</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <CalendarDays className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Types */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-vibrant-purple" />
                Leave Types
              </CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {LEAVE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div 
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${type.color}/20`}>
                      <Icon className={`h-4 w-4 ${type.color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className="font-medium text-sm">{type.name}</span>
                  </div>
                  <Badge variant="outline">{type.days} days/year</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Leave Requests */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-vibrant-blue" />
                Leave Requests
              </CardTitle>
              <Button className="bg-vibrant-blue hover:bg-vibrant-blue/90">
                <Plus className="h-4 w-4 mr-2" />
                Apply for Leave
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No leave requests</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Leave requests will appear here once staff members apply for leave.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-vibrant-green" />
            Team Leave Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] border rounded-lg p-4 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No scheduled leaves to display</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRLeave;

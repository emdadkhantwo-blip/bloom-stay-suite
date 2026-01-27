import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Timer, 
  Plus, 
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const HROvertime = () => {
  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-orange/10 to-vibrant-amber/10 border-l-4 border-l-vibrant-orange">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Clock className="h-8 w-8 text-vibrant-orange" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Hours</p>
                <p className="text-2xl font-bold">0h</p>
              </div>
              <CheckCircle className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total OT Cost</p>
                <p className="text-2xl font-bold">৳0</p>
              </div>
              <DollarSign className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-purple/10 to-vibrant-indigo/10 border-l-4 border-l-vibrant-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">0h</p>
              </div>
              <TrendingUp className="h-8 w-8 text-vibrant-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-4 w-4 text-vibrant-orange" />
            Overtime Rate Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium">Weekday OT</span>
                <Badge variant="outline">1.5x</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Regular overtime rate</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium">Weekend OT</span>
                <Badge variant="outline">2.0x</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Saturday & Sunday</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium">Holiday OT</span>
                <Badge variant="outline">2.5x</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Public holidays</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-vibrant-orange" />
              Overtime Entries
            </CardTitle>
            <Button className="bg-vibrant-orange hover:bg-vibrant-orange/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Timer className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No overtime entries</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Overtime hours will be automatically tracked from attendance records.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HROvertime;

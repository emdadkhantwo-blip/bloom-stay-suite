import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  Search,
  Filter,
  Clock,
  UserCheck,
  Shield,
  Wallet,
  CalendarDays,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

const ACTION_CATEGORIES = [
  { id: 'login', name: 'Login', icon: UserCheck, color: 'text-vibrant-blue' },
  { id: 'attendance', name: 'Attendance', icon: Clock, color: 'text-vibrant-green' },
  { id: 'role_change', name: 'Role Changes', icon: Shield, color: 'text-vibrant-purple' },
  { id: 'payroll', name: 'Payroll Edits', icon: Wallet, color: 'text-vibrant-amber' },
  { id: 'leave', name: 'Leave Approvals', icon: CalendarDays, color: 'text-vibrant-cyan' },
  { id: 'document', name: 'Documents', icon: FileText, color: 'text-vibrant-rose' },
];

const HRActivity = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-rose/10 to-vibrant-pink/10 border-l-4 border-l-vibrant-rose">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Activity className="h-8 w-8 text-vibrant-rose" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Clock className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-purple/10 to-vibrant-indigo/10 border-l-4 border-l-vibrant-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Role Changes</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Shield className="h-8 w-8 text-vibrant-purple" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Logins Today</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <UserCheck className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTION_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Categories */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {ACTION_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Card 
              key={category.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === category.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(
                selectedCategory === category.id ? 'all' : category.id
              )}
            >
              <CardContent className="p-3 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${category.color}`} />
                <span className="text-sm font-medium">{category.name}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-vibrant-rose" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No activity logs</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              HR activity will be tracked and displayed here for auditing purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRActivity;

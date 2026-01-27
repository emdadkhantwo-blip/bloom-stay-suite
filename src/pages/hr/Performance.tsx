import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  Plus, 
  MessageSquare,
  AlertTriangle,
  Award,
  TrendingUp,
  Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NOTE_TYPES = [
  { id: 'feedback', name: 'Feedback', icon: MessageSquare, color: 'text-vibrant-blue', bg: 'bg-vibrant-blue/10' },
  { id: 'warning', name: 'Warning', icon: AlertTriangle, color: 'text-vibrant-amber', bg: 'bg-vibrant-amber/10' },
  { id: 'reward', name: 'Reward', icon: Award, color: 'text-vibrant-green', bg: 'bg-vibrant-green/10' },
  { id: 'kpi', name: 'KPI Review', icon: TrendingUp, color: 'text-vibrant-purple', bg: 'bg-vibrant-purple/10' },
];

const HRPerformance = () => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <MessageSquare className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rewards</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Award className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-purple/10 to-vibrant-indigo/10 border-l-4 border-l-vibrant-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <Star className="h-8 w-8 text-vibrant-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List with Ratings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-vibrant-blue" />
              Staff Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No staff members to display</p>
            </div>
          </CardContent>
        </Card>

        {/* Performance Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-vibrant-amber" />
                Performance Notes
              </CardTitle>
              <Button className="bg-vibrant-amber hover:bg-vibrant-amber/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                {NOTE_TYPES.map((type) => (
                  <TabsTrigger key={type.id} value={type.id}>
                    {type.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab}>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Star className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No performance notes</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Add performance notes to track employee progress and feedback.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Note Type Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Note Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NOTE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.id} className={`flex items-center gap-3 p-3 rounded-lg ${type.bg}`}>
                  <Icon className={`h-5 w-5 ${type.color}`} />
                  <div>
                    <p className="font-medium text-sm">{type.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRPerformance;

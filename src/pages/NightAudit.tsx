import { useState } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNightAudit } from '@/hooks/useNightAudit';
import { NightAuditChecklist } from '@/components/night-audit/NightAuditChecklist';
import { NightAuditStats } from '@/components/night-audit/NightAuditStats';
import { NightAuditActions } from '@/components/night-audit/NightAuditActions';
import { NightAuditHistory } from '@/components/night-audit/NightAuditHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Moon, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NightAudit() {
  const {
    currentAudit,
    auditHistory,
    preAuditData,
    auditStats,
    businessDate,
    isLoading,
    startAudit,
    postRoomCharges,
    completeAudit,
    refetchPreAudit,
    refetchStats,
  } = useNightAudit();

  const [activeTab, setActiveTab] = useState('audit');

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Night Audit</h1>
              <p className="text-sm text-muted-foreground">
                Close the business day and generate end-of-day reports
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Business Date: {format(new Date(businessDate), 'MMMM d, yyyy')}</span>
            </div>
            {getStatusBadge(currentAudit?.status)}
          </div>
        </div>

        {/* Status Card */}
        {currentAudit?.status === 'completed' && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="flex items-center gap-4 py-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  Night Audit Completed
                </p>
                <p className="text-sm text-muted-foreground">
                  Completed at {currentAudit.completed_at && format(new Date(currentAudit.completed_at), 'h:mm a')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentAudit?.status === 'in_progress' && (
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="flex items-center gap-4 py-4">
              <Clock className="h-8 w-8 text-yellow-500 animate-pulse" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-400">
                  Night Audit In Progress
                </p>
                <p className="text-sm text-muted-foreground">
                  Started at {currentAudit.started_at && format(new Date(currentAudit.started_at), 'h:mm a')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="audit">Run Audit</TabsTrigger>
            <TabsTrigger value="history">Audit History</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-[400px]" />
                <Skeleton className="h-[400px]" />
              </div>
            ) : (
              <>
                {/* Pre-Audit Checklist and Stats */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <NightAuditChecklist
                    checklist={preAuditData}
                    onRefresh={refetchPreAudit}
                  />
                  <NightAuditStats
                    stats={auditStats}
                    onRefresh={refetchStats}
                  />
                </div>

                {/* Audit Actions */}
                <NightAuditActions
                  currentAudit={currentAudit}
                  preAuditData={preAuditData}
                  auditStats={auditStats}
                  onStartAudit={() => startAudit.mutate()}
                  onPostCharges={() => postRoomCharges.mutate()}
                  onCompleteAudit={(notes) => completeAudit.mutate(notes)}
                  isStarting={startAudit.isPending}
                  isPostingCharges={postRoomCharges.isPending}
                  isCompleting={completeAudit.isPending}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="history">
            <NightAuditHistory audits={auditHistory} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

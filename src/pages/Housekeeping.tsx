import { useState, useMemo } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HousekeepingStatsBar } from '@/components/housekeeping/HousekeepingStatsBar';
import { TaskCard } from '@/components/housekeeping/TaskCard';
import { TaskFilters } from '@/components/housekeeping/TaskFilters';
import { CreateTaskDialog } from '@/components/housekeeping/CreateTaskDialog';
import { AssignTaskDialog } from '@/components/housekeeping/AssignTaskDialog';
import { RoomStatusGrid } from '@/components/housekeeping/RoomStatusGrid';
import {
  useHousekeepingTasks,
  useHousekeepingStats,
  useStartTask,
  useCompleteTask,
  type HousekeepingTask,
} from '@/hooks/useHousekeeping';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export default function Housekeeping() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasAnyRole } = useAuth();

  // Only managers, owners, and front_desk can create tasks
  const canCreateTask = hasAnyRole(['owner', 'manager', 'front_desk']);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tasks, isLoading: tasksLoading, refetch } = useHousekeepingTasks();
  const { data: stats, isLoading: statsLoading } = useHousekeepingStats();
  const startTask = useStartTask();
  const completeTask = useCompleteTask();

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const roomNumber = task.room?.room_number?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        if (!roomNumber.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  const handleStartTask = async (taskId: string) => {
    try {
      await startTask.mutateAsync(taskId);
      toast({
        title: 'Task Started',
        description: 'The task has been marked as in progress.',
      });
    } catch (error) {
      console.error('Error starting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to start task.',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask.mutateAsync({ taskId, updateRoomStatus: true });
      toast({
        title: 'Task Completed',
        description: 'The task has been completed and room status updated.',
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete task.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignTask = (task: HousekeepingTask) => {
    setSelectedTask(task);
    setAssignDialogOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['housekeeping-stats'] });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    toast({
      title: 'Refreshed',
      description: 'Data has been refreshed.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <HousekeepingStatsBar stats={stats} isLoading={statsLoading} />

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Housekeeping Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          {canCreateTask && (
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Task List</TabsTrigger>
          <TabsTrigger value="rooms">Room Status</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <TaskFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Task List */}
          {tasksLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tasks found.</p>
              {canCreateTask && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Create First Task
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={handleStartTask}
                  onComplete={handleCompleteTask}
                  onAssign={handleAssignTask}
                  isStarting={startTask.isPending}
                  isCompleting={completeTask.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rooms">
          <RoomStatusGrid />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <AssignTaskDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}

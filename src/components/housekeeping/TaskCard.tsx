import { format } from 'date-fns';
import { Clock, User, Play, CheckCircle, MoreVertical, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: HousekeepingTask;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onAssign: (task: HousekeepingTask) => void;
  onDelete?: (taskId: string) => void;
  canAssign?: boolean;
  canDelete?: boolean;
  isStarting?: boolean;
  isCompleting?: boolean;
  id?: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'Low', color: 'text-slate-500' },
  2: { label: 'Medium', color: 'text-amber-500' },
  3: { label: 'High', color: 'text-orange-500' },
  4: { label: 'Urgent', color: 'text-red-500' },
};

const taskTypeLabels: Record<string, string> = {
  cleaning: 'Standard Cleaning',
  turndown: 'Turndown Service',
  deep_clean: 'Deep Clean',
  inspection: 'Inspection',
};

export function TaskCard({
  task,
  onStart,
  onComplete,
  onAssign,
  onDelete,
  canAssign = true,
  canDelete = true,
  isStarting,
  isCompleting,
  id,
}: TaskCardProps) {
  const status = statusConfig[task.status] || statusConfig.pending;
  const priority = priorityConfig[task.priority] || priorityConfig[1];

  return (
    <Card
      id={id}
      className={cn(
        'transition-all hover:shadow-md',
        task.priority >= 3 && task.status === 'pending' && 'border-l-4 border-l-red-500'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* Room and Task Type */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
                Room {task.room?.room_number}
              </span>
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
              {task.priority >= 3 && (
                <AlertTriangle className={cn('h-4 w-4', priority.color)} />
              )}
            </div>

            {/* Task Details */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {taskTypeLabels[task.task_type] || task.task_type}
              </span>
              <span>•</span>
              <span>{task.room?.room_type?.name}</span>
              {task.room?.floor && (
                <>
                  <span>•</span>
                  <span>Floor {task.room.floor}</span>
                </>
              )}
            </div>

            {/* Priority and Assignment */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={cn('flex items-center gap-1', priority.color)}>
                Priority: {priority.label}
              </span>
              {task.assigned_profile ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  {task.assigned_profile.full_name || task.assigned_profile.username}
                </span>
              ) : (
                <span className="text-muted-foreground italic">Unassigned</span>
              )}
            </div>

            {/* Time Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Created {format(new Date(task.created_at), 'MMM d, h:mm a')}</span>
              {task.started_at && (
                <span className="text-blue-600">
                  • Started {format(new Date(task.started_at), 'h:mm a')}
                </span>
              )}
              {task.completed_at && (
                <span className="text-emerald-600">
                  • Completed {format(new Date(task.completed_at), 'h:mm a')}
                </span>
              )}
            </div>

            {/* Notes */}
            {task.notes && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded px-2 py-1">
                {task.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {task.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStart(task.id)}
                disabled={isStarting}
              >
                <Play className="mr-1 h-3 w-3" />
                Start
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => onComplete(task.id)}
                disabled={isCompleting}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Complete
              </Button>
            )}
            {canAssign && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => onAssign(task)}>
                    <User className="mr-2 h-4 w-4" />
                    {task.assigned_to ? 'Reassign' : 'Assign'} Task
                  </DropdownMenuItem>
                  {canDelete && onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(task.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Task
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

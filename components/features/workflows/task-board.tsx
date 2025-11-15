'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task, TaskStatus, TaskPriority } from '@/types/workflow';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  Ban, 
  User,
  Calendar,
  MoreVertical,
  Hourglass,
  ShieldCheck,
  XCircle,
  CircleSlash
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskExecute?: (taskId: string) => void;
}

interface Column {
  id: TaskStatus;
  title: string;
  icon: typeof Clock;
  color: string;
  bgColor: string;
}

const columns: Column[] = [
  {
    id: 'to_do',
    title: 'To Do',
    icon: Clock,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: PlayCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'blocked',
    title: 'Blocked',
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    id: 'done',
    title: 'Done',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'awaiting_approval',
    title: 'Awaiting Approval',
    icon: Hourglass,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  {
    id: 'approved',
    title: 'Approved',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'rejected',
    title: 'Rejected',
    icon: XCircle,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50'
  },
  {
    id: 'cancelled',
    title: 'Cancelled',
    icon: CircleSlash,
    color: 'text-slate-500',
    bgColor: 'bg-slate-100'
  }
];

function getPriorityColor(priority: TaskPriority): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (priority) {
    case 'critical': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
  }
}

function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case 'critical': return '🔴 Critical';
    case 'high': return '🟠 High';
    case 'medium': return '🟡 Medium';
    case 'low': return '🟢 Low';
    default: return priority;
  }
}

export function TaskBoard({ tasks, onTaskUpdate, onTaskExecute }: TaskBoardProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = new Map<TaskStatus, Task[]>();
    
    columns.forEach(col => {
      grouped.set(col.id, []);
    });

    tasks.forEach(task => {
      const column = grouped.get(task.status);
      if (column) {
        column.push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const handleExecuteTask = (taskId: string) => {
    if (onTaskExecute) {
      onTaskExecute(taskId);
    } else {
      router.push(`/dashboard/workflows/tasks/${taskId}`);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (onTaskUpdate) {
      await onTaskUpdate(taskId, { status: newStatus });
    }
  };

  const renderTaskCard = (task: Task) => {
    const Icon = AlertCircle;
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const totalSteps = task.template_step_count && task.template_step_count > 0 ? task.template_step_count : null;
    const completedSteps = totalSteps ? Math.min(task.current_step_index + 1, totalSteps) : null;
    const progressPercent = totalSteps && completedSteps
      ? Math.round((completedSteps / totalSteps) * 100)
      : null;
    const actionLabel = (() => {
      if (task.status === 'in_progress') return 'Continue';
      if (['done', 'approved'].includes(task.status)) return 'Review';
      if (['cancelled', 'rejected'].includes(task.status)) return 'View';
      return 'Start';
    })();

    return (
      <Card 
        key={task.id} 
        className={`mb-3 cursor-pointer transition-shadow hover:shadow-md ${
          selectedTask === task.id ? 'ring-2 ring-blue-500' : ''
        } ${isOverdue ? 'border-red-300' : ''}`}
        onClick={() => setSelectedTask(task.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium text-slate-900 line-clamp-2">
                {task.title}
              </CardTitle>
              {task.template_name && (
                <CardDescription className="text-xs mt-1">
                  {task.template_name}
                </CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExecuteTask(task.id)}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Execute Task
                </DropdownMenuItem>
                {task.status !== 'to_do' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'to_do')}>
                    Move to To Do
                  </DropdownMenuItem>
                )}
                {task.status !== 'in_progress' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                    Move to In Progress
                  </DropdownMenuItem>
                )}
                {task.status !== 'blocked' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'blocked')}>
                    Move to Blocked
                  </DropdownMenuItem>
                )}
                {task.status !== 'done' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'done')}>
                    Move to Done
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
              {getPriorityLabel(task.priority)}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>

          {task.assigned_to && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <User className="h-3 w-3" />
              <span>Assigned</span>
            </div>
          )}

          {task.due_date && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar className="h-3 w-3" />
              <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          )}

          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-2">
              {task.description}
            </p>
          )}

          {/* Progress indicator */}
          {task.status === 'in_progress' && totalSteps && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>Step {completedSteps} of {totalSteps}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ 
                    width: `${progressPercent}%` 
                  }}
                />
              </div>
            </div>
          )}

          <Button
            size="sm"
            className="w-full mt-2"
            variant={task.status === 'in_progress' ? 'default' : 'outline'}
            onClick={(e) => {
              e.stopPropagation();
              handleExecuteTask(task.id);
            }}
          >
            <PlayCircle className="mr-2 h-3 w-3" />
            {actionLabel}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = tasksByStatus.get(column.id) || [];
          const Icon = column.icon;

          return (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.bgColor} rounded-t-lg p-3 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${column.color}`} />
                    <h3 className="font-semibold text-sm text-slate-900">{column.title}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>
              
              <div className="flex-1 p-3 bg-slate-50 rounded-b-lg min-h-[400px] max-h-[600px] overflow-y-auto">
                {columnTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map(task => renderTaskCard(task))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

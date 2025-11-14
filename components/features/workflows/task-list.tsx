'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Task, TaskStatus, TaskPriority } from '@/types/workflow';
import { 
  Search,
  PlayCircle,
  ChevronRight,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TaskListProps {
  tasks: Task[];
  onTaskExecute?: (taskId: string) => void;
}

function getPriorityColor(priority: TaskPriority): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (priority) {
    case 'critical': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
  }
}

function getStatusColor(status: TaskStatus): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (status) {
    case 'to_do': return 'outline';
    case 'in_progress': return 'default';
    case 'blocked': return 'destructive';
    case 'done': return 'secondary';
    case 'cancelled': return 'outline';
    case 'approved': return 'secondary';
    case 'awaiting_approval': return 'secondary';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
}

function getStatusLabel(status: TaskStatus): string {
  return status
    .split('_')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getActionLabel(status: TaskStatus): string {
  if (status === 'in_progress') return 'Continue';
  if (status === 'to_do' || status === 'blocked' || status === 'awaiting_approval') return 'Start';
  if (status === 'approved' || status === 'done') return 'Review';
  if (status === 'rejected' || status === 'cancelled') return 'View';
  return 'Start';
}

export function TaskList({ tasks, onTaskExecute }: TaskListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.template_name?.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const handleExecuteTask = (taskId: string) => {
    if (onTaskExecute) {
      onTaskExecute(taskId);
    } else {
      router.push(`/dashboard/workflows/tasks/${taskId}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{filteredTasks.length} tasks</Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="border border-slate-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="to_do">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="border border-slate-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors ${
                    isOverdue ? 'border-red-200 bg-red-50/50' : ''
                  }`}
                  onClick={() => handleExecuteTask(task.id)}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900 truncate">
                        {task.title}
                      </h4>
                      {isOverdue && (
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>

                    {task.template_name && (
                      <p className="text-sm text-slate-600 truncate">
                        {task.template_name}
                      </p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={getStatusColor(task.status)} className="text-xs">
                        {getStatusLabel(task.status)}
                      </Badge>
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>

                      {task.assigned_to && (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <User className="h-3 w-3" />
                          <span>Assigned</span>
                        </div>
                      )}

                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Hierarchy indicator */}
                    {task.hierarchy_level > 0 && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <ChevronRight className="h-3 w-3" />
                        <span>Level {task.hierarchy_level}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecuteTask(task.id);
                    }}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {getActionLabel(task.status)}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

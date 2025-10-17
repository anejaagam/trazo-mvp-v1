import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { mockTasks, mockTemplates } from '../../lib/mockData';
import { Task } from '../../lib/types';
import { Clock, Play, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { TaskExecutor } from './TaskExecutor';

export function TaskList() {
  const [tasks] = useState(mockTasks);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [executingTask, setExecutingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesStatus && matchesPriority;
    }).sort((a, b) => {
      // Sort by priority and due date
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      if (a.dueAt && b.dueAt) {
        return a.dueAt.getTime() - b.dueAt.getTime();
      }
      
      return 0;
    });
  }, [tasks, statusFilter, priorityFilter]);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (executingTask) {
    return (
      <TaskExecutor 
        task={executingTask} 
        onClose={() => setExecutingTask(null)}
        onComplete={() => {
          setExecutingTask(null);
          // In real app, update task status
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900">My Tasks</h2>
        <p className="text-slate-600">Execute and track your assigned tasks</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map(task => {
          const template = mockTemplates.find(t => t.id === task.templateId);
          const progress = template 
            ? Math.round((task.currentStepIndex / template.steps.length) * 100)
            : 0;

          return (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Task Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-slate-900">{task.templateName}</h3>
                          <Badge variant={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge variant={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="text-slate-600 mt-1 space-y-1">
                          {task.assignedTo && (
                            <div>Assigned to: {task.assignedTo}</div>
                          )}
                          {task.dueAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {task.dueAt.toLocaleString()}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{task.scheduleMode.replace('_', ' ')}</Badge>
                            {template && (
                              <span>
                                Step {task.currentStepIndex} of {template.steps.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {task.status !== 'completed' && progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <Button onClick={() => setExecutingTask(task)}>
                        <Play className="w-4 h-4 mr-2" />
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button onClick={() => setExecutingTask(task)}>
                        Continue
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Button variant="outline" onClick={() => setExecutingTask(task)}>
                        View Details
                      </Button>
                    )}
                    {task.status === 'overdue' && (
                      <Button variant="destructive" onClick={() => setExecutingTask(task)}>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Urgent
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No tasks found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

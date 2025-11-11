import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { mockTasks, mockTemplates } from '../../lib/mockData';
import { Task } from '../../lib/types';
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';

export function TaskBoard() {
  const [tasks] = useState(mockTasks);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => t.status === 'overdue').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, inProgress, completed, overdue, completionRate };
  }, [tasks]);

  const groupedByAssignee = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    
    tasks.forEach(task => {
      const assignee = task.assignedTo || 'Unassigned';
      if (!grouped.has(assignee)) {
        grouped.set(assignee, []);
      }
      grouped.get(assignee)!.push(task);
    });

    return Array.from(grouped.entries()).map(([assignee, tasks]) => ({
      assignee,
      tasks,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.status === 'overdue').length
    }));
  }, [tasks]);

  const urgentTasks = useMemo(() => {
    return tasks.filter(t => 
      (t.priority === 'urgent' || t.status === 'overdue') && 
      t.status !== 'completed'
    );
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{stats.pending}</div>
            <p className="text-slate-600">Awaiting start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{stats.inProgress}</div>
            <p className="text-slate-600">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{stats.completed}</div>
            <p className="text-slate-600">Finished today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{stats.overdue}</div>
            <p className="text-slate-600">Past SLA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Urgent Tasks Alert */}
      {urgentTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Urgent Attention Required
            </CardTitle>
            <CardDescription className="text-red-700">
              {urgentTasks.length} task{urgentTasks.length !== 1 ? 's' : ''} require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgentTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-200">
                <div>
                  <div className="text-slate-900">{task.templateName}</div>
                  <div className="text-slate-600">
                    {task.assignedTo || 'Unassigned'} • Due {task.dueAt?.toLocaleString()}
                  </div>
                </div>
                <Badge variant={task.status === 'overdue' ? 'destructive' : 'default'}>
                  {task.status === 'overdue' ? 'OVERDUE' : task.priority.toUpperCase()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Workload by Assignee */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Workload Distribution
          </CardTitle>
          <CardDescription>Task assignment and progress by team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedByAssignee.map(({ assignee, tasks, pending, inProgress, completed, overdue }) => (
              <div key={assignee} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-slate-900">{assignee}</div>
                    <div className="text-slate-600">{tasks.length} total tasks</div>
                  </div>
                  <div className="flex gap-2">
                    {overdue > 0 && (
                      <Badge variant="destructive">{overdue} overdue</Badge>
                    )}
                    {pending > 0 && (
                      <Badge variant="secondary">{pending} pending</Badge>
                    )}
                    {inProgress > 0 && (
                      <Badge variant="default">{inProgress} active</Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-slate-50 rounded">
                    <div className="text-slate-900">{pending}</div>
                    <div className="text-slate-600">Pending</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-slate-900">{inProgress}</div>
                    <div className="text-slate-600">Active</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-slate-900">{completed}</div>
                    <div className="text-slate-600">Done</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-slate-900">{overdue}</div>
                    <div className="text-slate-600">Overdue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest task updates and completions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks
              .sort((a, b) => {
                const aTime = a.completedAt || a.startedAt || a.createdAt;
                const bTime = b.completedAt || b.startedAt || b.createdAt;
                return bTime.getTime() - aTime.getTime();
              })
              .slice(0, 5)
              .map(task => {
                const template = mockTemplates.find(t => t.id === task.templateId);
                const latestTime = task.completedAt || task.startedAt || task.createdAt;
                const action = task.completedAt ? 'completed' : task.startedAt ? 'started' : 'created';
                
                return (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1">
                      <div className="text-slate-900">{task.templateName}</div>
                      <div className="text-slate-600">
                        {task.assignedTo || 'Unassigned'} {action} • {latestTime.toLocaleString()}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'overdue' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

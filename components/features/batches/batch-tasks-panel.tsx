'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Link2,
  FileText
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/use-permissions'

interface Task {
  id: string
  title: string
  status: string
  priority?: string
  due_date?: string
  assigned_to?: string
  completed_at?: string
  assigned_user?: {
    full_name?: string
    email?: string
  } | null
  sop_template?: {
    name?: string
    category?: string
  } | null
}

interface SOPLink {
  id: string
  stage?: string | null
  auto_create: boolean
  sop_template?: {
    id: string
    name: string
    category?: string
    description?: string
  } | null
}

interface BatchTasksPanelProps {
  batchId: string
  onLinkTemplate?: () => void
  onCreateTask?: () => void
}

const STATUS_CONFIG = {
  to_do: { icon: Clock, label: 'To Do', color: 'text-slate-500 bg-slate-100' },
  in_progress: { icon: PlayCircle, label: 'In Progress', color: 'text-blue-600 bg-blue-100' },
  done: { icon: CheckCircle2, label: 'Done', color: 'text-green-600 bg-green-100' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-600 bg-red-100' },
  blocked: { icon: AlertCircle, label: 'Blocked', color: 'text-amber-600 bg-amber-100' },
  approved: { icon: CheckCircle2, label: 'Approved', color: 'text-emerald-600 bg-emerald-100' },
}

const PRIORITY_CONFIG = {
  low: { color: 'text-slate-600', bg: 'bg-slate-100' },
  medium: { color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { color: 'text-amber-600', bg: 'bg-amber-100' },
  critical: { color: 'text-red-600', bg: 'bg-red-100' },
}

export function BatchTasksPanel({ batchId, onLinkTemplate, onCreateTask }: BatchTasksPanelProps) {
  const { can } = usePermissions()
  const [tasks, setTasks] = useState<Task[]>([])
  const [sopLinks, setSopLinks] = useState<SOPLink[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          assigned_to,
          completed_at,
          assigned_user:users!tasks_assigned_to_fkey (
            id,
            full_name,
            email
          ),
          sop_template:sop_templates (
            id,
            name,
            category
          )
        `)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      // Load SOP links
      const { data: linksData, error: linksError } = await supabase
        .from('batch_sop_links')
        .select(`
          id,
          stage,
          auto_create,
          sop_template:sop_templates (
            id,
            name,
            category,
            description
          )
        `)
        .eq('batch_id', batchId)

      if (linksError) throw linksError
      setSopLinks(linksData || [])
    } catch (error) {
      console.error('Error loading batch tasks:', error)
      toast.error('Failed to load batch tasks and SOPs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId])

  const filteredTasks = tasks.filter(task => 
    statusFilter === 'all' || task.status === statusFilter
  )

  const taskStats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    to_do: tasks.filter(t => t.status === 'to_do').length,
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SOP Links Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Linked SOP Templates
              </CardTitle>
              <CardDescription>
                Standard operating procedures linked to this batch
              </CardDescription>
            </div>
            {can('batch:tasks_link') && (
              <Button onClick={onLinkTemplate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Link Template
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sopLinks.length === 0 ? (
            <Alert>
              <AlertDescription>
                No SOP templates linked to this batch yet.
                {can('batch:tasks_link') && ' Click "Link Template" to add one.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {sopLinks.map(link => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{link.sop_template?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {link.sop_template?.category || 'N/A'}
                        {link.stage && ` • Stage: ${link.stage}`}
                      </p>
                    </div>
                  </div>
                  {link.auto_create && (
                    <Badge variant="secondary">Auto-creates tasks</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                {taskStats.done} of {taskStats.total} tasks completed
              </CardDescription>
            </div>
            {can('task:create') && (
              <Button onClick={onCreateTask} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Status Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({taskStats.total})
            </Button>
            <Button
              variant={statusFilter === 'to_do' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('to_do')}
            >
              To Do ({taskStats.to_do})
            </Button>
            <Button
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('in_progress')}
            >
              In Progress ({taskStats.in_progress})
            </Button>
            <Button
              variant={statusFilter === 'done' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('done')}
            >
              Done ({taskStats.done})
            </Button>
          </div>

          {/* Tasks Table */}
          {filteredTasks.length === 0 ? (
            <Alert>
              <AlertDescription>
                {statusFilter === 'all' 
                  ? 'No tasks created for this batch yet.'
                  : `No ${statusFilter.replace('_', ' ')} tasks.`}
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map(task => {
                  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.to_do
                  const StatusIcon = statusConfig.icon
                  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium

                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.sop_template?.name && (
                            <p className="text-sm text-muted-foreground">
                              {task.sop_template.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.priority && (
                          <Badge 
                            variant="outline" 
                            className={`${priorityConfig.color} ${priorityConfig.bg}`}
                          >
                            {task.priority}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.assigned_user?.full_name || task.assigned_user?.email || '-'}
                      </TableCell>
                      <TableCell>
                        {task.due_date 
                          ? new Date(task.due_date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

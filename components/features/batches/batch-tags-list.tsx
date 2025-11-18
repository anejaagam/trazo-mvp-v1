'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tag, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface BatchTagsListProps {
  batchId: string
  batchNumber: string
  tags: string[]
  plantCount: number
  onManageTags?: () => void
}

export function BatchTagsList({
  batchId,
  batchNumber,
  tags,
  plantCount,
  onManageTags,
}: BatchTagsListProps) {
  const [copiedTag, setCopiedTag] = useState<string | null>(null)

  const copyTag = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag)
      setCopiedTag(tag)
      toast.success('Tag copied to clipboard')
      setTimeout(() => setCopiedTag(null), 2000)
    } catch (error) {
      toast.error('Failed to copy tag')
    }
  }

  const copyAllTags = async () => {
    try {
      await navigator.clipboard.writeText(tags.join('\n'))
      toast.success(`Copied ${tags.length} tags to clipboard`)
    } catch (error) {
      toast.error('Failed to copy tags')
    }
  }

  const completion = tags.length > 0 ? (tags.length / plantCount) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            <div>
              <CardTitle>Metrc Plant Tags</CardTitle>
              <CardDescription>
                {tags.length} of {plantCount} plants tagged ({completion.toFixed(0)}%)
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {tags.length > 0 && (
              <Button variant="outline" size="sm" onClick={copyAllTags}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            )}
            {onManageTags && (
              <Button variant="outline" size="sm" onClick={onManageTags}>
                Manage Tags
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {tags.length > 0 && (
        <CardContent>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {tags.map((tag, index) => (
              <div
                key={tag}
                className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">#{index + 1}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {tag}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyTag(tag)}
                >
                  {copiedTag === tag ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tag, ChevronsUpDown, Check, Loader2, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AvailableTag {
  id: string
  tag_number: string
  tag_type: string
  status: string
}

interface AvailableTagSelectorProps {
  siteId: string
  tagType?: 'Plant' | 'Package'
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  excludeTags?: string[]
  maxTags?: number
  disabled?: boolean
  className?: string
  placeholder?: string
  showMultiSelect?: boolean
}

export function AvailableTagSelector({
  siteId,
  tagType = 'Plant',
  selectedTags,
  onTagsChange,
  excludeTags = [],
  maxTags,
  disabled = false,
  className,
  placeholder = 'Select tags...',
  showMultiSelect = true,
}: AvailableTagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadTags = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!siteId) return

    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        site_id: siteId,
        tag_type: tagType,
        status: 'available',
        page: pageNum.toString(),
        limit: '50',
      })

      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/tags/list?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to load tags')
      }

      const data = await response.json()
      const newTags = (data.tags || []).filter(
        (tag: AvailableTag) => !excludeTags.includes(tag.tag_number)
      )

      if (append) {
        setAvailableTags((prev) => [...prev, ...newTags])
      } else {
        setAvailableTags(newTags)
      }

      setHasMore(newTags.length === 50)
      setPage(pageNum)
    } catch (error) {
      console.error('Error loading available tags:', error)
      toast.error('Failed to load available tags')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, tagType, searchQuery, excludeTags])

  useEffect(() => {
    if (open) {
      loadTags(1, false)
    }
  }, [open, loadTags])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
    // Debounce search
    const timer = setTimeout(() => {
      loadTags(1, false)
    }, 300)
    return () => clearTimeout(timer)
  }

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadTags(page + 1, true)
    }
  }

  const toggleTag = (tagNumber: string) => {
    if (selectedTags.includes(tagNumber)) {
      onTagsChange(selectedTags.filter((t) => t !== tagNumber))
    } else {
      if (maxTags && selectedTags.length >= maxTags) {
        toast.warning(`Maximum ${maxTags} tags allowed`)
        return
      }
      onTagsChange([...selectedTags, tagNumber])
    }
  }

  const removeTag = (tagNumber: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tagNumber))
  }

  const clearAll = () => {
    onTagsChange([])
  }

  // Single select mode
  if (!showMultiSelect) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between', className)}
            disabled={disabled}
          >
            {selectedTags.length > 0
              ? `...${selectedTags[0].slice(-12)}`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={searchQuery}
              onValueChange={handleSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  'No available tags found.'
                )}
              </CommandEmpty>
              <CommandGroup heading="Available Tags">
                {availableTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.tag_number}
                    onSelect={() => {
                      onTagsChange([tag.tag_number])
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedTags.includes(tag.tag_number)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <Tag className="h-3 w-3 mr-2 text-muted-foreground" />
                    <span className="font-mono text-sm">{tag.tag_number}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {hasMore && (
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Load more
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // Multi-select mode
  return (
    <div className={cn('space-y-3', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {selectedTags.length > 0
                ? `${selectedTags.length} tag(s) selected`
                : placeholder}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[450px] p-0" align="start">
          <div className="p-3 border-b">
            <Input
              placeholder="Search available tags..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9"
            />
          </div>
          <ScrollArea className="h-[300px]">
            {isLoading && availableTags.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading tags...</span>
              </div>
            ) : availableTags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No available tags found</p>
                <p className="text-xs">Sync tags from Metrc to get started</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {availableTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors',
                      selectedTags.includes(tag.tag_number) && 'bg-emerald-50'
                    )}
                    onClick={() => toggleTag(tag.tag_number)}
                  >
                    <Checkbox
                      checked={selectedTags.includes(tag.tag_number)}
                      onCheckedChange={() => toggleTag(tag.tag_number)}
                    />
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-sm flex-1">{tag.tag_number}</span>
                    {selectedTags.includes(tag.tag_number) && (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                ))}
                {hasMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Load more tags
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
          {selectedTags.length > 0 && (
            <div className="p-3 border-t bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedTags.length} selected
                  {maxTags && ` / ${maxTags} max`}
                </span>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 bg-emerald-50 rounded-md border border-emerald-200">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="text-xs font-mono bg-emerald-600 hover:bg-emerald-700 gap-1 pr-1"
            >
              <Check className="h-3 w-3" />
              ...{tag.slice(-8)}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-emerald-800 rounded p-0.5"
                title="Remove tag"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// Single tag selector for batch creation (selects one batch tag)
export function BatchTagSelector({
  siteId,
  selectedTag,
  onTagChange,
  disabled = false,
  className,
}: {
  siteId: string
  selectedTag: string | null
  onTagChange: (tag: string | null) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <AvailableTagSelector
      siteId={siteId}
      tagType="Plant"
      selectedTags={selectedTag ? [selectedTag] : []}
      onTagsChange={(tags) => onTagChange(tags[0] || null)}
      disabled={disabled}
      className={className}
      placeholder="Select a batch tag..."
      showMultiSelect={false}
    />
  )
}

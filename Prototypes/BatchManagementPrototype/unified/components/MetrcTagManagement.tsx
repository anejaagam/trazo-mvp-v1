import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Tag, 
  QrCode, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { ICannabisBatch } from '../types/domains/cannabis';

interface MetrcTag {
  id: string;
  tagNumber: string;
  tagType: 'plant' | 'package' | 'source_package';
  status: 'active' | 'used' | 'void' | 'pending';
  assignedDate?: string;
  assignedTo?: string;
}

interface MetrcTagManagementProps {
  batch: ICannabisBatch;
  availableTags?: MetrcTag[];
  assignedTags?: MetrcTag[];
  onAssignTag?: (batchId: string, tagNumber: string, tagType: string) => void;
  onRemoveTag?: (batchId: string, tagId: string) => void;
  onSyncMetrc?: (batchId: string) => void;
  metrcSyncStatus?: 'synced' | 'pending' | 'error' | 'not-configured';
}

export const MetrcTagManagement: React.FC<MetrcTagManagementProps> = ({
  batch,
  availableTags = [],
  assignedTags = [],
  onAssignTag,
  onRemoveTag,
  onSyncMetrc,
  metrcSyncStatus = 'not-configured'
}) => {
  const [newTagNumber, setNewTagNumber] = useState('');
  const [selectedTagType, setSelectedTagType] = useState<'plant' | 'package' | 'source_package'>('package');
  const [showAddTag, setShowAddTag] = useState(false);

  const plantTags = assignedTags.filter(t => t.tagType === 'plant');
  const packageTags = assignedTags.filter(t => t.tagType === 'package');
  const sourceTags = assignedTags.filter(t => t.tagType === 'source_package');

  const handleAssignTag = () => {
    if (onAssignTag && newTagNumber) {
      onAssignTag(batch.id, newTagNumber, selectedTagType);
      setNewTagNumber('');
      setShowAddTag(false);
    }
  };

  const getSyncStatusBadge = () => {
    switch (metrcSyncStatus) {
      case 'synced':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Synced
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending Sync
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Sync Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Not Configured
          </Badge>
        );
    }
  };

  const renderTagGroup = (title: string, tags: MetrcTag[], tagType: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{title}</h4>
        <Badge variant="outline">{tags.length} tags</Badge>
      </div>
      {tags.length === 0 ? (
        <div className="text-sm text-muted-foreground italic p-3 border rounded-lg bg-gray-50">
          No {tagType.replace('_', ' ')} tags assigned
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <QrCode className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-mono text-sm font-medium">{tag.tagNumber}</div>
                  {tag.assignedDate && (
                    <div className="text-xs text-muted-foreground">
                      Assigned: {new Date(tag.assignedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline"
                  className={
                    tag.status === 'active' ? 'bg-green-50 text-green-700' :
                    tag.status === 'used' ? 'bg-gray-50 text-gray-700' :
                    tag.status === 'void' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }
                >
                  {tag.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveTag?.(batch.id, tag.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* METRC Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              METRC Tag Management
            </span>
            {getSyncStatusBadge()}
          </CardTitle>
          <CardDescription>
            Track and manage METRC compliance tags for regulatory reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{plantTags.length}</div>
              <div className="text-sm text-muted-foreground">Plant Tags</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{packageTags.length}</div>
              <div className="text-sm text-muted-foreground">Package Tags</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{sourceTags.length}</div>
              <div className="text-sm text-muted-foreground">Source Tags</div>
            </div>
          </div>

          {/* Sync Button */}
          {metrcSyncStatus !== 'not-configured' && (
            <Button
              onClick={() => onSyncMetrc?.(batch.id)}
              variant="outline"
              className="w-full"
              disabled={metrcSyncStatus === 'synced'}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              {metrcSyncStatus === 'synced' ? 'Synchronized with METRC' : 'Sync with METRC'}
            </Button>
          )}

          {metrcSyncStatus === 'not-configured' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                METRC integration not configured. Tags are being tracked locally for future sync.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Assigned Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Assigned Tags
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddTag(!showAddTag)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Tag
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Tag */}
          {showAddTag && (
            <div className="p-4 border rounded-lg bg-blue-50 space-y-3">
              <h4 className="font-medium">Assign New Tag</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tag-type">Tag Type</Label>
                  <select
                    id="tag-type"
                    value={selectedTagType}
                    onChange={(e) => setSelectedTagType(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="plant">Plant Tag</option>
                    <option value="package">Package Tag</option>
                    <option value="source_package">Source Package Tag</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-number">Tag Number</Label>
                  <Input
                    id="tag-number"
                    value={newTagNumber}
                    onChange={(e) => setNewTagNumber(e.target.value)}
                    placeholder="1A4060300000001000000000"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAssignTag}
                  disabled={!newTagNumber}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign Tag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddTag(false);
                    setNewTagNumber('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Tag Groups */}
          {renderTagGroup('Plant Tags', plantTags, 'plant')}
          {renderTagGroup('Package Tags', packageTags, 'package')}
          {renderTagGroup('Source Package Tags', sourceTags, 'source_package')}
        </CardContent>
      </Card>

      {/* Available Tags (if provided) */}
      {availableTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available METRC Tags</CardTitle>
            <CardDescription>Unused tags available for assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableTags.slice(0, 10).map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-mono text-sm">{tag.tagNumber}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{tag.tagType.replace('_', ' ')}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewTagNumber(tag.tagNumber);
                        setSelectedTagType(tag.tagType);
                        setShowAddTag(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Warning */}
      {batch.stage === 'packaging' && packageTags.length === 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Package tags must be assigned before products can be transferred or sold. METRC reporting required.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

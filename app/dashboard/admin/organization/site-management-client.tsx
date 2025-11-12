'use client';

/**
 * SiteManagementClient Component
 * Client-side component for managing organization sites
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2, MapPin, Building2, Boxes, ChevronDown, ChevronRight, DoorOpen } from 'lucide-react';
import { SiteFormDialog } from '@/components/features/admin/site-form-dialog';
import { DeleteSiteDialog } from '@/components/features/admin/delete-site-dialog';
import { RoomFormDialog } from '@/components/features/admin/room-form-dialog';
import { DeleteRoomDialog } from '@/components/features/admin/delete-room-dialog';
import { PodAssignmentDialog } from '@/components/features/admin/pod-assignment-dialog';

interface Site {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  timezone?: string;
  max_pods?: number;
  site_license_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  room_count: number;
  pod_count: number;
  user_count: number;
}

interface Room {
  id: string;
  site_id: string;
  name: string;
  room_type: 'veg' | 'flower' | 'mother' | 'clone' | 'dry' | 'cure' | 'mixed' | 'processing' | 'storage';
  capacity_pods?: number;
  environmental_zone?: string;
  length_ft?: number;
  width_ft?: number;
  height_ft?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pod_count?: number;
}

interface Pod {
  id: string;
  name: string;
  room_id: string;
  status: string;
  pod_serial_number?: string;
  is_active: boolean;
}

interface Organization {
  id: string;
  name: string;
  jurisdiction: string;
  created_at: string;
}

interface SiteManagementClientProps {
  organization: Organization;
  initialSites: Site[];
}

export function SiteManagementClient({
  organization,
  initialSites,
}: SiteManagementClientProps) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  
  // Room management state
  const [roomFormDialogOpen, setRoomFormDialogOpen] = useState(false);
  const [deleteRoomDialogOpen, setDeleteRoomDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedSiteForRooms, setSelectedSiteForRooms] = useState<string | null>(null);
  const [siteRooms, setSiteRooms] = useState<Map<string, Room[]>>(new Map());
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  
  // Pod management state
  const [podAssignmentDialogOpen, setPodAssignmentDialogOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [selectedPodSiteId, setSelectedPodSiteId] = useState<string>('');
  const [roomPods, setRoomPods] = useState<Map<string, Pod[]>>(new Map());
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  const totalSites = sites.filter(s => s.is_active).length;
  const totalRooms = sites.reduce((sum, s) => sum + (s.room_count || 0), 0);
  const totalPods = sites.reduce((sum, s) => sum + (s.pod_count || 0), 0);
  const totalCapacity = sites.reduce((sum, s) => sum + (s.max_pods || 0), 0);

  const handleRefresh = async () => {
    try {
      const response = await fetch('/api/admin/organizations/sites');
      const data = await response.json();
      if (response.ok) {
        setSites(data.sites || []);
      }
    } catch (error) {
      console.error('Error refreshing sites:', error);
    }
  };

  const handleCreateSite = () => {
    setSelectedSite(null);
    setFormDialogOpen(true);
  };

  const handleEditSite = (site: Site) => {
    setSelectedSite(site);
    setFormDialogOpen(true);
  };

  const handleDeleteSite = (site: Site) => {
    setSelectedSite(site);
    setDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    handleRefresh();
  };

  const handleDeleteSuccess = () => {
    handleRefresh();
  };

  // Room handlers
  const fetchRooms = async (siteId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/sites/${siteId}/rooms`);
      const data = await response.json();
      if (response.ok) {
        setSiteRooms(prev => new Map(prev).set(siteId, data.rooms || []));
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const toggleSiteExpanded = async (siteId: string) => {
    const newExpanded = new Set(expandedSites);
    if (newExpanded.has(siteId)) {
      newExpanded.delete(siteId);
    } else {
      newExpanded.add(siteId);
      // Fetch rooms if not already loaded
      if (!siteRooms.has(siteId)) {
        await fetchRooms(siteId);
      }
    }
    setExpandedSites(newExpanded);
  };

  const handleCreateRoom = (siteId: string) => {
    setSelectedRoom(null);
    setSelectedSiteForRooms(siteId);
    setRoomFormDialogOpen(true);
  };

  const handleEditRoom = (room: Room, siteId: string) => {
    setSelectedRoom(room);
    setSelectedSiteForRooms(siteId);
    setRoomFormDialogOpen(true);
  };

  const handleDeleteRoom = (room: Room, siteId: string) => {
    setSelectedRoom(room);
    setSelectedSiteForRooms(siteId);
    setDeleteRoomDialogOpen(true);
  };

  const handleRoomFormSuccess = () => {
    if (selectedSiteForRooms) {
      fetchRooms(selectedSiteForRooms);
    }
    handleRefresh();
  };

  const handleRoomDeleteSuccess = () => {
    if (selectedSiteForRooms) {
      fetchRooms(selectedSiteForRooms);
    }
    handleRefresh();
  };

  // Pod handlers
  const fetchPods = async (roomId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/rooms/${roomId}/pods`);
      const data = await response.json();
      if (response.ok) {
        setRoomPods(prev => new Map(prev).set(roomId, data.pods || []));
      }
    } catch (error) {
      console.error('Error fetching pods:', error);
    }
  };

  const toggleRoomExpanded = async (roomId: string) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId);
    } else {
      newExpanded.add(roomId);
      // Fetch pods if not already loaded
      if (!roomPods.has(roomId)) {
        await fetchPods(roomId);
      }
    }
    setExpandedRooms(newExpanded);
  };

  const handleReassignPod = (pod: Pod, siteId: string) => {
    setSelectedPod(pod);
    setSelectedPodSiteId(siteId);
    setPodAssignmentDialogOpen(true);
  };

  const handlePodAssignmentSuccess = () => {
    // Refresh rooms to update pod counts
    if (selectedSiteForRooms) {
      fetchRooms(selectedSiteForRooms);
    }
    // Refresh pods in the affected room
    if (selectedPod?.room_id) {
      fetchPods(selectedPod.room_id);
    }
    handleRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization sites and view infrastructure overview
        </p>
      </div>

      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Basic information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Organization Name</p>
              <p className="font-medium">{organization.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jurisdiction</p>
              <p className="font-medium">{organization.jurisdiction}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {new Date(organization.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSites}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
            <p className="text-xs text-muted-foreground">Across all sites</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pods</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPods}</div>
            <p className="text-xs text-muted-foreground">Deployed pods</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pod Capacity</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground">
              {totalPods > 0 ? `${Math.round((totalPods / totalCapacity) * 100)}% utilized` : 'No pods'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sites Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sites</CardTitle>
            <CardDescription>
              Manage physical locations and view pod deployment
            </CardDescription>
          </div>
          <Button onClick={handleCreateSite}>
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No sites yet</p>
              <p className="text-sm mt-1">Create your first site to get started</p>
              <Button onClick={handleCreateSite} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Site
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Pods</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => {
                  const isExpanded = expandedSites.has(site.id);
                  const rooms = siteRooms.get(site.id) || [];
                  
                  return (
                    <React.Fragment key={site.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto"
                            disabled={!site.is_active || site.room_count === 0}
                            onClick={() => toggleSiteExpanded(site.id)}
                          >
                            {site.room_count > 0 ? (
                              isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )
                            ) : null}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{site.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {site.city && site.state_province ? (
                              <>
                                {site.city}, {site.state_province}
                              </>
                            ) : site.address || (
                              <span className="text-muted-foreground">No address</span>
                            )}
                          </div>
                        </TableCell>
                          <TableCell>{site.user_count || 0}</TableCell>
                          <TableCell>{site.room_count || 0}</TableCell>
                          <TableCell>{site.pod_count || 0}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {site.max_pods || 0}
                              {site.pod_count > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({Math.round(((site.pod_count || 0) / (site.max_pods || 1)) * 100)}%)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={site.is_active ? 'default' : 'secondary'}>
                              {site.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditSite(site)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Site
                                </DropdownMenuItem>
                                {site.is_active && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteSite(site)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expandable Rooms Section */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/30 p-0">
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="text-sm font-semibold">
                                      Rooms at {site.name}
                                    </h4>
                                  </div>
                                  {site.is_active && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCreateRoom(site.id)}
                                    >
                                      <Plus className="mr-2 h-3 w-3" />
                                      Add Room
                                    </Button>
                                  )}
                                </div>
                                
                                {rooms.length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <DoorOpen className="mx-auto h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm">No rooms configured</p>
                                  </div>
                                ) : (
                                  <div className="border rounded-md">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[30px]"></TableHead>
                                          <TableHead className="w-[200px]">Room Name</TableHead>
                                          <TableHead>Type</TableHead>
                                          <TableHead>Capacity</TableHead>
                                          <TableHead>Pods</TableHead>
                                          <TableHead>Dimensions</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {rooms.map((room) => {
                                          const isRoomExpanded = expandedRooms.has(room.id);
                                          const pods = roomPods.get(room.id) || [];
                                          
                                          return (
                                            <React.Fragment key={room.id}>
                                              <TableRow>
                                                <TableCell>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-0 h-auto"
                                                    disabled={!room.is_active || (room.pod_count || 0) === 0}
                                                    onClick={() => toggleRoomExpanded(room.id)}
                                                  >
                                                    {(room.pod_count || 0) > 0 ? (
                                                      isRoomExpanded ? (
                                                        <ChevronDown className="h-3 w-3" />
                                                      ) : (
                                                        <ChevronRight className="h-3 w-3" />
                                                      )
                                                    ) : null}
                                                  </Button>
                                                </TableCell>
                                                <TableCell className="font-medium">{room.name}</TableCell>
                                                <TableCell>
                                                  <Badge variant="outline" className="capitalize">
                                                    {room.room_type}
                                                  </Badge>
                                                </TableCell>
                                                  <TableCell>{room.capacity_pods || 0}</TableCell>
                                                  <TableCell>{room.pod_count || 0}</TableCell>
                                                  <TableCell>
                                                    <div className="text-sm text-muted-foreground">
                                                      {room.length_ft && room.width_ft && room.height_ft ? (
                                                        <>
                                                          {room.length_ft}×{room.width_ft}×{room.height_ft} ft
                                                          <br />
                                                          <span className="text-xs">
                                                            {(room.length_ft * room.width_ft).toFixed(0)} sq ft
                                                          </span>
                                                        </>
                                                      ) : (
                                                        'Not set'
                                                      )}
                                                    </div>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Badge variant={room.is_active ? 'default' : 'secondary'}>
                                                      {room.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell>
                                                    <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                          <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditRoom(room, site.id)}>
                                                          <Edit className="mr-2 h-4 w-4" />
                                                          Edit Room
                                                        </DropdownMenuItem>
                                                        {room.is_active && (
                                                          <DropdownMenuItem
                                                            onClick={() => handleDeleteRoom(room, site.id)}
                                                            className="text-red-600 dark:text-red-400"
                                                          >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                          </DropdownMenuItem>
                                                        )}
                                                      </DropdownMenuContent>
                                                    </DropdownMenu>
                                                  </TableCell>
                                                </TableRow>
                                                
                                                {/* Expandable Pods Section */}
                                                {isRoomExpanded && (
                                                  <TableRow>
                                                    <TableCell colSpan={9} className="bg-muted/50 p-0">
                                                      <div className="p-3 pl-10">
                                                        <div className="text-xs font-semibold text-muted-foreground mb-2">
                                                          Pods in {room.name}
                                                        </div>
                                                        
                                                        {pods.length === 0 ? (
                                                          <div className="text-center py-4 text-xs text-muted-foreground">
                                                            <Boxes className="mx-auto h-6 w-6 mb-1 opacity-20" />
                                                            <p>No pods in this room</p>
                                                          </div>
                                                        ) : (
                                                          <div className="space-y-1">
                                                            {pods.map((pod) => (
                                                              <div
                                                                key={pod.id}
                                                                className="flex items-center justify-between p-2 rounded border bg-background hover:bg-muted/50 transition-colors"
                                                              >
                                                                <div className="flex items-center gap-3">
                                                                  <Boxes className="h-4 w-4 text-muted-foreground" />
                                                                  <div>
                                                                    <div className="text-sm font-medium">{pod.name}</div>
                                                                    {pod.pod_serial_number && (
                                                                      <div className="text-xs text-muted-foreground">
                                                                        SN: {pod.pod_serial_number}
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                  <Badge variant="outline" className="text-xs capitalize">
                                                                    {pod.status}
                                                                  </Badge>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleReassignPod(pod, site.id)}
                                                                    className="h-7 text-xs"
                                                                  >
                                                                    Reassign
                                                                  </Button>
                                                                </div>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </TableCell>
                                                  </TableRow>
                                                )}
                                            </React.Fragment>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SiteFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        site={selectedSite}
        onSuccess={handleFormSuccess}
      />
      <DeleteSiteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        siteId={selectedSite?.id || null}
        siteName={selectedSite?.name}
        roomCount={selectedSite?.room_count}
        podCount={selectedSite?.pod_count}
        onSuccess={handleDeleteSuccess}
      />
      {selectedSiteForRooms && (
        <>
          <RoomFormDialog
            open={roomFormDialogOpen}
            onClose={() => setRoomFormDialogOpen(false)}
            siteId={selectedSiteForRooms}
            room={selectedRoom}
            onSuccess={handleRoomFormSuccess}
          />
          <DeleteRoomDialog
            open={deleteRoomDialogOpen}
            onClose={() => setDeleteRoomDialogOpen(false)}
            roomId={selectedRoom?.id || null}
            roomName={selectedRoom?.name}
            podCount={selectedRoom?.pod_count}
            siteId={selectedSiteForRooms}
            onSuccess={handleRoomDeleteSuccess}
          />
          <PodAssignmentDialog
            open={podAssignmentDialogOpen}
            onClose={() => setPodAssignmentDialogOpen(false)}
            pod={selectedPod}
            currentSiteId={selectedPodSiteId}
            sites={Array.from(sites.values()).map(site => ({
              id: site.id,
              name: site.name,
              rooms: siteRooms.get(site.id) || []
            }))}
            onSuccess={handlePodAssignmentSuccess}
          />
        </>
      )}
    </div>
  );
}

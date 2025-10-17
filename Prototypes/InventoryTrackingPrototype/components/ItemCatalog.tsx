import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, AlertTriangle, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Item, ItemCategory } from "../lib/types";

interface ItemCatalogProps {
  items: Item[];
  setItems: (items: Item[]) => void;
}

type SortField = "name" | "category" | "parLevel" | "uom";
type SortDirection = "asc" | "desc";

export function ItemCatalog({ items, setItems }: ItemCatalogProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: "",
    category: "consumable",
    uom: "unit",
    safetyNote: "",
    active: true,
    parLevel: 0
  });

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [safetyFilter, setSafetyFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || !newItem.uom) return;

    const item: Item = {
      id: `item-${Date.now()}`,
      name: newItem.name,
      category: newItem.category as ItemCategory,
      uom: newItem.uom,
      safetyNote: newItem.safetyNote || undefined,
      active: true,
      parLevel: newItem.parLevel || undefined
    };

    setItems([...items, item]);
    setIsAddDialogOpen(false);
    setNewItem({
      name: "",
      category: "consumable",
      uom: "unit",
      safetyNote: "",
      active: true,
      parLevel: 0
    });
  };

  const getCategoryBadgeVariant = (category: ItemCategory) => {
    switch (category) {
      case "co2": return "default";
      case "filter": return "secondary";
      case "chemical": return "destructive";
      case "nutrient": return "outline";
      default: return "outline";
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-4 h-4 text-gray-900" />
      : <ArrowDown className="w-4 h-4 text-gray-900" />;
  };

  // Apply filters and sorting
  const filteredAndSortedItems = items
    .filter(item => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!item.name.toLowerCase().includes(search) && 
            !item.category.toLowerCase().includes(search) &&
            !item.uom.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "active" && !item.active) return false;
      if (statusFilter === "inactive" && item.active) return false;

      // Safety filter
      if (safetyFilter === "hazardous" && !item.safetyNote) return false;
      if (safetyFilter === "safe" && item.safetyNote) return false;

      return true;
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "name":
          compareValue = a.name.localeCompare(b.name);
          break;
        case "category":
          compareValue = a.category.localeCompare(b.category);
          break;
        case "parLevel":
          const aVal = a.parLevel || 0;
          const bVal = b.parLevel || 0;
          compareValue = aVal - bVal;
          break;
        case "uom":
          compareValue = a.uom.localeCompare(b.uom);
          break;
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSafetyFilter("all");
  };

  const hasActiveFilters = searchTerm || categoryFilter !== "all" || statusFilter !== "all" || safetyFilter !== "all";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Item Catalog</CardTitle>
            <CardDescription>Manage inventory items and consumables</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Create a new inventory item in the catalog
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="e.g., CO₂ Tank (50lb)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value as ItemCategory })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="co2">CO₂</SelectItem>
                        <SelectItem value="filter">Filter</SelectItem>
                        <SelectItem value="chemical">Chemical</SelectItem>
                        <SelectItem value="nutrient">Nutrient</SelectItem>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="consumable">Consumable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uom">Unit of Measure *</Label>
                    <Input
                      id="uom"
                      value={newItem.uom}
                      onChange={(e) => setNewItem({ ...newItem, uom: e.target.value })}
                      placeholder="e.g., L, kg, unit, tank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parLevel">Par Level</Label>
                    <Input
                      id="parLevel"
                      type="number"
                      min="0"
                      value={newItem.parLevel || ""}
                      onChange={(e) => setNewItem({ ...newItem, parLevel: Number(e.target.value) })}
                      placeholder="Minimum stock level"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="safetyNote">Safety Note (for hazardous materials)</Label>
                  <Textarea
                    id="safetyNote"
                    value={newItem.safetyNote}
                    onChange={(e) => setNewItem({ ...newItem, safetyNote: e.target.value })}
                    placeholder="Enter PPE requirements and safety precautions..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem} disabled={!newItem.name || !newItem.uom}>
                    Add Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm">Filters & Search</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="co2">CO₂</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                  <SelectItem value="chemical">Chemical</SelectItem>
                  <SelectItem value="nutrient">Nutrient</SelectItem>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="consumable">Consumable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Safety Filter */}
            <div className="space-y-2">
              <Label htmlFor="safety-filter">Safety</Label>
              <Select value={safetyFilter} onValueChange={setSafetyFilter}>
                <SelectTrigger id="safety-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="hazardous">Hazardous Only</SelectItem>
                  <SelectItem value="safe">Non-Hazardous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                Showing {filteredAndSortedItems.length} of {items.length} items
              </span>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    Name
                    {getSortIcon("name")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("category")}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    Category
                    {getSortIcon("category")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("uom")}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    UoM
                    {getSortIcon("uom")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("parLevel")}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    Par Level
                    {getSortIcon("parLevel")}
                  </button>
                </TableHead>
                <TableHead>Safety</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedItems.length > 0 ? (
                filteredAndSortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(item.category)}>
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.uom}</TableCell>
                    <TableCell>{item.parLevel || "—"}</TableCell>
                    <TableCell>
                      {item.safetyNote && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Hazard
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.active ? "default" : "secondary"}>
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {items.length === 0 
                      ? "No items in catalog. Add your first item to get started."
                      : "No items match the current filters."
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

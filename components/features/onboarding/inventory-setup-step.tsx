"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Package, 
  Beaker,
  Droplets,
  Bug,
  Wrench,
  Leaf,
  CheckCircle2,
  Plus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OnboardingStepProps } from "./types";
import type { LucideIcon } from "lucide-react";

interface InventoryCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  forCannabis: boolean;
  forProduce: boolean;
}

const INVENTORY_CATEGORIES: InventoryCategory[] = [
  {
    id: 'nutrients',
    name: 'Nutrients & Fertilizers',
    description: 'Base nutrients, additives, pH adjusters, and supplements',
    icon: Beaker,
    forCannabis: true,
    forProduce: true,
  },
  {
    id: 'growing-media',
    name: 'Growing Media',
    description: 'Soil, coco coir, rockwool, perlite, and other substrates',
    icon: Leaf,
    forCannabis: true,
    forProduce: true,
  },
  {
    id: 'pest-control',
    name: 'Pest & Disease Control',
    description: 'IPM products, beneficial insects, fungicides, and pesticides',
    icon: Bug,
    forCannabis: true,
    forProduce: true,
  },
  {
    id: 'irrigation',
    name: 'Irrigation Supplies',
    description: 'Tubing, fittings, emitters, filters, and pumps',
    icon: Droplets,
    forCannabis: true,
    forProduce: true,
  },
  {
    id: 'equipment',
    name: 'Equipment & Tools',
    description: 'Scissors, trimmers, meters, and cultivation tools',
    icon: Wrench,
    forCannabis: true,
    forProduce: true,
  },
  {
    id: 'packaging',
    name: 'Packaging Materials',
    description: 'Bags, containers, labels, and packaging supplies',
    icon: Package,
    forCannabis: true,
    forProduce: true,
  },
];

export function InventorySetupStep({ organization, onComplete, onSkip, stepData, updateStepData }: OnboardingStepProps) {
  // Use shared state from parent
  const [selectedCategories, setSelectedCategories] = useState<string[]>(stepData.selectedCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync local state back to parent when it changes
  useEffect(() => {
    updateStepData({ selectedCategories });
  }, [selectedCategories, updateStepData]);

  // Filter categories based on plant type (currently all categories apply to both)
  const availableCategories = INVENTORY_CATEGORIES.filter(category => {
    if (organization.plant_type === 'cannabis') {
      return category.forCannabis;
    } else {
      return category.forProduce;
    }
  });

  function toggleCategory(categoryId: string) {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  function selectAll() {
    setSelectedCategories(availableCategories.map(c => c.id));
  }

  function selectNone() {
    setSelectedCategories([]);
  }

  async function handleAddCategories() {
    if (selectedCategories.length === 0) {
      onComplete();
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First, check which categories already exist for this organization
      const { data: existingCategories } = await supabase
        .from('inventory_categories')
        .select('name')
        .eq('organization_id', organization.id);

      const existingNames = new Set(existingCategories?.map(c => c.name.toLowerCase()) || []);

      // Filter out categories that already exist
      const newCategories = selectedCategories
        .map(categoryId => {
          const category = INVENTORY_CATEGORIES.find(c => c.id === categoryId)!;
          return {
            name: category.name,
            description: category.description,
            organization_id: organization.id,
            track_lot_numbers: true,
            track_expiry: true,
            require_coa: false,
            is_active: true,
          };
        })
        .filter(cat => !existingNames.has(cat.name.toLowerCase()));

      // Only insert if there are new categories
      if (newCategories.length > 0) {
        const { error } = await supabase
          .from('inventory_categories')
          .insert(newCategories);

        if (error) {
          console.error('Error adding inventory categories:', error);
          // Continue anyway
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error adding categories:', error);
      onComplete(); // Continue anyway
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-brand-lighter-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-brand-lighter-green-600" />
        </div>
        <h2 className="font-display font-bold text-3xl text-secondary-800 mb-2">
          Inventory Categories
        </h2>
        <p className="text-secondary-500">
          Select the inventory categories you&apos;ll be tracking. You can add more later.
        </p>
      </div>

      {/* Select All / None */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-secondary-600">
          {selectedCategories.length} of {availableCategories.length} selected
        </p>
        <div className="flex gap-2">
          <button 
            onClick={selectAll}
            className="text-sm text-brand-lighter-green-600 hover:text-brand-lighter-green-700 font-medium"
          >
            Select All
          </button>
          <span className="text-secondary-300">|</span>
          <button 
            onClick={selectNone}
            className="text-sm text-secondary-500 hover:text-secondary-700 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {availableCategories.map(category => {
          const Icon = category.icon;
          const isSelected = selectedCategories.includes(category.id);
          
          return (
            <div
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-brand-lighter-green-500 bg-brand-lighter-green-50'
                  : 'border-secondary-200 bg-white hover:border-secondary-300'
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleCategory(category.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-lighter-green-600' : 'text-secondary-400'}`} />
                  <p className="font-medium text-secondary-800">{category.name}</p>
                </div>
                <p className="text-sm text-secondary-500 line-clamp-2">{category.description}</p>
              </div>
              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-brand-lighter-green-500 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-secondary-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <Plus className="w-4 h-4 text-secondary-600" />
          </div>
          <div>
            <p className="font-medium text-secondary-800">Track Everything</p>
            <p className="text-sm text-secondary-500">
              Add inventory items within each category from the Inventory page. Set low stock alerts to never run out of supplies.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex-1 h-12 text-base font-semibold border-2 border-secondary-300 rounded-3xl"
        >
          Skip for now
        </Button>
        <Button
          onClick={handleAddCategories}
          disabled={isSubmitting}
          loading={isSubmitting}
          className="flex-1 h-12 text-base font-semibold"
          size="lg"
        >
          {selectedCategories.length > 0 
            ? `Add ${selectedCategories.length} Categor${selectedCategories.length !== 1 ? 'ies' : 'y'} & Continue`
            : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Leaf, 
  Plus, 
  Trash2, 
  AlertCircle,
  Sprout,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OnboardingStepProps } from "./types";

interface CropItem {
  id: string;
  name: string;
  strain?: string; // For cannabis
  variety?: string; // For produce
  type: string;
}

// Sample cannabis strains for suggestions
const CANNABIS_SUGGESTIONS = [
  { name: 'Blue Dream', type: 'Hybrid' },
  { name: 'OG Kush', type: 'Indica' },
  { name: 'Sour Diesel', type: 'Sativa' },
  { name: 'Girl Scout Cookies', type: 'Hybrid' },
  { name: 'Gorilla Glue', type: 'Hybrid' },
  { name: 'Northern Lights', type: 'Indica' },
  { name: 'Jack Herer', type: 'Sativa' },
  { name: 'White Widow', type: 'Hybrid' },
];

// Sample produce for suggestions - more comprehensive list
const PRODUCE_SUGGESTIONS = [
  { name: 'Lettuce', variety: 'Butterhead' },
  { name: 'Lettuce', variety: 'Romaine' },
  { name: 'Tomato', variety: 'Cherry' },
  { name: 'Tomato', variety: 'Beefsteak' },
  { name: 'Basil', variety: 'Sweet Genovese' },
  { name: 'Spinach', variety: 'Baby Leaf' },
  { name: 'Kale', variety: 'Curly Green' },
  { name: 'Strawberry', variety: 'Everbearing' },
  { name: 'Pepper', variety: 'Bell' },
  { name: 'Cucumber', variety: 'English' },
  { name: 'Microgreens', variety: 'Mixed' },
  { name: 'Herbs', variety: 'Mixed' },
];

export function CropListStep({ organization, onComplete, onSkip, stepData, updateStepData }: OnboardingStepProps) {
  // Initialize from stepData - convert back to CropItem format
  const initCrops = (): CropItem[] => {
    const isCannabis = organization.plant_type === 'cannabis';
    return stepData.customCultivars.map(c => ({
      id: crypto.randomUUID(),
      name: c.name,
      type: c.type,
      ...(isCannabis ? { strain: undefined } : { variety: undefined })
    }));
  };
  
  const [crops, setCrops] = useState<CropItem[]>(initCrops);
  const [newCrop, setNewCrop] = useState({ name: '', strainOrVariety: '', type: '' });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCannabis = organization.plant_type === 'cannabis';
  const suggestions = isCannabis ? CANNABIS_SUGGESTIONS : PRODUCE_SUGGESTIONS;

  // Sync local state back to parent when it changes
  useEffect(() => {
    const customCultivars = crops.map(c => ({ name: c.name, type: c.type }));
    updateStepData({ customCultivars });
  }, [crops, updateStepData]);

  function addCrop() {
    if (!newCrop.name.trim()) {
      setError("Please enter a crop name");
      return;
    }

    // Check for duplicates
    const displayName = newCrop.strainOrVariety 
      ? `${newCrop.name} - ${newCrop.strainOrVariety}` 
      : newCrop.name;
    
    if (crops.some(c => {
      const existingName = c.strain || c.variety 
        ? `${c.name} - ${c.strain || c.variety}` 
        : c.name;
      return existingName.toLowerCase() === displayName.toLowerCase();
    })) {
      setError("This crop has already been added");
      return;
    }

    const newItem: CropItem = {
      id: crypto.randomUUID(),
      name: newCrop.name.trim(),
      type: newCrop.type || (isCannabis ? 'Hybrid' : 'Standard'),
      ...(isCannabis 
        ? { strain: newCrop.strainOrVariety.trim() || undefined }
        : { variety: newCrop.strainOrVariety.trim() || undefined }
      )
    };

    setCrops([...crops, newItem]);
    setNewCrop({ name: '', strainOrVariety: '', type: '' });
    setError("");
  }

  function addSuggestion(suggestion: typeof CANNABIS_SUGGESTIONS[0] | typeof PRODUCE_SUGGESTIONS[0]) {
    // Check if already added
    if (crops.some(c => {
      if (isCannabis && 'type' in suggestion) {
        return c.name.toLowerCase() === suggestion.name.toLowerCase();
      } else if (!isCannabis && 'variety' in suggestion) {
        return c.name.toLowerCase() === suggestion.name.toLowerCase() && 
               c.variety?.toLowerCase() === (suggestion as typeof PRODUCE_SUGGESTIONS[0]).variety?.toLowerCase();
      }
      return false;
    })) {
      return; // Already added
    }

    const newItem: CropItem = {
      id: crypto.randomUUID(),
      name: suggestion.name,
      ...(isCannabis 
        ? { type: (suggestion as typeof CANNABIS_SUGGESTIONS[0]).type, strain: undefined }
        : { variety: (suggestion as typeof PRODUCE_SUGGESTIONS[0]).variety, type: 'Standard' }
      )
    };

    setCrops([...crops, newItem]);
  }

  function removeCrop(id: string) {
    setCrops(crops.filter(c => c.id !== id));
  }

  async function handleAddCrops() {
    if (crops.length === 0) {
      onComplete();
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check for existing cultivars to prevent duplicates
      const { data: existingCultivars } = await supabase
        .from('cultivars')
        .select('name')
        .eq('organization_id', organization.id);

      const existingNames = new Set(existingCultivars?.map(c => c.name.toLowerCase()) || []);

      // Insert cultivars with correct schema fields (only new ones)
      const newCultivars = crops
        .map(crop => {
          // Determine strain_type based on plant type and crop type
          let strainType: string;
          if (!isCannabis) {
            strainType = 'produce';
          } else {
            // Map cannabis type to strain_type
            const typeMap: Record<string, string> = {
              'Indica': 'indica',
              'Sativa': 'sativa',
              'Hybrid': 'hybrid',
              'CBD': 'cbd',
              'Auto': 'auto',
            };
            strainType = typeMap[crop.type] || 'hybrid';
          }

          const name = crop.strain || crop.variety 
            ? `${crop.name} - ${crop.strain || crop.variety}` 
            : crop.name;

          return {
            name,
            strain_type: strainType,
            genetics: crop.strain || crop.variety || null,
            organization_id: organization.id,
            created_by: user.id,
            is_active: true,
          };
        })
        .filter(c => !existingNames.has(c.name.toLowerCase()));

      if (newCultivars.length > 0) {
        const { error } = await supabase
          .from('cultivars')
          .insert(newCultivars);

        if (error) {
          console.error('Error adding cultivars:', error);
          // Continue anyway - don't block onboarding
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error adding crops:', error);
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
          {isCannabis ? (
            <Leaf className="w-8 h-8 text-brand-lighter-green-600" />
          ) : (
            <Sprout className="w-8 h-8 text-brand-lighter-green-600" />
          )}
        </div>
        <h2 className="font-display font-bold text-3xl text-secondary-800 mb-2">
          {isCannabis ? 'Your Strains' : 'Your Produce'}
        </h2>
        <p className="text-secondary-500">
          {isCannabis 
            ? 'Add the cannabis strains you grow. These will be used for batch creation and tracking.'
            : 'Add the produce varieties you grow. These will be used for batch creation and tracking.'}
        </p>
      </div>

      {/* Quick Add Suggestions */}
      <div className="mb-6">
        <p className="text-sm font-medium text-secondary-700 mb-3">Quick Add:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => {
            const isAdded = crops.some(c => {
              if (isCannabis) {
                return c.name.toLowerCase() === suggestion.name.toLowerCase();
              } else {
                return c.name.toLowerCase() === suggestion.name.toLowerCase() && 
                       c.variety?.toLowerCase() === (suggestion as typeof PRODUCE_SUGGESTIONS[0]).variety?.toLowerCase();
              }
            });
            
            return (
              <button
                key={index}
                onClick={() => addSuggestion(suggestion)}
                disabled={isAdded}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isAdded
                    ? 'bg-brand-lighter-green-100 text-brand-lighter-green-700 cursor-not-allowed'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                {isCannabis 
                  ? suggestion.name
                  : `${suggestion.name} (${(suggestion as typeof PRODUCE_SUGGESTIONS[0]).variety})`
                }
                {isAdded && ' ✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Crop Form */}
      <div className="bg-white border-2 border-secondary-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {isCannabis ? 'Strain Name' : 'Produce Name'}
            </label>
            <input
              type="text"
              value={newCrop.name}
              onChange={(e) => setNewCrop({ ...newCrop, name: e.target.value })}
              placeholder={isCannabis ? "e.g., Blue Dream" : "e.g., Tomato"}
              className="w-full px-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
            />
          </div>
          <div className="sm:w-40">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {isCannabis ? 'Type' : 'Variety'}
            </label>
            <input
              type="text"
              value={newCrop.strainOrVariety}
              onChange={(e) => setNewCrop({ ...newCrop, strainOrVariety: e.target.value })}
              placeholder={isCannabis ? "Indica/Sativa" : "e.g., Cherry"}
              className="w-full px-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={addCrop}
              variant="outline"
              className="h-[50px] px-4 border-2"
              aria-label={isCannabis ? "Add strain" : "Add produce"}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Crops List */}
      {crops.length > 0 && (
        <div className="bg-white border-2 border-secondary-200 rounded-2xl overflow-hidden mb-6">
          <div className="p-4 border-b border-secondary-100 bg-secondary-50">
            <h3 className="font-medium text-secondary-800">
              {isCannabis ? 'Strains' : 'Produce'} ({crops.length})
            </h3>
          </div>
          <div className="divide-y divide-secondary-100 max-h-64 overflow-y-auto">
            {crops.map(crop => (
              <div key={crop.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-lighter-green-100 rounded-full flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-brand-lighter-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-800">
                      {crop.name}
                      {(crop.strain || crop.variety) && (
                        <span className="text-secondary-500"> - {crop.strain || crop.variety}</span>
                      )}
                    </p>
                    {isCannabis && crop.type && (
                      <p className="text-sm text-secondary-500">{crop.type}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeCrop(crop.id)}
                  className="p-2 text-secondary-400 hover:text-red-500 transition-colors"
                  disabled={isSubmitting}
                  title={isCannabis ? "Remove strain" : "Remove produce"}
                  aria-label={isCannabis ? "Remove strain" : "Remove produce"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {crops.length === 0 && (
        <div className="text-center py-8 px-4 border-2 border-dashed border-secondary-200 rounded-2xl mb-6">
          <Leaf className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">
            No {isCannabis ? 'strains' : 'produce'} added yet. Use the quick add buttons or enter custom ones above.
          </p>
        </div>
      )}

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
          onClick={handleAddCrops}
          disabled={isSubmitting}
          loading={isSubmitting}
          className="flex-1 h-12 text-base font-semibold"
          size="lg"
        >
          {crops.length > 0 
            ? `Add ${crops.length} ${isCannabis ? 'Strain' : 'Item'}${crops.length !== 1 ? 's' : ''} & Continue`
            : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

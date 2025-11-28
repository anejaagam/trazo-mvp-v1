"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChefHat, 
  CheckCircle2,
  Plus,
  Thermometer,
  Droplets,
  Sun,
  Wind
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OnboardingStepProps } from "./types";

interface RecipeTemplate {
  id: string;
  name: string;
  description: string;
  phase: string;
  stage: 'germination' | 'clone' | 'vegetative' | 'flowering' | 'drying' | 'curing';
  forCannabis: boolean;
  forProduce: boolean;
  parameters: {
    temp_day_c: number;
    temp_night_c: number;
    humidity_day_pct: number;
    photoperiod_hours: number;
    co2_day_ppm?: number;
  };
}

const RECIPE_TEMPLATES: RecipeTemplate[] = [
  // Cannabis Recipes
  {
    id: 'cannabis-veg',
    name: 'Vegetative Phase',
    description: '18/6 light cycle, optimal growth conditions for vegetative cannabis',
    phase: 'Vegetative',
    stage: 'vegetative',
    forCannabis: true,
    forProduce: false,
    parameters: {
      temp_day_c: 24, // ~75°F
      temp_night_c: 20, // ~68°F
      humidity_day_pct: 60,
      photoperiod_hours: 18,
      co2_day_ppm: 1200
    }
  },
  {
    id: 'cannabis-flower',
    name: 'Flowering Phase',
    description: '12/12 light cycle, conditions optimized for flower development',
    phase: 'Flowering',
    stage: 'flowering',
    forCannabis: true,
    forProduce: false,
    parameters: {
      temp_day_c: 22, // ~72°F
      temp_night_c: 18, // ~65°F
      humidity_day_pct: 50,
      photoperiod_hours: 12,
      co2_day_ppm: 1000
    }
  },
  {
    id: 'cannabis-late-flower',
    name: 'Late Flower / Ripening',
    description: 'Final weeks before harvest with reduced humidity',
    phase: 'Ripening',
    stage: 'flowering',
    forCannabis: true,
    forProduce: false,
    parameters: {
      temp_day_c: 21, // ~70°F
      temp_night_c: 17, // ~62°F
      humidity_day_pct: 40,
      photoperiod_hours: 12,
      co2_day_ppm: 800
    }
  },
  {
    id: 'cannabis-clone',
    name: 'Cloning / Propagation',
    description: 'High humidity environment for root development',
    phase: 'Propagation',
    stage: 'clone',
    forCannabis: true,
    forProduce: false,
    parameters: {
      temp_day_c: 26, // ~78°F
      temp_night_c: 22, // ~72°F
      humidity_day_pct: 80,
      photoperiod_hours: 18,
      co2_day_ppm: 800
    }
  },
  // Produce Recipes
  {
    id: 'produce-leafy',
    name: 'Leafy Greens Standard',
    description: 'Optimal conditions for lettuce, spinach, and leafy vegetables',
    phase: 'Growth',
    stage: 'vegetative',
    forCannabis: false,
    forProduce: true,
    parameters: {
      temp_day_c: 22, // ~72°F
      temp_night_c: 18, // ~65°F
      humidity_day_pct: 65,
      photoperiod_hours: 16,
      co2_day_ppm: 1000
    }
  },
  {
    id: 'produce-herbs',
    name: 'Herb Production',
    description: 'Conditions for basil, cilantro, and culinary herbs',
    phase: 'Growth',
    stage: 'vegetative',
    forCannabis: false,
    forProduce: true,
    parameters: {
      temp_day_c: 24, // ~75°F
      temp_night_c: 20, // ~68°F
      humidity_day_pct: 55,
      photoperiod_hours: 14,
      co2_day_ppm: 800
    }
  },
  {
    id: 'produce-fruiting',
    name: 'Fruiting Vegetables',
    description: 'For tomatoes, peppers, and fruiting crops',
    phase: 'Growth',
    stage: 'flowering',
    forCannabis: false,
    forProduce: true,
    parameters: {
      temp_day_c: 26, // ~78°F
      temp_night_c: 20, // ~68°F
      humidity_day_pct: 60,
      photoperiod_hours: 16,
      co2_day_ppm: 1000
    }
  },
  {
    id: 'produce-microgreens',
    name: 'Microgreens',
    description: 'Fast-cycle microgreen production settings',
    phase: 'Growth',
    stage: 'germination',
    forCannabis: false,
    forProduce: true,
    parameters: {
      temp_day_c: 21, // ~70°F
      temp_night_c: 18, // ~65°F
      humidity_day_pct: 60,
      photoperiod_hours: 12,
      co2_day_ppm: 600
    }
  },
  // Shared
  {
    id: 'shared-germination',
    name: 'Germination / Seedling',
    description: 'Warm, humid conditions for seed germination',
    phase: 'Germination',
    stage: 'germination',
    forCannabis: true,
    forProduce: true,
    parameters: {
      temp_day_c: 26, // ~78°F
      temp_night_c: 22, // ~72°F
      humidity_day_pct: 75,
      photoperiod_hours: 16,
      co2_day_ppm: 600
    }
  },
];

export function RecipeTemplatesStep({ organization, onComplete, onSkip }: OnboardingStepProps) {
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter recipes based on plant type
  const availableRecipes = RECIPE_TEMPLATES.filter(recipe => {
    if (organization.plant_type === 'cannabis') {
      return recipe.forCannabis;
    } else {
      return recipe.forProduce;
    }
  });

  function toggleRecipe(recipeId: string) {
    setSelectedRecipes(prev => 
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  }

  function selectAll() {
    setSelectedRecipes(availableRecipes.map(r => r.id));
  }

  function selectNone() {
    setSelectedRecipes([]);
  }

  async function handleAddRecipes() {
    if (selectedRecipes.length === 0) {
      onComplete();
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check for existing recipes to prevent duplicates
      const { data: existingRecipes } = await supabase
        .from('recipes')
        .select('name')
        .eq('organization_id', organization.id);

      const existingNames = new Set(existingRecipes?.map(r => r.name.toLowerCase()) || []);

      // Insert recipes into the main recipes table (only new ones)
      const recipesToAdd = selectedRecipes
        .map(recipeId => RECIPE_TEMPLATES.find(r => r.id === recipeId)!)
        .filter(r => !existingNames.has(r.name.toLowerCase()));

      for (const recipe of recipesToAdd) {
        // Insert recipe
        const { data: newRecipe, error: recipeError } = await supabase
          .from('recipes')
          .insert({
            name: recipe.name,
            description: recipe.description,
            organization_id: organization.id,
            owner_id: user.id,
            status: 'draft',
            current_version: 1,
            is_template: true,
            plant_types: organization.plant_type === 'cannabis' 
              ? ['cannabis'] 
              : ['produce'],
            tags: [recipe.phase.toLowerCase()],
          })
          .select()
          .single();

        if (recipeError) {
          console.error('Error adding recipe:', recipeError);
          continue;
        }

        // Create initial version
        const { data: version, error: versionError } = await supabase
          .from('recipe_versions')
          .insert({
            recipe_id: newRecipe.id,
            version: 1,
            created_by: user.id,
            notes: `Initial version from onboarding template`,
            version_data: {
              name: recipe.name,
              description: recipe.description,
              stages: [{
                name: recipe.phase,
                stage_type: recipe.stage,
                order_index: 0,
                duration_days: 14, // Default duration
                description: recipe.description,
              }]
            }
          })
          .select()
          .single();

        if (versionError) {
          console.error('Error adding recipe version:', versionError);
          continue;
        }

        // Create stage
        const { data: stage, error: stageError } = await supabase
          .from('recipe_stages')
          .insert({
            recipe_version_id: version.id,
            name: recipe.phase,
            stage_type: recipe.stage,
            order_index: 0,
            duration_days: 14,
            description: recipe.description,
          })
          .select()
          .single();

        if (stageError) {
          console.error('Error adding recipe stage:', stageError);
          continue;
        }

        // Create environmental setpoints for this stage
        const setpoints = [
          { parameter_type: 'temperature', day_value: recipe.parameters.temp_day_c, night_value: recipe.parameters.temp_night_c, unit: 'celsius' },
          { parameter_type: 'humidity', day_value: recipe.parameters.humidity_day_pct, unit: 'percent' },
          { parameter_type: 'photoperiod', value: recipe.parameters.photoperiod_hours, unit: 'hours' },
        ];

        if (recipe.parameters.co2_day_ppm) {
          setpoints.push({ parameter_type: 'co2', value: recipe.parameters.co2_day_ppm, unit: 'ppm' });
        }

        const { error: setpointsError } = await supabase
          .from('environmental_setpoints')
          .insert(setpoints.map(sp => ({
            recipe_stage_id: stage.id,
            parameter_type: sp.parameter_type,
            value: sp.value ?? null,
            day_value: sp.day_value ?? null,
            night_value: sp.night_value ?? null,
            unit: sp.unit,
            enabled: true,
            priority: 50,
          })));

        if (setpointsError) {
          console.error('Error adding setpoints:', setpointsError);
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error adding recipes:', error);
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
          <ChefHat className="w-8 h-8 text-brand-lighter-green-600" />
        </div>
        <h2 className="font-display font-bold text-3xl text-secondary-800 mb-2">
          Growing Recipes
        </h2>
        <p className="text-secondary-500">
          Select recipe templates for your grow phases. These control environmental parameters automatically.
        </p>
      </div>

      {/* Select All / None */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-secondary-600">
          {selectedRecipes.length} of {availableRecipes.length} selected
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

      {/* Recipes List */}
      <div className="space-y-3 mb-8">
        {availableRecipes.map(recipe => {
          const isSelected = selectedRecipes.includes(recipe.id);
          
          return (
            <div
              key={recipe.id}
              onClick={() => toggleRecipe(recipe.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-brand-lighter-green-500 bg-brand-lighter-green-50'
                  : 'border-secondary-200 bg-white hover:border-secondary-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleRecipe(recipe.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-secondary-800">{recipe.name}</p>
                      <span className="px-2 py-0.5 bg-secondary-100 text-secondary-600 text-xs rounded-full">
                        {recipe.phase}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-brand-lighter-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-secondary-500 mb-3">{recipe.description}</p>
                  
                  {/* Parameters Preview */}
                  <div className="flex flex-wrap gap-3">
                    {recipe.parameters.temp_day_c && (
                      <div className="flex items-center gap-1.5 text-xs text-secondary-600">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span>{Math.round(recipe.parameters.temp_day_c * 9/5 + 32)}°F / {Math.round(recipe.parameters.temp_night_c * 9/5 + 32)}°F</span>
                      </div>
                    )}
                    {recipe.parameters.humidity_day_pct && (
                      <div className="flex items-center gap-1.5 text-xs text-secondary-600">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{recipe.parameters.humidity_day_pct}% RH</span>
                      </div>
                    )}
                    {recipe.parameters.photoperiod_hours && (
                      <div className="flex items-center gap-1.5 text-xs text-secondary-600">
                        <Sun className="w-3.5 h-3.5" />
                        <span>{recipe.parameters.photoperiod_hours}h light</span>
                      </div>
                    )}
                    {recipe.parameters.co2_day_ppm && (
                      <div className="flex items-center gap-1.5 text-xs text-secondary-600">
                        <Wind className="w-3.5 h-3.5" />
                        <span>{recipe.parameters.co2_day_ppm} ppm CO₂</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
            <p className="font-medium text-secondary-800">Create Custom Recipes</p>
            <p className="text-sm text-secondary-500">
              Build custom recipes with precise environmental controls in the Recipes section. Link them to batches for automated growing.
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
          onClick={handleAddRecipes}
          disabled={isSubmitting}
          loading={isSubmitting}
          className="flex-1 h-12 text-base font-semibold"
          size="lg"
        >
          {selectedRecipes.length > 0 
            ? `Add ${selectedRecipes.length} Recipe${selectedRecipes.length !== 1 ? 's' : ''} & Finish`
            : 'Finish Setup'}
        </Button>
      </div>
    </div>
  );
}

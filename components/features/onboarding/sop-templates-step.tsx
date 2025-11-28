"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, 
  Download, 
  Plus,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OnboardingStepProps } from "./types";

interface SOPTemplate {
  id: string;
  name: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly' | 'harvest' | 'maintenance' | 'calibration' | 'cleaning' | 'compliance' | 'emergency' | 'quality_control';
  displayCategory: string; // For UI display
  forCannabis: boolean;
  forProduce: boolean;
  steps: { step: number; title: string; description: string }[];
}

const SOP_TEMPLATES: SOPTemplate[] = [
  // Cannabis SOPs
  {
    id: 'cannabis-harvest',
    name: 'Harvesting Procedures',
    description: 'Standard procedures for harvesting cannabis plants including timing, technique, and documentation',
    category: 'harvest',
    displayCategory: 'Cultivation',
    forCannabis: true,
    forProduce: false,
    steps: [
      { step: 1, title: 'Pre-Harvest Inspection', description: 'Inspect plants for readiness using trichome analysis' },
      { step: 2, title: 'Harvest Preparation', description: 'Prepare tools, containers, and workspace' },
      { step: 3, title: 'Plant Cutting', description: 'Cut plants at appropriate height and handle properly' },
      { step: 4, title: 'Documentation', description: 'Record harvest weight, plant count, and batch information' },
    ],
  },
  {
    id: 'cannabis-drying',
    name: 'Drying & Curing',
    description: 'Temperature, humidity, and duration requirements for drying and curing',
    category: 'harvest',
    displayCategory: 'Post-Harvest',
    forCannabis: true,
    forProduce: false,
    steps: [
      { step: 1, title: 'Setup Drying Room', description: 'Ensure proper temperature (60-70°F) and humidity (55-65%)' },
      { step: 2, title: 'Hang Plants', description: 'Hang plants or place on drying racks with adequate spacing' },
      { step: 3, title: 'Monitor Conditions', description: 'Check and record environmental conditions daily' },
      { step: 4, title: 'Cure Process', description: 'Transfer to curing containers and burp regularly' },
    ],
  },
  {
    id: 'cannabis-waste',
    name: 'Waste Disposal',
    description: 'Compliant waste disposal procedures for cannabis plant material',
    category: 'compliance',
    displayCategory: 'Compliance',
    forCannabis: true,
    forProduce: false,
    steps: [
      { step: 1, title: 'Waste Collection', description: 'Collect plant waste in designated containers' },
      { step: 2, title: 'Weighing', description: 'Weigh and document all waste material' },
      { step: 3, title: 'Rendering Unusable', description: 'Mix with approved material to render unusable' },
      { step: 4, title: 'Disposal Documentation', description: 'Complete disposal manifest and maintain records' },
    ],
  },
  {
    id: 'cannabis-pest',
    name: 'IPM - Pest Management',
    description: 'Integrated pest management protocols for cannabis cultivation',
    category: 'maintenance',
    displayCategory: 'Cultivation',
    forCannabis: true,
    forProduce: false,
    steps: [
      { step: 1, title: 'Daily Inspection', description: 'Inspect plants for signs of pests or disease' },
      { step: 2, title: 'Identify Issues', description: 'Document and identify any pest or disease issues' },
      { step: 3, title: 'Treatment Selection', description: 'Select appropriate organic treatment method' },
      { step: 4, title: 'Application & Follow-up', description: 'Apply treatment and schedule follow-up inspection' },
    ],
  },
  // Produce SOPs
  {
    id: 'produce-harvest',
    name: 'Harvesting Procedures',
    description: 'Standard procedures for harvesting produce including handling and quality checks',
    category: 'harvest',
    displayCategory: 'Cultivation',
    forCannabis: false,
    forProduce: true,
    steps: [
      { step: 1, title: 'Pre-Harvest Check', description: 'Verify produce is at optimal maturity' },
      { step: 2, title: 'Harvest Execution', description: 'Cut or pick produce using proper technique' },
      { step: 3, title: 'Quality Inspection', description: 'Inspect for defects and grade accordingly' },
      { step: 4, title: 'Post-Harvest Handling', description: 'Place in appropriate containers and cool immediately' },
    ],
  },
  {
    id: 'produce-sanitation',
    name: 'Sanitation Procedures',
    description: 'Cleaning and sanitization protocols for food safety compliance',
    category: 'cleaning',
    displayCategory: 'Food Safety',
    forCannabis: false,
    forProduce: true,
    steps: [
      { step: 1, title: 'Pre-Cleaning', description: 'Remove debris and organic matter from surfaces' },
      { step: 2, title: 'Wash', description: 'Apply approved cleaning solution and scrub surfaces' },
      { step: 3, title: 'Rinse', description: 'Rinse thoroughly with potable water' },
      { step: 4, title: 'Sanitize', description: 'Apply sanitizer at correct concentration and contact time' },
    ],
  },
  {
    id: 'produce-cold-chain',
    name: 'Cold Chain Management',
    description: 'Temperature control procedures for post-harvest handling',
    category: 'quality_control',
    displayCategory: 'Post-Harvest',
    forCannabis: false,
    forProduce: true,
    steps: [
      { step: 1, title: 'Temperature Check', description: 'Verify cold storage is at correct temperature' },
      { step: 2, title: 'Product Placement', description: 'Place produce in cooler with adequate airflow' },
      { step: 3, title: 'Monitoring', description: 'Check and log temperatures at regular intervals' },
      { step: 4, title: 'FIFO Management', description: 'Ensure first-in-first-out rotation of inventory' },
    ],
  },
  // Shared SOPs
  {
    id: 'shared-nutrient',
    name: 'Nutrient Management',
    description: 'Fertilizer mixing, application, and record-keeping procedures',
    category: 'daily',
    displayCategory: 'Cultivation',
    forCannabis: true,
    forProduce: true,
    steps: [
      { step: 1, title: 'Solution Preparation', description: 'Mix nutrients according to recipe specifications' },
      { step: 2, title: 'pH/EC Testing', description: 'Test and adjust pH and EC levels' },
      { step: 3, title: 'Application', description: 'Apply nutrient solution to plants' },
      { step: 4, title: 'Documentation', description: 'Record batch, concentrations, and application details' },
    ],
  },
  {
    id: 'shared-irrigation',
    name: 'Irrigation Management',
    description: 'Watering schedules, system maintenance, and water quality testing',
    category: 'daily',
    displayCategory: 'Cultivation',
    forCannabis: true,
    forProduce: true,
    steps: [
      { step: 1, title: 'System Check', description: 'Inspect irrigation system for leaks or clogs' },
      { step: 2, title: 'Water Quality', description: 'Test water pH and EC before irrigation' },
      { step: 3, title: 'Irrigation Cycle', description: 'Run irrigation according to schedule' },
      { step: 4, title: 'Drainage Check', description: 'Verify proper drainage and runoff' },
    ],
  },
  {
    id: 'shared-environment',
    name: 'Environmental Controls',
    description: 'Climate control, lighting schedules, and environmental monitoring',
    category: 'daily',
    displayCategory: 'Cultivation',
    forCannabis: true,
    forProduce: true,
    steps: [
      { step: 1, title: 'Temperature Check', description: 'Verify temperature is within target range' },
      { step: 2, title: 'Humidity Check', description: 'Check and adjust humidity levels as needed' },
      { step: 3, title: 'CO2 Monitoring', description: 'Verify CO2 levels if supplementing' },
      { step: 4, title: 'Log Readings', description: 'Document all environmental readings' },
    ],
  },
  {
    id: 'shared-training',
    name: 'Employee Training',
    description: 'Training requirements, documentation, and competency verification',
    category: 'compliance',
    displayCategory: 'Administration',
    forCannabis: true,
    forProduce: true,
    steps: [
      { step: 1, title: 'Training Assignment', description: 'Assign appropriate training materials to employee' },
      { step: 2, title: 'Training Completion', description: 'Employee completes training modules' },
      { step: 3, title: 'Assessment', description: 'Verify understanding through assessment' },
      { step: 4, title: 'Documentation', description: 'Record training completion and competency' },
    ],
  },
];

export function SOPTemplatesStep({ organization, onComplete, onSkip }: OnboardingStepProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter templates based on plant type
  const availableTemplates = SOP_TEMPLATES.filter(template => {
    if (organization.plant_type === 'cannabis') {
      return template.forCannabis;
    } else {
      return template.forProduce;
    }
  });

  // Group templates by display category
  const templatesByCategory = availableTemplates.reduce((acc, template) => {
    if (!acc[template.displayCategory]) {
      acc[template.displayCategory] = [];
    }
    acc[template.displayCategory].push(template);
    return acc;
  }, {} as Record<string, SOPTemplate[]>);

  function toggleTemplate(templateId: string) {
    setSelectedTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  }

  function selectAll() {
    setSelectedTemplates(availableTemplates.map(t => t.id));
  }

  function selectNone() {
    setSelectedTemplates([]);
  }

  async function handleAddTemplates() {
    if (selectedTemplates.length === 0) {
      onComplete();
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check for existing templates to prevent duplicates
      const { data: existingTemplates } = await supabase
        .from('sop_templates')
        .select('name')
        .eq('organization_id', organization.id);

      const existingNames = new Set(existingTemplates?.map(t => t.name.toLowerCase()) || []);

      // Filter and create SOP templates (only new ones)
      const newTemplates = selectedTemplates
        .map(templateId => {
          const template = SOP_TEMPLATES.find(t => t.id === templateId)!;
          return {
            name: template.name,
            description: template.description,
            category: template.category,
            steps: template.steps,
            organization_id: organization.id,
            created_by: user.id,
            is_template: true,
            is_active: true,
          };
        })
        .filter(t => !existingNames.has(t.name.toLowerCase()));

      if (newTemplates.length > 0) {
        const { error } = await supabase
          .from('sop_templates')
          .insert(newTemplates);

        if (error) {
          console.error('Error adding SOP templates:', error);
          // Continue anyway - this is not critical
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error adding SOPs:', error);
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
          <FileText className="w-8 h-8 text-brand-lighter-green-600" />
        </div>
        <h2 className="font-display font-bold text-3xl text-secondary-800 mb-2">
          Standard Operating Procedures
        </h2>
        <p className="text-secondary-500">
          Select SOP templates to add to your organization. You can customize them later.
        </p>
      </div>

      {/* Select All / None */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-secondary-600">
          {selectedTemplates.length} of {availableTemplates.length} selected
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

      {/* Templates by Category */}
      <div className="space-y-6 mb-8">
        {Object.entries(templatesByCategory).map(([category, templates]) => (
          <div key={category}>
            <h3 className="font-medium text-secondary-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-lighter-green-500"></span>
              {category}
            </h3>
            <div className="space-y-2">
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => toggleTemplate(template.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedTemplates.includes(template.id)
                      ? 'border-brand-lighter-green-500 bg-brand-lighter-green-50'
                      : 'border-secondary-200 bg-white hover:border-secondary-300'
                  }`}
                >
                  <Checkbox
                    checked={selectedTemplates.includes(template.id)}
                    onCheckedChange={() => toggleTemplate(template.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-secondary-800">{template.name}</p>
                    <p className="text-sm text-secondary-500">{template.description}</p>
                  </div>
                  {selectedTemplates.includes(template.id) && (
                    <CheckCircle2 className="w-5 h-5 text-brand-lighter-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-secondary-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <Plus className="w-4 h-4 text-secondary-600" />
          </div>
          <div>
            <p className="font-medium text-secondary-800">Create Custom SOPs</p>
            <p className="text-sm text-secondary-500">
              You can create custom SOPs from scratch in the Settings &gt; SOPs section after setup.
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
          onClick={handleAddTemplates}
          disabled={isSubmitting}
          loading={isSubmitting}
          className="flex-1 h-12 text-base font-semibold"
          size="lg"
        >
          {selectedTemplates.length > 0 
            ? `Add ${selectedTemplates.length} Template${selectedTemplates.length !== 1 ? 's' : ''} & Continue`
            : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

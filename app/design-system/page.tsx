"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/form-label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, User, Lock, Search, Mail, Eye, HelpCircle } from "lucide-react";

export default function DesignSystemDemo() {
  return (
    <div className="container mx-auto p-8 space-y-12 max-w-6xl">
      <div className="text-center space-y-4">
        <h1 className="font-display text-display-1 font-bold text-neutral-800">
          Trazo Design System
        </h1>
        <p className="text-neutral-600 text-body-lg max-w-2xl mx-auto">
          A comprehensive design system built from Figma components, featuring consistent styling, 
          accessible interactions, and seamless integration with your application.
        </p>
      </div>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-display-3">Buttons</CardTitle>
          <CardDescription>
            Various button variants with support for icons, loading states, and different sizes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Buttons */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Primary Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button leftIcon={<User className="w-4 h-4" />}>With Left Icon</Button>
              <Button rightIcon={<Info className="w-4 h-4" />}>With Right Icon</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          {/* Secondary Buttons */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Secondary Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline">Outline</Button>
              <Button variant="outline" leftIcon={<Search className="w-4 h-4" />}>
                Search
              </Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Info Buttons */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Info Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="info">Info</Button>
              <Button variant="info" leftIcon={<Info className="w-4 h-4" />}>
                Learn More
              </Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Button Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
              <Button size="icon">
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-display-3">Form Fields</CardTitle>
          <CardDescription>
            Input fields with icon support, validation states, and proper labeling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Fields */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Basic Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Field placeholder="Enter your first name" />
              </div>
              <div className="space-y-2">
                <Label required>Last Name</Label>
                <Field placeholder="Enter your last name" />
              </div>
            </div>
          </div>

          {/* Fields with Icons */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Fields with Icons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Field 
                  placeholder="Enter your email"
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Field 
                  type="password"
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={<Eye className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* Search Field */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Search Field</h3>
            <div className="max-w-md">
              <Field 
                placeholder="Search..."
                leftIcon={<Search className="w-4 h-4" />}
                rightIcon={<HelpCircle className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Error State */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Error State</h3>
            <div className="max-w-md space-y-2">
              <Label variant="error">Username</Label>
              <Field 
                placeholder="Enter username"
                error
                leftIcon={<User className="w-4 h-4" />}
              />
              <p className="text-sm text-error">This username is already taken</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkboxes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-display-3">Checkboxes</CardTitle>
          <CardDescription>
            Checkbox components with various states including checked, unchecked, and disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="checkbox1" />
              <Label htmlFor="checkbox1">Default checkbox</Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox id="checkbox2" defaultChecked />
              <Label htmlFor="checkbox2">Checked by default</Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox id="checkbox3" disabled />
              <Label htmlFor="checkbox3">Disabled checkbox</Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox id="checkbox4" disabled defaultChecked />
              <Label htmlFor="checkbox4">Disabled and checked</Label>
            </div>

            <div className="space-y-2">
              <Label required>Terms and Conditions</Label>
              <div className="flex items-center space-x-3">
                <Checkbox id="terms" />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the terms and conditions and privacy policy
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Labels Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-display-3">Labels</CardTitle>
          <CardDescription>
            Form labels with required indicators and icon support.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Regular Label</Label>
            <Label required>Required Label</Label>
            <Label variant="error">Error Label</Label>
            <Label icon={<Info className="w-4 h-4" />}>Label with Icon</Label>
            <Label required icon={<HelpCircle className="w-4 h-4" />}>
              Required Label with Help Icon
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Typography Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-display-3">Typography</CardTitle>
          <CardDescription>
            Typography scale from the Figma design system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-display text-display-1 font-bold">Display 1 (44px)</h1>
            <h2 className="font-display text-display-2 font-bold">Display 2 (40px)</h2>
            <h3 className="font-display text-display-3 font-semibold">Display 3 (33px)</h3>
            <h4 className="font-display text-display-4 font-semibold">Display 4 (27px)</h4>
            <h5 className="font-display text-display-5 font-semibold">Display 5 (23px)</h5>
            <h6 className="font-display text-display-6 font-semibold">Display 6 (19px)</h6>
          </div>
          
          <div className="space-y-2 pt-4">
            <p className="text-body-lg">Body Large (18px)</p>
            <p className="text-body-base">Body Base (16px)</p>
            <p className="text-body-sm">Body Small (14px)</p>
            <p className="text-body-xs">Body Extra Small (11px)</p>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-display-3">Color Palette</CardTitle>
          <CardDescription>
            Brand colors extracted from the Figma design system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brand Colors */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Brand Colors</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {/* Primary Green Scale */}
              <div className="space-y-1">
                <div className="h-12 w-full bg-primary-800 rounded"></div>
                <p className="text-xs">Primary 800</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-full bg-primary-600 rounded"></div>
                <p className="text-xs">Primary 600</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-full bg-primary-500 rounded"></div>
                <p className="text-xs">Primary 500</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-full bg-primary-300 rounded"></div>
                <p className="text-xs">Primary 300</p>
              </div>
              
              {/* Information Blue Scale */}
              <div className="space-y-1">
                <div className="h-12 w-full bg-information-800 rounded"></div>
                <p className="text-xs">Info 800</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-full bg-information-600 rounded"></div>
                <p className="text-xs">Info 600</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-full bg-information-500 rounded"></div>
                <p className="text-xs">Info 500</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-full bg-information-300 rounded"></div>
                <p className="text-xs">Info 300</p>
              </div>
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="space-y-3">
            <h3 className="font-display text-display-5 font-semibold">Semantic Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-12 w-full bg-success rounded"></div>
                <p className="text-sm font-medium">Success</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full bg-error rounded"></div>
                <p className="text-sm font-medium">Error</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full bg-disabled rounded"></div>
                <p className="text-sm font-medium">Disabled</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full bg-neutral-300 rounded"></div>
                <p className="text-sm font-medium">Neutral</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
/**
 * Inventory Constants
 * 
 * Common units of measure and other constants used in cultivation facilities
 */

export const UNITS_OF_MEASURE = [
  // Weight - Most Common (Listed First)
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 't', label: 'Metric Tons (t)' },
  
  // Volume - Liquid
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'gal', label: 'Gallons (gal)' },
  { value: 'fl_oz', label: 'Fluid Ounces (fl oz)' },
  { value: 'qt', label: 'Quarts (qt)' },
  { value: 'pt', label: 'Pints (pt)' },
  
  // Count / Quantity Units
  { value: 'each', label: 'Each (ea)' },
  { value: 'unit', label: 'Unit' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'case', label: 'Case' },
  { value: 'pallet', label: 'Pallet' },
  { value: 'bag', label: 'Bag' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'container', label: 'Container' },
  { value: 'tray', label: 'Tray' },
  { value: 'roll', label: 'Roll' },
  { value: 'sheet', label: 'Sheet' },
  
  // Area
  { value: 'sqft', label: 'Square Feet (sq ft)' },
  { value: 'sqm', label: 'Square Meters (sq m)' },
  { value: 'acre', label: 'Acre' },
  { value: 'hectare', label: 'Hectare' },
  
  // Length
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'yd', label: 'Yards (yd)' },
] as const

export type UnitOfMeasure = typeof UNITS_OF_MEASURE[number]['value']

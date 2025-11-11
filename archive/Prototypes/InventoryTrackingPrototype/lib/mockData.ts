import type { Item, Batch } from "./types";

export const mockItems: Item[] = [
  {
    id: "item-1",
    name: "CO₂ Tank (50lb)",
    category: "co2",
    uom: "tank",
    active: true,
    parLevel: 5
  },
  {
    id: "item-2",
    name: "HEPA Filter (24x24)",
    category: "filter",
    uom: "unit",
    active: true,
    parLevel: 3
  },
  {
    id: "item-3",
    name: "pH Down (Phosphoric Acid)",
    category: "chemical",
    uom: "L",
    safetyNote: "⚠️ CAUTION: Corrosive chemical. Wear protective gloves, safety goggles, and lab coat. Avoid skin contact. Use in well-ventilated area. In case of contact, rinse immediately with water for 15 minutes.",
    active: true,
    parLevel: 10
  },
  {
    id: "item-4",
    name: "Base Nutrient A",
    category: "nutrient",
    uom: "L",
    active: true,
    parLevel: 20
  },
  {
    id: "item-5",
    name: "Base Nutrient B",
    category: "nutrient",
    uom: "L",
    active: true,
    parLevel: 20
  },
  {
    id: "item-6",
    name: "CalMag Supplement",
    category: "nutrient",
    uom: "L",
    active: true,
    parLevel: 15
  },
  {
    id: "item-7",
    name: "Rockwool Cubes (1.5\")",
    category: "consumable",
    uom: "tray",
    active: true,
    parLevel: 50
  },
  {
    id: "item-8",
    name: "Hydrogen Peroxide 35%",
    category: "chemical",
    uom: "L",
    safetyNote: "⚠️ WARNING: Strong oxidizer. Wear nitrile gloves and face shield. Can cause severe burns. Keep away from combustible materials. Store in cool, dark place.",
    active: true,
    parLevel: 5
  }
];

export const mockBatches: Batch[] = [
  {
    id: "batch-1",
    name: "BG-24-001",
    strain: "Blue Dream",
    startDate: "2025-09-15",
    status: "active",
    locked: false
  },
  {
    id: "batch-2",
    name: "BG-24-002",
    strain: "OG Kush",
    startDate: "2025-09-20",
    status: "active",
    locked: false
  },
  {
    id: "batch-3",
    name: "BG-24-003",
    strain: "Sour Diesel",
    startDate: "2025-10-01",
    status: "active",
    locked: false
  },
  {
    id: "batch-4",
    name: "BG-23-045",
    strain: "Gorilla Glue",
    startDate: "2025-07-10",
    status: "completed",
    locked: true
  }
];

# TRAZO MVP Prototypes Analysis & Integration Guide

**Generated:** October 16, 2025  
**Purpose:** Comprehensive analysis of all standalone React prototypes for integration into main Next.js Trazo MVP

---

## 📋 Overview

This document catalogs all 11 prototype applications that need to be integrated into the main Trazo MVP. Each prototype was built as a standalone React application with mock data and needs to be migrated to Next.js 15 with Supabase backend integration.

---

## 🚀 Prototypes Summary

### Priority 1: Foundation & Core Operations
1. **[IdentityRolesPermissionPrototype](#1-identity-roles--permissions-management)** - User management, RBAC system
2. **[InventoryTrackingPrototype](#2-inventory-tracking)** - Inventory management, waste disposal
3. **[MonitoringAndTelemeteryPrototype](#3-monitoring--telemetry)** - Real-time environmental monitoring
4. **[RecipePrototype](#4-recipe-management)** (formerly EnvironmentalControlsPrototype) - Recipe management, manual overrides

### Priority 2: Advanced Operations
5. **[WorkflowAndTaskManagementPrototype](#5-workflow--task-management)** - Task management, SOPs
6. **[ComplianceEnginePrototype](#6-compliance-engine)** - Compliance reporting, evidence vault
7. **[BatchManagementPrototype](#7-batch-management)** - Crop batch lifecycle management
8. **[AlarmsAndNotifSystemPrototype](#8-alarms--notifications)** - Alert system and notifications

### Infrastructure & Settings
9. **[SignUpPrototype](#9-signup-flow-enhancement)** - Enhanced multi-step signup
10. **[FarmBuilderPrototype](#10-farm-layout-editor)** - Drag & drop farm designer (future)
11. **[ItegrationsAndSSOPrototype](#11-integrations--sso)** - SSO settings (part of settings)

---

## 📁 Detailed Prototype Analysis

### 1. Identity, Roles & Permissions Management

**Location:** `Prototypes/IdentityRolesPermissionPrototype/` (archived)

**Components:**
```
components/
├── ApiTokenManagement.tsx     # API key management
├── AuditLog.tsx              # System audit logging
├── CreateTokenDialog.tsx     # Token creation modal
├── Dashboard.tsx             # Admin dashboard
├── LoginPage.tsx             # Login interface
├── MFASetup.tsx             # Multi-factor authentication
├── OrgSettings.tsx          # Organization settings
├── RolesPermissions.tsx     # Role & permission matrix
├── StepUpMFADialog.tsx      # Step-up authentication
├── UserInviteDialog.tsx     # User invitation modal
├── UserManagement.tsx       # User CRUD operations
└── ui/ (46 shadcn components)
```

**Key Features:**
- User management with CRUD operations
- Role-based access control (RBAC) system
- Multi-factor authentication (MFA)
- API token management
- Audit logging
- Organization settings
- User invitation system

**Integration Priority:** **CRITICAL** - All other features depend on this RBAC system

**Migration Notes:**
- Keep existing main repo auth flow, enhance with RBAC
- Integrate MFA into existing Supabase auth
- Add role selection to signup flow
- Create admin-only sections in dashboard

---

### 2. Inventory Tracking

**Location:** `Prototypes/InventoryTrackingPrototype/` (archived)

**Components:**
```
components/
├── AdjustDispose.tsx         # Inventory adjustments & disposal
├── BatchConsumption.tsx      # Batch-related consumption
├── ComplianceLabels.tsx      # Compliance labeling
├── Dashboard.tsx            # Inventory overview
├── ExportView.tsx           # Data export functionality
├── IssueInventory.tsx       # Issue inventory items
├── ItemCatalog.tsx          # Item catalog management
├── MetrcPackages.tsx        # Metrc package tracking
├── MovementsLog.tsx         # Inventory movement history
├── ReceiveInventory.tsx     # Receive new inventory
├── TransferManifests.tsx    # Transfer documentation
├── WasteDisposal.tsx        # Waste disposal workflows
└── ui/ (38 shadcn components)
```

**Key Features:**
- Inventory item management (CO₂ tanks, filters, nutrients)
- Receive, issue, transfer, adjust inventory
- Waste disposal with compliance tracking
- Metrc package integration (for cannabis jurisdictions)
- Movement history and audit trail
- Export functionality

**Integration Priority:** **HIGH** - Core operational requirement

**Migration Notes:**
- Consolidate waste management with batch prototype
- Add jurisdiction-specific compliance rules
- Integrate with Supabase for real-time updates
- Add par level alerts

---

### 3. Monitoring & Telemetry

**Location:** `Prototypes/MonitoringAndTelemeteryPrototype/` (archived)

**Components:**
```
components/dashboard/
├── AlarmSummaryWidget.tsx    # Alarm overview widget
├── AlarmsPanel.tsx          # Alarm management panel
├── DashboardLayout.tsx      # Main dashboard layout
├── DataEntryDialog.tsx      # Manual data entry
├── EnvironmentChart.tsx     # Environmental data charts
├── ExportDialog.tsx         # Data export dialog
├── FleetView.tsx           # Multi-pod fleet view
├── InfoPanel.tsx           # Information panel
├── NotificationsPanel.tsx   # Notifications
├── PodCard.tsx             # Individual pod card
├── PodDetail.tsx           # Detailed pod view
├── QRCodeDialog.tsx        # QR code generation
└── StatusBadge.tsx         # Status indicators
```

**Key Features:**
- Real-time environmental monitoring (temp, humidity, CO₂, VPD)
- Pod status cards with visual indicators
- Environmental charts and data visualization
- Fleet view for multiple pods
- Data export capabilities
- Manual data entry for offline pods

**Integration Priority:** **HIGH** - Core monitoring requirement

**Migration Notes:**
- Set up Supabase Realtime for live updates
- Prepare TagoIO integration structure (post-MVP)
- Use mock data initially for MVP
- Create responsive dashboard layouts

---

### 4. Recipe Management

**Location:** `Prototypes/RecipePrototype/` (formerly EnvironmentalControlsPrototype)

**Components:**
```
components/
├── AuditLog.tsx             # Control action audit log
├── BatchGroupManager.tsx    # Batch group controls
├── OverrideControl.tsx      # Manual override controls
├── RecipeAuthor.tsx         # Recipe creation/editing
├── RecipeLibrary.tsx        # Recipe management library
├── RecipeViewer.tsx         # Recipe display
├── ScheduleManager.tsx      # Schedule management
└── ui/ (35 shadcn components)
```

**Key Features:**
- Recipe creation and management (temp, humidity, lighting, etc.)
- Manual override controls with safety checks
- Schedule management for automated control
- Batch group controls
- Audit logging for all control actions
- Recipe library with versioning

**Integration Priority:** **HIGH** - Core control requirement

**Migration Notes:**
- Implement safety interlock validation
- Add recipe application to pods/batches
- Create override approval workflows
- Integrate with monitoring for feedback loops

---

### 5. Workflow & Task Management

**Location:** `Prototypes/WorkflowAndTaskManagementPrototype/`

**Key Features:**
- SOP (Standard Operating Procedure) templates
- Task creation and assignment
- Evidence capture (photos, signatures, notes)
- Task scheduling and recurring tasks
- Workflow automation
- Task progress tracking

**Integration Priority:** **MEDIUM** - Important for operations

**Migration Notes:**
- Create task assignment based on roles
- Integrate evidence capture with compliance
- Add SOP template library
- Connect tasks to batch lifecycle events

---

### 6. Compliance Engine

**Location:** `Prototypes/ComplianceEnginePrototype/`

**Key Features:**
- Compliance report generation
- Evidence vault management
- Audit trail tracking
- Jurisdiction-specific templates
- Report scheduling and automation
- Regulatory compliance tracking

**Integration Priority:** **MEDIUM** - Critical for regulated industries

**Migration Notes:**
- Implement jurisdiction-specific reporting
- Create evidence vault with secure storage
- Add report generation for Metrc, CTLS, PrimusGFS
- Integrate with all other features for audit trail

---

### 7. Batch Management

**Location:** `Prototypes/BatchManagementPrototype/`

**Components (19 files):**
```
components/
├── BatchDashboard.tsx        # Main batch overview
├── BatchDetailView.tsx       # Individual batch details
├── BatchGenealogyView.tsx    # Batch genealogy tree
├── BatchGroupManagement.tsx  # Batch grouping
├── BatchMetricsPanel.tsx     # Batch metrics display
├── BatchStageTransition.tsx  # Stage transition workflow
├── BatchTimeline.tsx         # Batch lifecycle timeline
├── BulkBatchOperations.tsx   # Bulk operations (Metrc)
├── CreateBatchDialog.tsx     # Batch creation wizard
├── CultivarManagement.tsx    # Cultivar management
├── EvidenceCapture.tsx       # Evidence collection
├── HarvestWorkflow.tsx       # Harvest procedures
├── PlantCountTracking.tsx    # Plant count management
├── PlantTaggingWorkflow.tsx  # Plant tagging (Metrc)
├── PostHarvestProcessing.tsx # Post-harvest workflows
├── QuarantineManagement.tsx  # Quarantine procedures
├── RoomCapacityMonitor.tsx   # Room capacity tracking
├── WasteDisposalWorkflow.tsx # Waste disposal (consolidate)
└── WasteLogDashboard.tsx     # Waste logging (consolidate)
```

**Key Features:**
- Complete batch lifecycle management
- Cultivar and genetics tracking
- Plant count and tagging (Metrc compliance)
- Harvest workflows and post-processing
- Quarantine management
- Batch genealogy tracking
- Waste disposal integration

**Integration Priority:** **MEDIUM** - Complex but important

**Migration Notes:**
- LARGEST prototype - 19 components + 7 type files
- Consolidate waste management with inventory
- Add jurisdiction-specific stage rules
- Integrate with pod assignments
- Connect to compliance reporting

---

### 8. Alarms & Notifications

**Location:** `Prototypes/AlarmsAndNotifSystemPrototype/`

**Key Features:**
- Real-time alarm monitoring
- Alarm policy configuration
- Notification routing (email, SMS, push)
- Alarm acknowledgment and resolution
- Escalation procedures
- Alarm history and analytics

**Integration Priority:** **MEDIUM** - Important for safety

**Migration Notes:**
- Integrate with monitoring telemetry
- Add role-based notification routing
- Implement escalation policies
- Connect to compliance logging

---

### 9. Signup Flow Enhancement

**Location:** `Prototypes/SignUpPrototype/` (archived)

**Components:**
```
components/
├── Step1UserDetails.tsx      # Personal information
├── Step2CompanyDetails.tsx   # Company information  
├── Step3EmergencyContact.tsx # Emergency contact
├── Step4FarmDetails.tsx      # Farm configuration
└── Step5Success.tsx          # Success confirmation
```

**Key Features:**
- Enhanced 5-step signup process
- Role selection during signup
- Farm configuration capture
- Emergency contact information
- Company details collection

**Integration Priority:** **HIGH** - Replaces existing signup

**Migration Notes:**
- Replace existing 4-step signup with enhanced 5-step
- Add role and jurisdiction selection
- Integrate with organization creation
- Maintain multi-regional routing

---

### 10. Farm Layout Editor

**Location:** `Prototypes/FarmBuilderPrototype/`

**Key Features:**
- Drag & drop farm layout designer
- Room and pod placement
- Capacity planning
- Layout templates

**Integration Priority:** **LOW** - Future enhancement

**Migration Notes:**
- Create page structure only for MVP
- Implement post-MVP
- Focus on data structure preparation

---

### 11. Integrations & SSO

**Location:** `Prototypes/ItegrationsAndSSOPrototype/` (archived)

**Key Features:**
- SSO configuration
- Third-party integrations
- API key management
- Webhook configuration

**Integration Priority:** **LOW** - Admin settings feature

**Migration Notes:**
- Integrate into settings pages
- Admin-only functionality
- Part of organization settings

---

## 🔄 Component Consolidation Strategy

### shadcn/ui Components to Consolidate

**Main Repo Has:** button, field, checkbox, form-label, progress-indicator

**Need to Add from Prototypes:**
- table, dialog, card, tabs, select (from Batch)
- badge, separator, sonner (from Identity)
- sheet, dropdown-menu, popover (from Monitoring)
- form, input, textarea, calendar (from multiple)
- alert, alert-dialog, toast (from multiple)
- accordion, avatar, command (from various)

**Strategy:**
1. Keep main repo components as source of truth
2. Migrate unique components with main repo styling
3. Update all color tokens to match main repo palette
4. Test all components work with existing theme

### Shared Components to Create

```
components/shared/
├── data-table.tsx           # Reusable data table
├── status-badge.tsx         # Status indicators  
├── metric-card.tsx          # KPI display cards
├── filter-bar.tsx           # Search & filter controls
├── export-button.tsx        # Export functionality
├── evidence-capture.tsx     # Photo/signature capture
├── date-range-picker.tsx    # Date selection
└── confirmation-dialog.tsx  # Confirmation modals
```

---

## 🗂️ Type Consolidation

### Major Type Files to Consolidate

**From Batch Management (7 files):**
- batch.ts (29 interfaces)
- cultivar.ts
- harvest.ts  
- plant-tracking.ts
- post-harvest.ts
- tagging.ts
- waste.ts

**Strategy:**
1. Merge all into consolidated `/types/` directory
2. Remove duplicates across prototypes
3. Ensure compatibility with Supabase schema
4. Add proper exports from `/types/index.ts`

---

## 🔧 Integration Action Plan

### Phase 1: Foundation (Current Session)
1. ✅ **Analyze prototypes** (this document)
2. 🔄 **Set up project structure**
3. 🔄 **Implement RBAC system**
4. 🔄 **Implement jurisdiction system**
5. 🔄 **Create database schema**
6. 🔄 **Set up dashboard layout**
7. 🔄 **Update signup flow**
8. 🔄 **Create shared components**

### Phase 2: Priority 1 Features
- Identity & Roles (admin pages)
- Inventory Tracking (full feature)
- Monitoring & Telemetry (dashboard)
- Recipe Management (recipe system)

### Phase 3: Priority 2 Features  
- Workflow & Tasks
- Compliance Engine
- Batch Management (largest migration)
- Alarms & Notifications

### Phase 4: Final Integration
- Settings pages
- Component consolidation
- Testing & cleanup

---

## 📝 Key Decisions Made

1. **Keep Main Repo Auth:** Enhance existing Supabase auth instead of replacing
2. **Consolidate Waste Management:** Primary in Inventory, link from Batch
3. **shadcn/ui Strategy:** Main repo as source of truth, merge unique components
4. **Jurisdiction System:** New system to handle Oregon/Maryland/Canada/PrimusGFS rules
5. **RBAC Integration:** New system with 8 predefined roles and action-level permissions
6. **Database Schema:** Single comprehensive schema for all features

---

**Next Steps:** Begin Phase 1 foundation setup starting with project structure and RBAC implementation.
# Workflow Documentation

## Table of Contents
1. [Batch Lifecycle Workflow](#batch-lifecycle-workflow)
2. [Harvest Workflow](#harvest-workflow)
3. [Waste Disposal Workflow](#waste-disposal-workflow)
4. [Post-Harvest Processing Workflow](#post-harvest-processing-workflow)
5. [Plant Tagging Workflow](#plant-tagging-workflow)
6. [Quarantine Workflow](#quarantine-workflow)
7. [Bulk Operations Workflow](#bulk-operations-workflow)

## Batch Lifecycle Workflow

### Overview
Batches progress through five stages from seed to final product. Each stage has specific entry/exit criteria and associated operations.

### Stage Progression

```
Propagation → Vegetative → Flowering → Harvest → Post-Harvest
```

### 1. Propagation Stage

**Purpose:** Initial growth from seed, cutting, or transplant

**Duration:** Typically 1-3 weeks

**Entry Criteria:**
- Batch created
- Seeds/cuttings prepared
- Growing area assigned
- Initial plant count recorded

**Operations:**
- Monitor germination rates
- Record plant count snapshots
- Track environmental conditions
- Document any losses

**Exit Criteria:**
- Seedlings established
- Root development confirmed
- Ready for transplant
- Plant count verified

**Transition To:** Vegetative

---

### 2. Vegetative Stage

**Purpose:** Active growth and development

**Duration:** Typically 2-6 weeks (variety dependent)

**Entry Criteria:**
- Plants transplanted
- Growing space allocated
- Watering/feeding schedule established

**Operations:**
- Monitor growth rates
- Prune/train plants as needed
- Record plant counts regularly
- Track room transfers
- Document any issues (pests, disease)

**Exit Criteria:**
- Target size/maturity reached
- Pre-flower indicators visible
- Plants healthy and vigorous

**Transition To:** Flowering

---

### 3. Flowering Stage

**Purpose:** Reproductive stage, fruit/flower development

**Duration:** Typically 4-12 weeks (variety dependent)

**Entry Criteria:**
- Flowering initiated (naturally or induced)
- Environmental controls adjusted
- Nutrient formula modified

**Operations:**
- Monitor flower/fruit development
- Support heavy fruit-bearing plants
- Continue plant counts
- Quality assessments
- Pest/disease monitoring

**Exit Criteria:**
- Fruit/produce fully developed
- Maturity indicators present (color, size, firmness)
- Quality targets met
- Harvest window optimal

**Transition To:** Harvest

---

### 4. Harvest Stage

**Purpose:** Collection of mature produce

**Duration:** Variable (can be single event or multi-day)

**Entry Criteria:**
- Produce fully mature
- Quality approved
- Harvest team scheduled
- Containers/packaging ready

**Operations:**
- Select plants/produce for harvest
- Weigh harvest (wet weight)
- Document plant IDs harvested
- Record harvest metadata
- Update traceability system

**Exit Criteria:**
- All mature produce collected
- Weights recorded
- Harvest records complete
- Plants/areas cleaned

**Transition To:** Post-Harvest

---

### 5. Post-Harvest Stage

**Purpose:** Processing, drying, curing, packaging

**Duration:** Variable (hours to weeks depending on product)

**Entry Criteria:**
- Harvest completed
- Processing facilities available
- Processing schedule confirmed

**Operations:**
- Washing/cleaning (if needed)
- Cooling
- Drying (if needed)
- Curing (if needed)
- Sorting and grading
- Packaging
- Final weight recording
- Label generation

**Exit Criteria:**
- All processing complete
- Products packaged
- Final weights recorded
- Labels applied
- Traceability system updated
- Ready for distribution/sale

**Transition To:** Batch complete

---

## Harvest Workflow

### Step-by-Step Process

#### Step 1: Pre-Harvest Preparation

**Actions:**
- Verify batch is in harvest stage
- Confirm maturity/quality
- Prepare harvest tools and containers
- Assign harvest team
- Print/prepare labels if needed

**Validation:**
- Batch not quarantined
- Growing area accessible
- Staff trained and available

---

#### Step 2: Plant Selection

**Component:** HarvestWorkflow

**Actions:**
- View all plants in batch
- Filter by status (ready_harvest)
- Select specific plants to harvest (checkboxes)
- Review plant health indicators

**Data Displayed:**
- Plant ID
- Location
- Status
- Last recorded health score
- Days since flowering

**User Input:**
- Select plants (multi-select)
- Optionally add notes per plant

---

#### Step 3: Weight Recording

**Actions:**
- Weigh harvested produce
- Enter total wet weight (kg)
- System calculates estimated dry weight (if applicable)

**Validation:**
- Weight must be > 0
- Weight should be reasonable for plant count

---

#### Step 4: Quality Assessment

**Actions:**
- Visual inspection
- Select quality grade (A, B, C)
- Document any defects or issues
- Add photos if needed

**Grading Criteria:**
- **Grade A:** Premium quality, no defects
- **Grade B:** Good quality, minor cosmetic issues
- **Grade C:** Acceptable quality, processing grade

---

#### Step 5: Review and Submit

**Actions:**
- Review harvest summary:
  - Plant count
  - Total weight
  - Quality grade
  - Notes
- Confirm accuracy
- Submit harvest record

**System Actions:**
- Create HarvestRecord
- Update batch yieldData
- Update plant statuses to 'harvested'
- Report to traceability system
- Generate harvest ID
- Create timeline event

**Notifications:**
- Success toast with harvest summary
- Traceability system confirmation

---

## Waste Disposal Workflow

### Multi-Step Guided Process

**Component:** WasteDisposalWorkflow

### Step 1: Source Selection

**Purpose:** Identify where waste originated

**Options:**
- **From Batch:** Waste from specific batch (e.g., damaged plants)
- **From Facility:** General facility waste (e.g., cleaning materials)
- **General Waste:** Other waste not tied to specific source

**User Input:**
- Select source type
- If batch: Select batch from dropdown
- If facility: Select location/room

---

### Step 2: Waste Details

**Purpose:** Document what is being disposed

**User Input:**

**Waste Type:**
- Plant material
- Soil and growing media
- Packaging materials
- Equipment
- Other

**Waste Reason:**
- Crop failure
- Pest infestation
- Disease
- Quality control
- End of cycle
- Contamination
- Damaged
- Other

**Quantity:**
- Amount (number)
- Unit (kg or units)

**Disposal Method:**
- Compost
- Landfill disposal
- Incineration
- Recycling
- Render unusable (mix with non-organic)
- Other

**Validation:**
- All fields required
- Quantity must be > 0

---

### Step 3: Evidence Collection

**Purpose:** Document waste for compliance

**User Input:**
- Upload photos (before disposal)
- Upload photos (during disposal)
- Upload photos (after disposal)
- Add detailed notes
- Witness name (optional)

**Best Practices:**
- Photo of waste before mixing/destruction
- Photo of disposal process
- Photo showing waste rendered unusable
- Wide shot showing scale
- Close-up of waste type

---

### Step 4: Review and Submit

**Purpose:** Final verification before submission

**Display:**
- Source: [Batch/Facility/General]
- Type: [Plant material, etc.]
- Reason: [Quality control, etc.]
- Quantity: [5 kg]
- Method: [Compost]
- Photos: [3 attached]
- Notes: [User notes]

**Actions:**
- Review all details
- Edit if needed (go back)
- Submit for approval

**System Actions:**
- Create WasteLog with status: 'pending_approval'
- Notify compliance manager
- Add to waste log dashboard
- Create timeline event (if batch-specific)

---

### Step 5: Supervisor Approval

**Component:** WasteLogDashboard

**Compliance Manager Actions:**

**Review:**
- View waste log details
- Check photos
- Verify quantities reasonable
- Confirm disposal method appropriate

**Approve:**
- Add review notes
- Enter reviewer name
- Confirm approval

**System Actions:**
- Update status to 'approved'
- Report to traceability system
- Update status to 'reported_to_metrc'
- Record approval timestamp
- Notify submitter

**Reject:**
- Add rejection reason
- Enter reviewer name
- Confirm rejection

**System Actions:**
- Update status to 'rejected'
- Notify submitter
- Log requires resubmission

---

## Post-Harvest Processing Workflow

### Overview
Sequential processing stages for harvested produce

### Stage 1: Washing/Cooling (Optional)

**When:** Immediately after harvest

**Process:**
- Wash produce to remove debris
- Cool to optimal storage temperature
- Inspect for damage/defects
- Sort by size/quality

**Not shown in UI (manual process)**

---

### Stage 2: Drying

**Component:** PostHarvestProcessing (Drying Tab)

**When:** For produce requiring moisture reduction

**Step 1: Start Drying**

**User Input:**
- Select drying room (from available)
- Enter initial weight (wet weight from harvest)
- Set target moisture level (%)
- Confirm environmental settings:
  - Temperature
  - Humidity
  - Airflow
- Add notes

**System Actions:**
- Create DryingRecord with status: 'in_progress'
- Update drying room occupancy
- Start timeline

---

**Step 2: Monitor Drying**

**Ongoing:**
- Record periodic weight checks
- Log environmental readings
- Track moisture loss percentage
- Document any adjustments

**Data Entry:**
- Date/time
- Current weight
- Temperature
- Humidity
- Notes on progress

---

**Step 3: Complete Drying**

**When:** Target moisture reached

**User Input:**
- Final weight (dry weight)
- Final moisture reading
- Quality assessment
- Completion notes

**System Actions:**
- Update DryingRecord status: 'completed'
- Calculate total moisture loss
- Update batch yieldData.dryWeight
- Free drying room capacity
- Create timeline event

---

### Stage 3: Curing

**Component:** PostHarvestProcessing (Curing Tab)

**When:** For produce requiring flavor/quality development

**Step 1: Start Curing**

**User Input:**
- Select curing room/container
- Enter initial weight
- Set target duration (days)
- Confirm environmental settings:
  - Temperature
  - Humidity
- Add notes

**System Actions:**
- Create CuringRecord with status: 'in_progress'
- Update facility tracking
- Start timeline

---

**Step 2: Quality Checks**

**Periodic Checks (every few days):**
- Visual inspection
- Moisture test
- Aroma assessment
- Texture evaluation
- Inspector name
- Notes

**Data Captured:**
- Check date
- Moisture level (%)
- Aroma description
- Texture description
- Pass/fail assessment
- Recommendations

---

**Step 3: Complete Curing**

**When:** Target duration reached or quality optimal

**User Input:**
- Final weight
- Final quality assessment
- Completion notes

**System Actions:**
- Update CuringRecord status: 'completed'
- Update batch yield data
- Create timeline event

---

### Stage 4: Packaging

**Component:** PostHarvestProcessing (Packaging Tab)

**Step 1: Package Configuration**

**User Input:**
- Package type (bag, box, jar, container, bulk)
- Package size (e.g., "250g", "1kg", "5lb")
- Target weight per unit

**Validation:**
- Package size must be reasonable
- Weight per unit must be > 0

---

**Step 2: Package Creation**

**Actions:**
- Weigh and fill packages
- Generate labels for each unit
- Record unit count
- Track total weight

**User Input:**
- Number of units created
- Total weight (kg)
- Lot number (auto-generated or manual)
- Expiration date (if applicable)
- Quality grade (A, B, C)

---

**Step 3: Label Generation**

**System Actions:**
- Generate unique label IDs
- Create barcodes/QR codes
- Include:
  - Product name (variety)
  - Batch ID
  - Lot number
  - Package date
  - Weight
  - Expiration date
  - Traceability ID

**User Actions:**
- Print labels
- Apply to packages
- Confirm label application

---

**Step 4: Review and Submit**

**Display:**
- Package type and size
- Unit count
- Total weight
- Weight per unit
- Label IDs
- Lot number
- Quality grade

**System Actions:**
- Create PackagingRecord
- Update batch yieldData.packagedWeight
- Report to traceability system
- Generate package IDs in external system
- Create timeline event
- Mark batch as fully processed

---

## Plant Tagging Workflow

### Purpose
Assign individual tracking labels to plants for traceability

**Component:** PlantTaggingWorkflow

### Step 1: Label Inventory Check

**Display:**
- Available label types (barcode, RFID, QR code)
- Quantity available per type
- Last order date
- Low stock warnings

**Validation:**
- Sufficient labels available
- Labels not expired (if applicable)

---

### Step 2: Session Setup

**User Input:**
- Select label type
- Enter label range:
  - Start number (e.g., "1001")
  - End number (e.g., "1100")
- Confirm plant count to tag
- Operator name

**Validation:**
- Range count matches plant count
- Labels in range are available (not already used)

---

### Step 3: Tagging Process

**Actions:**
- Display plant list
- Scan/enter label ID
- System matches label to plant
- Confirm attachment
- Move to next plant

**Real-time Tracking:**
- Progress bar
- Plants tagged / Total plants
- Time elapsed
- Estimated time remaining

---

### Step 4: Session Complete

**Display:**
- Total plants tagged
- Labels used count
- Session duration
- Any skipped plants (with reasons)

**System Actions:**
- Create TaggingSession record
- Update Label statuses to 'assigned'
- Link labels to plant IDs
- Update plant records with tagIds
- Create timeline event
- Generate session report

---

## Quarantine Workflow

### Purpose
Isolate batches for quality control or compliance issues

**Component:** QuarantineManagement

### Placing in Quarantine

**Trigger Events:**
- Pest detection
- Disease symptoms
- Contamination suspected
- Failed quality check
- Test results pending
- Regulatory hold

---

**Step 1: Initiate Quarantine**

**User Input:**
- Quarantine reason (dropdown):
  - Pest infestation
  - Disease detected
  - Contamination
  - Quality issues
  - Testing required
  - Regulatory hold
  - Other (specify)
- Detailed description
- Recommended actions
- Authorized by (supervisor name)

**Validation:**
- Supervisor credentials required
- Reason must be selected
- Description required if "Other"

---

**Step 2: System Actions**

**Immediate:**
- Update batch.quarantineStatus = 'quarantined'
- Record quarantine timestamp
- Record authorizing supervisor
- Create timeline event
- Send notifications:
  - Facility manager
  - Compliance officer
  - Quality assurance team

**Restrictions Applied:**
- Cannot transition stages
- Cannot harvest
- Cannot be included in bulk operations
- Location moves require approval
- Special "Quarantined" badge on all displays

---

**Step 3: Investigation & Resolution**

**During Quarantine:**
- Document investigation steps
- Record test results
- Photo evidence of issue
- Corrective actions taken
- Progress updates

**User Actions:**
- Add notes to batch
- Upload evidence
- Record treatments applied
- Update status of corrective actions

---

### Releasing from Quarantine

**Step 1: Verify Resolution**

**Checklist:**
- ✓ Root cause identified
- ✓ Corrective actions completed
- ✓ Test results acceptable
- ✓ No remaining symptoms
- ✓ Clearance from QA team

---

**Step 2: Request Release**

**User Input:**
- Resolution summary
- Corrective actions taken
- Preventive measures implemented
- Test results (if applicable)
- Authorized by (supervisor name)

**Validation:**
- Supervisor credentials required
- Resolution notes required

---

**Step 3: System Actions**

**On Release:**
- Update batch.quarantineStatus = 'released'
- Record release timestamp
- Record releasing supervisor
- Create timeline event
- Remove restrictions
- Send notifications (batch cleared)
- Archive quarantine documentation

---

## Bulk Operations Workflow

### Purpose
Perform coordinated actions on multiple batches

**Component:** BulkBatchOperations

### Workflow Types

#### 1. Bulk Stage Update

**Use Case:** Move multiple batches to next stage simultaneously

---

**Step 1: Batch Selection**

**Actions:**
- Filter batches by current stage
- Search by variety or name
- Select target batches (checkboxes)
- Review selection summary

**Display:**
- Total selected: [5 batches]
- Total plants: [500 plants]
- Varieties: [Tomato (3), Lettuce (2)]

**Validation:**
- At least 1 batch selected
- All selected batches eligible for stage transition

---

**Step 2: Configure Operation**

**User Input:**
- Target stage (dropdown)
- Reason for transition
- Transition date (default: today)
- Authorized by (name)

**Validation:**
- Target stage must be valid next stage
- Authorization required
- Reason required for bulk operations

---

**Step 3: Review Impact**

**Display:**
- Batch list with current → new stage
- Room capacity impacts (if moving stages changes locations)
- Warnings (e.g., "Room G-1 will be at 95% capacity")

**User Actions:**
- Review changes
- Edit selection if needed
- Confirm or cancel

---

**Step 4: Execute**

**System Actions:**
- Update each batch:
  - Change stage
  - Update stageHistory
  - Record transition date
- Create timeline events for each batch
- Update room occupancies
- Send notifications

**Result:**
- Success message: "5 batches updated to vegetative stage"
- Option to undo (if immediate)
- View updated batches

---

#### 2. Bulk Location Update

**Use Case:** Move multiple batches to new growing area(s)

---

**Step 1: Batch Selection**
(Same as above)

---

**Step 2: Configure Operation**

**User Input:**
- Target growing area(s) (multi-select)
- Move date (default: today)
- Move reason
- Authorized by (name)

**Capacity Check:**
- Calculate total plants in selected batches
- Check target room(s) capacity
- Display warnings if over capacity

**Validation:**
- At least one target location selected
- Sufficient capacity (or override with approval)

---

**Step 3: Distribution Logic**

**Options:**
- **Distribute evenly:** Spread batches across selected rooms
- **Fill sequentially:** Fill first room, then next
- **Manual assignment:** User assigns each batch to specific room

**User Input:**
- Select distribution method
- Review proposed assignments

---

**Step 4: Review and Execute**

**Display:**
- Batch → New Location assignments
- Capacity usage per room after move
- Any over-capacity warnings

**System Actions:**
- Update batch.growingAreaIds for each
- Update room occupancies
- Create timeline events
- Create location change records
- Send notifications

**Result:**
- Success message: "5 batches moved to new locations"
- Updated room capacity display

---

### Safety Features for Bulk Operations

**Confirmation Dialogs:**
- Always require explicit confirmation
- Show impact summary
- Display "This cannot be undone" warning

**Authorization:**
- Require supervisor name for all bulk operations
- Log who authorized the operation

**Validation:**
- Pre-flight checks for all batches
- Prevent operations on quarantined batches
- Capacity overflow warnings

**Audit Trail:**
- Log all bulk operations
- Record authorization
- Track individual batch changes
- Timestamp all modifications

**Rollback (Future):**
- Option to undo bulk operation within time window
- Restore previous state
- Notify affected parties

---

## Workflow Best Practices

### General Guidelines

1. **Always verify before transitioning stages**
   - Check plant counts
   - Confirm quality
   - Validate required data collected

2. **Document everything**
   - Add notes to significant events
   - Capture photos when relevant
   - Record names and timestamps

3. **Use quarantine when uncertain**
   - Better to pause and investigate
   - Prevent spread of issues
   - Maintain product quality

4. **Leverage bulk operations carefully**
   - Useful for coordinated schedules
   - Review impact before executing
   - Require supervisor authorization

5. **Maintain traceability**
   - Link all records to batches
   - Record weights at every step
   - Keep genealogy current

### Error Prevention

- **Use validation rules:** System prevents invalid operations
- **Require confirmations:** Multi-step processes reduce mistakes
- **Role-based access:** Sensitive operations require authorization
- **Audit trails:** All actions logged for review

### Compliance Tips

- **Photo evidence:** Capture photos at key points
- **Timely updates:** Record events same-day when possible
- **Complete notes:** Detailed notes help audits
- **Regular counts:** Verify plant counts frequently
- **Review reports:** Check for inconsistencies weekly

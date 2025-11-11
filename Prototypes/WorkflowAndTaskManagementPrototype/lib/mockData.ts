import { SOPTemplate, Task, RoleChecklist, BatchRelease } from './types';

export const mockTemplates: SOPTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Daily Filter Change',
    category: 'Daily Operations',
    description: 'Standard procedure for replacing filtration system filters',
    estimatedDuration: 30,
    slaHours: 24,
    version: '2.1',
    versionHistory: [
      { version: '1.0', date: new Date('2024-06-01'), author: 'Admin', changes: 'Initial version', status: 'archived' },
      { version: '2.0', date: new Date('2024-12-15'), author: 'QA Manager', changes: 'Added flow rate check step', status: 'archived' },
      { version: '2.1', date: new Date('2025-01-15'), author: 'Supervisor', changes: 'Updated safety checklist', status: 'active' }
    ],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    createdBy: 'System Admin',
    updatedBy: 'John Supervisor',
    status: 'active',
    allowedRoles: ['operator', 'supervisor'],
    requiresDualSignoff: false,
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Safety Check',
        description: 'Verify system is in safe state for maintenance',
        evidenceRequired: true,
        evidenceType: 'checkbox',
        evidenceConfig: {
          options: ['System powered down', 'Lockout/tagout applied', 'PPE worn']
        }
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Remove Old Filter',
        description: 'Carefully remove the existing filter and dispose properly',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Check Filter Condition',
        description: 'Inspect old filter for abnormal wear or contamination',
        evidenceRequired: true,
        evidenceType: 'text',
        evidenceConfig: {
          requiredText: 'Document any abnormalities'
        },
        isConditional: true,
        conditionalLogic: [
          {
            stepId: 'step-3',
            condition: 'contains',
            value: 'abnormal',
            nextStepId: 'step-alert'
          }
        ]
      },
      {
        id: 'step-alert',
        order: 4,
        title: 'Alert Supervisor',
        description: 'Contact supervisor immediately about filter condition',
        evidenceRequired: true,
        evidenceType: 'signature'
      },
      {
        id: 'step-4',
        order: 5,
        title: 'Install New Filter',
        description: 'Install replacement filter per manufacturer specifications',
        evidenceRequired: true,
        evidenceType: 'qr_scan',
        evidenceConfig: {
          requiredText: 'Scan new filter QR code'
        }
      },
      {
        id: 'step-5',
        order: 6,
        title: 'Verify Installation',
        description: 'Check filter is seated correctly and all connections secure',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'step-6',
        order: 7,
        title: 'System Startup',
        description: 'Remove lockout/tagout and restart system',
        evidenceRequired: true,
        evidenceType: 'checkbox',
        evidenceConfig: {
          options: ['Lockout removed', 'System powered on', 'No leaks detected']
        }
      },
      {
        id: 'step-7',
        order: 8,
        title: 'Flow Rate Check',
        description: 'Measure and record system flow rate',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          minValue: 45,
          maxValue: 55,
          unit: 'L/min'
        }
      }
    ]
  },
  {
    id: 'tpl-2',
    name: 'Tank Swap Procedure',
    category: 'Daily Operations',
    description: 'Process for swapping chemical storage tanks',
    estimatedDuration: 45,
    slaHours: 12,
    version: '1.5',
    versionHistory: [
      { version: '1.0', date: new Date('2024-08-10'), author: 'QA Manager', changes: 'Initial version', status: 'archived' },
      { version: '1.5', date: new Date('2025-02-01'), author: 'Compliance Officer', changes: 'Added QR scanning requirement', status: 'active' }
    ],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-02-01'),
    createdBy: 'QA Manager',
    updatedBy: 'Compliance Team',
    status: 'active',
    allowedRoles: ['operator', 'supervisor'],
    requiresDualSignoff: false,
    steps: [
      {
        id: 'ts-1',
        order: 1,
        title: 'Pre-Swap Checklist',
        description: 'Verify all prerequisites are met',
        evidenceRequired: true,
        evidenceType: 'checkbox',
        evidenceConfig: {
          options: ['Replacement tank available', 'Transfer equipment ready', 'Area secured']
        }
      },
      {
        id: 'ts-2',
        order: 2,
        title: 'Tank Level Reading',
        description: 'Record current tank level before swap',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          minValue: 0,
          maxValue: 100,
          unit: '%'
        }
      },
      {
        id: 'ts-3',
        order: 3,
        title: 'Disconnect Tank',
        description: 'Safely disconnect all lines from current tank',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'ts-4',
        order: 4,
        title: 'Connect New Tank',
        description: 'Connect all lines to replacement tank',
        evidenceRequired: true,
        evidenceType: 'qr_scan',
        evidenceConfig: {
          requiredText: 'Scan new tank QR code'
        }
      },
      {
        id: 'ts-5',
        order: 5,
        title: 'Leak Test',
        description: 'Perform pressure test and visual inspection',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'ts-6',
        order: 6,
        title: 'Final Verification',
        description: 'Sign off on completed swap',
        evidenceRequired: true,
        evidenceType: 'signature'
      }
    ]
  },
  {
    id: 'tpl-3',
    name: 'Calibration - pH Sensor',
    category: 'Calibration & Maintenance',
    description: 'Monthly pH sensor calibration procedure',
    estimatedDuration: 20,
    slaHours: 168,
    version: '3.0',
    versionHistory: [
      { version: '1.0', date: new Date('2023-01-20'), author: 'Lab Tech', changes: 'Initial version', status: 'archived' },
      { version: '2.0', date: new Date('2024-06-20'), author: 'QA Manager', changes: 'Updated buffer ranges', status: 'archived' },
      { version: '3.0', date: new Date('2025-01-20'), author: 'Compliance Officer', changes: 'Added verification step', status: 'active' }
    ],
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-20'),
    createdBy: 'Lab Tech',
    updatedBy: 'Compliance Officer',
    status: 'active',
    allowedRoles: ['operator', 'supervisor', 'qa_manager'],
    requiresDualSignoff: false,
    steps: [
      {
        id: 'cal-1',
        order: 1,
        title: 'Prepare Calibration Solutions',
        description: 'Gather pH 4.0, 7.0, and 10.0 buffer solutions',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'cal-2',
        order: 2,
        title: 'Clean Sensor',
        description: 'Rinse sensor with DI water and pat dry',
        evidenceRequired: false
      },
      {
        id: 'cal-3',
        order: 3,
        title: 'pH 7.0 Calibration',
        description: 'Calibrate at pH 7.0 buffer',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          minValue: 6.8,
          maxValue: 7.2,
          unit: 'pH'
        }
      },
      {
        id: 'cal-4',
        order: 4,
        title: 'pH 4.0 Calibration',
        description: 'Calibrate at pH 4.0 buffer',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          minValue: 3.8,
          maxValue: 4.2,
          unit: 'pH'
        }
      },
      {
        id: 'cal-5',
        order: 5,
        title: 'pH 10.0 Calibration',
        description: 'Calibrate at pH 10.0 buffer',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          minValue: 9.8,
          maxValue: 10.2,
          unit: 'pH'
        }
      },
      {
        id: 'cal-6',
        order: 6,
        title: 'Verification',
        description: 'Re-test pH 7.0 to verify calibration',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          minValue: 6.9,
          maxValue: 7.1,
          unit: 'pH'
        }
      }
    ]
  },
  {
    id: 'tpl-4',
    name: 'Alarm Response - High Temperature',
    category: 'Alarm Response',
    description: 'Corrective action for high temperature alarm',
    estimatedDuration: 15,
    slaHours: 1,
    version: '1.0',
    versionHistory: [
      { version: '1.0', date: new Date('2025-02-01'), author: 'Safety Manager', changes: 'Initial version', status: 'active' }
    ],
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01'),
    createdBy: 'Safety Manager',
    updatedBy: 'Safety Manager',
    status: 'active',
    allowedRoles: ['operator', 'supervisor'],
    requiresDualSignoff: false,
    steps: [
      {
        id: 'alarm-1',
        order: 1,
        title: 'Record Temperature',
        description: 'Document current temperature reading',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          unit: '°C'
        },
        isConditional: true,
        conditionalLogic: [
          {
            stepId: 'alarm-1',
            condition: 'greater_than',
            value: 85,
            nextStepId: 'alarm-emergency'
          }
        ]
      },
      {
        id: 'alarm-emergency',
        order: 2,
        title: 'EMERGENCY SHUTDOWN',
        description: 'Temperature critical - initiate emergency shutdown',
        evidenceRequired: true,
        evidenceType: 'signature'
      },
      {
        id: 'alarm-2',
        order: 3,
        title: 'Check Cooling System',
        description: 'Verify cooling system is operational',
        evidenceRequired: true,
        evidenceType: 'checkbox',
        evidenceConfig: {
          options: ['Coolant flowing', 'Fans operational', 'No blockages']
        }
      },
      {
        id: 'alarm-3',
        order: 4,
        title: 'Adjust Setpoint',
        description: 'Lower temperature setpoint by 5°C',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'alarm-4',
        order: 5,
        title: 'Monitor Temperature',
        description: 'Record temperature after 10 minutes',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          unit: '°C'
        }
      }
    ]
  },
  {
    id: 'tpl-5',
    name: 'Batch Transition - Cleaning Protocol',
    category: 'Batch Operations',
    description: 'Complete cleaning procedure between product batches',
    estimatedDuration: 90,
    slaHours: 4,
    version: '2.2',
    versionHistory: [
      { version: '1.0', date: new Date('2024-03-25'), author: 'QA Manager', changes: 'Initial version', status: 'archived' },
      { version: '2.0', date: new Date('2024-09-10'), author: 'QA Manager', changes: 'Added ATP testing', status: 'archived' },
      { version: '2.2', date: new Date('2025-02-10'), author: 'Compliance Officer', changes: 'Updated temperature ranges', status: 'active' }
    ],
    createdAt: new Date('2025-01-25'),
    updatedAt: new Date('2025-02-10'),
    createdBy: 'QA Manager',
    updatedBy: 'Compliance Officer',
    status: 'active',
    allowedRoles: ['operator', 'supervisor', 'qa_manager'],
    requiresDualSignoff: true,
    steps: [
      {
        id: 'batch-1',
        order: 1,
        title: 'Pre-Clean Inspection',
        description: 'Document equipment state before cleaning',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'batch-2',
        order: 2,
        title: 'Drain System',
        description: 'Completely drain all product from system',
        evidenceRequired: true,
        evidenceType: 'checkbox',
        evidenceConfig: {
          options: ['All valves opened', 'System drained', 'Residue collected']
        }
      },
      {
        id: 'batch-3',
        order: 3,
        title: 'Water Rinse Cycle',
        description: 'Run hot water rinse cycle',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          minValue: 60,
          maxValue: 80,
          unit: '°C'
        }
      },
      {
        id: 'batch-4',
        order: 4,
        title: 'Detergent Wash',
        description: 'Apply cleaning solution and circulate',
        evidenceRequired: true,
        evidenceType: 'qr_scan',
        evidenceConfig: {
          requiredText: 'Scan detergent batch QR'
        }
      },
      {
        id: 'batch-5',
        order: 5,
        title: 'Final Rinse',
        description: 'Perform final DI water rinse',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          minValue: 5,
          maxValue: 15,
          unit: 'min'
        }
      },
      {
        id: 'batch-6',
        order: 6,
        title: 'Visual Inspection',
        description: 'Inspect all surfaces for cleanliness',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'batch-7',
        order: 7,
        title: 'ATP Test',
        description: 'Perform ATP swab test for contamination',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          maxValue: 10,
          unit: 'RLU'
        },
        isConditional: true,
        conditionalLogic: [
          {
            stepId: 'batch-7',
            condition: 'greater_than',
            value: 10,
            nextStepId: 'batch-reclean'
          }
        ]
      },
      {
        id: 'batch-reclean',
        order: 8,
        title: 'Re-Clean Required',
        description: 'ATP test failed - repeat cleaning cycle',
        evidenceRequired: true,
        evidenceType: 'signature'
      },
      {
        id: 'batch-8',
        order: 9,
        title: 'Final Sign-Off',
        description: 'Approve system for next batch - requires dual signature',
        evidenceRequired: true,
        evidenceType: 'dual_signature',
        isHighRisk: true,
        evidenceConfig: {
          dualSignature: {
            role1: 'operator',
            role2: 'supervisor',
            description: 'Batch cleaning verification requires both operator execution and supervisor approval',
            requiredRoles: ['operator', 'supervisor']
          }
        }
      }
    ]
  },
  {
    id: 'tpl-6',
    name: 'Batch Release - QA Approval',
    category: 'Quality Control',
    description: 'Quality assurance approval for batch release to packaging',
    estimatedDuration: 30,
    slaHours: 48,
    version: '1.3',
    versionHistory: [
      { version: '1.0', date: new Date('2024-05-01'), author: 'QA Manager', changes: 'Initial version', status: 'archived' },
      { version: '1.3', date: new Date('2025-01-15'), author: 'QA Manager', changes: 'Added additional test requirements', status: 'active' }
    ],
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2025-01-15'),
    createdBy: 'QA Manager',
    updatedBy: 'QA Manager',
    status: 'active',
    allowedRoles: ['qa_manager', 'compliance_officer'],
    requiresDualSignoff: true,
    steps: [
      {
        id: 'release-1',
        order: 1,
        title: 'Review Test Results',
        description: 'Verify all required lab tests are complete and within specifications',
        evidenceRequired: true,
        evidenceType: 'checkbox',
        evidenceConfig: {
          options: ['Potency test complete', 'Pesticide screening passed', 'Microbial testing passed', 'Heavy metals within limits', 'Moisture content verified']
        }
      },
      {
        id: 'release-2',
        order: 2,
        title: 'Verify Batch Documentation',
        description: 'Confirm all batch records are complete and accurate',
        evidenceRequired: true,
        evidenceType: 'checkbox',
        evidenceConfig: {
          options: ['Cultivation logs complete', 'Harvest documentation complete', 'Chain of custody maintained', 'Batch ID verified', 'Weight records accurate']
        }
      },
      {
        id: 'release-3',
        order: 3,
        title: 'Compliance Check',
        description: 'Verify regulatory compliance requirements met',
        evidenceRequired: true,
        evidenceType: 'checkbox',
        evidenceConfig: {
          options: ['State tracking system updated', 'Labels reviewed and approved', 'Packaging materials approved', 'Transport documentation ready']
        }
      },
      {
        id: 'release-4',
        order: 4,
        title: 'QA Manager Approval',
        description: 'Final approval for batch release',
        evidenceRequired: true,
        evidenceType: 'dual_signature',
        isHighRisk: true,
        requiresApproval: true,
        approvalRoles: ['qa_manager', 'compliance_officer'],
        evidenceConfig: {
          dualSignature: {
            role1: 'qa_manager',
            role2: 'compliance_officer',
            description: 'Batch release requires approval from both QA Manager and Compliance Officer',
            requiredRoles: ['qa_manager', 'compliance_officer']
          }
        }
      }
    ]
  },
  {
    id: 'tpl-7',
    name: 'Waste Destruction Protocol',
    category: 'Compliance',
    description: 'Controlled destruction of non-compliant or expired product',
    estimatedDuration: 45,
    slaHours: 24,
    version: '2.0',
    versionHistory: [
      { version: '1.0', date: new Date('2024-02-01'), author: 'Compliance Officer', changes: 'Initial version', status: 'archived' },
      { version: '2.0', date: new Date('2025-01-10'), author: 'Compliance Officer', changes: 'Added video documentation requirement', status: 'active' }
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2025-01-10'),
    createdBy: 'Compliance Officer',
    updatedBy: 'Compliance Officer',
    status: 'active',
    allowedRoles: ['supervisor', 'compliance_officer'],
    requiresDualSignoff: true,
    steps: [
      {
        id: 'waste-1',
        order: 1,
        title: 'Pre-Destruction Inventory',
        description: 'Document all materials to be destroyed',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'waste-2',
        order: 2,
        title: 'Weight Verification',
        description: 'Record total weight of material for destruction',
        evidenceRequired: true,
        evidenceType: 'numeric',
        evidenceConfig: {
          unit: 'grams'
        }
      },
      {
        id: 'waste-3',
        order: 3,
        title: 'Witness Destruction',
        description: 'Two authorized personnel must witness destruction process',
        evidenceRequired: true,
        evidenceType: 'dual_signature',
        isHighRisk: true,
        evidenceConfig: {
          dualSignature: {
            role1: 'supervisor',
            role2: 'compliance_officer',
            description: 'Waste destruction must be witnessed and signed by both Supervisor and Compliance Officer',
            requiredRoles: ['supervisor', 'compliance_officer']
          }
        }
      },
      {
        id: 'waste-4',
        order: 4,
        title: 'Post-Destruction Documentation',
        description: 'Photograph destroyed material and update tracking system',
        evidenceRequired: true,
        evidenceType: 'photo'
      }
    ]
  },
  {
    id: 'tpl-8',
    name: 'Exception: Lost Tag Incident',
    category: 'Exception Scenarios',
    description: 'Emergency response procedure for lost or damaged tracking tags',
    estimatedDuration: 60,
    slaHours: 2,
    version: '1.1',
    versionHistory: [
      { version: '1.0', date: new Date('2024-07-15'), author: 'Compliance Officer', changes: 'Initial version', status: 'archived' },
      { version: '1.1', date: new Date('2025-02-01'), author: 'Compliance Officer', changes: 'Updated reporting requirements', status: 'active' }
    ],
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2025-02-01'),
    createdBy: 'Compliance Officer',
    updatedBy: 'Compliance Officer',
    status: 'active',
    allowedRoles: ['operator', 'supervisor', 'compliance_officer'],
    isExceptionScenario: true,
    requiresDualSignoff: true,
    steps: [
      {
        id: 'lost-1',
        order: 1,
        title: 'Immediate Notification',
        description: 'Notify supervisor and compliance officer immediately',
        evidenceRequired: true,
        evidenceType: 'text',
        evidenceConfig: {
          requiredText: 'Document who was notified and when'
        }
      },
      {
        id: 'lost-2',
        order: 2,
        title: 'Incident Documentation',
        description: 'Document circumstances of tag loss or damage',
        evidenceRequired: true,
        evidenceType: 'text',
        evidenceConfig: {
          requiredText: 'Describe when, where, and how tag was lost/damaged'
        }
      },
      {
        id: 'lost-3',
        order: 3,
        title: 'Physical Evidence',
        description: 'Photograph affected plant/product and location',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'lost-4',
        order: 4,
        title: 'Tracking System Search',
        description: 'Search state tracking system for tag history',
        evidenceRequired: true,
        evidenceType: 'text',
        evidenceConfig: {
          requiredText: 'Document last known status in tracking system'
        }
      },
      {
        id: 'lost-5',
        order: 5,
        title: 'Replacement Tag Request',
        description: 'Submit request for replacement tag to regulatory authority',
        evidenceRequired: true,
        evidenceType: 'qr_scan',
        evidenceConfig: {
          requiredText: 'Scan new replacement tag when received'
        }
      },
      {
        id: 'lost-6',
        order: 6,
        title: 'Supervisor Approval',
        description: 'Incident resolution requires dual approval',
        evidenceRequired: true,
        evidenceType: 'dual_signature',
        isHighRisk: true,
        evidenceConfig: {
          dualSignature: {
            role1: 'supervisor',
            role2: 'compliance_officer',
            description: 'Lost tag incident must be approved by both Supervisor and Compliance Officer',
            requiredRoles: ['supervisor', 'compliance_officer']
          }
        }
      }
    ]
  },
  {
    id: 'tpl-9',
    name: 'Exception: Theft Reporting',
    category: 'Exception Scenarios',
    description: 'Mandatory reporting procedure for suspected or confirmed theft',
    estimatedDuration: 90,
    slaHours: 1,
    version: '1.0',
    versionHistory: [
      { version: '1.0', date: new Date('2024-11-01'), author: 'Compliance Officer', changes: 'Initial version', status: 'active' }
    ],
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-01'),
    createdBy: 'Compliance Officer',
    updatedBy: 'Compliance Officer',
    status: 'active',
    allowedRoles: ['supervisor', 'compliance_officer', 'admin'],
    isExceptionScenario: true,
    requiresDualSignoff: true,
    steps: [
      {
        id: 'theft-1',
        order: 1,
        title: 'Immediate Lockdown',
        description: 'Secure affected area and prevent further access',
        evidenceRequired: true,
        evidenceType: 'checkbox',
        evidenceConfig: {
          options: ['Area secured', 'Access restricted', 'Security notified', 'Management notified']
        }
      },
      {
        id: 'theft-2',
        order: 2,
        title: 'Inventory Verification',
        description: 'Conduct immediate inventory count of affected area',
        evidenceRequired: true,
        evidenceType: 'text',
        evidenceConfig: {
          requiredText: 'List all missing items and quantities'
        }
      },
      {
        id: 'theft-3',
        order: 3,
        title: 'Evidence Collection',
        description: 'Photograph scene and collect any physical evidence',
        evidenceRequired: true,
        evidenceType: 'photo'
      },
      {
        id: 'theft-4',
        order: 4,
        title: 'Law Enforcement Notification',
        description: 'Contact local law enforcement',
        evidenceRequired: true,
        evidenceType: 'text',
        evidenceConfig: {
          requiredText: 'Document officer name, badge number, and case number'
        }
      },
      {
        id: 'theft-5',
        order: 5,
        title: 'Regulatory Authority Notification',
        description: 'Report to state regulatory authority within required timeframe',
        evidenceRequired: true,
        evidenceType: 'text',
        evidenceConfig: {
          requiredText: 'Document confirmation number and time of report'
        }
      },
      {
        id: 'theft-6',
        order: 6,
        title: 'Executive Sign-Off',
        description: 'Theft incident requires dual executive approval',
        evidenceRequired: true,
        evidenceType: 'dual_signature',
        isHighRisk: true,
        evidenceConfig: {
          dualSignature: {
            role1: 'compliance_officer',
            role2: 'admin',
            description: 'Theft reporting must be signed by both Compliance Officer and Executive Management',
            requiredRoles: ['compliance_officer', 'admin']
          }
        }
      }
    ]
  }
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    templateId: 'tpl-1',
    templateName: 'Daily Filter Change',
    assignedTo: 'John Smith',
    assignedRole: 'operator',
    status: 'pending',
    priority: 'high',
    scheduleMode: 'recurring',
    createdAt: new Date('2025-10-16T06:00:00'),
    dueAt: new Date('2025-10-16T18:00:00'),
    currentStepIndex: 0,
    evidence: []
  },
  {
    id: 'task-2',
    templateId: 'tpl-3',
    templateName: 'Calibration - pH Sensor',
    assignedTo: 'Sarah Johnson',
    assignedRole: 'operator',
    status: 'in_progress',
    priority: 'medium',
    scheduleMode: 'recurring',
    createdAt: new Date('2025-10-15T08:00:00'),
    dueAt: new Date('2025-10-23T17:00:00'),
    startedAt: new Date('2025-10-16T09:15:00'),
    currentStepIndex: 2,
    evidence: [
      {
        stepId: 'cal-1',
        type: 'photo',
        value: 'photo-placeholder',
        timestamp: new Date('2025-10-16T09:16:00')
      },
      {
        stepId: 'cal-3',
        type: 'numeric',
        value: 7.05,
        timestamp: new Date('2025-10-16T09:25:00')
      }
    ]
  },
  {
    id: 'task-3',
    templateId: 'tpl-2',
    templateName: 'Tank Swap Procedure',
    assignedTo: 'Mike Chen',
    assignedRole: 'operator',
    status: 'pending',
    priority: 'urgent',
    scheduleMode: 'event_driven',
    createdAt: new Date('2025-10-16T10:30:00'),
    dueAt: new Date('2025-10-16T22:30:00'),
    currentStepIndex: 0,
    evidence: []
  },
  {
    id: 'task-4',
    templateId: 'tpl-1',
    templateName: 'Daily Filter Change',
    assignedTo: 'John Smith',
    assignedRole: 'operator',
    status: 'completed',
    priority: 'high',
    scheduleMode: 'recurring',
    createdAt: new Date('2025-10-15T06:00:00'),
    dueAt: new Date('2025-10-15T18:00:00'),
    startedAt: new Date('2025-10-15T07:30:00'),
    completedAt: new Date('2025-10-15T08:15:00'),
    currentStepIndex: 7,
    evidence: []
  },
  {
    id: 'task-5',
    templateId: 'tpl-4',
    templateName: 'Alarm Response - High Temperature',
    assignedRole: 'operator',
    status: 'overdue',
    priority: 'urgent',
    scheduleMode: 'event_driven',
    createdAt: new Date('2025-10-16T03:45:00'),
    dueAt: new Date('2025-10-16T04:45:00'),
    currentStepIndex: 0,
    evidence: []
  },
  {
    id: 'task-6',
    templateId: 'tpl-5',
    templateName: 'Batch Transition - Cleaning Protocol',
    assignedTo: 'Sarah Johnson',
    assignedRole: 'operator',
    status: 'pending',
    priority: 'medium',
    scheduleMode: 'stage_driven',
    createdAt: new Date('2025-10-16T11:00:00'),
    dueAt: new Date('2025-10-16T15:00:00'),
    currentStepIndex: 0,
    evidence: []
  },
  {
    id: 'task-7',
    templateId: 'tpl-6',
    templateName: 'Batch Release - QA Approval',
    assignedTo: 'Dr. Emily Chen',
    assignedRole: 'qa_manager',
    status: 'awaiting_approval',
    priority: 'high',
    scheduleMode: 'manual',
    createdAt: new Date('2025-10-15T14:00:00'),
    dueAt: new Date('2025-10-17T14:00:00'),
    currentStepIndex: 3,
    evidence: [],
    batchId: 'BATCH-2025-1015-A',
    requiresApproval: true,
    approvalStatus: 'pending'
  },
  {
    id: 'task-8',
    templateId: 'tpl-7',
    templateName: 'Waste Destruction Protocol',
    assignedTo: 'Mark Davis',
    assignedRole: 'supervisor',
    status: 'pending',
    priority: 'medium',
    scheduleMode: 'manual',
    createdAt: new Date('2025-10-16T08:00:00'),
    dueAt: new Date('2025-10-17T08:00:00'),
    currentStepIndex: 0,
    evidence: []
  },
  {
    id: 'task-9',
    templateId: 'tpl-8',
    templateName: 'Exception: Lost Tag Incident',
    assignedTo: 'Lisa Wong',
    assignedRole: 'compliance_officer',
    status: 'in_progress',
    priority: 'urgent',
    scheduleMode: 'event_driven',
    createdAt: new Date('2025-10-16T10:15:00'),
    dueAt: new Date('2025-10-16T12:15:00'),
    currentStepIndex: 2,
    evidence: []
  }
];

export const roleChecklists: RoleChecklist[] = [
  {
    id: 'checklist-1',
    role: 'operator',
    frequency: 'daily',
    name: 'Operator Daily Tasks',
    description: 'Standard daily operations checklist for facility operators',
    tasks: ['tpl-1'] // Daily Filter Change
  },
  {
    id: 'checklist-2',
    role: 'supervisor',
    frequency: 'daily',
    name: 'Supervisor Daily Review',
    description: 'Daily compliance and operations review',
    tasks: ['tpl-2'] // Tank operations oversight
  },
  {
    id: 'checklist-3',
    role: 'qa_manager',
    frequency: 'weekly',
    name: 'QA Weekly Tasks',
    description: 'Weekly quality assurance procedures',
    tasks: ['tpl-3'] // Calibrations
  },
  {
    id: 'checklist-4',
    role: 'compliance_officer',
    frequency: 'monthly',
    name: 'Compliance Monthly Review',
    description: 'Monthly compliance audit and documentation review',
    tasks: ['tpl-6', 'tpl-7'] // Batch releases and waste protocols
  }
];

export const batchReleases: BatchRelease[] = [
  {
    id: 'release-1',
    batchId: 'BATCH-2025-1015-A',
    productName: 'Premium Flower - Blue Dream',
    harvestDate: new Date('2025-10-01'),
    testResults: [
      { name: 'THC %', value: '24.5%', passed: true },
      { name: 'CBD %', value: '0.8%', passed: true },
      { name: 'Pesticides', value: 'Not Detected', passed: true },
      { name: 'Microbiologicals', value: 'Pass', passed: true },
      { name: 'Heavy Metals', value: 'Pass', passed: true },
      { name: 'Moisture %', value: '11.2%', passed: true }
    ],
    status: 'pending',
    submittedBy: 'John Lab Tech',
    submittedAt: new Date('2025-10-15T14:00:00'),
    notes: 'All test results within acceptable ranges. Ready for QA approval.'
  },
  {
    id: 'release-2',
    batchId: 'BATCH-2025-1012-B',
    productName: 'Premium Flower - OG Kush',
    harvestDate: new Date('2025-09-28'),
    testResults: [
      { name: 'THC %', value: '26.2%', passed: true },
      { name: 'CBD %', value: '0.5%', passed: true },
      { name: 'Pesticides', value: 'Not Detected', passed: true },
      { name: 'Microbiologicals', value: 'Pass', passed: true },
      { name: 'Heavy Metals', value: 'Pass', passed: true },
      { name: 'Moisture %', value: '10.8%', passed: true }
    ],
    status: 'approved',
    submittedBy: 'Jane Lab Tech',
    submittedAt: new Date('2025-10-13T10:00:00'),
    reviewedBy: 'Dr. Emily Chen - QA Manager',
    reviewedAt: new Date('2025-10-14T15:30:00'),
    notes: 'Approved for packaging and distribution.'
  },
  {
    id: 'release-3',
    batchId: 'BATCH-2025-1010-C',
    productName: 'Premium Concentrate - Live Resin',
    harvestDate: new Date('2025-09-25'),
    testResults: [
      { name: 'THC %', value: '82.3%', passed: true },
      { name: 'CBD %', value: '1.2%', passed: true },
      { name: 'Pesticides', value: 'Not Detected', passed: true },
      { name: 'Residual Solvents', value: 'Below Limit', passed: true },
      { name: 'Microbiologicals', value: 'Pass', passed: true },
      { name: 'Heavy Metals', value: 'Pass', passed: true }
    ],
    status: 'rejected',
    submittedBy: 'Lab Supervisor',
    submittedAt: new Date('2025-10-11T09:00:00'),
    reviewedBy: 'Dr. Emily Chen - QA Manager',
    reviewedAt: new Date('2025-10-12T11:00:00'),
    notes: 'Rejected - Residual solvent levels need re-verification. Retest required.'
  }
];

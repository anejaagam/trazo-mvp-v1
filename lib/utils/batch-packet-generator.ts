/**
 * Batch Packet Generator
 * Generates comprehensive PDF/HTML documents for batch reporting and compliance
 */

import type { BatchEventWithTask } from '@/types/batch';

interface BatchPacketData {
  batch: {
    id: string;
    batch_number: string;
    current_stage?: string;
    plant_count?: number;
    start_date?: string;
    expected_harvest_date?: string;
    actual_harvest_date?: string;
    status?: string;
    cultivar?: {
      name: string;
      strain_type?: string;
      genetics?: string;
    } | null;
    site?: {
      name: string;
      license_number?: string;
    } | null;
    created_user?: {
      full_name: string;
      email: string;
    } | null;
    [key: string]: unknown;
  };
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    completed_at?: string;
    completed_by?: string;
    [key: string]: unknown;
  }>;
  events?: Array<BatchEventWithTask>;
  sopLinks?: Array<{
    id: string;
    sop_template?: {
      name: string;
      category?: string;
    } | null;
    [key: string]: unknown;
  }>;
  previousPackets?: Array<{
    id: string;
    packet_type: string;
    generated_at: string;
    [key: string]: unknown;
  }>;
}

interface PacketOptions {
  packetType: 'full' | 'summary' | 'compliance' | 'harvest';
  includesTasks: boolean;
  includesRecipe: boolean;
  includesInventory: boolean;
  includesCompliance: boolean;
}

/**
 * Generate batch packet as HTML (for conversion to PDF)
 */
export function generateBatchPacketHTML(
  data: BatchPacketData,
  options: PacketOptions
): string {
  const { batch, tasks, events, sopLinks } = data;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch Packet - ${batch.batch_number}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: #1e40af;
    }
    .header .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-top: 0.5rem;
    }
    .section {
      margin-bottom: 2rem;
      page-break-inside: avoid;
    }
    .section h2 {
      font-size: 20px;
      color: #1e40af;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    .section h3 {
      font-size: 16px;
      color: #475569;
      margin-bottom: 0.5rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .info-item {
      border: 1px solid #e2e8f0;
      padding: 0.75rem;
      border-radius: 4px;
    }
    .info-item .label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }
    .info-item .value {
      font-size: 16px;
      color: #1e293b;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    th {
      background: #f1f5f9;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-done { background: #dcfce7; color: #166534; }
    .status-in_progress { background: #dbeafe; color: #1e40af; }
    .status-to_do { background: #f1f5f9; color: #475569; }
    .status-active { background: #dcfce7; color: #166534; }
    .status-completed { background: #e0e7ff; color: #4338ca; }
    .footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
    @media print {
      body {
        margin: 0;
        padding: 0.25in;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Batch Packet: ${batch.batch_number}</h1>
    <div class="subtitle">
      Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </div>
    <div class="subtitle">
      Packet Type: ${options.packetType.charAt(0).toUpperCase() + options.packetType.slice(1)}
    </div>
  </div>

  <!-- Batch Overview -->
  <div class="section">
    <h2>Batch Overview</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Batch Number</div>
        <div class="value">${batch.batch_number}</div>
      </div>
      <div class="info-item">
        <div class="label">Status</div>
        <div class="value">
          <span class="status-badge status-${batch.status || 'active'}">${batch.status || 'Active'}</span>
        </div>
      </div>
      ${batch.cultivar ? `
      <div class="info-item">
        <div class="label">Cultivar</div>
        <div class="value">${batch.cultivar.name}</div>
      </div>
      ` : ''}
      <div class="info-item">
        <div class="label">Current Stage</div>
        <div class="value">${batch.current_stage || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="label">Plant Count</div>
        <div class="value">${batch.plant_count || 0}</div>
      </div>
      <div class="info-item">
        <div class="label">Start Date</div>
        <div class="value">${batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'N/A'}</div>
      </div>
      ${batch.site ? `
      <div class="info-item">
        <div class="label">Site</div>
        <div class="value">${batch.site.name}</div>
      </div>
      ` : ''}
      ${batch.site?.license_number ? `
      <div class="info-item">
        <div class="label">License Number</div>
        <div class="value">${batch.site.license_number}</div>
      </div>
      ` : ''}
    </div>
  </div>

  ${options.includesTasks && tasks && tasks.length > 0 ? `
  <!-- Tasks & SOPs -->
  <div class="section">
    <h2>Tasks & Standard Operating Procedures</h2>
    
    ${sopLinks && sopLinks.length > 0 ? `
    <h3>Linked SOP Templates</h3>
    <ul>
      ${sopLinks.map(link => `
        <li><strong>${link.sop_template?.name || 'Unknown'}</strong> (${link.sop_template?.category || 'N/A'})</li>
      `).join('')}
    </ul>
    ` : ''}
    
    <h3>Task Completion Summary</h3>
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Status</th>
          <th>Completed</th>
          <th>Completed By</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map(task => `
          <tr>
            <td>${task.title}</td>
            <td><span class="status-badge status-${task.status}">${task.status.replace('_', ' ')}</span></td>
            <td>${task.completed_at ? new Date(task.completed_at).toLocaleDateString() : '-'}</td>
            <td>${task.completed_by || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${options.includesCompliance && events && events.length > 0 ? `
  <!-- Event Timeline -->
  <div class="section">
    <h2>Event Timeline</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Event Type</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${events.slice(0, 20).map(event => `
          <tr>
            <td>${new Date(event.timestamp).toLocaleDateString()}</td>
            <td>${event.event_type.replace(/_/g, ' ')}</td>
            <td>${event.notes || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>This is an official batch documentation packet generated by TRAZO.</p>
    <p>Document ID: ${batch.id} | Generated: ${new Date().toISOString()}</p>
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Generate batch packet PDF client-side using jsPDF and html2canvas
 * Downloads directly to user's browser without server storage
 */
export async function generateBatchPacketPDF(
  data: BatchPacketData,
  options: PacketOptions
): Promise<{
  success: boolean;
  filename?: string;
  error?: string;
}> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF generation must run in the browser');
    }
    
    // Generate HTML content
    const html = generateBatchPacketHTML(data, options);
    
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '8.5in'; // Letter width
    document.body.appendChild(container);
    
    // Dynamic imports for client-side libraries
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);
    
    try {
      // Find the body element in the generated HTML
      const bodyElement = container.querySelector('body') || container;
      
      // Capture HTML as canvas
      const canvas = await html2canvas(bodyElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297; // A4 height in mm
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Generate filename
      const filename = `batch-${data.batch.batch_number}-${options.packetType}-${Date.now()}.pdf`;
      
      // Download PDF
      pdf.save(filename);
      
      return {
        success: true,
        filename
      };
    } finally {
      // Clean up temporary container
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('Error generating batch packet PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF'
    };
  }
}

/**
 * Download batch packet
 * Helper function for client-side download
 */
export function downloadBatchPacket(fileUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

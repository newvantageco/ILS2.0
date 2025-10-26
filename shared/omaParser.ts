/**
 * OMA (Optical Manufacturers Association) File Parser
 * 
 * Parses OMA files which contain optical prescription data and lens tracing information.
 * OMA files are text-based with key=value pairs.
 */

export interface OMAData {
  jobNumber?: string;
  prescription?: {
    rightEye?: {
      sphere?: string;
      cylinder?: string;
      axis?: string;
      add?: string;
    };
    leftEye?: {
      sphere?: string;
      cylinder?: string;
      axis?: string;
      add?: string;
    };
    pd?: string;
  };
  tracing?: {
    side?: string;
    points?: string;
    rawData?: string;
  };
  frameInfo?: {
    type?: string;
    size?: string;
    bridge?: string;
  };
  raw: Record<string, string | string[]>;
}

/**
 * Parse an OMA file content
 */
export function parseOMAFile(content: string): OMAData {
  const lines = content.split(/\r?\n/);
  const raw: Record<string, string | string[]> = {};
  
  // Parse all key=value pairs
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes('=')) continue;
    
    const [key, value] = trimmed.split('=', 2);
    const cleanKey = key.trim();
    const cleanValue = value?.trim() || '';
    
    // Handle multiple values separated by semicolons
    const values = cleanValue.split(';').map(v => v.trim()).filter(v => v);
    raw[cleanKey] = values.length > 1 ? values : cleanValue;
  }
  
  // Extract structured data
  const result: OMAData = { raw };
  
  // Job number
  if (raw.JOB) {
    result.jobNumber = Array.isArray(raw.JOB) ? raw.JOB[0] : raw.JOB;
  }
  
  // Prescription data
  result.prescription = {};
  
  // Sphere (SPH) - typically [rightEye, leftEye]
  if (raw.SPH) {
    const sphValues = Array.isArray(raw.SPH) ? raw.SPH : [raw.SPH];
    result.prescription.rightEye = { sphere: sphValues[0] };
    result.prescription.leftEye = { sphere: sphValues[1] };
  }
  
  // Cylinder (CYL) - typically [rightEye, leftEye]
  if (raw.CYL) {
    const cylValues = Array.isArray(raw.CYL) ? raw.CYL : [raw.CYL];
    if (!result.prescription.rightEye) result.prescription.rightEye = {};
    if (!result.prescription.leftEye) result.prescription.leftEye = {};
    result.prescription.rightEye.cylinder = cylValues[0];
    result.prescription.leftEye.cylinder = cylValues[1];
  }
  
  // Axis - typically [rightEye, leftEye]
  if (raw.AXIS) {
    const axisValues = Array.isArray(raw.AXIS) ? raw.AXIS : [raw.AXIS];
    if (!result.prescription.rightEye) result.prescription.rightEye = {};
    if (!result.prescription.leftEye) result.prescription.leftEye = {};
    result.prescription.rightEye.axis = axisValues[0];
    result.prescription.leftEye.axis = axisValues[1];
  }
  
  // Add power (ADD) - typically [rightEye, leftEye]
  if (raw.ADD) {
    const addValues = Array.isArray(raw.ADD) ? raw.ADD : [raw.ADD];
    if (!result.prescription.rightEye) result.prescription.rightEye = {};
    if (!result.prescription.leftEye) result.prescription.leftEye = {};
    result.prescription.rightEye.add = addValues[0];
    result.prescription.leftEye.add = addValues[1];
  }
  
  // Pupillary Distance (PD)
  if (raw.PD) {
    result.prescription.pd = Array.isArray(raw.PD) ? raw.PD[0] : raw.PD;
  }
  
  // Tracing data (TRAC)
  if (raw.TRAC) {
    const tracValue = Array.isArray(raw.TRAC) ? raw.TRAC.join(';') : raw.TRAC;
    result.tracing = {
      rawData: tracValue,
      side: tracValue.includes('R') ? 'Right' : tracValue.includes('L') ? 'Left' : undefined,
      points: tracValue,
    };
  }
  
  // Frame information
  if (raw.FRAME || raw.SIZE || raw.BRIDGE) {
    result.frameInfo = {
      type: raw.FRAME ? (Array.isArray(raw.FRAME) ? raw.FRAME[0] : raw.FRAME) : undefined,
      size: raw.SIZE ? (Array.isArray(raw.SIZE) ? raw.SIZE[0] : raw.SIZE) : undefined,
      bridge: raw.BRIDGE ? (Array.isArray(raw.BRIDGE) ? raw.BRIDGE[0] : raw.BRIDGE) : undefined,
    };
  }
  
  return result;
}

/**
 * Validate if a file content looks like an OMA file
 */
export function isValidOMAFile(content: string): boolean {
  if (!content || content.trim().length === 0) return false;
  
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return false;
  
  // Check if at least one line has key=value format
  const hasKeyValue = lines.some(line => line.includes('='));
  if (!hasKeyValue) return false;
  
  // Check for common OMA fields
  const commonFields = ['SPH', 'CYL', 'AXIS', 'TRAC', 'JOB', 'PD'];
  const hasCommonField = commonFields.some(field => 
    content.toUpperCase().includes(`${field}=`)
  );
  
  return hasCommonField;
}

/**
 * Format OMA data for display
 */
export function formatOMAData(data: OMAData): string {
  const lines: string[] = [];
  
  if (data.jobNumber) {
    lines.push(`Job Number: ${data.jobNumber}`);
  }
  
  if (data.prescription?.rightEye || data.prescription?.leftEye) {
    lines.push('\nPrescription:');
    
    if (data.prescription.rightEye) {
      lines.push('  Right Eye (OD):');
      if (data.prescription.rightEye.sphere) lines.push(`    Sphere: ${data.prescription.rightEye.sphere}`);
      if (data.prescription.rightEye.cylinder) lines.push(`    Cylinder: ${data.prescription.rightEye.cylinder}`);
      if (data.prescription.rightEye.axis) lines.push(`    Axis: ${data.prescription.rightEye.axis}`);
      if (data.prescription.rightEye.add) lines.push(`    Add: ${data.prescription.rightEye.add}`);
    }
    
    if (data.prescription.leftEye) {
      lines.push('  Left Eye (OS):');
      if (data.prescription.leftEye.sphere) lines.push(`    Sphere: ${data.prescription.leftEye.sphere}`);
      if (data.prescription.leftEye.cylinder) lines.push(`    Cylinder: ${data.prescription.leftEye.cylinder}`);
      if (data.prescription.leftEye.axis) lines.push(`    Axis: ${data.prescription.leftEye.axis}`);
      if (data.prescription.leftEye.add) lines.push(`    Add: ${data.prescription.leftEye.add}`);
    }
    
    if (data.prescription.pd) {
      lines.push(`  PD: ${data.prescription.pd}`);
    }
  }
  
  if (data.frameInfo) {
    lines.push('\nFrame Information:');
    if (data.frameInfo.type) lines.push(`  Type: ${data.frameInfo.type}`);
    if (data.frameInfo.size) lines.push(`  Size: ${data.frameInfo.size}`);
    if (data.frameInfo.bridge) lines.push(`  Bridge: ${data.frameInfo.bridge}`);
  }
  
  if (data.tracing) {
    lines.push('\nTracing Data:');
    if (data.tracing.side) lines.push(`  Side: ${data.tracing.side}`);
    if (data.tracing.rawData) {
      const truncated = data.tracing.rawData.length > 100 
        ? data.tracing.rawData.substring(0, 100) + '...' 
        : data.tracing.rawData;
      lines.push(`  Data: ${truncated}`);
    }
  }
  
  return lines.join('\n');
}

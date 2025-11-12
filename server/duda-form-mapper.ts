interface DudaFormField {
  field_label: string;
  field_value: string;
  field_type: string;
  field_key?: string;
  field_id?: string;
}

interface MappedLeadData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  unmappedFields: Array<{ label: string; value: string }>;
}

export class DudaFormMapper {
  private static readonly NAME_PATTERNS = [
    /^name$/i,
    /^full\s*name$/i,
    /^your\s*name$/i,
    /^customer\s*name$/i,
    /^contact\s*name$/i,
    /^first\s*and\s*last\s*name$/i,
  ];

  private static readonly EMAIL_PATTERNS = [
    /^email$/i,
    /^e-?mail$/i,
    /^email\s*address$/i,
    /^your\s*email$/i,
    /^contact\s*email$/i,
  ];

  private static readonly PHONE_PATTERNS = [
    /^phone$/i,
    /^telephone$/i,
    /^phone\s*number$/i,
    /^tel$/i,
    /^mobile$/i,
    /^contact\s*number$/i,
    /^your\s*phone$/i,
  ];

  private static readonly ADDRESS_PATTERNS = [
    /^address$/i,
    /^street\s*address$/i,
    /^your\s*address$/i,
    /^location$/i,
    /^property\s*address$/i,
    /^service\s*address$/i,
    /^full\s*address$/i,
  ];

  private static readonly NOTES_PATTERNS = [
    /^notes$/i,
    /^message$/i,
    /^comments$/i,
    /^additional\s*information$/i,
    /^details$/i,
    /^description$/i,
    /^tell\s*us\s*more$/i,
    /^project\s*details$/i,
    /^how\s*can\s*we\s*help$/i,
  ];

  private static matchesPattern(label: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(label.trim()));
  }

  static mapFormFieldsToLead(fields: DudaFormField[]): MappedLeadData {
    const mapped: MappedLeadData = {
      unmappedFields: []
    };

    for (const field of fields) {
      const label = field.field_label.trim();
      const value = field.field_value.trim();
      
      // Skip empty values and system fields
      if (!value || label.toLowerCase() === 'submission date' || label.toLowerCase() === 'form title') {
        continue;
      }

      let fieldMapped = false;

      // Try to map by field type first (most reliable)
      if (field.field_type === 'email' && !mapped.email) {
        mapped.email = value;
        fieldMapped = true;
      } else if (field.field_type === 'tel' && !mapped.phone) {
        mapped.phone = value;
        fieldMapped = true;
      }
      // Map by label patterns if type didn't match or field already filled
      else if (!mapped.name && this.matchesPattern(label, this.NAME_PATTERNS)) {
        mapped.name = value;
        fieldMapped = true;
      } else if (!mapped.email && this.matchesPattern(label, this.EMAIL_PATTERNS)) {
        mapped.email = value;
        fieldMapped = true;
      } else if (!mapped.phone && this.matchesPattern(label, this.PHONE_PATTERNS)) {
        mapped.phone = value;
        fieldMapped = true;
      } else if (!mapped.address && this.matchesPattern(label, this.ADDRESS_PATTERNS)) {
        mapped.address = value;
        fieldMapped = true;
      } else if (!mapped.notes && this.matchesPattern(label, this.NOTES_PATTERNS)) {
        mapped.notes = value;
        fieldMapped = true;
      }

      // If field wasn't mapped, add to unmapped fields (can be stored in notes or variables)
      if (!fieldMapped) {
        mapped.unmappedFields.push({ label, value });
      }
    }

    // Append unmapped fields to notes if they exist
    if (mapped.unmappedFields.length > 0) {
      const unmappedText = mapped.unmappedFields
        .map(f => `${f.label}: ${f.value}`)
        .join('\n');
      
      if (mapped.notes) {
        mapped.notes += '\n\n--- Additional Form Data ---\n' + unmappedText;
      } else {
        mapped.notes = '--- Form Data ---\n' + unmappedText;
      }
    }

    return mapped;
  }

  static validateMappedLead(mapped: MappedLeadData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Name and email are required for a valid lead
    if (!mapped.name || mapped.name.trim().length === 0) {
      errors.push('Name is required but could not be found in form submission');
    }

    if (!mapped.email || mapped.email.trim().length === 0) {
      errors.push('Email is required but could not be found in form submission');
    }

    // Basic email validation
    if (mapped.email && !this.isValidEmail(mapped.email)) {
      errors.push('Email address appears to be invalid');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static createLeadSummary(mapped: MappedLeadData, siteName: string): string {
    const parts = [
      `New lead from Duda website (${siteName})`,
      `Name: ${mapped.name || 'Not provided'}`,
      `Email: ${mapped.email || 'Not provided'}`,
    ];

    if (mapped.phone) {
      parts.push(`Phone: ${mapped.phone}`);
    }

    if (mapped.address) {
      parts.push(`Address: ${mapped.address}`);
    }

    if (mapped.notes) {
      parts.push(`\nNotes:\n${mapped.notes}`);
    }

    return parts.join('\n');
  }
}

// src/components/employees/documents/DocumentCategoryTypes.ts

export const DOCUMENT_CATEGORIES = {
  IDENTIFICATION: "Identification",
  EMPLOYMENT: "Employment",
  FINANCIAL: "Financial",
  EDUCATION: "Education",
  IMMIGRATION: "Immigration",
  MEDICAL: "Medical",
  PERFORMANCE: "Performance",
  OTHER: "Other"
} as const;

export type DocumentCategoryKey = keyof typeof DOCUMENT_CATEGORIES;
export type DocumentCategoryLabel = typeof DOCUMENT_CATEGORIES[DocumentCategoryKey];

export const DOCUMENT_CATEGORY_OPTIONS_ARRAY: { key: DocumentCategoryKey; label: DocumentCategoryLabel }[] =
  (Object.keys(DOCUMENT_CATEGORIES) as DocumentCategoryKey[]).map(key => ({
    key: key,
    label: DOCUMENT_CATEGORIES[key]
  }));

export const DOCUMENT_CATEGORIES_MAP: Record<DocumentCategoryKey, DocumentCategoryLabel> =
  DOCUMENT_CATEGORY_OPTIONS_ARRAY.reduce((acc, curr) => {
    acc[curr.key] = curr.label;
    return acc;
}, {} as Record<DocumentCategoryKey, DocumentCategoryLabel>);

export interface DocumentTypeOption { value: string; label: string; description?: string; }

// Ensure this DOCUMENT_TYPES object is fully populated for all categories
// The keys here are the LABELS from DOCUMENT_CATEGORIES
export const DOCUMENT_TYPES: Record<string, Array<DocumentTypeOption>> = {
  [DOCUMENT_CATEGORIES.IDENTIFICATION]: [
    { value: "national_id", label: "National ID", description: "NRIC, FIN, or other national identification" },
    { value: "passport", label: "Passport", description: "International passport" },
    { value: "drivers_license", label: "Driver's License", description: "Driving permit" },
    { value: "birth_certificate", label: "Birth Certificate" }
  ],
  [DOCUMENT_CATEGORIES.EMPLOYMENT]: [
    { value: "offer_letter", label: "Offer Letter", description: "Official job offer document" },
    { value: "employment_contract", label: "Employment Contract", description: "Signed employment agreement" },
    { value: "confidentiality_agreement", label: "Confidentiality Agreement", description: "NDA or confidentiality contract" },
    { value: "termination_letter", label: "Termination Letter" },
    { value: "resignation_letter", label: "Resignation Letter" }
  ],
  [DOCUMENT_CATEGORIES.FINANCIAL]: [
    { value: "salary_slip", label: "Salary Slip", description: "Pay stub or salary statement" },
    { value: "bank_info", label: "Bank Information", description: "Bank account details for salary" },
    { value: "cpf_statement", label: "CPF Statement", description: "Central Provident Fund statement" },
    { value: "tax_documents", label: "Tax Documents", description: "Income tax or clearance" }
  ],
  [DOCUMENT_CATEGORIES.EDUCATION]: [
    { value: "degree_certificate", label: "Degree Certificate", description: "University or college degree" },
    { value: "diploma", label: "Diploma", description: "Educational diploma" },
    { value: "transcript", label: "Transcript", description: "Academic transcript" },
    { value: "certification", label: "Professional Certification", description: "Industry or skill certification" }
  ],
  [DOCUMENT_CATEGORIES.IMMIGRATION]: [
    { value: "work_permit", label: "Work Permit", description: "Authorization to work" },
    { value: "visa", label: "Visa", description: "Entry or residence visa" },
    { value: "employment_pass", label: "Employment Pass", description: "Singapore EP or S-Pass" },
    { value: "dependent_pass", label: "Dependent Pass" }
  ],
  [DOCUMENT_CATEGORIES.MEDICAL]: [
    { value: "medical_certificate", label: "Medical Certificate", description: "MC for leave" },
    { value: "health_insurance", label: "Health Insurance", description: "Insurance card or policy" },
    { value: "medical_report", label: "Medical Report", description: "Health assessment" },
    { value: "vaccination_record", label: "Vaccination Record" }
  ],
  [DOCUMENT_CATEGORIES.PERFORMANCE]: [
    { value: "performance_review", label: "Performance Review", description: "Periodic evaluation" },
    { value: "warning_letter", label: "Warning Letter" },
    { value: "commendation", label: "Commendation", description: "Recognition or award" },
    { value: "training_certificate", label: "Training Certificate", description: "Completed training" }
  ],
  [DOCUMENT_CATEGORIES.OTHER]: [
    { value: "reference_letter", label: "Reference Letter", description: "Professional reference" },
    { value: "miscellaneous", label: "Miscellaneous", description: "Other documents (specify in name/label)" }
  ]
};

// Renamed to getTypeFromValue and ensured it's exported
export const getTypeFromValue = (categoryKey: DocumentCategoryKey | undefined, typeValue: string | undefined): string => {
  if (!categoryKey || !typeValue) return typeValue || 'N/A';
  const categoryLabel = DOCUMENT_CATEGORIES_MAP[categoryKey];
  if (!categoryLabel) return typeValue || 'N/A'; // Should not happen if categoryKey is valid

  const typesForCategory = DOCUMENT_TYPES[categoryLabel];
  if (typesForCategory) {
    const docType = typesForCategory.find(type => type.value === typeValue);
    return docType ? docType.label : typeValue; // Return label or the value itself if not found
  }
  return typeValue; // Fallback if categoryLabel not in DOCUMENT_TYPES (should not happen if data is consistent)
};

// Kept your other helper functions, ensure they are used consistently or remove if redundant
export const getCategoryFromValue = (value: string): string => {
  // This assumes value is a LABEL, returns the LABEL if found, or "Other"
  const foundKey = (Object.keys(DOCUMENT_CATEGORIES) as DocumentCategoryKey[]).find(key => DOCUMENT_CATEGORIES[key] === value);
  if (foundKey) {
    return DOCUMENT_CATEGORIES[foundKey];
  }
  return "Other";
};

export const getDisplayLabel = (categoryKey: DocumentCategoryKey | undefined, typeValue: string | undefined): string => {
  const categoryLabel = categoryKey ? DOCUMENT_CATEGORIES_MAP[categoryKey] : "N/A";
  const typeLabel = getTypeFromValue(categoryKey, typeValue);
  if (categoryLabel === 'N/A' && typeLabel === 'N/A') return 'N/A';
  if (categoryLabel === 'N/A') return typeLabel;
  if (typeLabel === 'N/A') return categoryLabel;
  return `${categoryLabel} - ${typeLabel}`;
};
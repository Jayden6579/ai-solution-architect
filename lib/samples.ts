/** A curated set of sample customer requirements for the "Sample" button. */
export const SAMPLE_REQUIREMENTS: string[] = [
  `Customer wants to migrate Oracle database to OceanBase.
Country: Malaysia
Users: 5000
Need High Availability.
Need Disaster Recovery.
Budget is medium.
Application is LMS.`,

  `We are building a new core banking platform for a mid-sized bank.
Country: Singapore
Expected users: 50,000
Must be Highly Available with zero downtime during business hours.
Cross-region Disaster Recovery is mandatory.
Budget: high
Compliance: MAS regulations, data residency required.`,

  `Migrating a legacy on-prem e-commerce platform to the cloud.
Country: Indonesia
Users: 200,000 peak during campaigns
Need to handle 10x traffic spikes on sale days
Budget: low
Application: e-commerce storefront + order management`,

  `Healthcare provider needs a patient portal and EHR integration layer.
Country: Thailand
Users: 8,000 staff, 120,000 patients
High Availability required
Disaster Recovery required
Budget: medium
Strict data privacy and HIPAA-equivalent compliance.`,
];

/** The default sample (the example from the project brief). */
export const DEFAULT_SAMPLE = SAMPLE_REQUIREMENTS[0];

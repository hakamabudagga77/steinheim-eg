export type ContactLeadStatus = "new" | "read" | "replied" | "archived";

export type ContactLead = {
  id: string;
  submittedAt: string;
  status: ContactLeadStatus;
  enquiryType: "homeowner" | "trade" | "general";
  name: string;
  email: string;
  phone: string;
  cityOrCompany: string;
  subject: string;
  message: string;
};

export function isContactLeadStatus(value: unknown): value is ContactLeadStatus {
  return value === "new" || value === "read" || value === "replied" || value === "archived";
}

export const CONTACT_LEAD_STATUS_LABELS: Record<ContactLeadStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

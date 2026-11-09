export interface BillerCategory {
  id: string;
  name: string;
  category: "electricity" | "airtime" | "data" | "cable" | "school";
  placeholder: string;
}

/** Same biller categories as the original PRD's bill-pay list, VTpass-backed (see billsteady-backend). */
export const BILLER_CATEGORIES: BillerCategory[] = [
  { id: "electricity", name: "Electricity (DisCo)", category: "electricity", placeholder: "Meter number" },
  { id: "airtime", name: "Airtime", category: "airtime", placeholder: "Phone number" },
  { id: "data", name: "Data", category: "data", placeholder: "Phone number" },
  { id: "cable", name: "Cable TV", category: "cable", placeholder: "Smartcard number" },
  { id: "school", name: "School fees", category: "school", placeholder: "Student/payment reference" },
];

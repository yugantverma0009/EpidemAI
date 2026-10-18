export type SchemeTopic = "all" | "public_care" | "hospital" | "senior" | "pregnancy" | "child" | "medicines" | "diagnostics" | "digital_health" | "financial_assistance" | "worker" | "government_employee";
export type NavigatorAnswer = "yes" | "no" | "unknown" | "prefer_not_to_say";

export interface SchemeMatchRequest {
  state: string | null;
  district: string | null;
  topics: SchemeTopic[];
  age_group: "unknown" | "under18" | "18_59" | "60_69" | "70_plus";
  age: number | null;
  gender: "unknown" | "male" | "female" | "other";
  income_band: "unknown" | "under_1_lakh" | "1_3_lakh" | "3_5_lakh" | "5_10_lakh" | "above_10_lakh";
  occupation: "unknown" | "govt_central" | "govt_state" | "pensioner_central" | "ex_serviceman" | "organised_private" | "unorganised" | "gig_worker" | "farmer" | "student" | "none";
  area: "unknown" | "urban" | "rural";
  pregnant: NavigatorAnswer;
  child_under_one: NavigatorAnswer;
  pmjay_beneficiary: NavigatorAnswer;
  worker_group: "none" | "asha" | "anganwadi_worker" | "anganwadi_helper" | "other" | "unknown";
  government_employment: "unknown" | "none" | "delhi_employee" | "delhi_pensioner" | "other";
  nfsc_card: NavigatorAnswer;
  delhi_residence_years: number | null;
  government_hospital_treatment: NavigatorAnswer;
  bpl_or_secc: NavigatorAnswer;
  tb_patient: NavigatorAnswer;
  disability: NavigatorAnswer;
  sc_st: NavigatorAnswer;
}

export interface HealthScheme {
  scheme_id: string;
  name: string;
  kind: string;
  jurisdiction: string;
  topics: string[];
  summary: string;
  benefit: string;
  criteria: string[];
  documents: string[];
  actions: { label: string; url: string }[];
  source_url: string;
  source_label: string;
  source_date: string | null;
  checked_date: string | null;
  review_status: string;
  eligibility?: Record<string, unknown>;
  source_quote?: string;
  source_availability?: "current" | "possibly_discontinued";
  match_status?: string;
  match_reasons?: string[];
}

export interface SchemeMatchResponse {
  results: HealthScheme[];
  state: string | null;
  state_catalog: "partial" | "not_selected" | "not_available";
  state_catalog_note: string;
  state_scheme_search_url: string;
  disclaimer: string;
  catalog_status: string;
}

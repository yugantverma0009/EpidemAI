export type AssistantSymptom = {
  name: string;
  reported: true;
  duration_days?: number;
  severity?: "mild" | "moderate" | "severe";
};

export type AssistantQuestion = { id: string; text: string };

export type PredictedDisease = {
  id: string;
  name: string;
  category: string;
  match_score: number;
  confidence_level: "High" | "Moderate" | "Low";
  matching_symptoms: string[];
  description: string;
  regional_risk: string;
  regional_records_count: number;
};

export type TargetedTest = {
  test_name: string;
  for_condition: string;
  timing: string;
  purpose: string;
  priority: "High" | "Secondary";
  estimated_cost_inr: string;
  turnaround_time: string;
  free_in_government: boolean;
};

export type CostOptimization = {
  targeted_cost_range_inr: string;
  blanket_panel_cost_inr: string;
  estimated_savings_percentage: number;
  estimated_savings_inr: string;
  avoided_unnecessary_tests: string[];
  subsidized_note: string;
};

export type BlanketPanelAvoided = {
  panel_name: string;
  typical_commercial_cost: string;
  drawbacks: string[];
  included_unnecessary_tests: string[];
};

export type PatientContext = {
  symptoms_evaluated: number;
  duration_days: number | null;
  district?: string;
  state?: string;
  age_group?: string;
  gender?: string;
};

export type AssistantTriageResult = {
  urgent: boolean;
  rule_id?: string;
  message?: string;
  next_steps?: string[];
  care_level?: string;
  follow_up_questions?: AssistantQuestion[];
  guidance?: {
    summary: string;
    next_steps: string[];
    discussion_topics?: { name: string; reason: string; evidence_id: string }[];
    testing_guidance?: {
      status: string;
      message: string;
      questions: string[];
    };
    sources: { name: string; url: string }[];
    content_review_status: string;
  };
  predicted_diseases?: PredictedDisease[];
  targeted_tests?: TargetedTest[];
  cost_optimization?: CostOptimization;
  blanket_panel_avoided?: BlanketPanelAvoided;
  patient_context?: PatientContext;
  disclaimer: string;
  content_review_status?: string;
};

export type AssistantContext = {
  location: { state: string; district: string };
  items: {
    disease: string;
    type: string;
    source: string;
    data_period: string;
    freshness: string;
    note: string;
  }[];
  status: "available" | "unavailable";
  limitations: string[];
};

export type AssistantSession = { session_id: string; access_token: string; token_type: "bearer"; expires_at: string };

export type StoredAssistantEntry = {
  id: string;
  created_at: string;
  expires_at: string;
  symptoms: AssistantSymptom[];
  answers: Record<string, string | null>;
  care_level: string | null;
  urgent: boolean;
  guidance: Record<string, unknown>;
};

export type AssistantCheckIn = {
  id: string;
  entry_id: string;
  created_at: string;
  status: "better" | "same" | "worse";
  symptoms_text: string;
  urgent: boolean;
  message?: string | null;
  next_steps?: string[];
};

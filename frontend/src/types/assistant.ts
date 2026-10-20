export type AssistantSymptom = {
  name: string;
  reported: true;
  duration_days?: number;
  severity?: "mild" | "moderate" | "severe";
};

export type AssistantQuestion = { id: string; text: string };

export type TargetedTest = {
  test_name: string;
  purpose: string;
  estimated_cost_inr: number;
  priority: string;
  sample_type: string;
  turnaround_time: string;
};

export type DiseasePrediction = {
  id: string;
  disease: string;
  probability: number;
  urgency: "low" | "moderate" | "high";
  matched_symptoms: string[];
  key_indicators: string;
  description: string;
  regional_boost?: boolean;
  regional_note?: string | null;
  targeted_tests: TargetedTest[];
  blanket_cost_inr?: number;
};

export type CostOptimization = {
  blanket_panel_cost_inr: number;
  targeted_tests_cost_inr: number;
  estimated_savings_inr: number;
  savings_percentage: number;
  cost_rationale: string;
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
  disease_predictions?: DiseasePrediction[];
  recommended_tests?: TargetedTest[];
  cost_optimization?: CostOptimization;
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

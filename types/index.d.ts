// Database types
export interface DatabaseResume {
  id: string;
  user_id: string;
  company_name: string | null;
  job_title: string | null;
  job_description: string | null;
  resume_file_url: string;
  resume_file_name: string;
  resume_thumbnail_url: string | null;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  overall_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseResumeAnalysis {
  id: string;
  resume_id: string;
  ats_score: number | null;
  ats_tips: AnalysisTip[];
  tone_style_score: number | null;
  tone_style_tips: AnalysisTip[];
  content_score: number | null;
  content_tips: AnalysisTip[];
  structure_score: number | null;
  structure_tips: AnalysisTip[];
  skills_score: number | null;
  skills_tips: AnalysisTip[];
  keywords_found: string[] | null;
  keywords_missing: string[] | null;
  sections_found: string[] | null;
  sections_missing: string[] | null;
  ai_model_used: string | null;
  analysis_version: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisTip {
  type: "good" | "bad" | "improve";
  tip: string;
  explanation?: string;
}

// UI types (for backward compatibility)
interface Resume {
  id: string;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  imagePath: string;
  resumePath: string;
  status?: 'pending' | 'analyzing' | 'completed' | 'failed';
  createdAt?: string;
  feedback: Feedback;
}

interface Feedback {
  overallScore: number;
  ATS: {
    score: number;
    tips: {
      type: "good" | "bad";
      tip: string;
    }[];
  };
  toneAndStyle: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  content: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  structure: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  skills: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_user_id: string
          email: string
          first_name: string | null
          last_name: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          company_name: string | null
          job_title: string | null
          job_description: string | null
          resume_file_url: string
          resume_file_name: string
          resume_thumbnail_url: string | null
          status: 'pending' | 'analyzing' | 'completed' | 'failed'
          overall_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name?: string | null
          job_title?: string | null
          job_description?: string | null
          resume_file_url: string
          resume_file_name: string
          resume_thumbnail_url?: string | null
          status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          overall_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string | null
          job_title?: string | null
          job_description?: string | null
          resume_file_url?: string
          resume_file_name?: string
          resume_thumbnail_url?: string | null
          status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          overall_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      resume_analysis: {
        Row: {
          id: string
          resume_id: string
          ats_score: number | null
          ats_tips: Json
          tone_style_score: number | null
          tone_style_tips: Json
          content_score: number | null
          content_tips: Json
          structure_score: number | null
          structure_tips: Json
          skills_score: number | null
          skills_tips: Json
          keywords_found: string[] | null
          keywords_missing: string[] | null
          sections_found: string[] | null
          sections_missing: string[] | null
          ai_model_used: string | null
          analysis_version: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resume_id: string
          ats_score?: number | null
          ats_tips?: Json
          tone_style_score?: number | null
          tone_style_tips?: Json
          content_score?: number | null
          content_tips?: Json
          structure_score?: number | null
          structure_tips?: Json
          skills_score?: number | null
          skills_tips?: Json
          keywords_found?: string[] | null
          keywords_missing?: string[] | null
          sections_found?: string[] | null
          sections_missing?: string[] | null
          ai_model_used?: string | null
          analysis_version?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resume_id?: string
          ats_score?: number | null
          ats_tips?: Json
          tone_style_score?: number | null
          tone_style_tips?: Json
          content_score?: number | null
          content_tips?: Json
          structure_score?: number | null
          structure_tips?: Json
          skills_score?: number | null
          skills_tips?: Json
          keywords_found?: string[] | null
          keywords_missing?: string[] | null
          sections_found?: string[] | null
          sections_missing?: string[] | null
          ai_model_used?: string | null
          analysis_version?: string
          created_at?: string
          updated_at?: string
        }
      }
      resume_keywords: {
        Row: {
          id: string
          resume_id: string
          keyword: string
          frequency: number
          category: 'technical' | 'soft_skill' | 'industry' | 'certification' | 'tool' | null
          created_at: string
        }
        Insert: {
          id?: string
          resume_id: string
          keyword: string
          frequency?: number
          category?: 'technical' | 'soft_skill' | 'industry' | 'certification' | 'tool' | null
          created_at?: string
        }
        Update: {
          id?: string
          resume_id?: string
          keyword?: string
          frequency?: number
          category?: 'technical' | 'soft_skill' | 'industry' | 'certification' | 'tool' | null
          created_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'free' | 'basic' | 'premium' | 'enterprise'
          resumes_analyzed_count: number
          resumes_limit: number
          subscription_start_date: string | null
          subscription_end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type?: 'free' | 'basic' | 'premium' | 'enterprise'
          resumes_analyzed_count?: number
          resumes_limit?: number
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'free' | 'basic' | 'premium' | 'enterprise'
          resumes_analyzed_count?: number
          resumes_limit?: number
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      analysis_templates: {
        Row: {
          id: string
          name: string
          job_category: string
          required_keywords: string[] | null
          required_sections: string[] | null
          scoring_weights: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          job_category: string
          required_keywords?: string[] | null
          required_sections?: string[] | null
          scoring_weights?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          job_category?: string
          required_keywords?: string[] | null
          required_sections?: string[] | null
          scoring_weights?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

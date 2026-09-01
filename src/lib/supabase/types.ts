export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type RateType = "hourly" | "fixed" | "negotiable";
export type JobStatus = "open" | "closed" | "filled";
export type ApplicationStatus = "pending" | "accepted" | "declined";
export type EngagementStatus = "active" | "completed" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          bio: string | null;
          school: string | null;
          course_year: string | null;
          photo_url: string | null;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          bio?: string | null;
          school?: string | null;
          course_year?: string | null;
          photo_url?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          bio?: string | null;
          school?: string | null;
          course_year?: string | null;
          photo_url?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profile_private: {
        Row: {
          user_id: string;
          email: string;
          phone: string | null;
        };
        Insert: {
          user_id: string;
          email: string;
          phone?: string | null;
        };
        Update: {
          user_id?: string;
          email?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      verifications: {
        Row: {
          user_id: string;
          status: VerificationStatus;
          student_id_doc_path: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          status?: VerificationStatus;
          student_id_doc_path?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          status?: VerificationStatus;
          student_id_doc_path?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      service_listings: {
        Row: {
          id: string;
          user_id: string;
          category_id: number;
          title: string;
          description: string;
          rate: number | null;
          rate_type: RateType;
          area: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: number;
          title: string;
          description: string;
          rate?: number | null;
          rate_type: RateType;
          area: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: number;
          title?: string;
          description?: string;
          rate?: number | null;
          rate_type?: RateType;
          area?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_listings_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      job_posts: {
        Row: {
          id: string;
          user_id: string;
          category_id: number;
          title: string;
          description: string;
          budget: number | null;
          date_needed: string | null;
          area: string;
          status: JobStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: number;
          title: string;
          description: string;
          budget?: number | null;
          date_needed?: string | null;
          area: string;
          status?: JobStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: number;
          title?: string;
          description?: string;
          budget?: number | null;
          date_needed?: string | null;
          area?: string;
          status?: JobStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          id: string;
          job_post_id: string;
          applicant_id: string;
          message: string;
          status: ApplicationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_post_id: string;
          applicant_id: string;
          message: string;
          status?: ApplicationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_post_id?: string;
          applicant_id?: string;
          message?: string;
          status?: ApplicationStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_job_post_id_fkey";
            columns: ["job_post_id"];
            isOneToOne: false;
            referencedRelation: "job_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          participant_a_id: string;
          participant_b_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_a_id: string;
          participant_b_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          participant_a_id?: string;
          participant_b_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      engagements: {
        Row: {
          id: string;
          poster_id: string;
          worker_id: string;
          job_post_id: string | null;
          service_listing_id: string | null;
          status: EngagementStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          poster_id: string;
          worker_id: string;
          job_post_id?: string | null;
          service_listing_id?: string | null;
          status?: EngagementStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          poster_id?: string;
          worker_id?: string;
          job_post_id?: string | null;
          service_listing_id?: string | null;
          status?: EngagementStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

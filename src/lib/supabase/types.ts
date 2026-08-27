export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type RateType = "hourly" | "fixed" | "negotiable";

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
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

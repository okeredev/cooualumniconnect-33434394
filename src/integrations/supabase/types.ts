export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          status: string
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: string
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string
          id: string
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string
          id?: string
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string
          id?: string
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolved?: boolean
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          message: string | null
          purpose: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          purpose?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          purpose?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      education: {
        Row: {
          created_at: string
          degree: string | null
          end_year: number | null
          field: string | null
          id: string
          school: string
          start_year: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          end_year?: number | null
          field?: string | null
          id?: string
          school: string
          start_year?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          end_year?: number | null
          field?: string | null
          id?: string
          school?: string
          start_year?: number | null
          user_id?: string
        }
        Relationships: []
      }
      employment: {
        Row: {
          company: string
          created_at: string
          current: boolean
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          current?: boolean
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          current?: boolean
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          location: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          apply_url: string | null
          company: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          posted_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          company: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          posted_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          company?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          posted_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mentor_profiles: {
        Row: {
          available: boolean
          bio: string | null
          capacity: number
          created_at: string
          id: string
          topics: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: boolean
          bio?: string | null
          capacity?: number
          created_at?: string
          id?: string
          topics?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: boolean
          bio?: string | null
          capacity?: number
          created_at?: string
          id?: string
          topics?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentorship_requests: {
        Row: {
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          alt_email: string | null
          avatar_url: string | null
          bio: string | null
          certificate_review_notes: string | null
          certificate_reviewed_at: string | null
          certificate_reviewed_by: string | null
          certificate_status: string
          certificate_url: string | null
          city: string | null
          country: string | null
          created_at: string
          current_address: string | null
          date_of_birth: string | null
          department: string | null
          display_name: string | null
          email: string | null
          facebook: string | null
          github: string | null
          graduation_year: number | null
          hide_phone: boolean
          id: string
          instagram: string | null
          last_seen_at: string | null
          linkedin: string | null
          phone: string | null
          state: string | null
          suspended: boolean
          telegram: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string
          user_id: string
          verified: boolean
          website: string | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          address?: string | null
          alt_email?: string | null
          avatar_url?: string | null
          bio?: string | null
          certificate_review_notes?: string | null
          certificate_reviewed_at?: string | null
          certificate_reviewed_by?: string | null
          certificate_status?: string
          certificate_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          facebook?: string | null
          github?: string | null
          graduation_year?: number | null
          hide_phone?: boolean
          id?: string
          instagram?: string | null
          last_seen_at?: string | null
          linkedin?: string | null
          phone?: string | null
          state?: string | null
          suspended?: boolean
          telegram?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          address?: string | null
          alt_email?: string | null
          avatar_url?: string | null
          bio?: string | null
          certificate_review_notes?: string | null
          certificate_reviewed_at?: string | null
          certificate_reviewed_by?: string | null
          certificate_status?: string
          certificate_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          facebook?: string | null
          github?: string | null
          graduation_year?: number | null
          hide_phone?: boolean
          id?: string
          instagram?: string | null
          last_seen_at?: string | null
          linkedin?: string | null
          phone?: string | null
          state?: string | null
          suspended?: boolean
          telegram?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
          website?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          address: string | null
          alt_email: string | null
          avatar_url: string | null
          bio: string | null
          certificate_status: string | null
          certificate_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          current_address: string | null
          date_of_birth: string | null
          department: string | null
          display_name: string | null
          email: string | null
          facebook: string | null
          github: string | null
          graduation_year: number | null
          hide_phone: boolean | null
          id: string | null
          instagram: string | null
          last_seen_at: string | null
          linkedin: string | null
          phone: string | null
          state: string | null
          suspended: boolean | null
          telegram: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
          website: string | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          address?: string | null
          alt_email?: string | null
          avatar_url?: string | null
          bio?: string | null
          certificate_status?: string | null
          certificate_url?: never
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_address?: string | null
          date_of_birth?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          facebook?: string | null
          github?: string | null
          graduation_year?: number | null
          hide_phone?: boolean | null
          id?: string | null
          instagram?: string | null
          last_seen_at?: string | null
          linkedin?: string | null
          phone?: never
          state?: string | null
          suspended?: boolean | null
          telegram?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: never
          youtube?: string | null
        }
        Update: {
          address?: string | null
          alt_email?: string | null
          avatar_url?: string | null
          bio?: string | null
          certificate_status?: string | null
          certificate_url?: never
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_address?: string | null
          date_of_birth?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          facebook?: string | null
          github?: string | null
          graduation_year?: number | null
          hide_phone?: boolean | null
          id?: string | null
          instagram?: string | null
          last_seen_at?: string | null
          linkedin?: string | null
          phone?: never
          state?: string | null
          suspended?: boolean | null
          telegram?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: never
          youtube?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

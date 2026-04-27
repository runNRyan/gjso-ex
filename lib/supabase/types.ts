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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      worldcup_results: {
        Row: {
          id: string
          category: string
          champion_text: string
          personality_type: string | null
          personality_emoji: string | null
          personality_subtitle: string | null
          personality_description: string | null
          result_count: number
          created_at: string | null
        }
        Insert: {
          id: string
          category: string
          champion_text: string
          personality_type?: string | null
          personality_emoji?: string | null
          personality_subtitle?: string | null
          personality_description?: string | null
          result_count?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          category?: string
          champion_text?: string
          personality_type?: string | null
          personality_emoji?: string | null
          personality_subtitle?: string | null
          personality_description?: string | null
          result_count?: number
          created_at?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          guest_nickname: string | null
          id: string
          is_deleted: boolean | null
          like_count: number | null
          parent_id: string | null
          question_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          guest_nickname?: string | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          question_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          guest_nickname?: string | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          question_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      point_history: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["point_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["point_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["point_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean | null
          prediction: Database["public"]["Enums"]["prediction_choice"]
          question_id: string
          reward_points: number | null
          user_id: string | null
          guest_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          prediction: Database["public"]["Enums"]["prediction_choice"]
          question_id: string
          reward_points?: number | null
          user_id?: string | null
          guest_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          prediction?: Database["public"]["Enums"]["prediction_choice"]
          question_id?: string
          reward_points?: number | null
          user_id?: string | null
          guest_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          guest_migrated: boolean
          id: string
          nickname: string
          point_balance: number | null
          provider: string | null
          updated_at: string | null
          user_level: number | null
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          guest_migrated?: boolean
          id: string
          nickname: string
          point_balance?: number | null
          provider?: string | null
          updated_at?: string | null
          user_level?: number | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          guest_migrated?: boolean
          id?: string
          nickname?: string
          point_balance?: number | null
          provider?: string | null
          updated_at?: string | null
          user_level?: number | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          balance_type: Database["public"]["Enums"]["balance_type"] | null
          category: string | null
          close_at: string | null
          closed_at: string | null
          comment_count: number | null
          created_at: string | null
          created_by: string | null
          id: string
          option_a: string
          option_b: string
          published_at: string | null
          status: Database["public"]["Enums"]["question_status"] | null
          title: string
          vote_count_a: number | null
          vote_count_b: number | null
        }
        Insert: {
          balance_type?: Database["public"]["Enums"]["balance_type"] | null
          category?: string | null
          close_at?: string | null
          closed_at?: string | null
          comment_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          option_a: string
          option_b: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["question_status"] | null
          title: string
          vote_count_a?: number | null
          vote_count_b?: number | null
        }
        Update: {
          balance_type?: Database["public"]["Enums"]["balance_type"] | null
          category?: string | null
          close_at?: string | null
          closed_at?: string | null
          comment_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          option_a?: string
          option_b?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["question_status"] | null
          title?: string
          vote_count_a?: number | null
          vote_count_b?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suggested_questions: {
        Row: {
          created_at: string | null
          id: string
          option_a: string
          option_b: string
          status: Database["public"]["Enums"]["suggestion_status"] | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_a: string
          option_b: string
          status?: Database["public"]["Enums"]["suggestion_status"] | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_a?: string
          option_b?: string
          status?: Database["public"]["Enums"]["suggestion_status"] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggested_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          choice: Database["public"]["Enums"]["vote_choice"]
          created_at: string | null
          guest_id: string | null
          id: string
          question_id: string
          user_id: string | null
        }
        Insert: {
          choice: Database["public"]["Enums"]["vote_choice"]
          created_at?: string | null
          guest_id?: string | null
          id?: string
          question_id: string
          user_id?: string | null
        }
        Update: {
          choice?: Database["public"]["Enums"]["vote_choice"]
          created_at?: string | null
          guest_id?: string | null
          id?: string
          question_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          id: string | null
          nickname: string | null
          point_balance: number | null
          user_level: number | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          created_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_period_rankings: {
        Args: {
          start_date: string
        }
        Returns: {
          user_id: string
          nickname: string
          user_level: number
          total_points: number
        }[]
      }
      get_period_user_count: {
        Args: {
          start_date: string
        }
        Returns: number
      }
    }
    Enums: {
      balance_type: "golden" | "normal"
      point_type: "vote_bonus" | "prediction_reward"
      prediction_choice: "a" | "b" | "golden"
      question_status: "draft" | "published" | "closed" | "legend"
      suggestion_status: "new" | "reviewed" | "used"
      user_type: "guest" | "member" | "admin" | "ghost"
      vote_choice: "a" | "b"
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
      balance_type: ["golden", "normal"],
      point_type: ["vote_bonus", "prediction_reward"],
      prediction_choice: ["a", "b", "golden"],
      question_status: ["draft", "published", "closed", "legend"],
      suggestion_status: ["new", "reviewed", "used"],
      user_type: ["guest", "member", "admin", "ghost"],
      vote_choice: ["a", "b"],
    },
  },
} as const

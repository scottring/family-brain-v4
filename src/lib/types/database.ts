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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      daily_itineraries: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["itinerary_status"]
          title: string | null
          total_actual_minutes: number | null
          total_planned_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["itinerary_status"]
          title?: string | null
          total_actual_minutes?: number | null
          total_planned_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["itinerary_status"]
          title?: string | null
          total_actual_minutes?: number | null
          total_planned_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_itineraries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      family_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          family_id: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["family_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          family_id: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["family_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          family_id?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["family_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          family_id: string
          id: string
          joined_at: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Insert: {
          family_id: string
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Update: {
          family_id?: string
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["family_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          actual_completion_date: string | null
          category: string | null
          context: Database["public"]["Enums"]["context_type"]
          created_at: string | null
          description: string | null
          due_date: string | null
          family_id: string | null
          id: string
          is_shared: boolean
          metadata: Json | null
          priority: Database["public"]["Enums"]["priority_level"]
          progress_percentage: number | null
          sharing_level: Database["public"]["Enums"]["sharing_level"]
          status: Database["public"]["Enums"]["goal_status"]
          target_completion_date: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_completion_date?: string | null
          category?: string | null
          context?: Database["public"]["Enums"]["context_type"]
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          is_shared?: boolean
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress_percentage?: number | null
          sharing_level?: Database["public"]["Enums"]["sharing_level"]
          status?: Database["public"]["Enums"]["goal_status"]
          target_completion_date?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_completion_date?: string | null
          category?: string | null
          context?: Database["public"]["Enums"]["context_type"]
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          family_id?: string | null
          id?: string
          is_shared?: boolean
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress_percentage?: number | null
          sharing_level?: Database["public"]["Enums"]["sharing_level"]
          status?: Database["public"]["Enums"]["goal_status"]
          target_completion_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_template_slots: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          assignment_id: string
          created_at: string | null
          id: string
          itinerary_id: string
          notes: string | null
          order_index: number
          scheduled_end_time: string | null
          scheduled_start_time: string | null
          status: Database["public"]["Enums"]["itinerary_status"]
          updated_at: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assignment_id: string
          created_at?: string | null
          id?: string
          itinerary_id: string
          notes?: string | null
          order_index: number
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          status?: Database["public"]["Enums"]["itinerary_status"]
          updated_at?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assignment_id?: string
          created_at?: string | null
          id?: string
          itinerary_id?: string
          notes?: string | null
          order_index?: number
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          status?: Database["public"]["Enums"]["itinerary_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_template_slots_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "task_template_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_template_slots_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "daily_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      line_item_completions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          execution_id: string
          id: string
          line_item_id: string
          notes: string | null
          time_minutes: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          execution_id: string
          id?: string
          line_item_id: string
          notes?: string | null
          time_minutes?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          execution_id?: string
          id?: string
          line_item_id?: string
          notes?: string | null
          time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "line_item_completions_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "template_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_item_completions_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "template_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_session_items: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          notes: string | null
          session_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          notes?: string | null
          session_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          notes?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_session_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "planning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          family_id: string | null
          id: string
          metadata: Json | null
          objectives: string[] | null
          outcomes: string[] | null
          period_end: string
          period_start: string
          session_type: string
          status: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          family_id?: string | null
          id?: string
          metadata?: Json | null
          objectives?: string[] | null
          outcomes?: string[] | null
          period_end: string
          period_start: string
          session_type: string
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          family_id?: string | null
          id?: string
          metadata?: Json | null
          objectives?: string[] | null
          outcomes?: string[] | null
          period_end?: string
          period_start?: string
          session_type?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_sessions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_completion_date: string | null
          context: Database["public"]["Enums"]["context_type"]
          created_at: string | null
          description: string | null
          due_date: string | null
          family_id: string | null
          goal_id: string
          id: string
          is_shared: boolean
          metadata: Json | null
          priority: Database["public"]["Enums"]["priority_level"]
          progress_percentage: number | null
          sharing_level: Database["public"]["Enums"]["sharing_level"]
          status: Database["public"]["Enums"]["project_status"]
          target_completion_date: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_completion_date?: string | null
          context?: Database["public"]["Enums"]["context_type"]
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          family_id?: string | null
          goal_id: string
          id?: string
          is_shared?: boolean
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress_percentage?: number | null
          sharing_level?: Database["public"]["Enums"]["sharing_level"]
          status?: Database["public"]["Enums"]["project_status"]
          target_completion_date?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_completion_date?: string | null
          context?: Database["public"]["Enums"]["context_type"]
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          family_id?: string | null
          goal_id?: string
          id?: string
          is_shared?: boolean
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress_percentage?: number | null
          sharing_level?: Database["public"]["Enums"]["sharing_level"]
          status?: Database["public"]["Enums"]["project_status"]
          target_completion_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_assignments: {
        Row: {
          assigned_by: string
          assigned_date: string
          created_at: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          task_id: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_by: string
          assigned_date: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          task_id: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_date?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          task_id?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_template_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_template_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_template_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_minutes: number | null
          context: Database["public"]["Enums"]["context_type"]
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          family_id: string | null
          id: string
          is_shared: boolean
          metadata: Json | null
          priority: Database["public"]["Enums"]["priority_level"]
          progress_percentage: number | null
          project_id: string
          sharing_level: Database["public"]["Enums"]["sharing_level"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          context?: Database["public"]["Enums"]["context_type"]
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          family_id?: string | null
          id?: string
          is_shared?: boolean
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress_percentage?: number | null
          project_id: string
          sharing_level?: Database["public"]["Enums"]["sharing_level"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          context?: Database["public"]["Enums"]["context_type"]
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          family_id?: string | null
          id?: string
          is_shared?: boolean
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress_percentage?: number | null
          project_id?: string
          sharing_level?: Database["public"]["Enums"]["sharing_level"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_executions: {
        Row: {
          assignment_id: string
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          feedback: string | null
          id: string
          metadata: Json | null
          rating: number | null
          started_at: string | null
          total_time_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          metadata?: Json | null
          rating?: number | null
          started_at?: string | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          metadata?: Json | null
          rating?: number | null
          started_at?: string | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_executions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "task_template_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_executions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_optional: boolean
          metadata: Json | null
          order_index: number
          template_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_optional?: boolean
          metadata?: Json | null
          order_index: number
          template_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_optional?: boolean
          metadata?: Json | null
          order_index?: number
          template_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_line_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          context: Database["public"]["Enums"]["context_type"]
          created_at: string | null
          description: string | null
          estimated_duration_minutes: number | null
          family_id: string | null
          id: string
          is_shared: boolean
          metadata: Json | null
          sharing_level: Database["public"]["Enums"]["sharing_level"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          context?: Database["public"]["Enums"]["context_type"]
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          family_id?: string | null
          id?: string
          is_shared?: boolean
          metadata?: Json | null
          sharing_level?: Database["public"]["Enums"]["sharing_level"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          context?: Database["public"]["Enums"]["context_type"]
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          family_id?: string | null
          id?: string
          is_shared?: boolean
          metadata?: Json | null
          sharing_level?: Database["public"]["Enums"]["sharing_level"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      assignment_status: "assigned" | "in_progress" | "completed" | "skipped"
      context_type: "personal" | "family" | "work"
      family_role: "admin" | "member" | "child"
      goal_status: "planning" | "active" | "completed" | "cancelled" | "paused"
      itinerary_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "skipped"
        | "postponed"
      priority_level: "low" | "medium" | "high" | "critical"
      project_status:
        | "planning"
        | "active"
        | "completed"
        | "cancelled"
        | "paused"
      sharing_level: "private" | "family_read" | "family_edit"
      task_status: "todo" | "in_progress" | "completed" | "cancelled"
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
      assignment_status: ["assigned", "in_progress", "completed", "skipped"],
      context_type: ["personal", "family", "work"],
      family_role: ["admin", "member", "child"],
      goal_status: ["planning", "active", "completed", "cancelled", "paused"],
      itinerary_status: [
        "scheduled",
        "in_progress",
        "completed",
        "skipped",
        "postponed",
      ],
      priority_level: ["low", "medium", "high", "critical"],
      project_status: [
        "planning",
        "active",
        "completed",
        "cancelled",
        "paused",
      ],
      sharing_level: ["private", "family_read", "family_edit"],
      task_status: ["todo", "in_progress", "completed", "cancelled"],
    },
  },
} as const
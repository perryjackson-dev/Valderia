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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      battle_reports: {
        Row: {
          attacker_losses: Json
          camp_id: string | null
          city_id: string
          created_at: string
          defender_losses: Json
          id: string
          loot: Json
          march_id: string
          outcome: string
        }
        Insert: {
          attacker_losses?: Json
          camp_id?: string | null
          city_id: string
          created_at?: string
          defender_losses?: Json
          id?: string
          loot?: Json
          march_id: string
          outcome: string
        }
        Update: {
          attacker_losses?: Json
          camp_id?: string | null
          city_id?: string
          created_at?: string
          defender_losses?: Json
          id?: string
          loot?: Json
          march_id?: string
          outcome?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_reports_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "wilderness_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_reports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_reports_march_id_fkey"
            columns: ["march_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          base_build_seconds: number
          base_cost: Json
          build_seconds_multiplier: number
          category: string
          cost_multiplier: number
          display_name: string
          effect: Json
          max_level: number
          type: string
        }
        Insert: {
          base_build_seconds: number
          base_cost?: Json
          build_seconds_multiplier?: number
          category: string
          cost_multiplier?: number
          display_name: string
          effect?: Json
          max_level?: number
          type: string
        }
        Update: {
          base_build_seconds?: number
          base_cost?: Json
          build_seconds_multiplier?: number
          category?: string
          cost_multiplier?: number
          display_name?: string
          effect?: Json
          max_level?: number
          type?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
          x: number
          y: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "cities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      city_plots: {
        Row: {
          building_type: string | null
          city_id: string
          id: string
          level: number
          plot_index: number
          upgrade_completes_at: string | null
          upgrade_started_at: string | null
        }
        Insert: {
          building_type?: string | null
          city_id: string
          id?: string
          level?: number
          plot_index: number
          upgrade_completes_at?: string | null
          upgrade_started_at?: string | null
        }
        Update: {
          building_type?: string | null
          city_id?: string
          id?: string
          level?: number
          plot_index?: number
          upgrade_completes_at?: string | null
          upgrade_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_plots_building_type_fkey"
            columns: ["building_type"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["type"]
          },
          {
            foreignKeyName: "city_plots_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      field_plots: {
        Row: {
          building_type: string | null
          city_id: string
          id: string
          level: number
          plot_index: number
          upgrade_completes_at: string | null
          upgrade_started_at: string | null
        }
        Insert: {
          building_type?: string | null
          city_id: string
          id?: string
          level?: number
          plot_index: number
          upgrade_completes_at?: string | null
          upgrade_started_at?: string | null
        }
        Update: {
          building_type?: string | null
          city_id?: string
          id?: string
          level?: number
          plot_index?: number
          upgrade_completes_at?: string | null
          upgrade_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_plots_building_type_fkey"
            columns: ["building_type"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["type"]
          },
          {
            foreignKeyName: "field_plots_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      marches: {
        Row: {
          arrival_time: string
          camp_id: string | null
          city_id: string
          departure_time: string
          id: string
          march_type: string
          resolved: boolean
          return_time: string
          target_x: number
          target_y: number
          troops: Json
        }
        Insert: {
          arrival_time: string
          camp_id?: string | null
          city_id: string
          departure_time?: string
          id?: string
          march_type?: string
          resolved?: boolean
          return_time: string
          target_x: number
          target_y: number
          troops: Json
        }
        Update: {
          arrival_time?: string
          camp_id?: string | null
          city_id?: string
          departure_time?: string
          id?: string
          march_type?: string
          resolved?: boolean
          return_time?: string
          target_x?: number
          target_y?: number
          troops?: Json
        }
        Relationships: [
          {
            foreignKeyName: "marches_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "wilderness_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marches_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      research: {
        Row: {
          city_id: string
          completes_at: string | null
          in_progress: boolean
          level: number
          started_at: string | null
          tech_type: string
        }
        Insert: {
          city_id: string
          completes_at?: string | null
          in_progress?: boolean
          level?: number
          started_at?: string | null
          tech_type: string
        }
        Update: {
          city_id?: string
          completes_at?: string | null
          in_progress?: boolean
          level?: number
          started_at?: string | null
          tech_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          city_id: string
          food: number
          gold: number
          last_tick_at: string
          ore: number
          stone: number
          wood: number
        }
        Insert: {
          city_id: string
          food?: number
          gold?: number
          last_tick_at?: string
          ore?: number
          stone?: number
          wood?: number
        }
        Update: {
          city_id?: string
          food?: number
          gold?: number
          last_tick_at?: string
          ore?: number
          stone?: number
          wood?: number
        }
        Relationships: [
          {
            foreignKeyName: "resources_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      training_queue: {
        Row: {
          city_id: string
          completes_at: string
          id: string
          quantity: number
          resolved: boolean
          started_at: string
          troop_type: string
        }
        Insert: {
          city_id: string
          completes_at: string
          id?: string
          quantity: number
          resolved?: boolean
          started_at?: string
          troop_type: string
        }
        Update: {
          city_id?: string
          completes_at?: string
          id?: string
          quantity?: number
          resolved?: boolean
          started_at?: string
          troop_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_queue_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_queue_troop_type_fkey"
            columns: ["troop_type"]
            isOneToOne: false
            referencedRelation: "troop_types"
            referencedColumns: ["type"]
          },
        ]
      }
      troop_types: {
        Row: {
          attack: number
          class: string
          display_name: string
          life: number
          load: number
          requires_building: string | null
          requires_building_level: number
          speed: number
          tier: number
          train_cost: Json
          train_seconds: number
          type: string
        }
        Insert: {
          attack: number
          class: string
          display_name: string
          life: number
          load: number
          requires_building?: string | null
          requires_building_level?: number
          speed: number
          tier: number
          train_cost?: Json
          train_seconds: number
          type: string
        }
        Update: {
          attack?: number
          class?: string
          display_name?: string
          life?: number
          load?: number
          requires_building?: string | null
          requires_building_level?: number
          speed?: number
          tier?: number
          train_cost?: Json
          train_seconds?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "troop_types_requires_building_fkey"
            columns: ["requires_building"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["type"]
          },
        ]
      }
      troops: {
        Row: {
          city_id: string
          quantity: number
          troop_type: string
        }
        Insert: {
          city_id: string
          quantity?: number
          troop_type: string
        }
        Update: {
          city_id?: string
          quantity?: number
          troop_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "troops_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "troops_troop_type_fkey"
            columns: ["troop_type"]
            isOneToOne: false
            referencedRelation: "troop_types"
            referencedColumns: ["type"]
          },
        ]
      }
      wilderness_camps: {
        Row: {
          created_at: string
          garrison: Json
          id: string
          level: number
          loot_table: Json
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          garrison?: Json
          id?: string
          level: number
          loot_table?: Json
          x: number
          y: number
        }
        Update: {
          created_at?: string
          garrison?: Json
          id?: string
          level?: number
          loot_table?: Json
          x?: number
          y?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_resource_tick: { Args: { p_city_id: string }; Returns: undefined }
      resolve_plot_upgrades: { Args: { p_city_id: string }; Returns: undefined }
      start_building_upgrade: {
        Args: {
          p_building_type: string
          p_city_id: string
          p_plot_index: number
          p_plot_kind: string
        }
        Returns: undefined
      }
      tick_all_cities: { Args: never; Returns: undefined }
      tick_my_city: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

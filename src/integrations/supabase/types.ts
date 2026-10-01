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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_snapshots: {
        Row: {
          account_id: number
          balance: number
          buy_count: number
          buy_lots: number
          buy_pnl: number
          captured_at: string
          drawdown_pct: number
          equity: number
          floating_pnl: number
          free_margin: number | null
          id: number
          margin: number | null
          margin_level: number | null
          sell_count: number
          sell_lots: number
          sell_pnl: number
          user_id: string
        }
        Insert: {
          account_id: number
          balance: number
          buy_count?: number
          buy_lots?: number
          buy_pnl?: number
          captured_at?: string
          drawdown_pct?: number
          equity: number
          floating_pnl?: number
          free_margin?: number | null
          id?: never
          margin?: number | null
          margin_level?: number | null
          sell_count?: number
          sell_lots?: number
          sell_pnl?: number
          user_id: string
        }
        Update: {
          account_id?: number
          balance?: number
          buy_count?: number
          buy_lots?: number
          buy_pnl?: number
          captured_at?: string
          drawdown_pct?: number
          equity?: number
          floating_pnl?: number
          free_margin?: number | null
          id?: never
          margin?: number | null
          margin_level?: number | null
          sell_count?: number
          sell_lots?: number
          sell_pnl?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_agents: {
        Row: {
          capabilities: Json
          created_at: string
          id: number
          last_seen_at: string | null
          machine_label: string | null
          name: string
          platform: string
          secret_ref: string | null
          status: string
          updated_at: string
          user_id: string
          version: string | null
        }
        Insert: {
          capabilities?: Json
          created_at?: string
          id?: never
          last_seen_at?: string | null
          machine_label?: string | null
          name: string
          platform?: string
          secret_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
          version?: string | null
        }
        Update: {
          capabilities?: Json
          created_at?: string
          id?: never
          last_seen_at?: string | null
          machine_label?: string | null
          name?: string
          platform?: string
          secret_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          account_id: number
          commission: number
          entry_type: string
          executed_at: string
          id: number
          magic_number: number | null
          position_ticket: number | null
          price: number
          profit: number
          side: string
          swap: number
          symbol: string
          ticket: number
          user_id: string
          volume: number
        }
        Insert: {
          account_id: number
          commission?: number
          entry_type: string
          executed_at: string
          id?: never
          magic_number?: number | null
          position_ticket?: number | null
          price: number
          profit?: number
          side: string
          swap?: number
          symbol: string
          ticket: number
          user_id: string
          volume: number
        }
        Update: {
          account_id?: number
          commission?: number
          entry_type?: string
          executed_at?: string
          id?: never
          magic_number?: number | null
          position_ticket?: number | null
          price?: number
          profit?: number
          side?: string
          swap?: number
          symbol?: string
          ticket?: number
          user_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      mt5_accounts: {
        Row: {
          account_type: string | null
          auto_trade_enabled: boolean
          broker: string
          connector_agent_id: number | null
          created_at: string
          currency: string
          display_name: string
          id: number
          last_sync_at: string | null
          login: string
          magic_number: number | null
          risk_settings: Json
          server: string
          status: string
          terminal_path_hint: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          auto_trade_enabled?: boolean
          broker: string
          connector_agent_id?: number | null
          created_at?: string
          currency?: string
          display_name: string
          id?: never
          last_sync_at?: string | null
          login: string
          magic_number?: number | null
          risk_settings?: Json
          server: string
          status?: string
          terminal_path_hint?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          auto_trade_enabled?: boolean
          broker?: string
          connector_agent_id?: number | null
          created_at?: string
          currency?: string
          display_name?: string
          id?: never
          last_sync_at?: string | null
          login?: string
          magic_number?: number | null
          risk_settings?: Json
          server?: string
          status?: string
          terminal_path_hint?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt5_accounts_connector_agent_id_fkey"
            columns: ["connector_agent_id"]
            isOneToOne: false
            referencedRelation: "connector_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      mt5_candles: {
        Row: {
          account_id: number
          close: number
          high: number
          id: number
          low: number
          open: number
          open_time: string
          spread: number
          symbol: string
          tick_volume: number
          timeframe: string
          user_id: string
        }
        Insert: {
          account_id: number
          close: number
          high: number
          id?: never
          low: number
          open: number
          open_time: string
          spread?: number
          symbol: string
          tick_volume?: number
          timeframe: string
          user_id: string
        }
        Update: {
          account_id?: number
          close?: number
          high?: number
          id?: never
          low?: number
          open?: number
          open_time?: string
          spread?: number
          symbol?: string
          tick_volume?: number
          timeframe?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt5_candles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          account_id: number
          commission: number
          current_price: number
          id: number
          magic_number: number | null
          observed_at: string
          open_price: number
          opened_at: string
          profit: number
          side: string
          stop_loss: number | null
          swap: number
          symbol: string
          take_profit: number | null
          ticket: number
          user_id: string
          volume: number
        }
        Insert: {
          account_id: number
          commission?: number
          current_price: number
          id?: never
          magic_number?: number | null
          observed_at?: string
          open_price: number
          opened_at: string
          profit?: number
          side: string
          stop_loss?: number | null
          swap?: number
          symbol: string
          take_profit?: number | null
          ticket: number
          user_id: string
          volume: number
        }
        Update: {
          account_id?: number
          commission?: number
          current_price?: number
          id?: never
          magic_number?: number | null
          observed_at?: string
          open_price?: number
          opened_at?: string
          profit?: number
          side?: string
          stop_loss?: number | null
          swap?: number
          symbol?: string
          take_profit?: number | null
          ticket?: number
          user_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "positions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mt5_accounts"
            referencedColumns: ["id"]
          },
        ]
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
  public: {
    Enums: {},
  },
} as const

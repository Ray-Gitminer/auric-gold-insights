export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      account_bot_assignments: {
        Row: {
          account_id: number;
          bot_definition_id: number;
          created_at: string;
          id: number;
          is_enabled: boolean;
          magic_number: number;
          settings: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: number;
          bot_definition_id: number;
          created_at?: string;
          id?: never;
          is_enabled?: boolean;
          magic_number: number;
          settings?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: number;
          bot_definition_id?: number;
          created_at?: string;
          id?: never;
          is_enabled?: boolean;
          magic_number?: number;
          settings?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_bot_assignments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "mt5_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_bot_assignments_bot_definition_id_fkey";
            columns: ["bot_definition_id"];
            isOneToOne: false;
            referencedRelation: "bot_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      account_snapshots: {
        Row: {
          account_id: number;
          balance: number;
          buy_count: number;
          buy_lots: number;
          buy_pnl: number;
          captured_at: string;
          drawdown_pct: number;
          equity: number;
          floating_pnl: number;
          free_margin: number | null;
          id: number;
          margin: number | null;
          margin_level: number | null;
          sell_count: number;
          sell_lots: number;
          sell_pnl: number;
          user_id: string;
        };
        Insert: {
          account_id: number;
          balance: number;
          buy_count?: number;
          buy_lots?: number;
          buy_pnl?: number;
          captured_at?: string;
          drawdown_pct?: number;
          equity: number;
          floating_pnl?: number;
          free_margin?: number | null;
          id?: never;
          margin?: number | null;
          margin_level?: number | null;
          sell_count?: number;
          sell_lots?: number;
          sell_pnl?: number;
          user_id: string;
        };
        Update: {
          account_id?: number;
          balance?: number;
          buy_count?: number;
          buy_lots?: number;
          buy_pnl?: number;
          captured_at?: string;
          drawdown_pct?: number;
          equity?: number;
          floating_pnl?: number;
          free_margin?: number | null;
          id?: never;
          margin?: number | null;
          margin_level?: number | null;
          sell_count?: number;
          sell_lots?: number;
          sell_pnl?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_snapshots_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "mt5_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      alerts: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          message: string;
          read_at: string | null;
          severity: string;
          title: string;
          user_id: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          message: string;
          read_at?: string | null;
          severity: string;
          title: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          message?: string;
          read_at?: string | null;
          severity?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          account_id: number | null;
          action: string;
          actor_type: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
          ip_hash: string | null;
          metadata: Json;
          trade_command_id: number | null;
          user_id: string;
        };
        Insert: {
          account_id?: number | null;
          action: string;
          actor_type: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          ip_hash?: string | null;
          metadata?: Json;
          trade_command_id?: number | null;
          user_id: string;
        };
        Update: {
          account_id?: number | null;
          action?: string;
          actor_type?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          ip_hash?: string | null;
          metadata?: Json;
          trade_command_id?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "mt5_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_trade_command_id_fkey";
            columns: ["trade_command_id"];
            isOneToOne: false;
            referencedRelation: "trade_commands";
            referencedColumns: ["id"];
          },
        ];
      };
      auriq_audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
          metadata: Json;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          metadata?: Json;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          metadata?: Json;
          user_id?: string | null;
        };
        Relationships: [];
      };
      bot_definitions: {
        Row: {
          config_schema: Json;
          created_at: string;
          description: string | null;
          id: number;
          is_enabled: boolean;
          name: string;
          updated_at: string;
          user_id: string;
          version: string;
        };
        Insert: {
          config_schema?: Json;
          created_at?: string;
          description?: string | null;
          id?: never;
          is_enabled?: boolean;
          name: string;
          updated_at?: string;
          user_id: string;
          version?: string;
        };
        Update: {
          config_schema?: Json;
          created_at?: string;
          description?: string | null;
          id?: never;
          is_enabled?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
          version?: string;
        };
        Relationships: [];
      };
      broker_accounts: {
        Row: {
          account_type: string;
          base_currency: string;
          broker_account_id: string;
          connection_id: string;
          created_at: string;
          display_name: string | null;
          id: string;
          is_active: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_type?: string;
          base_currency?: string;
          broker_account_id: string;
          connection_id: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_type?: string;
          base_currency?: string;
          broker_account_id?: string;
          connection_id?: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "broker_accounts_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "broker_connections";
            referencedColumns: ["id"];
          },
        ];
      };
      broker_connections: {
        Row: {
          broker: string;
          connector_label: string;
          created_at: string;
          environment: string;
          id: string;
          last_error: string | null;
          last_heartbeat_at: string | null;
          mode: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          broker?: string;
          connector_label: string;
          created_at?: string;
          environment?: string;
          id?: string;
          last_error?: string | null;
          last_heartbeat_at?: string | null;
          mode?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          broker?: string;
          connector_label?: string;
          created_at?: string;
          environment?: string;
          id?: string;
          last_error?: string | null;
          last_heartbeat_at?: string | null;
          mode?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      connector_agents: {
        Row: {
          capabilities: Json;
          created_at: string;
          id: number;
          last_seen_at: string | null;
          machine_label: string | null;
          name: string;
          platform: string;
          secret_ref: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          version: string | null;
        };
        Insert: {
          capabilities?: Json;
          created_at?: string;
          id?: never;
          last_seen_at?: string | null;
          machine_label?: string | null;
          name: string;
          platform?: string;
          secret_ref?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          version?: string | null;
        };
        Update: {
          capabilities?: Json;
          created_at?: string;
          id?: never;
          last_seen_at?: string | null;
          machine_label?: string | null;
          name?: string;
          platform?: string;
          secret_ref?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          version?: string | null;
        };
        Relationships: [];
      };
      deals: {
        Row: {
          account_id: number;
          commission: number;
          entry_type: string;
          executed_at: string;
          id: number;
          magic_number: number | null;
          position_ticket: number | null;
          price: number;
          profit: number;
          side: string;
          swap: number;
          symbol: string;
          ticket: number;
          user_id: string;
          volume: number;
        };
        Insert: {
          account_id: number;
          commission?: number;
          entry_type: string;
          executed_at: string;
          id?: never;
          magic_number?: number | null;
          position_ticket?: number | null;
          price: number;
          profit?: number;
          side: string;
          swap?: number;
          symbol: string;
          ticket: number;
          user_id: string;
          volume: number;
        };
        Update: {
          account_id?: number;
          commission?: number;
          entry_type?: string;
          executed_at?: string;
          id?: never;
          magic_number?: number | null;
          position_ticket?: number | null;
          price?: number;
          profit?: number;
          side?: string;
          swap?: number;
          symbol?: string;
          ticket?: number;
          user_id?: string;
          volume?: number;
        };
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "mt5_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      economic_event_analyses: {
        Row: {
          analyzed_at: string;
          confidence: number;
          economic_event_id: string;
          gold_impact: string;
          id: string;
          medium_term_reason: string | null;
          model: string;
          prompt_version: string;
          scenario_if_above: string | null;
          scenario_if_below: string | null;
          scenario_if_inline: string | null;
          short_term_reason: string;
          usd_impact: string;
        };
        Insert: {
          analyzed_at?: string;
          confidence: number;
          economic_event_id: string;
          gold_impact: string;
          id?: string;
          medium_term_reason?: string | null;
          model: string;
          prompt_version: string;
          scenario_if_above?: string | null;
          scenario_if_below?: string | null;
          scenario_if_inline?: string | null;
          short_term_reason: string;
          usd_impact: string;
        };
        Update: {
          analyzed_at?: string;
          confidence?: number;
          economic_event_id?: string;
          gold_impact?: string;
          id?: string;
          medium_term_reason?: string | null;
          model?: string;
          prompt_version?: string;
          scenario_if_above?: string | null;
          scenario_if_below?: string | null;
          scenario_if_inline?: string | null;
          short_term_reason?: string;
          usd_impact?: string;
        };
        Relationships: [
          {
            foreignKeyName: "economic_event_analyses_economic_event_id_fkey";
            columns: ["economic_event_id"];
            isOneToOne: false;
            referencedRelation: "economic_events";
            referencedColumns: ["id"];
          },
        ];
      };
      economic_events: {
        Row: {
          actual: string | null;
          category: string | null;
          country: string;
          created_at: string;
          currency: string;
          event_name: string;
          external_id: string;
          forecast: string | null;
          id: string;
          importance: number;
          previous: string | null;
          provider: string;
          revised: string | null;
          scheduled_at: string;
          source_name: string;
          source_url: string;
          status: string;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          actual?: string | null;
          category?: string | null;
          country?: string;
          created_at?: string;
          currency?: string;
          event_name: string;
          external_id: string;
          forecast?: string | null;
          id?: string;
          importance?: number;
          previous?: string | null;
          provider: string;
          revised?: string | null;
          scheduled_at: string;
          source_name: string;
          source_url: string;
          status?: string;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          actual?: string | null;
          category?: string | null;
          country?: string;
          created_at?: string;
          currency?: string;
          event_name?: string;
          external_id?: string;
          forecast?: string | null;
          id?: string;
          importance?: number;
          previous?: string | null;
          provider?: string;
          revised?: string | null;
          scheduled_at?: string;
          source_name?: string;
          source_url?: string;
          status?: string;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ibkr_executions: {
        Row: {
          account_id: string;
          broker_execution_id: string;
          commission: number | null;
          executed_at: string;
          id: string;
          order_id: string | null;
          price: number;
          quantity: number;
          realized_pnl: number | null;
          received_at: string;
          side: string;
          symbol: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          broker_execution_id: string;
          commission?: number | null;
          executed_at: string;
          id?: string;
          order_id?: string | null;
          price: number;
          quantity: number;
          realized_pnl?: number | null;
          received_at?: string;
          side: string;
          symbol: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          broker_execution_id?: string;
          commission?: number | null;
          executed_at?: string;
          id?: string;
          order_id?: string | null;
          price?: number;
          quantity?: number;
          realized_pnl?: number | null;
          received_at?: string;
          side?: string;
          symbol?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ibkr_executions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "broker_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ibkr_executions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "ibkr_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      ibkr_orders: {
        Row: {
          account_id: string;
          broker_order_id: string;
          id: string;
          limit_price: number | null;
          order_type: string;
          quantity: number;
          received_at: string;
          side: string;
          source_timestamp: string;
          status: string;
          stop_price: number | null;
          submitted_at: string | null;
          symbol: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          broker_order_id: string;
          id?: string;
          limit_price?: number | null;
          order_type: string;
          quantity: number;
          received_at?: string;
          side: string;
          source_timestamp: string;
          status: string;
          stop_price?: number | null;
          submitted_at?: string | null;
          symbol: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          broker_order_id?: string;
          id?: string;
          limit_price?: number | null;
          order_type?: string;
          quantity?: number;
          received_at?: string;
          side?: string;
          source_timestamp?: string;
          status?: string;
          stop_price?: number | null;
          submitted_at?: string | null;
          symbol?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ibkr_orders_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "broker_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      ibkr_positions: {
        Row: {
          account_id: string;
          asset_class: string;
          average_cost: number | null;
          broker_position_key: string;
          currency: string;
          id: string;
          market_price: number | null;
          market_value: number | null;
          quantity: number;
          realized_pnl: number | null;
          received_at: string;
          source_timestamp: string;
          symbol: string;
          unrealized_pnl: number | null;
          user_id: string;
        };
        Insert: {
          account_id: string;
          asset_class: string;
          average_cost?: number | null;
          broker_position_key: string;
          currency?: string;
          id?: string;
          market_price?: number | null;
          market_value?: number | null;
          quantity: number;
          realized_pnl?: number | null;
          received_at?: string;
          source_timestamp: string;
          symbol: string;
          unrealized_pnl?: number | null;
          user_id: string;
        };
        Update: {
          account_id?: string;
          asset_class?: string;
          average_cost?: number | null;
          broker_position_key?: string;
          currency?: string;
          id?: string;
          market_price?: number | null;
          market_value?: number | null;
          quantity?: number;
          realized_pnl?: number | null;
          received_at?: string;
          source_timestamp?: string;
          symbol?: string;
          unrealized_pnl?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ibkr_positions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "broker_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entries: {
        Row: {
          created_at: string;
          discipline_score: number | null;
          emotion: string | null;
          execution_id: string | null;
          id: string;
          mistakes: string | null;
          review: string | null;
          setup: string | null;
          thesis: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          discipline_score?: number | null;
          emotion?: string | null;
          execution_id?: string | null;
          id?: string;
          mistakes?: string | null;
          review?: string | null;
          setup?: string | null;
          thesis?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          discipline_score?: number | null;
          emotion?: string | null;
          execution_id?: string | null;
          id?: string;
          mistakes?: string | null;
          review?: string | null;
          setup?: string | null;
          thesis?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entries_execution_id_fkey";
            columns: ["execution_id"];
            isOneToOne: false;
            referencedRelation: "ibkr_executions";
            referencedColumns: ["id"];
          },
        ];
      };
      mt5_accounts: {
        Row: {
          account_type: string | null;
          auto_trade_enabled: boolean;
          broker: string;
          connector_agent_id: number | null;
          created_at: string;
          currency: string;
          display_name: string;
          id: number;
          last_sync_at: string | null;
          login: string;
          magic_number: number | null;
          risk_settings: Json;
          server: string;
          status: string;
          terminal_path_hint: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_type?: string | null;
          auto_trade_enabled?: boolean;
          broker: string;
          connector_agent_id?: number | null;
          created_at?: string;
          currency?: string;
          display_name: string;
          id?: never;
          last_sync_at?: string | null;
          login: string;
          magic_number?: number | null;
          risk_settings?: Json;
          server: string;
          status?: string;
          terminal_path_hint?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_type?: string | null;
          auto_trade_enabled?: boolean;
          broker?: string;
          connector_agent_id?: number | null;
          created_at?: string;
          currency?: string;
          display_name?: string;
          id?: never;
          last_sync_at?: string | null;
          login?: string;
          magic_number?: number | null;
          risk_settings?: Json;
          server?: string;
          status?: string;
          terminal_path_hint?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mt5_accounts_connector_agent_id_fkey";
            columns: ["connector_agent_id"];
            isOneToOne: false;
            referencedRelation: "connector_agents";
            referencedColumns: ["id"];
          },
        ];
      };
      mt5_candles: {
        Row: {
          account_id: number;
          close: number;
          high: number;
          id: number;
          low: number;
          open: number;
          open_time: string;
          spread: number;
          symbol: string;
          tick_volume: number;
          timeframe: string;
          user_id: string;
        };
        Insert: {
          account_id: number;
          close: number;
          high: number;
          id?: never;
          low: number;
          open: number;
          open_time: string;
          spread?: number;
          symbol: string;
          tick_volume?: number;
          timeframe: string;
          user_id: string;
        };
        Update: {
          account_id?: number;
          close?: number;
          high?: number;
          id?: never;
          low?: number;
          open?: number;
          open_time?: string;
          spread?: number;
          symbol?: string;
          tick_volume?: number;
          timeframe?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mt5_candles_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "mt5_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      news_analyses: {
        Row: {
          analyzed_at: string;
          confidence: number;
          gold_impact: string;
          id: string;
          medium_term_reason: string | null;
          model: string;
          news_item_id: string;
          prompt_version: string;
          short_term_reason: string;
        };
        Insert: {
          analyzed_at?: string;
          confidence: number;
          gold_impact: string;
          id?: string;
          medium_term_reason?: string | null;
          model: string;
          news_item_id: string;
          prompt_version: string;
          short_term_reason: string;
        };
        Update: {
          analyzed_at?: string;
          confidence?: number;
          gold_impact?: string;
          id?: string;
          medium_term_reason?: string | null;
          model?: string;
          news_item_id?: string;
          prompt_version?: string;
          short_term_reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "news_analyses_news_item_id_fkey";
            columns: ["news_item_id"];
            isOneToOne: false;
            referencedRelation: "news_items";
            referencedColumns: ["id"];
          },
        ];
      };
      news_items: {
        Row: {
          canonical_url: string;
          created_at: string;
          fingerprint: string;
          headline: string;
          id: string;
          published_at: string;
          source_name: string;
          source_url: string;
          summary: string | null;
        };
        Insert: {
          canonical_url: string;
          created_at?: string;
          fingerprint: string;
          headline: string;
          id?: string;
          published_at: string;
          source_name: string;
          source_url: string;
          summary?: string | null;
        };
        Update: {
          canonical_url?: string;
          created_at?: string;
          fingerprint?: string;
          headline?: string;
          id?: string;
          published_at?: string;
          source_name?: string;
          source_url?: string;
          summary?: string | null;
        };
        Relationships: [];
      };
      notification_channels: {
        Row: {
          channel_type: string;
          created_at: string;
          destination_hint: string | null;
          enabled: boolean;
          id: string;
          preferences: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          channel_type: string;
          created_at?: string;
          destination_hint?: string | null;
          enabled?: boolean;
          id?: string;
          preferences?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          channel_type?: string;
          created_at?: string;
          destination_hint?: string | null;
          enabled?: boolean;
          id?: string;
          preferences?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      portfolio_snapshots: {
        Row: {
          account_id: string;
          buying_power: number | null;
          cash_balance: number | null;
          drawdown_pct: number | null;
          id: number;
          margin_used: number | null;
          net_liquidation: number | null;
          raw_payload: Json | null;
          realized_pnl: number | null;
          received_at: string;
          source_timestamp: string;
          unrealized_pnl: number | null;
          user_id: string;
        };
        Insert: {
          account_id: string;
          buying_power?: number | null;
          cash_balance?: number | null;
          drawdown_pct?: number | null;
          id?: never;
          margin_used?: number | null;
          net_liquidation?: number | null;
          raw_payload?: Json | null;
          realized_pnl?: number | null;
          received_at?: string;
          source_timestamp: string;
          unrealized_pnl?: number | null;
          user_id: string;
        };
        Update: {
          account_id?: string;
          buying_power?: number | null;
          cash_balance?: number | null;
          drawdown_pct?: number | null;
          id?: never;
          margin_used?: number | null;
          net_liquidation?: number | null;
          raw_payload?: Json | null;
          realized_pnl?: number | null;
          received_at?: string;
          source_timestamp?: string;
          unrealized_pnl?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portfolio_snapshots_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "broker_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      positions: {
        Row: {
          account_id: number;
          commission: number;
          current_price: number;
          id: number;
          magic_number: number | null;
          observed_at: string;
          open_price: number;
          opened_at: string;
          profit: number;
          side: string;
          stop_loss: number | null;
          swap: number;
          symbol: string;
          take_profit: number | null;
          ticket: number;
          user_id: string;
          volume: number;
        };
        Insert: {
          account_id: number;
          commission?: number;
          current_price: number;
          id?: never;
          magic_number?: number | null;
          observed_at?: string;
          open_price: number;
          opened_at: string;
          profit?: number;
          side: string;
          stop_loss?: number | null;
          swap?: number;
          symbol: string;
          take_profit?: number | null;
          ticket: number;
          user_id: string;
          volume: number;
        };
        Update: {
          account_id?: number;
          commission?: number;
          current_price?: number;
          id?: never;
          magic_number?: number | null;
          observed_at?: string;
          open_price?: number;
          opened_at?: string;
          profit?: number;
          side?: string;
          stop_loss?: number | null;
          swap?: number;
          symbol?: string;
          take_profit?: number | null;
          ticket?: number;
          user_id?: string;
          volume?: number;
        };
        Relationships: [
          {
            foreignKeyName: "positions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "mt5_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          preferred_locale: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          preferred_locale?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          preferred_locale?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trade_commands: {
        Row: {
          account_id: number;
          claimed_at: string | null;
          command_type: string;
          confirmation_text: string;
          confirmed_at: string;
          created_at: string;
          executed_at: string | null;
          expires_at: string;
          id: number;
          parameters: Json;
          result: Json | null;
          status: string;
          user_id: string;
        };
        Insert: {
          account_id: number;
          claimed_at?: string | null;
          command_type: string;
          confirmation_text: string;
          confirmed_at: string;
          created_at?: string;
          executed_at?: string | null;
          expires_at?: string;
          id?: never;
          parameters?: Json;
          result?: Json | null;
          status?: string;
          user_id: string;
        };
        Update: {
          account_id?: number;
          claimed_at?: string | null;
          command_type?: string;
          confirmation_text?: string;
          confirmed_at?: string;
          created_at?: string;
          executed_at?: string | null;
          expires_at?: string;
          id?: never;
          parameters?: Json;
          result?: Json | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trade_commands_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "mt5_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      weekly_market_briefs: {
        Row: {
          confidence: number;
          conflicting_evidence: Json;
          generated_at: string;
          gold_bias: string;
          id: string;
          model: string;
          narrative: string;
          next_catalyst: string | null;
          prompt_version: string;
          risk_note: string;
          supporting_evidence: Json;
          title: string;
          user_id: string;
          week_start: string;
        };
        Insert: {
          confidence: number;
          conflicting_evidence?: Json;
          generated_at?: string;
          gold_bias: string;
          id?: string;
          model: string;
          narrative: string;
          next_catalyst?: string | null;
          prompt_version: string;
          risk_note: string;
          supporting_evidence?: Json;
          title: string;
          user_id: string;
          week_start: string;
        };
        Update: {
          confidence?: number;
          conflicting_evidence?: Json;
          generated_at?: string;
          gold_bias?: string;
          id?: string;
          model?: string;
          narrative?: string;
          next_catalyst?: string | null;
          prompt_version?: string;
          risk_note?: string;
          supporting_evidence?: Json;
          title?: string;
          user_id?: string;
          week_start?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

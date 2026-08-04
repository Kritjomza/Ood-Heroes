export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      afk_claims: {
        Row: {
          claim_idempotency_key: string | null;
          claimed_at: string | null;
          id: string;
          interval_count: number;
          period_end: string;
          period_start: string;
          prepared_at: string;
          reward_payload: Json;
          status: string;
          user_id: string;
        };
        Insert: {
          claim_idempotency_key?: string | null;
          claimed_at?: string | null;
          id?: string;
          interval_count: number;
          period_end: string;
          period_start: string;
          prepared_at?: string;
          reward_payload: Json;
          status: string;
          user_id: string;
        };
        Update: {
          claim_idempotency_key?: string | null;
          claimed_at?: string | null;
          id?: string;
          interval_count?: number;
          period_end?: string;
          period_start?: string;
          prepared_at?: string;
          reward_payload?: Json;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'afk_claims_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      afk_state: {
        Row: {
          last_activity_at: string;
          last_settled_at: string;
          rate_version: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          last_activity_at?: string;
          last_settled_at?: string;
          rate_version?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          last_activity_at?: string;
          last_settled_at?: string;
          rate_version?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'afk_state_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      hero_definitions: {
        Row: {
          asset_key: string;
          attack_cooldown_ms: number;
          attack_range: number;
          base_attack: number;
          base_defense: number;
          base_hp: number;
          created_at: string;
          display_name: string;
          duplicate_shards: number;
          enabled: boolean;
          id: string;
          move_speed: number;
          rarity: string;
          role: string;
          slug: string;
          sort_order: number;
          starter_eligible: boolean;
          summon_weight: number;
          updated_at: string;
        };
        Insert: {
          asset_key: string;
          attack_cooldown_ms: number;
          attack_range: number;
          base_attack: number;
          base_defense: number;
          base_hp: number;
          created_at?: string;
          display_name: string;
          duplicate_shards: number;
          enabled?: boolean;
          id: string;
          move_speed: number;
          rarity: string;
          role: string;
          slug: string;
          sort_order: number;
          starter_eligible?: boolean;
          summon_weight: number;
          updated_at?: string;
        };
        Update: {
          asset_key?: string;
          attack_cooldown_ms?: number;
          attack_range?: number;
          base_attack?: number;
          base_defense?: number;
          base_hp?: number;
          created_at?: string;
          display_name?: string;
          duplicate_shards?: number;
          enabled?: boolean;
          id?: string;
          move_speed?: number;
          rarity?: string;
          role?: string;
          slug?: string;
          sort_order?: number;
          starter_eligible?: boolean;
          summon_weight?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      mmo_world_checkpoints: {
        Row: {
          account_id: string;
          channel_hint: string | null;
          checkpointed_at: string;
          payload: Json;
          revision: number;
          sanctuary_id: string;
          zone_id: string;
        };
        Insert: {
          account_id: string;
          channel_hint?: string | null;
          checkpointed_at?: string;
          payload?: Json;
          revision: number;
          sanctuary_id: string;
          zone_id: string;
        };
        Update: {
          account_id?: string;
          channel_hint?: string | null;
          checkpointed_at?: string;
          payload?: Json;
          revision?: number;
          sanctuary_id?: string;
          zone_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mmo_world_checkpoints_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      player_currencies: {
        Row: {
          balance: number;
          currency_code: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          currency_code: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          currency_code?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_currencies_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      player_heroes: {
        Row: {
          acquired_at: string;
          hero_definition_id: string;
          id: string;
          shards: number;
          stars: number;
          total_experience: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          acquired_at?: string;
          hero_definition_id: string;
          id?: string;
          shards?: number;
          stars?: number;
          total_experience?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          acquired_at?: string;
          hero_definition_id?: string;
          id?: string;
          shards?: number;
          stars?: number;
          total_experience?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_heroes_hero_definition_id_fkey';
            columns: ['hero_definition_id'];
            isOneToOne: false;
            referencedRelation: 'hero_definitions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'player_heroes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      player_summon_state: {
        Row: {
          banner_id: string;
          pulls_since_epic: number;
          total_pulls: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          banner_id: string;
          pulls_since_epic?: number;
          total_pulls?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          banner_id?: string;
          pulls_since_epic?: number;
          total_pulls?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_summon_state_banner_id_fkey';
            columns: ['banner_id'];
            isOneToOne: false;
            referencedRelation: 'summon_banners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'player_summon_state_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      player_teams: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_teams_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      profiles: {
        Row: {
          account_kind: string;
          created_at: string;
          display_name: string;
          last_seen_at: string;
          onboarding_step: number;
          team_slots: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_kind: string;
          created_at?: string;
          display_name: string;
          last_seen_at?: string;
          onboarding_step?: number;
          team_slots?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_kind?: string;
          created_at?: string;
          display_name?: string;
          last_seen_at?: string;
          onboarding_step?: number;
          team_slots?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      reward_ledger: {
        Row: {
          created_at: string;
          id: string;
          reward_identity: string;
          reward_payload: Json;
          source_metadata: Json;
          source_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reward_identity: string;
          reward_payload: Json;
          source_metadata?: Json;
          source_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          reward_identity?: string;
          reward_payload?: Json;
          source_metadata?: Json;
          source_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reward_ledger_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      schema_versions: {
        Row: {
          applied_at: string;
          version: number;
        };
        Insert: {
          applied_at?: string;
          version: number;
        };
        Update: {
          applied_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      summon_banners: {
        Row: {
          created_at: string;
          display_name: string;
          enabled: boolean;
          ends_at: string | null;
          gem_cost: number;
          id: string;
          pity_threshold: number;
          starts_at: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          enabled?: boolean;
          ends_at?: string | null;
          gem_cost: number;
          id: string;
          pity_threshold: number;
          starts_at?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          enabled?: boolean;
          ends_at?: string | null;
          gem_cost?: number;
          id?: string;
          pity_threshold?: number;
          starts_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      summon_history: {
        Row: {
          banner_id: string;
          created_at: string;
          gem_cost: number;
          hero_definition_id: string;
          id: string;
          idempotency_key: string;
          outcome_type: string;
          pity_after: number;
          pity_before: number;
          shards_awarded: number;
          user_id: string;
        };
        Insert: {
          banner_id: string;
          created_at?: string;
          gem_cost: number;
          hero_definition_id: string;
          id?: string;
          idempotency_key: string;
          outcome_type: string;
          pity_after: number;
          pity_before: number;
          shards_awarded?: number;
          user_id: string;
        };
        Update: {
          banner_id?: string;
          created_at?: string;
          gem_cost?: number;
          hero_definition_id?: string;
          id?: string;
          idempotency_key?: string;
          outcome_type?: string;
          pity_after?: number;
          pity_before?: number;
          shards_awarded?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'summon_history_banner_id_fkey';
            columns: ['banner_id'];
            isOneToOne: false;
            referencedRelation: 'summon_banners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'summon_history_hero_definition_id_fkey';
            columns: ['hero_definition_id'];
            isOneToOne: false;
            referencedRelation: 'hero_definitions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'summon_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      summon_pool_entries: {
        Row: {
          banner_id: string;
          hero_definition_id: string;
          weight: number;
        };
        Insert: {
          banner_id: string;
          hero_definition_id: string;
          weight: number;
        };
        Update: {
          banner_id?: string;
          hero_definition_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'summon_pool_entries_banner_id_fkey';
            columns: ['banner_id'];
            isOneToOne: false;
            referencedRelation: 'summon_banners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'summon_pool_entries_hero_definition_id_fkey';
            columns: ['hero_definition_id'];
            isOneToOne: false;
            referencedRelation: 'hero_definitions';
            referencedColumns: ['id'];
          },
        ];
      };
      team_members: {
        Row: {
          player_hero_id: string;
          slot_index: number;
          team_id: string;
        };
        Insert: {
          player_hero_id: string;
          slot_index: number;
          team_id: string;
        };
        Update: {
          player_hero_id?: string;
          slot_index?: number;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_player_hero_id_fkey';
            columns: ['player_hero_id'];
            isOneToOne: false;
            referencedRelation: 'player_heroes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_members_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'player_teams';
            referencedColumns: ['id'];
          },
        ];
      };
      mmo_account_progression: {
        Row: {
          account_id: string;
          adventure_experience: number;
          adventure_rank: number;
          revision: number;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          adventure_experience?: number;
          adventure_rank?: number;
          revision?: number;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          adventure_experience?: number;
          adventure_rank?: number;
          revision?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      mmo_hero_progression: {
        Row: {
          account_id: string;
          experience: number;
          hero_id: string;
          level: number;
          revision: number;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          experience?: number;
          hero_id: string;
          level?: number;
          revision?: number;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          experience?: number;
          hero_id?: string;
          level?: number;
          revision?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      mmo_reward_ledger: {
        Row: {
          account_id: string;
          committed_at: string | null;
          payload: Json;
          prepared_at: string;
          reward_identity: string;
          status: string;
        };
        Insert: {
          account_id: string;
          committed_at?: string | null;
          payload: Json;
          prepared_at?: string;
          reward_identity: string;
          status: string;
        };
        Update: {
          account_id?: string;
          committed_at?: string | null;
          payload?: Json;
          prepared_at?: string;
          reward_identity?: string;
          status?: string;
        };
        Relationships: [];
      };
      mmo_parties: {
        Row: { party_id: string; leader_account_id: string; revision: number; updated_at: string };
        Insert: { party_id: string; leader_account_id: string; revision?: number; updated_at?: string };
        Update: { party_id?: string; leader_account_id?: string; revision?: number; updated_at?: string };
        Relationships: [];
      };
      mmo_party_members: {
        Row: { party_id: string; account_id: string; joined_at: string };
        Insert: { party_id: string; account_id: string; joined_at?: string };
        Update: { party_id?: string; account_id?: string; joined_at?: string };
        Relationships: [];
      };
      mmo_party_invites: {
        Row: { party_id: string; target_account_id: string; invited_by: string; status: string; created_at: string };
        Insert: { party_id: string; target_account_id: string; invited_by: string; status?: string; created_at?: string };
        Update: { party_id?: string; target_account_id?: string; invited_by?: string; status?: string; created_at?: string };
        Relationships: [];
      };
      mmo_friend_consents: {
        Row: { from_account_id: string; to_account_id: string; granted_at: string };
        Insert: { from_account_id: string; to_account_id: string; granted_at?: string };
        Update: { from_account_id?: string; to_account_id?: string; granted_at?: string };
        Relationships: [];
      };
      mmo_private_instances: {
        Row: { instance_id: string; kind: string; leader_account_id: string; status: string; checkpoint_revision: number; checkpoint_payload: Json; revive_tokens: number; world_revision: number; updated_at: string };
        Insert: { instance_id: string; kind: string; leader_account_id: string; status: string; checkpoint_revision?: number; checkpoint_payload?: Json; revive_tokens?: number; world_revision?: number; updated_at?: string };
        Update: { instance_id?: string; kind?: string; leader_account_id?: string; status?: string; checkpoint_revision?: number; checkpoint_payload?: Json; revive_tokens?: number; world_revision?: number; updated_at?: string };
        Relationships: [];
      };
      mmo_instance_members: {
        Row: { instance_id: string; account_id: string; joined_at: string };
        Insert: { instance_id: string; account_id: string; joined_at?: string };
        Update: { instance_id?: string; account_id?: string; joined_at?: string };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_combat_reward: {
        Args: {
          p_defeated_hero_ids: string[];
          p_gold: number;
          p_hero_experience: number;
          p_living_hero_ids: string[];
          p_reward_identity: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      save_mmo_world_checkpoint: {
        Args: {
          p_account_id: string;
          p_channel_hint: string | null;
          p_checkpointed_at: string;
          p_payload: Json;
          p_revision: number;
          p_sanctuary_id: string;
          p_zone_id: string;
        };
        Returns: boolean;
      };
      save_mmo_progression: {
        Args: {
          p_account_id: string;
          p_adventure_experience: number;
          p_adventure_rank: number;
          p_heroes: Json;
          p_revision: number;
          p_updated_at?: string;
        };
        Returns: boolean;
      };
      prepare_mmo_reward: {
        Args: {
          p_account_id: string;
          p_payload: Json;
          p_prepared_at?: string;
          p_reward_identity: string;
        };
        Returns: {
          account_id: string;
          committed_at: string | null;
          payload: Json;
          prepared_at: string;
          reward_identity: string;
          status: string;
        };
      };
      commit_mmo_reward: {
        Args: { p_committed_at?: string; p_reward_identity: string };
        Returns: {
          account_id: string;
          committed_at: string | null;
          payload: Json;
          prepared_at: string;
          reward_identity: string;
          status: string;
        };
      };
      claim_afk_reward: {
        Args: {
          p_claim_id: string;
          p_idempotency_key: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_player_bootstrap: { Args: { p_user_id: string }; Returns: Json };
      get_summon_history: {
        Args: { p_limit?: number; p_user_id: string };
        Returns: Json;
      };
      initialize_player_account: {
        Args: {
          p_account_kind: string;
          p_display_name: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      perform_summon: {
        Args: {
          p_banner_id: string;
          p_idempotency_key: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      prepare_afk_claim: { Args: { p_user_id: string }; Returns: Json };
      unlock_team_slot: {
        Args: { p_idempotency_key: string; p_user_id: string };
        Returns: Json;
      };
      update_active_team: {
        Args: {
          p_idempotency_key: string;
          p_player_hero_ids: string[];
          p_user_id: string;
        };
        Returns: Json;
      };
      update_player_activity: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      update_player_profile: {
        Args: {
          p_account_kind: string;
          p_display_name: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      upgrade_hero_star: {
        Args: {
          p_idempotency_key: string;
          p_player_hero_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;

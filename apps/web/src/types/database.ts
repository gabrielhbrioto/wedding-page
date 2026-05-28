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
      ceremony_guest_names: {
        Row: {
          created_at: string
          id: string
          nome: string
          response_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          response_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ceremony_guest_names_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "rsvp_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_settings: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_evento: string
          endereco: string | null
          google_maps_url: string | null
          id: string
          local_nome: string | null
          mensagem_home: string | null
          nome_casal: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_evento: string
          endereco?: string | null
          google_maps_url?: string | null
          id?: string
          local_nome?: string | null
          mensagem_home?: string | null
          nome_casal: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_evento?: string
          endereco?: string | null
          google_maps_url?: string | null
          id?: string
          local_nome?: string | null
          mensagem_home?: string | null
          nome_casal?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          created_at: string | null
          id: string
          imagem_url: string
          ordem: number | null
          publico: boolean | null
          titulo: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          imagem_url: string
          ordem?: number | null
          publico?: boolean | null
          titulo?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          imagem_url?: string
          ordem?: number | null
          publico?: boolean | null
          titulo?: string | null
        }
        Relationships: []
      }
      gifts: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          imagem_url: string | null
          link_externo: string | null
          nome: string
          ordem: number | null
          preco: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          link_externo?: string | null
          nome: string
          ordem?: number | null
          preco?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          link_externo?: string | null
          nome?: string
          ordem?: number | null
          preco?: number | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          nome: string
          ordem_exibicao: number | null
          pre_cadastrado: boolean
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          nome: string
          ordem_exibicao?: number | null
          pre_cadastrado?: boolean
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          nome?: string
          ordem_exibicao?: number | null
          pre_cadastrado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "invitation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          acompanhantes_max: number | null
          codigo_convite: string
          created_at: string | null
          email: string | null
          grupo: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          acompanhantes_max?: number | null
          codigo_convite: string
          created_at?: string | null
          email?: string | null
          grupo?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          acompanhantes_max?: number | null
          codigo_convite?: string
          created_at?: string | null
          email?: string | null
          grupo?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      invitation_groups: {
        Row: {
          created_at: string
          id: string
          nome_grupo: string
          observacoes: string | null
          responded_at: string | null
          rsvp_status: Database["public"]["Enums"]["rsvp_status"]
          tipo_convite: Database["public"]["Enums"]["invite_type"]
          token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_grupo: string
          observacoes?: string | null
          responded_at?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          tipo_convite?: Database["public"]["Enums"]["invite_type"]
          token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_grupo?: string
          observacoes?: string | null
          responded_at?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          tipo_convite?: Database["public"]["Enums"]["invite_type"]
          token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rsvp: {
        Row: {
          acompanhantes: number | null
          comparecera: boolean
          created_at: string | null
          guest_id: string | null
          id: string
          mensagem: string | null
          restricao: string | null
        }
        Insert: {
          acompanhantes?: number | null
          comparecera: boolean
          created_at?: string | null
          guest_id?: string | null
          id?: string
          mensagem?: string | null
          restricao?: string | null
        }
        Update: {
          acompanhantes?: number | null
          comparecera?: boolean
          created_at?: string | null
          guest_id?: string | null
          id?: string
          mensagem?: string | null
          restricao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_member_status: {
        Row: {
          created_at: string
          id: string
          member_id: string
          response_id: string
          status: Database["public"]["Enums"]["member_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          response_id: string
          status: Database["public"]["Enums"]["member_status"]
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          response_id?: string
          status?: Database["public"]["Enums"]["member_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_member_status_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_member_status_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "rsvp_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_responses: {
        Row: {
          created_at: string
          group_id: string
          id: string
          mensagem: string | null
          total_confirmados: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          mensagem?: string | null
          total_confirmados?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          mensagem?: string | null
          total_confirmados?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "invitation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_dashboard: {
        Row: {
          grupos_pendentes: number | null
          grupos_respondidos: number | null
          total_grupos: number | null
        }
        Relationships: []
      }
      vw_presence_summary: {
        Row: {
          ausentes: number | null
          jantar_confirmados: number | null
          somente_cerimonia: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invite_type: "CERIMONIA" | "CERIMONIA_JANTAR" | "VIP"
      member_status: "CERIMONIA_E_JANTAR" | "SOMENTE_CERIMONIA" | "AUSENTE"
      rsvp_status: "PENDENTE" | "RESPONDIDO"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      invite_type: ["CERIMONIA", "CERIMONIA_JANTAR", "VIP"],
      member_status: ["CERIMONIA_E_JANTAR", "SOMENTE_CERIMONIA", "AUSENTE"],
      rsvp_status: ["PENDENTE", "RESPONDIDO"],
    },
  },
} as const

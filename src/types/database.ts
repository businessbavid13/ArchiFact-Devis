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
      articles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          unit: string | null
          unit_price: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          unit?: string | null
          unit_price?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          unit?: string | null
          unit_price?: number
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          created_at: string | null
          currency: string
          date_format: string
          document_template: string
          email: string | null
          footer_image_url: string | null
          footer_text: string | null
          header_image_url: string | null
          header_text: string | null
          id: string
          invoice_color: string
          invoice_due_days: number
          invoice_opacity: number
          language: string
          legal_status: string | null
          logo_url: string | null
          name: string
          number_format: string
          payment_modes: Json
          phone: string | null
          quote_color: string
          show_payment_status: boolean
          signature_image_url: string | null
          signature_scale: number
          signature_url: string | null
          tax_id: string | null
          tax_options: Json
          terms_and_conditions: Json
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          currency?: string
          date_format?: string
          document_template?: string
          email?: string | null
          footer_image_url?: string | null
          footer_text?: string | null
          header_image_url?: string | null
          header_text?: string | null
          id?: string
          invoice_color?: string
          invoice_due_days?: number
          invoice_opacity?: number
          language?: string
          legal_status?: string | null
          logo_url?: string | null
          name?: string
          number_format?: string
          payment_modes?: Json
          phone?: string | null
          quote_color?: string
          show_payment_status?: boolean
          signature_image_url?: string | null
          signature_scale?: number
          signature_url?: string | null
          tax_id?: string | null
          tax_options?: Json
          terms_and_conditions?: Json
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          currency?: string
          date_format?: string
          document_template?: string
          email?: string | null
          footer_image_url?: string | null
          footer_text?: string | null
          header_image_url?: string | null
          header_text?: string | null
          id?: string
          invoice_color?: string
          invoice_due_days?: number
          invoice_opacity?: number
          language?: string
          legal_status?: string | null
          logo_url?: string | null
          name?: string
          number_format?: string
          payment_modes?: Json
          phone?: string | null
          quote_color?: string
          show_payment_status?: boolean
          signature_image_url?: string | null
          signature_scale?: number
          signature_url?: string | null
          tax_id?: string | null
          tax_options?: Json
          terms_and_conditions?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      credits: {
        Row: {
          balance: number
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          additional_tax_amount: number | null
          additional_tax_name: string | null
          additional_tax_rate: number | null
          client_id: string | null
          created_at: string | null
          date: string
          discount_type: string
          discount_value: number
          due_date: string
          id: string
          items: Json
          number: string
          payment_mode: string | null
          scanned_pages_urls: Json | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          terms: string | null
          total: number
          user_id: string | null
        }
        Insert: {
          additional_tax_amount?: number | null
          additional_tax_name?: string | null
          additional_tax_rate?: number | null
          client_id?: string | null
          created_at?: string | null
          date: string
          discount_type?: string
          discount_value?: number
          due_date: string
          id?: string
          items?: Json
          number: string
          payment_mode?: string | null
          scanned_pages_urls?: Json | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          user_id?: string | null
        }
        Update: {
          additional_tax_amount?: number | null
          additional_tax_name?: string | null
          additional_tax_rate?: number | null
          client_id?: string | null
          created_at?: string | null
          date?: string
          discount_type?: string
          discount_value?: number
          due_date?: string
          id?: string
          items?: Json
          number?: string
          payment_mode?: string | null
          scanned_pages_urls?: Json | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          additional_tax_amount: number | null
          additional_tax_name: string | null
          additional_tax_rate: number | null
          client_id: string | null
          created_at: string | null
          date: string
          discount_type: string
          discount_value: number
          expiration_date: string
          id: string
          items: Json
          number: string
          payment_mode: string | null
          scanned_pages_urls: Json | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          terms: string | null
          total: number
          user_id: string | null
        }
        Insert: {
          additional_tax_amount?: number | null
          additional_tax_name?: string | null
          additional_tax_rate?: number | null
          client_id?: string | null
          created_at?: string | null
          date: string
          discount_type?: string
          discount_value?: number
          expiration_date: string
          id?: string
          items?: Json
          number: string
          payment_mode?: string | null
          scanned_pages_urls?: Json | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          user_id?: string | null
        }
        Update: {
          additional_tax_amount?: number | null
          additional_tax_name?: string | null
          additional_tax_rate?: number | null
          client_id?: string | null
          created_at?: string | null
          date?: string
          discount_type?: string
          discount_value?: number
          expiration_date?: string
          id?: string
          items?: Json
          number?: string
          payment_mode?: string | null
          scanned_pages_urls?: Json | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms?: string | null
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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


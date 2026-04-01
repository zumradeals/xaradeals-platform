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
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_deliveries: {
        Row: {
          created_at: string
          delivery_note: string | null
          delivery_status: string
          id: string
          order_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_note?: string | null
          delivery_status?: string
          id?: string
          order_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_note?: string | null
          delivery_status?: string
          id?: string
          order_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_products: {
        Row: {
          created_at: string
          id: string
          position: number
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total_fcfa: number
          order_id: string
          product_id: string
          qty: number
          unit_price_fcfa: number
        }
        Insert: {
          id?: string
          line_total_fcfa: number
          order_id: string
          product_id: string
          qty?: number
          unit_price_fcfa: number
        }
        Update: {
          id?: string
          line_total_fcfa?: number
          order_id?: string
          product_id?: string
          qty?: number
          unit_price_fcfa?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          id: string
          status: string
          total_fcfa: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          status?: string
          total_fcfa?: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          status?: string
          total_fcfa?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_fcfa: number
          created_at: string
          id: string
          method: string
          order_id: string
          proof_status: string
          proof_url: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string
        }
        Insert: {
          amount_fcfa: number
          created_at?: string
          id?: string
          method: string
          order_id: string
          proof_status?: string
          proof_url?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id: string
        }
        Update: {
          amount_fcfa?: number
          created_at?: string
          id?: string
          method?: string
          order_id?: string
          proof_status?: string
          proof_url?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_delivery_templates: {
        Row: {
          code: string | null
          created_at: string
          credentials: string | null
          id: string
          instructions: string | null
          link: string | null
          product_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          credentials?: string | null
          id?: string
          instructions?: string | null
          link?: string | null
          product_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          credentials?: string | null
          id?: string
          instructions?: string | null
          link?: string | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_delivery_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_description_blocks: {
        Row: {
          delivery_steps: string | null
          duration_and_renewal: string | null
          faq: string | null
          id: string
          pitch: string | null
          product_id: string
          requirements: string | null
          support_policy: string | null
          updated_at: string
          use_case: string | null
          what_you_get: string | null
        }
        Insert: {
          delivery_steps?: string | null
          duration_and_renewal?: string | null
          faq?: string | null
          id?: string
          pitch?: string | null
          product_id: string
          requirements?: string | null
          support_policy?: string | null
          updated_at?: string
          use_case?: string | null
          what_you_get?: string | null
        }
        Update: {
          delivery_steps?: string | null
          duration_and_renewal?: string | null
          faq?: string | null
          id?: string
          pitch?: string | null
          product_id?: string
          requirements?: string | null
          support_policy?: string | null
          updated_at?: string
          use_case?: string | null
          what_you_get?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_description_blocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          storage_path: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          storage_path: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_keys: {
        Row: {
          assigned_at: string | null
          assigned_to_order: string | null
          created_at: string
          id: string
          is_used: boolean
          key_value: string
          product_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_order?: string | null
          created_at?: string
          id?: string
          is_used?: boolean
          key_value: string
          product_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to_order?: string | null
          created_at?: string
          id?: string
          is_used?: boolean
          key_value?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_keys_assigned_to_order_fkey"
            columns: ["assigned_to_order"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string
          category_id: string | null
          created_at: string
          currency: string
          delivery_mode: string
          delivery_type: string
          discount_percent: number | null
          duration_months: number
          id: string
          instant_delivery: boolean
          og_image_url: string | null
          original_price_fcfa: number | null
          price_fcfa: number
          product_family: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          supplier_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          brand: string
          category_id?: string | null
          created_at?: string
          currency?: string
          delivery_mode: string
          delivery_type?: string
          discount_percent?: number | null
          duration_months?: number
          id?: string
          instant_delivery?: boolean
          og_image_url?: string | null
          original_price_fcfa?: number | null
          price_fcfa: number
          product_family: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          supplier_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          brand?: string
          category_id?: string | null
          created_at?: string
          currency?: string
          delivery_mode?: string
          delivery_type?: string
          discount_percent?: number | null
          duration_months?: number
          id?: string
          instant_delivery?: boolean
          og_image_url?: string | null
          original_price_fcfa?: number | null
          price_fcfa?: number
          product_family?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          supplier_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          content: string
          id: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      app_role: "ADMIN" | "CLIENT"
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
      app_role: ["ADMIN", "CLIENT"],
    },
  },
} as const

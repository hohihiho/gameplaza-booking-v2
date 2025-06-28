export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string
          avatar_url: string | null
          created_at: string
          updated_at: string
          role: 'user' | 'admin'
          is_banned: boolean
          ban_reason: string | null
          banned_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          role?: 'user' | 'admin'
          is_banned?: boolean
          ban_reason?: string | null
          banned_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          role?: 'user' | 'admin'
          is_banned?: boolean
          ban_reason?: string | null
          banned_at?: string | null
        }
      }
      device_types: {
        Row: {
          id: string
          name: string
          company: string
          display_order: number
          rental_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company: string
          display_order?: number
          rental_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string
          display_order?: number
          rental_settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          device_type_id: string
          device_number: number
          status: 'available' | 'maintenance' | 'rental'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_type_id: string
          device_number: number
          status?: 'available' | 'maintenance' | 'rental'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_type_id?: string
          device_number?: number
          status?: 'available' | 'maintenance' | 'rental'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rental_time_slots: {
        Row: {
          id: string
          device_type_id: string
          slot_type: 'early' | 'overnight'
          start_time: string
          end_time: string
          credit_options: Json
          enable_2p: boolean
          price_2p_extra: number | null
          is_youth_time: boolean
          created_at: string
          updated_at: string
          date: string
          price: number
        }
        Insert: {
          id?: string
          device_type_id: string
          slot_type: 'early' | 'overnight'
          start_time: string
          end_time: string
          credit_options?: Json
          enable_2p?: boolean
          price_2p_extra?: number | null
          is_youth_time?: boolean
          created_at?: string
          updated_at?: string
          date: string
          price: number
        }
        Update: {
          id?: string
          device_type_id?: string
          slot_type?: 'early' | 'overnight'
          start_time?: string
          end_time?: string
          credit_options?: Json
          enable_2p?: boolean
          price_2p_extra?: number | null
          is_youth_time?: boolean
          created_at?: string
          updated_at?: string
          date?: string
          price?: number
        }
      }
      rental_settings: {
        Row: {
          id: string
          device_type_id: string
          max_rental_units: number | null
          min_rental_hours: number
          max_rental_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_type_id: string
          max_rental_units?: number | null
          min_rental_hours?: number
          max_rental_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_type_id?: string
          max_rental_units?: number | null
          min_rental_hours?: number
          max_rental_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          rental_time_slot_id: string
          device_type_id: string
          device_number: number | null
          assigned_device_number: number | null
          player_count: number
          credit_option: string | null
          total_price: number
          status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'checked_in'
          notes: string | null
          approved_at: string | null
          approved_by: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          checked_in_at: string | null
          actual_start_time: string | null
          actual_end_time: string | null
          time_adjustment_reason: string | null
          adjusted_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rental_time_slot_id: string
          device_type_id: string
          device_number?: number | null
          assigned_device_number?: number | null
          player_count?: number
          credit_option?: string | null
          total_price: number
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'checked_in'
          notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          checked_in_at?: string | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          time_adjustment_reason?: string | null
          adjusted_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rental_time_slot_id?: string
          device_type_id?: string
          device_number?: number | null
          assigned_device_number?: number | null
          player_count?: number
          credit_option?: string | null
          total_price?: number
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'checked_in'
          notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          checked_in_at?: string | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          time_adjustment_reason?: string | null
          adjusted_amount?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      time_adjustments: {
        Row: {
          id: string
          reservation_id: string
          adjusted_by: string
          adjustment_type: 'start' | 'end' | 'both'
          old_start_time: string | null
          new_start_time: string | null
          old_end_time: string | null
          new_end_time: string | null
          reason: string
          old_amount: number | null
          new_amount: number | null
          created_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          adjusted_by: string
          adjustment_type: 'start' | 'end' | 'both'
          old_start_time?: string | null
          new_start_time?: string | null
          old_end_time?: string | null
          new_end_time?: string | null
          reason: string
          old_amount?: number | null
          new_amount?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          adjusted_by?: string
          adjustment_type?: 'start' | 'end' | 'both'
          old_start_time?: string | null
          new_start_time?: string | null
          old_end_time?: string | null
          new_end_time?: string | null
          reason?: string
          old_amount?: number | null
          new_amount?: number | null
          created_at?: string
        }
      }
      guide_content: {
        Row: {
          id: string
          page_slug: string
          content: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_slug: string
          content: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_slug?: string
          content?: Json
          created_at?: string
          updated_at?: string
        }
      }
      reservation_rules: {
        Row: {
          id: string
          rule_type: string
          description: string
          config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rule_type: string
          description: string
          config: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rule_type?: string
          description?: string
          config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_time_adjustment: {
        Args: {
          p_reservation_id: string
          p_adjusted_by: string
          p_new_start_time: string
          p_new_end_time: string
          p_reason: string
        }
        Returns: void
      }
      update_device_status_on_rental_end: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      calculate_actual_duration: {
        Args: {
          start_time: string
          end_time: string
        }
        Returns: string
      }
      calculate_adjusted_amount: {
        Args: {
          reservation_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
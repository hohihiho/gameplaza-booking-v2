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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          bank_account: Json | null
          created_at: string | null
          id: string
          is_super_admin: boolean | null
          permissions: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank_account?: Json | null
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank_account?: Json | null
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_qr_codes: {
        Row: {
          bank_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          qr_image_path: string
          qr_image_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bank_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          qr_image_path: string
          qr_image_url: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bank_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          qr_image_path?: string
          qr_image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          is_active: boolean | null
          severity: number
          updated_at: string | null
          word: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          severity?: number
          updated_at?: string | null
          word: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          severity?: number
          updated_at?: string | null
          word?: string
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string | null
          updated_by: string | null
          view_count: number | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_categories: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      device_types: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_rentable: boolean | null
          model_name: string | null
          name: string
          play_modes: Json | null
          rental_settings: Json | null
          updated_at: string | null
          version_name: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_rentable?: boolean | null
          model_name?: string | null
          name: string
          play_modes?: Json | null
          rental_settings?: Json | null
          updated_at?: string | null
          version_name?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_rentable?: boolean | null
          model_name?: string | null
          name?: string
          play_modes?: Json | null
          rental_settings?: Json | null
          updated_at?: string | null
          version_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "device_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string | null
          device_number: number
          device_type_id: string
          id: string
          last_maintenance: string | null
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_number: number
          device_type_id: string
          id?: string
          last_maintenance?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_number?: number
          device_type_id?: string
          id?: string
          last_maintenance?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_device_type_id_fkey"
            columns: ["device_type_id"]
            isOneToOne: false
            referencedRelation: "device_types"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_content: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          page_slug: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          page_slug: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          page_slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          is_red_day: boolean | null
          last_synced_at: string | null
          name: string
          source: string | null
          type: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          is_red_day?: boolean | null
          last_synced_at?: string | null
          name: string
          source?: string | null
          type: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          is_red_day?: boolean | null
          last_synced_at?: string | null
          name?: string
          source?: string | null
          type?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      machine_rules: {
        Row: {
          content: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      machines: {
        Row: {
          created_at: string | null
          id: string
          last_maintenance_date: string | null
          location: string | null
          machine_number: string
          name: string
          notes: string | null
          purchase_date: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          machine_number: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          machine_number?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          account_holder: string
          account_number: string
          bank_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_holder: string
          account_number: string
          bank_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      play_modes: {
        Row: {
          created_at: string | null
          device_type_id: string
          display_order: number
          id: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          device_type_id: string
          display_order?: number
          id?: string
          name: string
          price?: number
        }
        Update: {
          created_at?: string | null
          device_type_id?: string
          display_order?: number
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "play_modes_device_type_id_fkey"
            columns: ["device_type_id"]
            isOneToOne: false
            referencedRelation: "device_types"
            referencedColumns: ["id"]
          },
        ]
      }
      push_message_templates: {
        Row: {
          body: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          template_key: string
          title: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          template_key: string
          title: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          template_key?: string
          title?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          enabled: boolean
          endpoint: string
          id: string
          p256dh: string | null
          updated_at: string
          user_agent: string | null
          user_email: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          enabled?: boolean
          endpoint: string
          id?: string
          p256dh?: string | null
          updated_at?: string
          user_agent?: string | null
          user_email: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          enabled?: boolean
          endpoint?: string
          id?: string
          p256dh?: string | null
          updated_at?: string
          user_agent?: string | null
          user_email?: string
        }
        Relationships: []
      }
      rental_machines: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          display_order: number | null
          hourly_rate: number
          id: string
          image_url: string | null
          is_active: boolean | null
          machine_id: string | null
          max_hours: number | null
          max_players: number | null
          min_hours: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          display_order?: number | null
          hourly_rate: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          machine_id?: string | null
          max_hours?: number | null
          max_players?: number | null
          min_hours?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          display_order?: number | null
          hourly_rate?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          machine_id?: string | null
          max_hours?: number | null
          max_players?: number | null
          min_hours?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_machines_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: true
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_settings: {
        Row: {
          created_at: string | null
          device_type_id: string
          id: string
          max_rental_hours: number
          max_rental_units: number | null
          min_rental_hours: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_type_id: string
          id?: string
          max_rental_hours?: number
          max_rental_units?: number | null
          min_rental_hours?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_type_id?: string
          id?: string
          max_rental_hours?: number
          max_rental_units?: number | null
          min_rental_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_settings_device_type_id_fkey"
            columns: ["device_type_id"]
            isOneToOne: true
            referencedRelation: "device_types"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_time_slots: {
        Row: {
          created_at: string | null
          credit_options: Json
          device_type_id: string
          enable_2p: boolean
          end_time: string
          id: string
          is_youth_time: boolean
          price_2p_extra: number | null
          slot_type: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_options?: Json
          device_type_id: string
          enable_2p?: boolean
          end_time: string
          id?: string
          is_youth_time?: boolean
          price_2p_extra?: number | null
          slot_type: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_options?: Json
          device_type_id?: string
          enable_2p?: boolean
          end_time?: string
          id?: string
          is_youth_time?: boolean
          price_2p_extra?: number | null
          slot_type?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_time_slots_device_type_id_fkey"
            columns: ["device_type_id"]
            isOneToOne: false
            referencedRelation: "device_types"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_completion_schedule: {
        Row: {
          created_at: string | null
          id: string
          processed: boolean | null
          reservation_id: string | null
          scheduled_at: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          processed?: boolean | null
          reservation_id?: string | null
          scheduled_at: string
        }
        Update: {
          created_at?: string | null
          id?: string
          processed?: boolean | null
          reservation_id?: string | null
          scheduled_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_completion_schedule_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_completion_schedule_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "v_completion_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_rules: {
        Row: {
          content: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          adjusted_amount: number | null
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_device_number: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in_at: string | null
          check_in_by: string | null
          completed_at: string | null
          created_at: string | null
          credit_type: string | null
          date: string
          device_id: string | null
          end_time: string
          hourly_rate: number
          hours: number | null
          id: string
          payment_confirmed_at: string | null
          payment_confirmed_by: string | null
          payment_method: string | null
          payment_status: string | null
          player_count: number | null
          rejection_reason: string | null
          rental_machine_id: string | null
          reservation_number: string
          start_time: string
          status: string | null
          time_adjustment_reason: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
          user_notes: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          adjusted_amount?: number | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_device_number?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in_at?: string | null
          check_in_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          credit_type?: string | null
          date: string
          device_id?: string | null
          end_time: string
          hourly_rate: number
          hours?: number | null
          id?: string
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_method?: string | null
          payment_status?: string | null
          player_count?: number | null
          rejection_reason?: string | null
          rental_machine_id?: string | null
          reservation_number: string
          start_time: string
          status?: string | null
          time_adjustment_reason?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_notes?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          adjusted_amount?: number | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_device_number?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in_at?: string | null
          check_in_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          credit_type?: string | null
          date?: string
          device_id?: string | null
          end_time?: string
          hourly_rate?: number
          hours?: number | null
          id?: string
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_method?: string | null
          payment_status?: string | null
          player_count?: number | null
          rejection_reason?: string | null
          rental_machine_id?: string | null
          reservation_number?: string
          start_time?: string
          status?: string | null
          time_adjustment_reason?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_check_in_by_fkey"
            columns: ["check_in_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_payment_confirmed_by_fkey"
            columns: ["payment_confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_rental_machine_id_fkey"
            columns: ["rental_machine_id"]
            isOneToOne: false
            referencedRelation: "rental_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          end_time: string
          id: string
          is_overnight: boolean | null
          start_time: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          end_time: string
          id?: string
          is_overnight?: boolean | null
          start_time: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          end_time?: string
          id?: string
          is_overnight?: boolean | null
          start_time?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_events: {
        Row: {
          affects_reservation: boolean | null
          block_type: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          end_date: string | null
          end_time: string | null
          id: string
          is_auto_generated: boolean | null
          is_recurring: boolean | null
          recurring_type: string | null
          source_reference: string | null
          source_type: string | null
          start_time: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          affects_reservation?: boolean | null
          block_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_recurring?: boolean | null
          recurring_type?: string | null
          source_reference?: string | null
          source_type?: string | null
          start_time?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          affects_reservation?: boolean | null
          block_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_recurring?: boolean | null
          recurring_type?: string | null
          source_reference?: string | null
          source_type?: string | null
          start_time?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      special_schedules: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          date: string
          description: string | null
          end_time: string
          id: string
          is_confirmed: boolean | null
          min_reservations: number | null
          schedule_type: string
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          end_time: string
          id?: string
          is_confirmed?: boolean | null
          min_reservations?: number | null
          schedule_type: string
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          end_time?: string
          id?: string
          is_confirmed?: boolean | null
          min_reservations?: number | null
          schedule_type?: string
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      terms: {
        Row: {
          content: string
          created_at: string | null
          effective_date: string
          id: string
          is_active: boolean | null
          title: string
          type: string
          updated_at: string | null
          version: string
        }
        Insert: {
          content: string
          created_at?: string | null
          effective_date: string
          id?: string
          is_active?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          version: string
        }
        Update: {
          content?: string
          created_at?: string | null
          effective_date?: string
          id?: string
          is_active?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          notes: string | null
          rental_machine_id: string | null
          slot_type: string | null
          special_rate: number | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          rental_machine_id?: string | null
          slot_type?: string | null
          special_rate?: number | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          rental_machine_id?: string | null
          slot_type?: string | null
          special_rate?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_rental_machine_id_fkey"
            columns: ["rental_machine_id"]
            isOneToOne: false
            referencedRelation: "rental_machines"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admin_notes: string | null
          blacklist_reason: string | null
          blacklisted_at: string | null
          blacklisted_until: string | null
          created_at: string | null
          email: string
          id: string
          is_blacklisted: boolean | null
          last_login_at: string | null
          marketing_agreed: boolean | null
          marketing_agreed_at: string | null
          name: string
          nickname: string | null
          no_show_count: number | null
          phone: string | null
          phone_changed_at: string | null
          push_notifications_enabled: boolean | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_until?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_blacklisted?: boolean | null
          last_login_at?: string | null
          marketing_agreed?: boolean | null
          marketing_agreed_at?: string | null
          name: string
          nickname?: string | null
          no_show_count?: number | null
          phone?: string | null
          phone_changed_at?: string | null
          push_notifications_enabled?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_until?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_blacklisted?: boolean | null
          last_login_at?: string | null
          marketing_agreed?: boolean | null
          marketing_agreed_at?: string | null
          name?: string
          nickname?: string | null
          no_show_count?: number | null
          phone?: string | null
          phone_changed_at?: string | null
          push_notifications_enabled?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_completion_schedule: {
        Row: {
          assigned_device_number: number | null
          device_type: string | null
          id: string | null
          processed: boolean | null
          scheduled_at: string | null
          time_remaining: unknown | null
          user_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_and_update_expired_rentals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_schedule_status: {
        Args: { check_date: string }
        Returns: {
          event_types: string[]
          has_special_hours: boolean
          is_closed: boolean
          special_end_time: string
          special_start_time: string
        }[]
      }
      cleanup_expired_verifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      debug_completion_schedule: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_status: string
          device_info: string
          minutes_until_completion: number
          reservation_id: string
          scheduled_time: string
          user_name: string
          will_process_at: string
        }[]
      }
      generate_reservation_number: {
        Args: { p_date: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_scheduled_completions: {
        Args: Record<PropertyKey, never>
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
    Enums: {},
  },
} as const
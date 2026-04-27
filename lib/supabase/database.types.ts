// Hand-derived from the live Supabase schema on 2026-04-19.
// If the schema changes, regenerate via `supabase gen types typescript` or update here.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ISODate = string; // "YYYY-MM-DD"
type Timestamp = string; // ISO timestamp with tz

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          full_name: string | null;
          business_name: string | null;
          logo_url: string | null;
          tax_id: string | null;
          tax_id_type: string | null;
          vat_rate: number | null;
          vat_included: boolean | null;
          address: string | null;
          city: string | null;
          email: string | null;
          website: string | null;
          invoice_prefix: string | null;
          next_invoice_number: number | null;
          next_quote_number: number | null;
          next_receipt_number: number | null;
          bank_name: string | null;
          bank_branch: string | null;
          bank_account: string | null;
          bit_phone: string | null;
          invoice_footer: string | null;
          onboarding_completed_at: Timestamp | null;
          plan: string | null;
          subscription_status: string | null;
          subscription_ends_at: Timestamp | null;
          trial_ends_at: Timestamp | null;
          locale: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id: string;
          phone?: string | null;
          full_name?: string | null;
          business_name?: string | null;
          logo_url?: string | null;
          tax_id?: string | null;
          tax_id_type?: string | null;
          vat_rate?: number | null;
          vat_included?: boolean | null;
          address?: string | null;
          city?: string | null;
          email?: string | null;
          website?: string | null;
          invoice_prefix?: string | null;
          next_invoice_number?: number | null;
          next_quote_number?: number | null;
          next_receipt_number?: number | null;
          bank_name?: string | null;
          bank_branch?: string | null;
          bank_account?: string | null;
          bit_phone?: string | null;
          invoice_footer?: string | null;
          onboarding_completed_at?: Timestamp | null;
          plan?: string | null;
          subscription_status?: string | null;
          subscription_ends_at?: Timestamp | null;
          trial_ends_at?: Timestamp | null;
          locale?: string | null;
          created_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          phone?: string | null;
          full_name?: string | null;
          business_name?: string | null;
          logo_url?: string | null;
          tax_id?: string | null;
          tax_id_type?: string | null;
          vat_rate?: number | null;
          vat_included?: boolean | null;
          address?: string | null;
          city?: string | null;
          email?: string | null;
          website?: string | null;
          invoice_prefix?: string | null;
          next_invoice_number?: number | null;
          next_quote_number?: number | null;
          next_receipt_number?: number | null;
          bank_name?: string | null;
          bank_branch?: string | null;
          bank_account?: string | null;
          bit_phone?: string | null;
          invoice_footer?: string | null;
          onboarding_completed_at?: Timestamp | null;
          plan?: string | null;
          subscription_status?: string | null;
          subscription_ends_at?: Timestamp | null;
          trial_ends_at?: Timestamp | null;
          locale?: string | null;
          created_at?: Timestamp | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          client_id: string | null;
          client_name: string | null;
          client_phone: string | null;
          contract_value: number | null;
          start_date: ISODate | null;
          target_end_date: ISODate | null;
          status: string | null;
          cover_photo_url: string | null;
          portal_token: string | null;
          portal_expires_at: Timestamp | null;
          portal_pin_hash: string | null;
          portal_revoked_at: Timestamp | null;
          portal_last_viewed_at: Timestamp | null;
          portal_view_count: number | null;
          progress_pct: number | null;
          foreman_contact_id: string | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          client_id?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          contract_value?: number | null;
          start_date?: ISODate | null;
          target_end_date?: ISODate | null;
          status?: string | null;
          cover_photo_url?: string | null;
          portal_token?: string | null;
          portal_expires_at?: Timestamp | null;
          portal_pin_hash?: string | null;
          portal_revoked_at?: Timestamp | null;
          portal_last_viewed_at?: Timestamp | null;
          portal_view_count?: number | null;
          progress_pct?: number | null;
          foreman_contact_id?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string | null;
          client_id?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          contract_value?: number | null;
          start_date?: ISODate | null;
          target_end_date?: ISODate | null;
          status?: string | null;
          cover_photo_url?: string | null;
          portal_token?: string | null;
          portal_expires_at?: Timestamp | null;
          portal_pin_hash?: string | null;
          portal_revoked_at?: Timestamp | null;
          portal_last_viewed_at?: Timestamp | null;
          portal_view_count?: number | null;
          progress_pct?: number | null;
          foreman_contact_id?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          tax_id: string | null;
          billing_address: string | null;
          notes: string | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          tax_id?: string | null;
          billing_address?: string | null;
          notes?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          tax_id?: string | null;
          billing_address?: string | null;
          notes?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Relationships: [];
      };
      webhooks: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          events: string[];
          secret: string | null;
          active: boolean;
          last_status: number | null;
          last_fired_at: Timestamp | null;
          last_error: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          events?: string[];
          secret?: string | null;
          active?: boolean;
          last_status?: number | null;
          last_fired_at?: Timestamp | null;
          last_error?: string | null;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["webhooks"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      recurring_invoice_templates: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          type: string;
          frequency: string;
          next_issue_date: ISODate;
          active: boolean;
          client_name: string | null;
          client_tax_id: string | null;
          client_email: string | null;
          client_phone: string | null;
          client_address: string | null;
          items: Json;
          vat_rate: number;
          vat_included: boolean;
          notes: string | null;
          footer: string | null;
          last_issued_at: Timestamp | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          type?: string;
          frequency?: string;
          next_issue_date: ISODate;
          active?: boolean;
          client_name?: string | null;
          client_tax_id?: string | null;
          client_email?: string | null;
          client_phone?: string | null;
          client_address?: string | null;
          items?: Json;
          vat_rate?: number;
          vat_included?: boolean;
          notes?: string | null;
          footer?: string | null;
          last_issued_at?: Timestamp | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_invoice_templates"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      project_collaborators: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          invited_email: string | null;
          role: string;
          invited_by: string | null;
          invited_at: Timestamp | null;
          accepted_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          invited_email?: string | null;
          role?: string;
          invited_by?: string | null;
          invited_at?: Timestamp | null;
          accepted_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["project_collaborators"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      portal_views: {
        Row: {
          id: string;
          project_id: string;
          viewed_at: Timestamp | null;
          ip_hash: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          viewed_at?: Timestamp | null;
          ip_hash?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          viewed_at?: Timestamp | null;
          ip_hash?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          contact_id: string;
          role_in_project: string | null;
          agreed_amount: number | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          contact_id: string;
          role_in_project?: string | null;
          agreed_amount?: number | null;
          created_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          contact_id?: string;
          role_in_project?: string | null;
          agreed_amount?: number | null;
          created_at?: Timestamp | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          role: string;
          trade: string | null;
          pay_rate: number | null;
          pay_type: string | null;
          notes: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string | null;
          role: string;
          trade?: string | null;
          pay_rate?: number | null;
          pay_type?: string | null;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string | null;
          role?: string;
          trade?: string | null;
          pay_rate?: number | null;
          pay_type?: string | null;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Relationships: [];
      };
      daily_reports: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          report_date: ISODate;
          weather: string | null;
          notes: string | null;
          voice_note_url: string | null;
          locked: boolean | null;
          foreman_contact_id: string | null;
          foreman_on_site: boolean | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          report_date?: ISODate;
          weather?: string | null;
          notes?: string | null;
          voice_note_url?: string | null;
          locked?: boolean | null;
          foreman_contact_id?: string | null;
          foreman_on_site?: boolean | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          report_date?: ISODate;
          weather?: string | null;
          notes?: string | null;
          voice_note_url?: string | null;
          locked?: boolean | null;
          foreman_contact_id?: string | null;
          foreman_on_site?: boolean | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Relationships: [];
      };
      project_milestones: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          planned_date: ISODate | null;
          actual_date: ISODate | null;
          done: boolean | null;
          position: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          planned_date?: ISODate | null;
          actual_date?: ISODate | null;
          done?: boolean | null;
          position?: number | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          planned_date?: ISODate | null;
          actual_date?: ISODate | null;
          done?: boolean | null;
          position?: number | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          daily_report_id: string;
          contact_id: string;
          hours_worked: number | null;
          notes: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          daily_report_id: string;
          contact_id: string;
          hours_worked?: number | null;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          daily_report_id?: string;
          contact_id?: string;
          hours_worked?: number | null;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Relationships: [];
      };
      report_photos: {
        Row: {
          id: string;
          daily_report_id: string;
          url: string;
          caption: string | null;
          geo_lat: number | null;
          geo_lng: number | null;
          taken_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          daily_report_id: string;
          url: string;
          caption?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          taken_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          daily_report_id?: string;
          url?: string;
          caption?: string | null;
          geo_lat?: number | null;
          geo_lng?: number | null;
          taken_at?: Timestamp | null;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          description: string | null;
          photo_url: string | null;
          severity: string | null;
          status: string | null;
          source_report_id: string | null;
          created_at: Timestamp | null;
          resolved_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          photo_url?: string | null;
          severity?: string | null;
          status?: string | null;
          source_report_id?: string | null;
          created_at?: Timestamp | null;
          resolved_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          photo_url?: string | null;
          severity?: string | null;
          status?: string | null;
          source_report_id?: string | null;
          created_at?: Timestamp | null;
          resolved_at?: Timestamp | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          amount: number;
          category: string;
          supplier_contact_id: string | null;
          receipt_photo_url: string | null;
          paid_by: string | null;
          payment_method: string | null;
          expense_date: ISODate;
          notes: string | null;
          paid_at: Timestamp | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          amount: number;
          category: string;
          supplier_contact_id?: string | null;
          receipt_photo_url?: string | null;
          paid_by?: string | null;
          payment_method?: string | null;
          expense_date?: ISODate;
          notes?: string | null;
          paid_at?: Timestamp | null;
          created_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          supplier_contact_id?: string | null;
          receipt_photo_url?: string | null;
          paid_by?: string | null;
          payment_method?: string | null;
          expense_date?: ISODate;
          notes?: string | null;
          paid_at?: Timestamp | null;
          created_at?: Timestamp | null;
        };
        Relationships: [];
      };
      worker_payments: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          contact_id: string;
          period_start: ISODate;
          period_end: ISODate;
          amount: number;
          paid_at: Timestamp;
          notes: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          contact_id: string;
          period_start: ISODate;
          period_end: ISODate;
          amount: number;
          paid_at?: Timestamp;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          contact_id?: string;
          period_start?: ISODate;
          period_end?: ISODate;
          amount?: number;
          paid_at?: Timestamp;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          direction: string;
          amount: number;
          counterparty_contact_id: string | null;
          payment_date: ISODate;
          method: string | null;
          invoice_number: string | null;
          notes: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          direction: string;
          amount: number;
          counterparty_contact_id?: string | null;
          payment_date?: ISODate;
          method?: string | null;
          invoice_number?: string | null;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          direction?: string;
          amount?: number;
          counterparty_contact_id?: string | null;
          payment_date?: ISODate;
          method?: string | null;
          invoice_number?: string | null;
          notes?: string | null;
          created_at?: Timestamp | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: Timestamp | null;
          last_seen_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: Timestamp | null;
          last_seen_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string;
          table_name: string;
          row_id: string | null;
          action: string;
          old_data: Json | null;
          new_data: Json | null;
          actor_id: string | null;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          table_name: string;
          row_id?: string | null;
          action: string;
          old_data?: Json | null;
          new_data?: Json | null;
          actor_id?: string | null;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      materials_catalog: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          default_unit: string | null;
          typical_cost_per_unit: number | null;
          default_supplier_id: string | null;
          use_count: number;
          last_used_at: Timestamp | null;
          notes: string | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          default_unit?: string | null;
          typical_cost_per_unit?: number | null;
          default_supplier_id?: string | null;
          use_count?: number;
          last_used_at?: Timestamp | null;
          notes?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["materials_catalog"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          name: string;
          quantity: number;
          unit: string | null;
          cost_per_unit: number | null;
          total_cost: number | null;
          supplier_contact_id: string | null;
          status: string;
          delivery_date: ISODate | null;
          expense_id: string | null;
          notes: string | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          name: string;
          quantity?: number;
          unit?: string | null;
          cost_per_unit?: number | null;
          total_cost?: number | null;
          supplier_contact_id?: string | null;
          status?: string;
          delivery_date?: ISODate | null;
          expense_id?: string | null;
          notes?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      change_orders: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          description: string | null;
          amount_change: number;
          status: string;
          signed_by_name: string | null;
          signed_signature_url: string | null;
          signed_at: Timestamp | null;
          rejected_at: Timestamp | null;
          rejected_reason: string | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          amount_change?: number;
          status?: string;
          signed_by_name?: string | null;
          signed_signature_url?: string | null;
          signed_at?: Timestamp | null;
          rejected_at?: Timestamp | null;
          rejected_reason?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["change_orders"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          type: string;
          doc_number: string;
          number_int: number;
          status: string;
          client_contact_id: string | null;
          client_name: string | null;
          client_tax_id: string | null;
          client_address: string | null;
          client_email: string | null;
          client_phone: string | null;
          issue_date: ISODate;
          due_date: ISODate | null;
          valid_until: ISODate | null;
          subtotal: number;
          vat_rate: number;
          vat_amount: number;
          discount_amount: number;
          total: number;
          amount_paid: number;
          payment_method: string | null;
          payment_reference: string | null;
          notes: string | null;
          footer: string | null;
          pdf_url: string | null;
          accepted_at: Timestamp | null;
          accepted_by_name: string | null;
          accepted_signature_url: string | null;
          cancelled_at: Timestamp | null;
          cancelled_reason: string | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          type: string;
          doc_number: string;
          number_int: number;
          status?: string;
          client_contact_id?: string | null;
          client_name?: string | null;
          client_tax_id?: string | null;
          client_address?: string | null;
          client_email?: string | null;
          client_phone?: string | null;
          issue_date?: ISODate;
          due_date?: ISODate | null;
          valid_until?: ISODate | null;
          subtotal?: number;
          vat_rate?: number;
          vat_amount?: number;
          discount_amount?: number;
          total?: number;
          amount_paid?: number;
          payment_method?: string | null;
          payment_reference?: string | null;
          notes?: string | null;
          footer?: string | null;
          pdf_url?: string | null;
          accepted_at?: Timestamp | null;
          accepted_by_name?: string | null;
          accepted_signature_url?: string | null;
          cancelled_at?: Timestamp | null;
          cancelled_reason?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          sort_order: number;
          description: string;
          quantity: number;
          unit_price: number;
          unit: string | null;
          line_total: number;
          created_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          sort_order?: number;
          description: string;
          quantity?: number;
          unit_price?: number;
          unit?: string | null;
          line_total?: number;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]> & { id?: string };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          description: string | null;
          assignee_contact_id: string | null;
          due_date: ISODate | null;
          status: string | null;
          created_at: Timestamp | null;
          completed_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          assignee_contact_id?: string | null;
          due_date?: ISODate | null;
          status?: string | null;
          created_at?: Timestamp | null;
          completed_at?: Timestamp | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          assignee_contact_id?: string | null;
          due_date?: ISODate | null;
          status?: string | null;
          created_at?: Timestamp | null;
          completed_at?: Timestamp | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

// Convenient row/insert/update aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
export type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"];
export type DailyReportInsert = Database["public"]["Tables"]["daily_reports"]["Insert"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type AttendanceInsert = Database["public"]["Tables"]["attendance"]["Insert"];
export type ReportPhoto = Database["public"]["Tables"]["report_photos"]["Row"];
export type ReportPhotoInsert = Database["public"]["Tables"]["report_photos"]["Insert"];
export type Issue = Database["public"]["Tables"]["issues"]["Row"];
export type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
export type WorkerPayment = Database["public"]["Tables"]["worker_payments"]["Row"];
export type WorkerPaymentInsert = Database["public"]["Tables"]["worker_payments"]["Insert"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type ProjectMilestone = Database["public"]["Tables"]["project_milestones"]["Row"];
export type ProjectMilestoneInsert = Database["public"]["Tables"]["project_milestones"]["Insert"];

// Known enum-ish strings (kept loose; DB columns are plain text)
export const CONTACT_ROLES = ["worker", "supplier", "subcontractor", "foreman", "other"] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];
export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  worker: "עובד",
  subcontractor: "קבלן משנה",
  supplier: "ספק",
  foreman: "מנהל עבודה",
  other: "אחר",
};

export const PROJECT_STATUSES = ["active", "paused", "done", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PAYMENT_DIRECTIONS = ["in", "out"] as const;
export type PaymentDirection = (typeof PAYMENT_DIRECTIONS)[number];

export const ISSUE_SEVERITIES = ["low", "medium", "high"] as const;
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

export const ISSUE_STATUSES = ["open", "in_progress", "resolved"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const TASK_STATUSES = ["open", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type Material = Database["public"]["Tables"]["materials"]["Row"];
export type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"];
export const MATERIAL_STATUSES = ["ordered", "delivered", "installed", "returned"] as const;
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];
export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  ordered: "הוזמן",
  delivered: "סופק",
  installed: "הותקן",
  returned: "הוחזר",
};

export type ChangeOrder = Database["public"]["Tables"]["change_orders"]["Row"];
export type ChangeOrderInsert = Database["public"]["Tables"]["change_orders"]["Insert"];
export const CHANGE_ORDER_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type ChangeOrderStatus = (typeof CHANGE_ORDER_STATUSES)[number];
export const CHANGE_ORDER_STATUS_LABELS: Record<ChangeOrderStatus, string> = {
  pending: "ממתין לאישור",
  approved: "מאושר",
  rejected: "נדחה",
  cancelled: "בוטל",
};

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];

export const INVOICE_TYPES = ["quote", "tax_invoice", "receipt", "tax_receipt"] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  quote: "הצעת מחיר",
  tax_invoice: "חשבונית מס",
  receipt: "קבלה",
  tax_receipt: "חשבונית מס-קבלה",
};

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "accepted",
  "paid",
  "cancelled",
  "expired",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "טיוטה",
  issued: "הונפק",
  accepted: "התקבל",
  paid: "שולם",
  cancelled: "בוטל",
  expired: "פג תוקף",
};

export type ProjectCollaborator = Database["public"]["Tables"]["project_collaborators"]["Row"];
export type ProjectCollaboratorInsert = Database["public"]["Tables"]["project_collaborators"]["Insert"];
export const COLLAB_ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type CollabRole = (typeof COLLAB_ROLES)[number];
export const COLLAB_ROLE_LABELS: Record<CollabRole, string> = {
  owner: "בעלים",
  admin: "מנהל",
  editor: "עורך",
  viewer: "צופה",
};

export const TAX_ID_TYPES = ["osek_patur", "osek_morshe", "company", "individual"] as const;
export type TaxIdType = (typeof TAX_ID_TYPES)[number];

export const TAX_ID_TYPE_LABELS: Record<TaxIdType, string> = {
  osek_patur: "עוסק פטור",
  osek_morshe: "עוסק מורשה",
  company: "חברה בע״מ",
  individual: "יחיד / ת.ז.",
};

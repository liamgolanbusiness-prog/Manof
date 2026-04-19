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
          created_at: Timestamp | null;
        };
        Insert: {
          id: string;
          phone?: string | null;
          full_name?: string | null;
          business_name?: string | null;
          logo_url?: string | null;
          created_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          client_name: string | null;
          client_phone: string | null;
          contract_value: number | null;
          start_date: ISODate | null;
          target_end_date: ISODate | null;
          status: string | null;
          cover_photo_url: string | null;
          portal_token: string | null;
          progress_pct: number | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          contract_value?: number | null;
          start_date?: ISODate | null;
          target_end_date?: ISODate | null;
          status?: string | null;
          cover_photo_url?: string | null;
          portal_token?: string | null;
          progress_pct?: number | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["project_members"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
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
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["daily_reports"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["report_photos"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
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
          created_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenient row/insert/update aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type ReportPhoto = Database["public"]["Tables"]["report_photos"]["Row"];
export type Issue = Database["public"]["Tables"]["issues"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];

// Known enum-ish strings (kept loose; DB columns are plain text)
export const CONTACT_ROLES = ["worker", "supplier", "subcontractor", "client", "other"] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

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

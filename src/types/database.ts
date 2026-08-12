/**
 * Hand-written mirror of supabase/migrations/0001_init.sql.
 *
 * Once a real Supabase project exists, prefer regenerating this file with
 * `supabase gen types typescript` so it can never drift from the live
 * schema — this manual version exists so the app has full type coverage
 * before that project is provisioned.
 */

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'partially_paid' | 'unknown';
export type DocumentSource = 'camera' | 'gallery' | 'pdf' | 'file' | 'screenshot';
export type DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'failed';
export type DocumentType = 'bill' | 'receipt' | 'tax_invoice' | 'payment_demand' | 'other';
export type ReviewStatus = 'pending_review' | 'confirmed' | 'rejected';
export type MatchType = 'bill_receipt' | 'duplicate';
export type MatchStatus = 'suggested' | 'confirmed' | 'rejected';
export type NotificationType =
  | 'due_reminder_7d'
  | 'due_reminder_3d'
  | 'due_reminder_1d'
  | 'due_today';
export type NotificationStatus = 'scheduled' | 'sent' | 'cancelled';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  key: string;
  name_en: string;
  name_he: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_system: boolean;
  created_at: string;
}

export interface Provider {
  id: string;
  user_id: string | null;
  name: string;
  normalized_name: string;
  default_category_id: string | null;
  country: string | null;
  aliases: string[];
  logo_url: string | null;
  is_system: boolean;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  file_hash: string;
  source: DocumentSource;
  status: DocumentStatus;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}

/** Per-field confidence scores (0..1) attached to a document_extractions row. */
export type ExtractionConfidence = Partial<
  Record<
    | 'provider'
    | 'category'
    | 'amount'
    | 'currency'
    | 'issueDate'
    | 'dueDate'
    | 'billingPeriod'
    | 'invoiceNumber'
    | 'customerNumber',
    number
  >
>;

export interface DocumentExtraction {
  id: string;
  document_id: string;
  user_id: string;
  ai_provider: string;
  document_type: DocumentType | null;
  provider_name_raw: string | null;
  provider_id: string | null;
  category_id: string | null;
  amount: number | null;
  currency: string | null;
  amount_before_vat: number | null;
  amount_after_vat: number | null;
  issue_date: string | null;
  due_date: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  invoice_number: string | null;
  customer_number: string | null;
  reference_number: string | null;
  payment_method: string | null;
  is_paid: boolean | null;
  paid_date: string | null;
  raw_ocr_text: string | null;
  confidence: ExtractionConfidence;
  review_status: ReviewStatus;
  created_at: string;
}

export interface Bill {
  id: string;
  user_id: string;
  provider_id: string | null;
  category_id: string | null;
  document_id: string | null;
  invoice_number: string | null;
  customer_number: string | null;
  amount: number;
  currency: string;
  amount_before_vat: number | null;
  amount_after_vat: number | null;
  issue_date: string | null;
  due_date: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  status: BillStatus;
  paid_date: string | null;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  bill_id: string;
  document_id: string | null;
  amount: number;
  currency: string;
  paid_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface DocumentMatch {
  id: string;
  user_id: string;
  bill_id: string;
  document_id: string;
  match_type: MatchType;
  confidence: number;
  matched_fields: Record<string, boolean>;
  status: MatchStatus;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  bill_id: string;
  type: NotificationType;
  scheduled_for: string;
  sent_at: string | null;
  status: NotificationStatus;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: ThemePreference;
  notifications_enabled: boolean;
  reminder_days_before: number[];
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

/** Minimal Supabase `Database` generic — enough for typed table access. */
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      categories: {
        Row: Category;
        Insert: Partial<Category> & Pick<Category, 'key' | 'name_en' | 'name_he'>;
        Update: Partial<Category>;
      };
      providers: {
        Row: Provider;
        Insert: Partial<Provider> & Pick<Provider, 'name' | 'normalized_name'>;
        Update: Partial<Provider>;
      };
      documents: {
        Row: DocumentRow;
        Insert: Partial<DocumentRow> &
          Pick<DocumentRow, 'user_id' | 'storage_path' | 'file_name' | 'mime_type' | 'file_size' | 'file_hash' | 'source'>;
        Update: Partial<DocumentRow>;
      };
      document_extractions: {
        Row: DocumentExtraction;
        Insert: Partial<DocumentExtraction> & Pick<DocumentExtraction, 'document_id' | 'user_id' | 'ai_provider'>;
        Update: Partial<DocumentExtraction>;
      };
      bills: {
        Row: Bill;
        Insert: Partial<Bill> & Pick<Bill, 'user_id' | 'amount'>;
        Update: Partial<Bill>;
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & Pick<Payment, 'user_id' | 'bill_id' | 'amount' | 'paid_date'>;
        Update: Partial<Payment>;
      };
      document_matches: {
        Row: DocumentMatch;
        Insert: Partial<DocumentMatch> &
          Pick<DocumentMatch, 'user_id' | 'bill_id' | 'document_id' | 'confidence'>;
        Update: Partial<DocumentMatch>;
      };
      notifications: {
        Row: AppNotification;
        Insert: Partial<AppNotification> &
          Pick<AppNotification, 'user_id' | 'bill_id' | 'type' | 'scheduled_for'>;
        Update: Partial<AppNotification>;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Partial<UserSettings> & Pick<UserSettings, 'user_id'>;
        Update: Partial<UserSettings>;
      };
    };
  };
}

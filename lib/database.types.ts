export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ReportType = '7_day' | '30_day';
export type ReportDeliveryStatus = 'not_started' | 'pending' | 'processing' | 'generated' | 'failed' | 'delivered';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
export type PaymentEnvironment = 'sandbox' | 'production';
export type PaymentCurrency = 'AUD' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'NZD' | 'CHF' | 'SGD' | 'HKD' | 'JPY' | 'THB';
export type WebhookProcessingStatus = 'pending' | 'processing' | 'processed' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
          last_active_at: string;
          check_in_count: number;
          purchase_status: string;
          is_admin: boolean;
          report_reminder_last_shown_on: string | null;
          consent_given_at: string | null;
          marketing_consent: boolean;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          created_at?: string;
          last_active_at?: string;
          check_in_count?: number;
          purchase_status?: string;
          is_admin?: boolean;
          report_reminder_last_shown_on?: string | null;
          consent_given_at?: string | null;
          marketing_consent?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      checkins: {
        Row: {
          id: string;
          user_id: string;
          email: string | null;
          mood: string;
          feeling: string;
          target_mood: string | null;
          action_title: string | null;
          action_desc: string | null;
          saved_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email?: string | null;
          mood: string;
          feeling: string;
          target_mood?: string | null;
          action_title?: string | null;
          action_desc?: string | null;
          saved_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['checkins']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          report_type: ReportType;
          period_start: string;
          period_end: string;
          saved_days: number;
          entry_count: number;
          report_data: Json;
          delivery_status: ReportDeliveryStatus;
          email_status: 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
          email_attempts: number;
          email_next_attempt_at: string;
          email_claimed_at: string | null;
          email_delivery_key: string | null;
          email_last_error: string | null;
          download_completed_at: string | null;
          email_sent_at: string | null;
          email_delivered_at: string | null;
          delivered_at: string | null;
          email_message_id: string | null;
          delivery_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          report_type: ReportType;
          period_start: string;
          period_end: string;
          saved_days: number;
          entry_count: number;
          report_data?: Json;
          delivery_status?: ReportDeliveryStatus;
          email_status?: 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
          email_attempts?: number;
          email_next_attempt_at?: string;
          email_claimed_at?: string | null;
          email_delivery_key?: string | null;
          email_last_error?: string | null;
          download_completed_at?: string | null;
          email_sent_at?: string | null;
          email_delivered_at?: string | null;
          delivered_at?: string | null;
          email_message_id?: string | null;
          delivery_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
      purchases: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          product: string;
          amount_usd: number | null;
          stripe_payment_id: string | null;
          pdf_generated: boolean;
          pdf_emailed: boolean;
          pdf_url: string | null;
          status: string;
          created_at: string;
          report_id: string | null;
          order_number: string;
          report_type: ReportType;
          product_name: string;
          amount_minor: number | null;
          currency: PaymentCurrency | null;
          currency_decimals: number | null;
          payment_provider: 'airwallex' | null;
          payment_environment: PaymentEnvironment | null;
          airwallex_payment_intent_id: string | null;
          airwallex_request_id: string | null;
          payment_status: PaymentStatus;
          paid_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          product: string;
          amount_usd?: number | null;
          stripe_payment_id?: string | null;
          pdf_generated?: boolean;
          pdf_emailed?: boolean;
          pdf_url?: string | null;
          status?: string;
          created_at?: string;
          report_id?: string | null;
          order_number: string;
          report_type: ReportType;
          product_name: string;
          amount_minor?: number | null;
          currency?: PaymentCurrency | null;
          currency_decimals?: number | null;
          payment_provider?: 'airwallex' | null;
          payment_environment?: PaymentEnvironment | null;
          airwallex_payment_intent_id?: string | null;
          airwallex_request_id?: string | null;
          payment_status?: PaymentStatus;
          paid_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>;
      };
      payment_webhook_events: {
        Row: {
          event_id: string;
          event_type: string;
          airwallex_payment_intent_id: string | null;
          processing_status: WebhookProcessingStatus;
          received_at: string;
          processed_at: string | null;
          attempts: number;
          last_error: string | null;
        };
        Insert: {
          event_id: string;
          event_type: string;
          airwallex_payment_intent_id?: string | null;
          processing_status?: WebhookProcessingStatus;
          received_at?: string;
          processed_at?: string | null;
          attempts?: number;
          last_error?: string | null;
        };
        Update: Partial<Database['public']['Tables']['payment_webhook_events']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_mood_lift_progress: {
        Args: { p_user_id: string; p_saved_at: string };
        Returns: Json;
      };
      save_mood_lift_atomic: {
        Args: {
          p_user_id: string;
          p_email: string;
          p_mood: string;
          p_feeling: string;
          p_target_mood: string;
          p_action_title: string;
          p_action_desc: string;
          p_saved_at: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

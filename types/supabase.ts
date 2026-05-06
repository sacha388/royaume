export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      hearts: {
        Row: {
          created_at: string;
          id: string;
          sender_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          sender_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            columns: ["sender_id"];
            foreignKeyName: "hearts_sender_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "users";
          },
        ];
      };
      couple_messages: {
        Row: {
          body: string;
          created_at: string;
          from_profile: string;
          id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          from_profile: string;
          id?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          from_profile?: string;
          id?: string;
        };
        Relationships: [];
      };
      heart_acknowledgements: {
        Row: {
          acknowledged_at: string;
          message_id: string;
          profile: string;
        };
        Insert: {
          acknowledged_at?: string;
          message_id: string;
          profile: string;
        };
        Update: {
          acknowledged_at?: string;
          message_id?: string;
          profile?: string;
        };
        Relationships: [
          {
            columns: ["message_id"];
            foreignKeyName: "heart_acknowledgements_message_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "couple_messages";
          },
        ];
      };
      constellation_stars: {
        Row: {
          body: string;
          created_at: string;
          created_by_profile: string | null;
          id: string;
          size: number;
          x: number;
          y: number;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by_profile?: string | null;
          id?: string;
          size: number;
          x: number;
          y: number;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by_profile?: string | null;
          id?: string;
          size?: number;
          x?: number;
          y?: number;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          created_at: string;
          id: string;
          image_data_url: string;
          profile: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_data_url: string;
          profile: string;
          title: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_data_url?: string;
          profile?: string;
          title?: string;
        };
        Relationships: [];
      };
      web_push_subscriptions: {
        Row: {
          auth: string;
          endpoint: string;
          id: string;
          p256dh: string;
          profile: string;
          updated_at: string;
        };
        Insert: {
          auth: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          profile: string;
          updated_at?: string;
        };
        Update: {
          auth?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          profile?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

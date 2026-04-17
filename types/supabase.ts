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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

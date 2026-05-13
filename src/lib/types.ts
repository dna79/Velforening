export type Database = {
  public: {
    Tables: {
      blocked_times: {
        Row: BlockedTime;
        Insert: Omit<BlockedTime, "id" | "created_at"> & {
          created_at?: string | null;
          id?: string;
        };
        Update: Partial<BlockedTime>;
        Relationships: [];
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "created_at" | "cancelled_at"> & {
          cancelled_at?: string | null;
          created_at?: string | null;
          id?: string;
        };
        Update: Partial<Booking>;
        Relationships: [
          {
            foreignKeyName: "bookings_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      resources: {
        Row: Resource;
        Insert: Omit<Resource, "id" | "created_at"> & {
          created_at?: string | null;
          id?: string;
        };
        Update: Partial<Resource>;
        Relationships: [];
      };
      booking_types: {
        Row: BookingType;
        Insert: Omit<BookingType, "id" | "created_at"> & {
          created_at?: string | null;
          id?: string;
        };
        Update: Partial<BookingType>;
        Relationships: [];
      };
      blocked_periods: {
        Row: BlockedPeriod;
        Insert: Omit<BlockedPeriod, "id" | "created_at"> & {
          created_at?: string | null;
          id?: string;
        };
        Update: Partial<BlockedPeriod>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cancel_booking: {
        Args: {
          p_booking_id: string;
          p_device_token: string;
        };
        Returns: void;
      };
      cancel_own_booking: {
        Args: {
          p_booking_id: string;
          p_device_token: string;
        };
        Returns: void;
      };
      create_blocked_time: {
        Args: {
          p_end_time: string;
          p_reason: string;
          p_resource_id: string;
          p_start_time: string;
        };
        Returns: void;
      };
      delete_blocked_time: {
        Args: {
          p_blocked_time_id: string;
        };
        Returns: void;
      };
      update_booking_request: {
        Args: {
          p_admin_comment: string;
          p_booking_id: string;
          p_status: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Resource = {
  id: string;
  created_at: string | null;
  name: string;
  slug: string;
  opens_at: string;
  closes_at: string;
  booking_interval_minutes: number;
  requires_approval?: boolean;
  description?: string | null;
};

export type Booking = {
  id: string;
  created_at: string | null;
  cancelled_at: string | null;
  resource_id: string;
  start_time: string;
  end_time: string;
  guest_name: string;
  guest_phone: string;
  admin_comment?: string | null;
  guest_email?: string | null;
  purpose?: string | null;
  booking_type_id?: string | null;
  device_token: string;
  status: string;
};

export type BlockedTime = {
  id: string;
  created_at: string | null;
  resource_id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};

export type BookingType = {
  id: string;
  created_at: string | null;
  resource_id: string;
  name: string;
  slug: string;
  start_time: string;
  end_time: string;
  sort_order: number;
};

export type BlockedPeriod = {
  id: string;
  created_at: string | null;
  resource_id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};

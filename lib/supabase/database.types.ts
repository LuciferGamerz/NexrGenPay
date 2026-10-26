export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "USER" | "ADMIN";
export type DepositNetwork = "BEP20" | "ERC20" | "TRC20";
export type TransactionType = "DEPOSIT" | "SELL";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

export type TransactionRow = {
  id: string;
  user_id: string;
  reviewed_by: string | null;
  type: TransactionType;
  network: DepositNetwork | null;
  amount: string;
  tx_hash: string | null;
  status: TransactionStatus;
  from_address: string | null;
  to_address: string | null;
  required_confirmations: number | null;
  actual_confirmations: number | null;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          usdt_balance: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          usdt_balance?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          role?: UserRole;
          usdt_balance?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: TransactionRow;
        Insert: {
          user_id: string;
          reviewed_by?: string | null;
          type: TransactionType;
          network?: DepositNetwork | null;
          amount: string;
          tx_hash?: string | null;
          status?: TransactionStatus;
          from_address?: string | null;
          to_address?: string | null;
          required_confirmations?: number | null;
          actual_confirmations?: number | null;
          admin_note?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<Omit<TransactionRow, "id" | "user_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      deposit_wallets: {
        Row: {
          address: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          address: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          address?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      request_sell: {
        Args: { p_amount: string };
        Returns: TransactionRow;
      };
      process_deposit_claim: {
        Args: {
          p_user_id: string;
          p_network: DepositNetwork;
          p_tx_hash: string;
          p_amount: string;
          p_status: TransactionStatus;
          p_from_address: string | null;
          p_to_address: string;
          p_actual_confirmations: number;
          p_required_confirmations: number;
          p_admin_note: string | null;
        };
        Returns: { transaction: TransactionRow; credited: boolean };
      };
      list_pending_deposits: {
        Args: Record<PropertyKey, never>;
        Returns: TransactionRow[];
      };
      review_sell_request: {
        Args: {
          p_transaction_id: string;
          p_admin_id: string;
          p_decision: "COMPLETE" | "FAIL";
          p_note: string | null;
        };
        Returns: TransactionRow;
      };
      set_user_admin: {
        Args: { p_email: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      create_deposit_wallet_challenge: {
        Args: {
          p_user_id: string;
          p_challenge_id: string;
          p_address: string;
          p_message: string;
          p_expires_at: string;
        };
        Returns: boolean;
      };
      get_deposit_wallet_challenge: {
        Args: {
          p_user_id: string;
          p_challenge_id: string;
          p_address: string;
        };
        Returns: string | null;
      };
      complete_deposit_wallet_link: {
        Args: {
          p_user_id: string;
          p_challenge_id: string;
          p_address: string;
          p_start_block: number;
        };
        Returns: boolean;
      };
      list_deposit_wallets: {
        Args: Record<PropertyKey, never>;
        Returns: { address: string; user_id: string }[];
      };
      claim_deposit_scanner: {
        Args: {
          p_network: DepositNetwork;
          p_initial_block: number;
          p_lock_id: string;
          p_lease_seconds: number;
        };
        Returns: number | null;
      };
      complete_deposit_scanner: {
        Args: {
          p_network: DepositNetwork;
          p_lock_id: string;
          p_last_scanned_block: number;
        };
        Returns: boolean;
      };
      release_deposit_scanner: {
        Args: {
          p_network: DepositNetwork;
          p_lock_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      deposit_network: DepositNetwork;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

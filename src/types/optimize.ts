export interface OptCandidate {
  id: string;
  label: string;
  description: string;
  current_state: string;
  is_recommended: boolean;
}

export interface AppliedItem {
  id: string;
  before: string;
  after: string;
}

export interface FailedItem {
  id: string;
  reason: string;
}

export interface ApplyResult {
  applied: AppliedItem[];
  failed: FailedItem[];
  session_id: string;
}

export interface RevertResult {
  reverted: string[];
  failed: FailedItem[];
}

export interface OptSession {
  id: string;
  timestamp: number;
  applied: AppliedItem[];
  failed: FailedItem[];
}

export interface NexusSettings {
  protected_processes: string[];
  dns_choice: string;
  polling_interval_secs: number;
}

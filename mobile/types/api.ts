/**
 * Mirrors backend/app/schemas/*.py. Keep in sync with the API — these are the shapes
 * every screen renders from, never a looser `any`.
 */

export type SourceType = "text" | "image" | "camera" | "voice" | "pdf" | "document" | "audio";
export type Importance = "low" | "normal" | "high";

export interface UserOut {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  plan: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: UserOut;
  tokens: TokenPair;
}

export interface ExtractedPerson {
  name: string;
  context: string | null;
}

export interface ExtractedAmount {
  person: string | null;
  amount: number;
  currency: string;
  transaction_type: "lent" | "borrowed" | "gave" | "received" | "spent" | "other";
  notes: string | null;
}

export interface ExtractedDate {
  label: string;
  date: string | null;
  is_uncertain: boolean;
}

export interface AIProcessingResult {
  summary: string;
  suggested_category: string;
  suggested_tags: string[];
  people: ExtractedPerson[];
  amounts: ExtractedAmount[];
  dates: ExtractedDate[];
  is_financial: boolean;
  needs_confirmation: boolean;
  uncertainty_notes: string[];
  provider: string;
}

export interface ProcessMemoryResponse {
  draft_id: string;
  result: AIProcessingResult;
  original_content: string;
}

export interface MemoryOut {
  id: string;
  source_type: SourceType;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  tags: string[];
  people: ExtractedPerson[];
  amounts: ExtractedAmount[];
  dates: ExtractedDate[];
  is_financial: boolean;
  location: string | null;
  importance: Importance;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  attachment_ids: string[];
  ai_provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryListResponse {
  items: MemoryOut[];
  total: number;
  page: number;
  page_size: number;
}

export interface CategoryOut {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  is_sensitive: boolean;
  memory_count: number;
  created_at: string;
}

export interface SearchSourceCard {
  memory_id: string;
  title: string;
  snippet: string;
  category: string;
  score: number;
  created_at: string;
}

export interface SearchResponse {
  answer: string;
  grounded: boolean;
  sources: SearchSourceCard[];
  provider: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  content_type: string;
  url: string;
  size_bytes: number;
}

export interface ApiErrorBody {
  detail: string | { msg: string; loc: (string | number)[] }[];
}

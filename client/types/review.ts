export type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: {
    full_name: string;
    company_name?: string;
    avatar_url?: string;
  };
};
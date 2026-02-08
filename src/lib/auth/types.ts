export interface User {
  id?: string;
  email: string;
  role?: "admin" | "user";
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

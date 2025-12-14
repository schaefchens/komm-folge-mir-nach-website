// API utilities for PrayerModal

const API_BASE = '/api';

export interface User {
  id: string;
  username: string;
  display_name: string;
  color: string;
  avatar: string;
  verified: boolean;
  notifications?: boolean;
}

export interface Prayer {
  id: string;
  name: string;
  text: string;
  createdAt: string;
  reactions: Reaction[];
  userColor?: string;
  userAvatar?: string;
  verified?: boolean;
  creatorUsername?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  comments: IndividualReaction[];
  userReactions: string[];
}

export interface IndividualReaction {
  emoji: string;
  text: string;
  name: string;
  color?: string;
  creatorUsername: string;
}

export interface ScheduledCall {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  creator_name: string;
  is_clickable: boolean;
  countdown: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  session_token: string;
  requires_verification?: boolean;
  message: string;
}

class ApiClient {
  private sessionToken: string | null = null;

  setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (token) {
      localStorage.setItem('prayer_session_token', token);
    } else {
      localStorage.removeItem('prayer_session_token');
    }
  }

  getSessionToken(): string | null {
    if (!this.sessionToken) {
      this.sessionToken = localStorage.getItem('prayer_session_token');
    }
    return this.sessionToken;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Handle query parameters in endpoint (e.g., "/prayers?filter=all")
    let url: string;
    if (endpoint.includes('?')) {
      // Split endpoint and query parameters
      const [path, queryString] = endpoint.split('?', 2);
      const pathWithExtension = path.includes('.') ? path : `${path}.php`;
      url = `${API_BASE}${pathWithExtension}?${queryString}`;
    } else {
      // No query parameters
      const pathWithExtension = endpoint.includes('.') ? endpoint : `${endpoint}.php`;
      url = `${API_BASE}${pathWithExtension}`;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getSessionToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Authentication
  async register(userData: {
    username: string;
    name: string;
    email?: string;
    phone?: string;
    password: string;
    color: string;
    avatar: string;
    notifications: boolean;
  }): Promise<AuthResponse> {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'register', ...userData }),
    });
  }

  async login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', ...credentials }),
    });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const result = await this.request('/auth', { method: 'DELETE' });
    this.setSessionToken(null);
    return result;
  }

  // Prayers
  async getPrayers(params: {
    filter?: 'all' | 'own' | 'unanswered' | 'unseen' | 'seen';
    hashtag?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ prayers: Prayer[]; has_more: boolean }> {
    const searchParams = new URLSearchParams();
    if (params.filter) searchParams.set('filter', params.filter);
    if (params.hashtag) searchParams.set('hashtag', params.hashtag);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());

    return this.request(`/prayers?${searchParams.toString()}`);
  }

  async createPrayer(text: string): Promise<{ success: boolean; prayer: Prayer; message: string }> {
    return this.request('/prayers', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Reactions
  async addReaction(prayerId: string, emoji: string, text?: string): Promise<{
    success: boolean;
    reactions: Reaction[];
    message: string;
  }> {
    return this.request('/reactions', {
      method: 'POST',
      body: JSON.stringify({ prayer_id: prayerId, emoji, text }),
    });
  }

  async removeReaction(prayerId: string, emoji: string): Promise<{
    success: boolean;
    reactions: Reaction[];
    message: string;
  }> {
    return this.request(`/reactions?prayer_id=${prayerId}&emoji=${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
    });
  }

  async removeComment(prayerId: string, emoji: string, commentIndex: number): Promise<{
    success: boolean;
    reactions: Reaction[];
    message: string;
  }> {
    return this.request(`/reactions?prayer_id=${prayerId}&emoji=${encodeURIComponent(emoji)}&comment_index=${commentIndex}`, {
      method: 'DELETE',
    });
  }

  // Scheduled calls
  async getScheduledCall(): Promise<{ scheduled_call: ScheduledCall | null }> {
    return this.request('/scheduled-calls');
  }

  // Verification
  async sendVerification(): Promise<{ success: boolean; message: string }> {
    return this.request('/verify', {
      method: 'POST',
      body: JSON.stringify({ action: 'send_verification' }),
    });
  }

  async verifyCode(token: string): Promise<{ success: boolean; message: string }> {
    return this.request('/verify', {
      method: 'POST',
      body: JSON.stringify({ action: 'verify_code', token }),
    });
  }
}

export const apiClient = new ApiClient();
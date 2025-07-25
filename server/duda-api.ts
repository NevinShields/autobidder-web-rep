interface DudaConfig {
  apiKey: string;
  password: string;
  baseUrl: string;
}

interface DudaWebsiteResponse {
  site_name: string;
  account_name: string;
  site_domain: string;
  preview_url: string;
  last_published?: string;
  created_date: string;
  status: 'active' | 'draft' | 'published';
  template_id?: string;
}

interface CreateWebsiteRequest {
  name: string;
  description?: string;
  template_id?: string;
}

interface DudaTemplate {
  template_id: string;
  template_name: string;
  preview_url: string;
  thumbnail_url: string;
  desktop_thumbnail_url: string;
  tablet_thumbnail_url: string;
  mobile_thumbnail_url: string;
  template_properties: {
    can_build_from_url: boolean;
    has_store: boolean;
    has_blog: boolean;
    has_new_features: boolean;
    vertical: string;
    type: string;
    visibility: string;
  };
}

interface DudaAccount {
  account_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  account_type: 'CUSTOMER' | 'STAFF';
}

interface CreateAccountRequest {
  first_name: string;
  last_name: string;
  email: string;
  account_type?: 'CUSTOMER' | 'STAFF';
}

interface DudaPermissions {
  permissions: string[];
}

interface DudaSSOResponse {
  url: string;
}

export class DudaApiService {
  private config: DudaConfig;

  constructor() {
    this.config = {
      apiKey: process.env.DUDA_API_KEY || '',
      password: process.env.DUDA_API_PASSWORD || '',
      baseUrl: 'https://api.duda.co/api'
    };
  }

  private getAuthHeaders() {
    const auth = Buffer.from(`${this.config.apiKey}:${this.config.password}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PriceBuilder-Pro/1.0'
    };
  }

  async createWebsite(data: CreateWebsiteRequest): Promise<DudaWebsiteResponse> {
    const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        template_id: data.template_id || '1027437', // Default Blank Side Bar Template
        lang: 'en'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async getWebsites(): Promise<DudaWebsiteResponse[]> {
    const response = await fetch(`${this.config.baseUrl}/accounts/account-name/sites`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  async getWebsite(siteName: string): Promise<DudaWebsiteResponse> {
    const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${siteName}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async deleteWebsite(siteName: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${siteName}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error: ${response.status} - ${error}`);
    }
  }

  async publishWebsite(siteName: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/publish/${siteName}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error: ${response.status} - ${error}`);
    }
  }

  async getTemplates(): Promise<DudaTemplate[]> {
    const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/templates`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data || [];
  }

  async createAccount(data: CreateAccountRequest): Promise<DudaAccount> {
    const accountName = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response = await fetch(`${this.config.baseUrl}/accounts/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        account_name: accountName,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        account_type: data.account_type || 'CUSTOMER'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error creating account: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async grantSitePermissions(accountName: string, siteName: string): Promise<void> {
    const permissions = [
      'EDIT',
      'PUBLISH', 
      'STATS_TAB',
      'SEO',
      'BLOG',
      'CUSTOM_DOMAIN',
      'REPUBLISH',
      'PUSH_NOTIFICATIONS',
      'INSITE'
    ];

    const response = await fetch(`${this.config.baseUrl}/accounts/${accountName}/sites/${siteName}/permissions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ permissions })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error granting permissions: ${response.status} - ${error}`);
    }
  }

  async generateSSOLink(accountName: string, siteName: string): Promise<DudaSSOResponse> {
    const response = await fetch(`${this.config.baseUrl}/accounts/${accountName}/sites/${siteName}/sso-link`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        target: 'EDITOR'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error generating SSO link: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.password);
  }
}

export const dudaApi = new DudaApiService();
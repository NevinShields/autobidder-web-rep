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
      'X-DUDA-ACCESS-TOKEN': this.config.apiKey
    };
  }

  async createWebsite(data: CreateWebsiteRequest): Promise<DudaWebsiteResponse> {
    const response = await fetch(`${this.config.baseUrl}/sites/multiscreen`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        site_name: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        template_id: data.template_id || 'dm-theme-1001',
        default_domain_prefix: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
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

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.password);
  }
}

export const dudaApi = new DudaApiService();
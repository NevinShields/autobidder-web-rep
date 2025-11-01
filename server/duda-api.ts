interface DudaConfig {
  apiKey: string;
  password: string;
  baseUrl: string;
}

interface DudaWebsiteResponse {
  site_name: string;
  account_name: string;
  site_default_domain: string;
  preview_site_url: string;
  edit_site_url: string;
  creation_date: string;
  modification_date: string;
  publish_status: string;
  template_id?: number;
  canonical_url?: string;
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
    try {
      console.log('Creating website with Duda API...');
      const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          template_id: data.template_id || '1027437', // Default Blank Side Bar Template
          lang: 'en'
        })
      });

      console.log(`Duda create website response: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.log(`Duda create website error: ${error}`);
        throw new Error(`Duda API error: ${response.status} - ${error}`);
      }

      const responseText = await response.text();
      console.log(`Duda create website response text: "${responseText}"`);
      
      if (!responseText.trim()) {
        throw new Error('Duda API returned empty response for website creation');
      }

      try {
        const parsed = JSON.parse(responseText);
        console.log('Successfully parsed website creation response JSON');
        return parsed;
      } catch (parseError) {
        console.log('JSON parse failed for website creation response');
        throw new Error(`Failed to parse Duda API response: ${responseText}`);
      }
    } catch (error) {
      console.error('Full error in createWebsite:', error);
      throw error;
    }
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
    const accountName = data.email; // Use email as account_name as Duda expects
    
    try {
      console.log(`👤 Creating Duda account for: ${accountName}`);
      const requestBody = {
        account_name: accountName,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        account_type: data.account_type || 'CUSTOMER'
      };
      console.log(`👤 Request body:`, JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${this.config.baseUrl}/accounts/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log(`👤 Duda create account response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda create account error (${response.status}):`, error);
        throw new Error(`Duda API error creating account: ${response.status} - ${error}`);
      }

      // Handle empty response (some Duda API endpoints return empty on success)
      const responseText = await response.text();
      console.log(`👤 Duda create account raw response:`, responseText);
      
      if (!responseText.trim()) {
        console.log('👤 Empty response, returning constructed account object');
        // Return account info based on request since API returned empty success response
        return {
          account_name: accountName,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          account_type: data.account_type || 'CUSTOMER'
        };
      }

      try {
        const parsed = JSON.parse(responseText);
        console.log('✅ Successfully parsed account creation JSON:', JSON.stringify(parsed, null, 2));
        return parsed;
      } catch (parseError) {
        console.log('⚠️ JSON parse failed, returning constructed account object');
        // If JSON parsing fails, return account info from request
        return {
          account_name: accountName,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          account_type: data.account_type || 'CUSTOMER'
        };
      }
    } catch (error) {
      console.error('❌ Full error in createAccount:', error);
      // If anything fails, skip account creation and return a mock account
      console.log('⚠️ Returning fallback account object due to error');
      return {
        account_name: accountName,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        account_type: data.account_type || 'CUSTOMER'
      };
    }
  }

  async grantSitePermissions(accountName: string, siteName: string): Promise<void> {
    const permissions = [
      'STATS_TAB',
      'EDIT',
      'ADD_FLEX',
      'E_COMMERCE',
      'PUBLISH',
      'REPUBLISH',
      'DEV_MODE',
      'INSITE',
      'SEO',
      'BACKUPS',
      'CUSTOM_DOMAIN',
      'RESET',
      'BLOG',
      'PUSH_NOTIFICATIONS',
      'LIMITED_EDITING',
      'SITE_COMMENTS',
      'CONTENT_LIBRARY',
      'EDIT_CONNECTED_DATA',
      'MANAGE_CONNECTED_DATA',
      'USE_APP',
      'CLIENT_MANAGE_FREE_APPS',
      'AI_ASSISTANT',
      'MANAGE_DOMAIN',
      'CONTENT_LIBRARY_EXTERNAL_DATA_SYNC',
      'SEO_OVERVIEW',
      'BOOKING_ADMIN'
    ];

    const response = await fetch(`${this.config.baseUrl}/accounts/${accountName}/sites/${siteName}/permissions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ permissions })
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`Duda API permissions warning: ${response.status} - ${error}`);
      // Don't throw error for permissions - it's not critical for basic functionality
    }
  }

  async createWelcomeLink(accountName: string): Promise<string> {
    try {
      console.log(`🔗 Creating welcome link for account: ${accountName}`);
      console.log(`🔗 Endpoint: ${this.config.baseUrl}/accounts/${accountName}/welcome`);
      
      const response = await fetch(`${this.config.baseUrl}/accounts/${accountName}/welcome`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      console.log(`🔗 Duda create welcome link response status: ${response.status}`);
      console.log(`🔗 Response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries())));

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda create welcome link error (${response.status}):`, error);
        throw new Error(`Duda API error creating welcome link: ${response.status} - ${error}`);
      }

      const responseText = await response.text();
      console.log(`🔗 Duda welcome link raw response text:`, responseText);
      console.log(`🔗 Response text length: ${responseText.length} characters`);
      
      // The response might be JSON with a URL or just the URL directly
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log(`🔗 Parsed JSON response:`, JSON.stringify(jsonResponse, null, 2));
        const welcomeLink = jsonResponse.welcome_url || jsonResponse.url || jsonResponse.link || responseText;
        console.log(`✅ Welcome link extracted successfully:`, welcomeLink);
        return welcomeLink;
      } catch (parseError) {
        // If not JSON, assume the response is the URL directly
        const welcomeLink = responseText.trim();
        console.log(`✅ Welcome link (direct text response):`, welcomeLink);
        return welcomeLink;
      }
    } catch (error) {
      console.error('❌ Full error in createWelcomeLink:', error);
      throw error;
    }
  }

  async generateSSOActivationLink(accountName: string, siteName: string): Promise<string> {
    // Use the correct Duda SSO endpoint format with SWITCH_TEMPLATE target for template selection
    const ssoUrl = `${this.config.baseUrl}/accounts/sso/${accountName}/link?target=SWITCH_TEMPLATE&site_name=${siteName}`;
    
    const response = await fetch(ssoUrl, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Duda SSO link generation failed: ${response.status} - ${error}`);
      throw new Error(`Duda API error generating SSO activation link: ${response.status} - ${error}`);
    }

    const responseText = await response.text();
    
    // The response might be JSON with a URL or just the URL directly
    try {
      const jsonResponse = JSON.parse(responseText);
      return jsonResponse.url || jsonResponse.sso_link || responseText;
    } catch {
      // If not JSON, assume the response is the URL directly
      return responseText.trim();
    }
  }

  async generateSSOEditorLink(accountName: string, siteName: string): Promise<string> {
    // Generate SSO link that goes directly to the site editor (not template selection)
    const ssoUrl = `${this.config.baseUrl}/accounts/sso/${accountName}/link?site_name=${siteName}`;
    
    const response = await fetch(ssoUrl, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Duda SSO editor link generation failed: ${response.status} - ${error}`);
      throw new Error(`Duda API error generating SSO editor link: ${response.status} - ${error}`);
    }

    const responseText = await response.text();
    
    // The response might be JSON with a URL or just the URL directly
    try {
      const jsonResponse = JSON.parse(responseText);
      return jsonResponse.url || jsonResponse.sso_link || responseText;
    } catch {
      // If not JSON, assume the response is the URL directly
      return responseText.trim();
    }
  }

  async resetAccountPassword(accountName: string): Promise<void> {
    try {
      console.log(`Resetting password for account: ${accountName}`);
      
      const response = await fetch(`${this.config.baseUrl}/accounts/reset-password/${accountName}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      console.log(`Duda reset password response: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.log(`Duda reset password error: ${error}`);
        throw new Error(`Duda API error resetting password: ${response.status} - ${error}`);
      }

      console.log('Password reset initiated successfully');
    } catch (error) {
      console.error('Full error in resetAccountPassword:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.password);
  }
}

export const dudaApi = new DudaApiService();
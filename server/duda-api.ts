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

interface DudaWelcomeLinkResponse {
  welcome_url: string;
  expiration?: number;
}

interface DudaFormField {
  field_label: string;
  field_value: string;
  field_type: string;
  field_key?: string;
  field_id?: string;
}

interface DudaFormSubmission {
  data: {
    utm_campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_term?: string;
    utm_content?: string;
    additionalParams?: Record<string, string>;
    fieldsData: DudaFormField[];
  };
  resource_data: {
    site_name: string;
    external_id?: string;
  };
  event_type: string;
  event_timestamp: number;
}

// Blog API Types
interface DudaBlogPostRequest {
  title: string;
  content: string; // HTML content
  slug?: string;
  excerpt?: string;
  featured_image?: string;
  author?: {
    name: string;
    email?: string;
  };
  categories?: string[];
  tags?: string[];
  status?: 'draft' | 'published';
  seo?: {
    title?: string;
    description?: string;
  };
}

interface DudaBlogPostResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  url?: string;
  content?: string;
  excerpt?: string;
  featured_image?: string;
  author?: {
    name: string;
    email?: string;
  };
  categories?: string[];
  tags?: string[];
  seo?: {
    title?: string;
    description?: string;
  };
  created_at?: string;
  updated_at?: string;
  published_at?: string;
}

interface DudaBlogPostListResponse {
  results: DudaBlogPostResponse[];
  total_responses: number;
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

  async getWebsites(accountName: string): Promise<DudaWebsiteResponse[]> {
    const response = await fetch(`${this.config.baseUrl}/accounts/${encodeURIComponent(accountName)}/sites`, {
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
    const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${encodeURIComponent(siteName)}`, {
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
    const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${encodeURIComponent(siteName)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Duda API error: ${response.status} - ${error}`);
    }
  }

  async publishWebsite(siteName: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/publish/${encodeURIComponent(siteName)}`, {
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
      const errorLower = error.toLowerCase();

      // Handle account already exists - can be 409 Conflict or 400 Bad Request with specific message
      // This is recoverable - the account exists in Duda, so we can still generate welcome links
      const accountExistsPatterns = [
        'already exists',
        'alreadyexist',
        'resourcealreadyexist',
        'account_name already taken',
        'duplicate',
        'account exists'
      ];
      const isAccountExistsError = response.status === 409 ||
        accountExistsPatterns.some(pattern => errorLower.includes(pattern));

      if (isAccountExistsError) {
        console.log(`👤 Account already exists for ${accountName}, continuing with existing account`);
        return {
          account_name: accountName,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          account_type: data.account_type || 'CUSTOMER'
        };
      }

      console.error(`❌ Duda create account error (${response.status}):`, error);
      throw new Error(`Duda API error creating account: ${response.status} - ${error}`);
    }

    // Handle empty response (some Duda API endpoints return empty on success)
    const responseText = await response.text();
    console.log(`👤 Duda create account raw response:`, responseText);

    if (!responseText.trim()) {
      console.log('👤 Empty response, returning constructed account object');
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
      'SEO_OVERVIEW'
      // Note: BOOKING_ADMIN requires BOOKING_USER to be granted first
    ];

    const response = await fetch(`${this.config.baseUrl}/accounts/${encodeURIComponent(accountName)}/sites/${encodeURIComponent(siteName)}/permissions`, {
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

  async createWelcomeLink(accountName: string): Promise<DudaWelcomeLinkResponse> {
    console.log(`🔗 Creating welcome link for account: ${accountName}`);
    console.log(`🔗 Endpoint: ${this.config.baseUrl}/accounts/${encodeURIComponent(accountName)}/welcome`);

    const response = await fetch(`${this.config.baseUrl}/accounts/${encodeURIComponent(accountName)}/welcome`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    console.log(`🔗 Duda create welcome link response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Duda create welcome link error (${response.status}):`, error);
      throw new Error(`Duda API error creating welcome link: ${response.status} - ${error}`);
    }

    const responseText = await response.text();
    console.log(`🔗 Duda welcome link raw response text:`, responseText);

    // The response might be JSON with a URL or just the URL directly
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log(`🔗 Parsed JSON response:`, JSON.stringify(jsonResponse, null, 2));
      let welcomeLink = jsonResponse.welcome_url || jsonResponse.url || jsonResponse.link || responseText;

      // Decode HTML entities (e.g., &amp; to &)
      welcomeLink = welcomeLink.replace(/&amp;/g, '&');

      console.log(`✅ Welcome link extracted successfully:`, welcomeLink);
      return {
        welcome_url: welcomeLink,
        expiration: jsonResponse.expiration
      };
    } catch (parseError) {
      // If not JSON, assume the response is the URL directly
      let welcomeLink = responseText.trim();

      // Decode HTML entities (e.g., &amp; to &)
      welcomeLink = welcomeLink.replace(/&amp;/g, '&');

      console.log(`✅ Welcome link (direct text response):`, welcomeLink);
      return {
        welcome_url: welcomeLink
      };
    }
  }

  async generateSSOActivationLink(accountName: string, siteName: string): Promise<string> {
    // Use the correct Duda SSO endpoint format with SWITCH_TEMPLATE target for template selection
    const ssoUrl = `${this.config.baseUrl}/accounts/sso/${encodeURIComponent(accountName)}/link?target=SWITCH_TEMPLATE&site_name=${encodeURIComponent(siteName)}`;
    
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
    const ssoUrl = `${this.config.baseUrl}/accounts/sso/${encodeURIComponent(accountName)}/link?site_name=${encodeURIComponent(siteName)}`;
    
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
      
      const response = await fetch(`${this.config.baseUrl}/accounts/reset-password/${encodeURIComponent(accountName)}`, {
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

  async getFormSubmissions(siteName: string): Promise<DudaFormSubmission[]> {
    try {
      console.log(`📋 Fetching form submissions for site: ${siteName}`);

      const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/get-forms/${encodeURIComponent(siteName)}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log(`📋 Duda get form submissions response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda get form submissions error (${response.status}):`, error);
        throw new Error(`Duda API error fetching form submissions: ${response.status} - ${error}`);
      }

      const responseText = await response.text();
      console.log(`📋 Duda form submissions raw response length: ${responseText.length} characters`);

      if (!responseText.trim()) {
        console.log('📋 Empty response, returning empty array');
        return [];
      }

      try {
        const parsed = JSON.parse(responseText);
        console.log(`✅ Successfully parsed form submissions, found ${Array.isArray(parsed) ? parsed.length : 0} submissions`);
        return Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.error('❌ JSON parse failed for form submissions response');
        throw new Error(`Failed to parse Duda form submissions response: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Full error in getFormSubmissions:', error);
      throw error;
    }
  }

  // ==================== Blog API Methods ====================

  async createBlogPost(siteName: string, post: DudaBlogPostRequest): Promise<DudaBlogPostResponse> {
    try {
      console.log(`📝 Creating blog post for site: ${siteName}`);

      const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${encodeURIComponent(siteName)}/blog/posts`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(post)
      });

      console.log(`📝 Duda create blog post response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda create blog post error (${response.status}):`, error);
        throw new Error(`Duda API error creating blog post: ${response.status} - ${error}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Duda API returned empty response for blog post creation');
      }

      try {
        const parsed = JSON.parse(responseText);
        console.log('✅ Successfully created blog post:', parsed.id);
        return parsed;
      } catch (parseError) {
        console.error('❌ JSON parse failed for blog post creation response');
        throw new Error(`Failed to parse Duda blog post response: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Full error in createBlogPost:', error);
      throw error;
    }
  }

  async updateBlogPost(siteName: string, postId: string, updates: Partial<DudaBlogPostRequest>): Promise<DudaBlogPostResponse> {
    try {
      console.log(`📝 Updating blog post ${postId} for site: ${siteName}`);

      const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${encodeURIComponent(siteName)}/blog/posts/${encodeURIComponent(postId)}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      console.log(`📝 Duda update blog post response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda update blog post error (${response.status}):`, error);
        throw new Error(`Duda API error updating blog post: ${response.status} - ${error}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        // Some update endpoints return empty on success
        return { id: postId, title: '', slug: '', status: 'draft' };
      }

      try {
        const parsed = JSON.parse(responseText);
        console.log('✅ Successfully updated blog post:', postId);
        return parsed;
      } catch (parseError) {
        return { id: postId, title: '', slug: '', status: 'draft' };
      }
    } catch (error) {
      console.error('❌ Full error in updateBlogPost:', error);
      throw error;
    }
  }

  async getBlogPost(siteName: string, postId: string): Promise<DudaBlogPostResponse> {
    try {
      console.log(`📝 Getting blog post ${postId} for site: ${siteName}`);

      const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${encodeURIComponent(siteName)}/blog/posts/${encodeURIComponent(postId)}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log(`📝 Duda get blog post response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda get blog post error (${response.status}):`, error);
        throw new Error(`Duda API error getting blog post: ${response.status} - ${error}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Duda API returned empty response for blog post');
      }

      try {
        const parsed = JSON.parse(responseText);
        console.log('✅ Successfully fetched blog post:', postId);
        return parsed;
      } catch (parseError) {
        console.error('❌ JSON parse failed for blog post response');
        throw new Error(`Failed to parse Duda blog post response: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Full error in getBlogPost:', error);
      throw error;
    }
  }

  async listBlogPosts(siteName: string, options?: { offset?: number; limit?: number }): Promise<DudaBlogPostListResponse> {
    try {
      console.log(`📝 Listing blog posts for site: ${siteName}`);

      let url = `${this.config.baseUrl}/sites/multiscreen/${encodeURIComponent(siteName)}/blog/posts`;
      const params = new URLSearchParams();
      if (options?.offset !== undefined) params.append('offset', options.offset.toString());
      if (options?.limit !== undefined) params.append('limit', options.limit.toString());
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log(`📝 Duda list blog posts response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda list blog posts error (${response.status}):`, error);
        throw new Error(`Duda API error listing blog posts: ${response.status} - ${error}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        return { results: [], total_responses: 0 };
      }

      try {
        const parsed = JSON.parse(responseText);
        console.log(`✅ Successfully listed ${parsed.results?.length || 0} blog posts`);
        return parsed;
      } catch (parseError) {
        console.error('❌ JSON parse failed for blog posts list response');
        throw new Error(`Failed to parse Duda blog posts list response: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Full error in listBlogPosts:', error);
      throw error;
    }
  }

  async publishBlogPost(siteName: string, postId: string): Promise<void> {
    try {
      console.log(`📝 Publishing blog post ${postId} for site: ${siteName}`);

      const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${encodeURIComponent(siteName)}/blog/posts/${encodeURIComponent(postId)}/publish`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      console.log(`📝 Duda publish blog post response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda publish blog post error (${response.status}):`, error);
        throw new Error(`Duda API error publishing blog post: ${response.status} - ${error}`);
      }

      console.log('✅ Successfully published blog post:', postId);
    } catch (error) {
      console.error('❌ Full error in publishBlogPost:', error);
      throw error;
    }
  }

  async unpublishBlogPost(siteName: string, postId: string): Promise<void> {
    try {
      console.log(`📝 Unpublishing blog post ${postId} for site: ${siteName}`);

      const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${encodeURIComponent(siteName)}/blog/posts/${encodeURIComponent(postId)}/unpublish`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      console.log(`📝 Duda unpublish blog post response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda unpublish blog post error (${response.status}):`, error);
        throw new Error(`Duda API error unpublishing blog post: ${response.status} - ${error}`);
      }

      console.log('✅ Successfully unpublished blog post:', postId);
    } catch (error) {
      console.error('❌ Full error in unpublishBlogPost:', error);
      throw error;
    }
  }

  async deleteBlogPost(siteName: string, postId: string): Promise<void> {
    try {
      console.log(`📝 Deleting blog post ${postId} for site: ${siteName}`);

      const response = await fetch(`${this.config.baseUrl}/sites/multiscreen/${encodeURIComponent(siteName)}/blog/posts/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      console.log(`📝 Duda delete blog post response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Duda delete blog post error (${response.status}):`, error);
        throw new Error(`Duda API error deleting blog post: ${response.status} - ${error}`);
      }

      console.log('✅ Successfully deleted blog post:', postId);
    } catch (error) {
      console.error('❌ Full error in deleteBlogPost:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.password);
  }
}

export const dudaApi = new DudaApiService();
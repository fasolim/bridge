const axios = require('axios');

class NotionConfig {
  constructor() {
    this.token = process.env.NOTION_TOKEN;
    this.baseUrl = 'https://api.notion.com/v1';
    this.headers = {
      'Authorization': `Bearer ${this.token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    };
  }

  getHeaders() {
    return this.headers;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  getToken() {
    return this.token;
  }

  isConfigured() {
    return !!this.token;
  }

  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('NOTION_TOKEN não configurado');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: this.headers
      });
      
      return {
        success: true,
        user: response.data
      };
    } catch (error) {
      throw new Error(`Erro na conexão com Notion: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new NotionConfig();

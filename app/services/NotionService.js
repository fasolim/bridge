const axios = require('axios');
const notionConfig = require('../config/notion');

class NotionService {
  constructor() {
    this.config = notionConfig;
  }

  /**
   * Extrai texto de propriedades do Notion
   */
  extractTextFromProperty(property) {
    if (!property) return '';
    
    if (property.type === 'title' && property.title) {
      return property.title.map(item => item.plain_text).join('');
    }
    
    if (property.type === 'rich_text' && property.rich_text) {
      return property.rich_text.map(item => item.plain_text).join('');
    }
    
    if (property.type === 'select' && property.select) {
      return property.select.name;
    }
    
    if (property.type === 'status' && property.status) {
      return property.status.name;
    }
    
    if (property.type === 'multi_select' && property.multi_select) {
      return property.multi_select.map(item => item.name).join(', ');
    }
    
    if (property.type === 'number') {
      return property.number;
    }
    
    if (property.type === 'checkbox') {
      return property.checkbox;
    }
    
    if (property.type === 'date' && property.date) {
      return property.date.start;
    }
    
    if (property.type === 'people' && property.people) {
      return property.people.map(person => person.name || person.id).join(', ');
    }
    
    return '';
  }

  /**
   * Busca informações do database
   */
  async fetchDatabaseInfo(databaseId) {
    try {
      const response = await axios.get(
        `${this.config.getBaseUrl()}/databases/${databaseId}`,
        { headers: this.config.getHeaders() }
      );

      const database = response.data;
      
      return {
        id: database.id,
        title: database.title?.map(item => item.plain_text).join('') || 'Sem título',
        description: database.description?.map(item => item.plain_text).join('') || '',
        url: database.url,
        created_time: database.created_time,
        last_edited_time: database.last_edited_time,
        properties: Object.keys(database.properties).map(key => ({
          name: key,
          type: database.properties[key].type,
          description: database.properties[key].description || ''
        }))
      };
    } catch (error) {
      throw new Error(`Erro ao buscar informações do database: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Busca todas as páginas do database
   */
  async fetchAllPages(databaseId) {
    try {
      let allPages = [];
      let hasMore = true;
      let startCursor = undefined;

      while (hasMore) {
        const requestBody = {
          page_size: 100
        };

        if (startCursor) {
          requestBody.start_cursor = startCursor;
        }

        const response = await axios.post(
          `${this.config.getBaseUrl()}/databases/${databaseId}/query`,
          requestBody,
          { headers: this.config.getHeaders() }
        );

        const pages = response.data.results;
        allPages = allPages.concat(pages);
        
        hasMore = response.data.has_more;
        startCursor = response.data.next_cursor;

        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return allPages;
    } catch (error) {
      throw new Error(`Erro ao buscar páginas: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Busca blocos de uma página
   */
  async fetchPageBlocks(pageId) {
    try {
      const response = await axios.get(
        `${this.config.getBaseUrl()}/blocks/${pageId}/children`,
        { headers: this.config.getHeaders() }
      );

      return response.data.results.map(block => ({
        id: block.id,
        type: block.type,
        created_time: block.created_time,
        last_edited_time: block.last_edited_time,
        has_children: block.has_children,
        content: this.extractBlockContent(block)
      }));
    } catch (error) {
      console.log(`⚠️  Não foi possível buscar blocos da página ${pageId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Extrai conteúdo de um bloco
   */
  extractBlockContent(block) {
    const content = {
      type: block.type,
      text: '',
      url: '',
      caption: '',
      language: '',
      code: '',
      formula: ''
    };

    switch (block.type) {
      case 'paragraph':
        if (block.paragraph?.rich_text) {
          content.text = block.paragraph.rich_text.map(item => item.plain_text).join('');
        }
        break;
      
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
        if (block[block.type]?.rich_text) {
          content.text = block[block.type].rich_text.map(item => item.plain_text).join('');
        }
        break;
      
      case 'bulleted_list_item':
      case 'numbered_list_item':
        if (block[block.type]?.rich_text) {
          content.text = block[block.type].rich_text.map(item => item.plain_text).join('');
        }
        break;
      
      case 'code':
        if (block.code?.rich_text) {
          content.code = block.code.rich_text.map(item => item.plain_text).join('');
          content.language = block.code.language;
        }
        break;
      
      case 'image':
      case 'video':
      case 'file':
        if (block[block.type]?.url) {
          content.url = block[block.type].url;
        }
        if (block[block.type]?.caption) {
          content.caption = block[block.type].caption.map(item => item.plain_text).join('');
        }
        break;
    }

    return content;
  }

  /**
   * Lista todos os databases disponíveis
   */
  async listDatabases() {
    try {
      const response = await axios.post(`${this.config.getBaseUrl()}/search`, {
        filter: {
          value: 'database',
          property: 'object'
        }
      }, {
        headers: this.config.getHeaders()
      });
      
      return response.data.results.map(db => ({
        id: db.id,
        title: db.title?.map(item => item.plain_text).join('') || 'Sem título',
        url: db.url
      }));
    } catch (error) {
      throw new Error(`Erro ao listar databases: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new NotionService();

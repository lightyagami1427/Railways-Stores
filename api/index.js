const app = require('../server/index');
const rag = require('../server/rag');

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    console.log('Initializing RAG system in serverless function...');
    try {
      await rag.init();
      
      // Auto-ingest existing documents if any
      const fs = require('fs');
      const path = require('path');
      const docsDir = path.join(__dirname, '../documents');
      if (fs.existsSync(docsDir)) {
        const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.pdf'));
        for (const file of files) {
          await rag.ingestPDF(path.join(docsDir, file));
        }
      }
      
      initialized = true;
      console.log('RAG system initialized.');
    } catch (e) {
      console.error('Failed to initialize RAG:', e);
    }
  }
  
  return app(req, res);
};

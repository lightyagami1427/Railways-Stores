const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { pipeline } = require('@xenova/transformers');
const { IndexFlatL2 } = require('faiss-node');

class RAGSystem {
    constructor() {
        this.index = null;
        this.chunks = [];
        this.embedder = null;
        this.dimension = 384; // Default for many sentence-transformer models
    }

    async init() {
        // Load the embedding model (local)
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        this.index = new IndexFlatL2(this.dimension);
    }

    async ingestPDF(filePath) {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const fileName = path.basename(filePath);
        
        // pdf-parse doesn't give text-per-page easily, 
        // but it gives segments. For better page tracking,
        // we'd ideally use a more advanced parser, but we can simulate
        // or chunk it based on page markers if available.
        // For now, let's treat the entire text and estimate pages
        // or use a more robust approach if possible.
        // Actually, pdf-parse provides 'numpages' but the text is a blob.
        
        const text = data.text;
        const newChunks = this.chunkText(text);
        
        for (let i = 0; i < newChunks.length; i++) {
            const chunk = newChunks[i];
            const embedding = await this.getEmbedding(chunk);
            
            // Estimate page number based on character position
            // (Rough heuristic for demonstration; in prod we'd parse per-page)
            const approxPage = Math.floor((i / newChunks.length) * data.numpages) + 1;
            
            this.index.add(embedding);
            this.chunks.push({
                text: chunk,
                metadata: {
                    source: fileName,
                    page: approxPage
                }
            });
        }
        console.log(`Ingested ${filePath}: ${newChunks.length} chunks added.`);
    }

    chunkText(text, size = 500, overlap = 50) {
        const lines = text.split('\n');
        const chunks = [];
        let currentChunk = "";
        
        for (const line of lines) {
            if (currentChunk.length + line.length > size) {
                chunks.push(currentChunk);
                currentChunk = currentChunk.slice(-overlap) + " " + line;
            } else {
                currentChunk += (currentChunk ? " " : "") + line;
            }
        }
        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }

    async getEmbedding(text) {
        const output = await this.embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    async query(queryText, k = 5) {
        if (!this.index || this.index.ntotal() === 0) {
            console.log("RAG: Index is empty. No context retrieved.");
            return [];
        }
        const queryEmbedding = await this.getEmbedding(queryText);
        
        // Find best k: at least 1, at most this.index.ntotal()
        const actualK = Math.min(k, this.index.ntotal());
        if (actualK <= 0) return [];

        const results = this.index.search(queryEmbedding, actualK);
        return results.labels.map(idx => this.chunks[idx]);
    }
}

module.exports = new RAGSystem();

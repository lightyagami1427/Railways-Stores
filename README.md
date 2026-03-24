# Indian Railways Senior Stores Officer AI

A RAG-based AI assistant for Supply Tender queries.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js
- **AI**: OpenRouter (Mistral/Llama 3)
- **RAG**: @xenova/transformers (local), faiss-node (local)

## Setup
1. `npm install` in root and `client/`.
2. Configure `.env` with `OPENROUTER_API_KEY`.
3. Add PDFs to `documents/`.
4. Run `node server/index.js` and `cd client && npm run dev`.

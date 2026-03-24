require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const rag = require('./rag');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

const PORT = process.env.PORT || 5001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Answering structure requirements
const SYSTEM_PROMPT = `
You are a Senior Stores Officer of Indian Railways with 50 years of experience in Supply Tenders.
Expertise: IRSC Volume I & II, Tender procedures (Open, LTE, PAC), Railway Board circulars.

STRICT ANSWERING RULES:
1. Para Reference (IRSC / Board Letter)
2. Rule (exact meaning from code)
3. Interpretation (practical understanding)
4. Practical Note (field-level guidance)
5. Audit Note (risk / compliance warning)

If no rule is found, say: "No direct rule found in Stores Code".
Always think like an Audit Officer.
`;

// JIT PDF Generation for Dynamic Evidence
async function generateDynamicPDF(text, sourceLink) {
    try {
        const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.addPage([600, 450]);
        
        page.drawText('INDIAN RAILWAYS STORES ADVISORY - DYNAMIC EVIDENCE', { x: 50, y: 400, size: 16, font, color: rgb(0, 0, 0) });
        page.drawText(`Generated on: ${new Date().toLocaleString()}`, { x: 50, y: 380, size: 10, font });
        
        const lines = text.split('\n').slice(0, 15); // Simple wrap simulation
        let y = 340;
        lines.forEach(line => {
            if (y > 100) {
                page.drawText(line.substring(0, 80), { x: 50, y, size: 10, font });
                y -= 15;
            }
        });

        if (sourceLink) {
            page.drawText('SOURCE URL:', { x: 50, y: 70, size: 10, font, color: rgb(0, 0, 0.8) });
            page.drawText(sourceLink.substring(0, 90), { x: 50, y: 55, size: 8, font, color: rgb(0, 0, 0.8) });
        }

        const pdfBytes = await pdfDoc.save();
        const fileName = `Evidence_${Date.now()}.pdf`;
        // Use /tmp for serverless environments (Vercel)
        const isVercel = process.env.VERCEL || process.env.NOW_REGION;
        const storageDir = isVercel ? '/tmp' : path.join(__dirname, '../documents');
        
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
        
        const filePath = path.join(storageDir, fileName);
        fs.writeFileSync(filePath, pdfBytes);
        return fileName;
    } catch (e) {
        console.error('JIT PDF Error:', e);
        return null;
    }
}

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    try {
        // Step 1: Try RAG
        let retrieved = await rag.query(message);
        let context = retrieved.map(c => `[Source: ${c.metadata.source}, Page: ${c.metadata.page}]\n${c.text}`).join('\n\n---\n\n');

        // Step 2: Call OpenRouter
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "deepseek/deepseek-chat",
            messages: [
                { role: "system", content: SYSTEM_PROMPT + "\nIf you mention a specific rule not in context, provide a [SOURCE_URL: ...] if you know it." },
                { role: "system", content: `LOCAL CONTEXT:\n${context || "No local files indexed yet."}` },
                { role: "user", content: message }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const answer = response.data.choices[0].message.content;
        
        // Step 3: Check for Source URL or create JIT Source
        let dynamicSource = null;
        if (retrieved.length > 0) {
            dynamicSource = retrieved[0].metadata;
        } else {
            // Generate a JIT PDF for this answer
            const urlMatch = answer.match(/\[SOURCE_URL:\s*(.*?)\]/);
            const sourceUrl = urlMatch ? urlMatch[1] : "Internal Railway Knowledge Base";
            const fileName = await generateDynamicPDF(answer, sourceUrl);
            if (fileName) {
                dynamicSource = { source: fileName, page: 1, type: 'dynamic', url: sourceUrl };
            }
        }

        res.json({ 
            answer: answer.replace(/\[SOURCE_URL:.*?\]/g, ''), // Clean the URL from text
            source: dynamicSource 
        });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// New endpoint for single-page PDF extraction
app.get('/api/reference/:doc/:page', async (req, res) => {
    const { doc, page } = req.params;
    
    // Check both documents folder and /tmp
    const docPath = path.join(__dirname, '../documents', doc);
    const tmpPath = path.join('/tmp', doc);
    
    let finalPath = fs.existsSync(docPath) ? docPath : (fs.existsSync(tmpPath) ? tmpPath : null);
    
    if (!finalPath) {
        return res.status(404).send('Document not found');
    }

    try {
        const existingPdfBytes = fs.readFileSync(finalPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const newPdf = await PDFDocument.create();
        
        const pageIdx = parseInt(page) - 1;
        if (pageIdx < 0 || pageIdx >= pdfDoc.getPageCount()) {
            return res.status(400).send('Invalid page number');
        }

        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIdx]);
        newPdf.addPage(copiedPage);

        const pdfBytes = await newPdf.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Reference_${doc}_Page_${page}.pdf"`);
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error('PDF Extraction Error:', error);
        res.status(500).send('Error extracting page');
    }
});

app.get('/api/ingest', async (req, res) => {
    const docsDir = path.join(__dirname, '../documents');
    if (!fs.existsSync(docsDir)) {
        return res.status(404).json({ error: 'Documents directory not found' });
    }
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.pdf'));
    
    for (const file of files) {
        await rag.ingestPDF(path.join(docsDir, file));
    }
    
    res.json({ message: `Ingested ${files.length} documents.` });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Only listen if not in a serverless environment
if (!process.env.VERCEL && !process.env.NOW_REGION) {
    app.listen(PORT, async () => {
        console.log(`Server running on port ${PORT}`);
        try {
            await rag.init();
            console.log('RAG system initialized.');
        } catch (e) {
            console.error('Failed to initialize RAG:', e);
        }
    });
}

module.exports = app;

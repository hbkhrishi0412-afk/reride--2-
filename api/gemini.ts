
import { GoogleGenerativeAI, GenerateContentResponse } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This is the main handler for the API route.
// It now uses Vercel's native request/response objects for better compatibility.
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }
        
        if (!req.body) {
            return res.status(400).json({ error: 'Request body is missing.' });
        }

        // The VercelRequest object has a pre-parsed body.
        // We expect the client to send `{ "payload": { ... } }`
        const { payload } = req.body;

        if (!payload) {
            return res.status(400).json({ error: 'Missing payload in request body' });
        }

        // This log is crucial for debugging on Vercel
        console.log(`Gemini API proxy called. GEMINI_API_KEY present: ${!!process.env.GEMINI_API_KEY}`);
        
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY not configured in Vercel environment variables.");
            return res.status(500).json({ error: 'Server configuration error.' });
        }
        
        // Initialize the AI client on the server with the secure API key
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Get the model (default to gemini-1.5-flash if not specified)
        const modelName = payload.model || "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Extract the content and generation config from payload
        const { contents, generationConfig } = payload;
        
        // Make the actual call to the Gemini API
        const result = await model.generateContent({
            contents: contents,
            generationConfig: generationConfig
        });
        
        const response = await result.response;
        const resultText = response.text();

        // Send the result back to the frontend
        return res.status(200).json({ result: resultText });

    } catch (error) {
        console.error("Error in /api/gemini proxy:", error);
        
        // Check if it's a specific Gemini API error if possible, or just a generic one
        const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
        
        // Respond with a more structured error
        return res.status(500).json({ 
            error: 'An error occurred while communicating with the AI service.', 
            details: errorMessage 
        });
    }
}

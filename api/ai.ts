import type { VercelRequest, VercelResponse } from '@vercel/node';

// This file consolidates AI services (Gemini API)
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Always set JSON content type to prevent HTML responses
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Route to appropriate AI service
    if (pathname.includes('/gemini') || pathname.endsWith('/gemini')) {
      return await handleGemini(req, res);
    } else {
      return res.status(404).json({ success: false, reason: 'AI endpoint not found' });
    }

  } catch (error) {
    console.error('AI API Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    return res.status(500).json({ success: false, reason: message, error: message });
  }
}

// Gemini handler - preserves exact functionality from gemini.ts
async function handleGemini(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, reason: 'Method not allowed' });
  }

  try {
    const { payload } = req.body;
    
    if (!payload) {
      return res.status(400).json({ 
        success: false, 
        reason: 'Payload is required' 
      });
    }

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: payload.prompt || JSON.stringify(payload)
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return res.status(200).json({
      success: true,
      response: generatedText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    return res.status(500).json({
      success: false,
      reason: 'Gemini API call failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { getAgent } from './mastra/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Park4Night Agent API is running' });
});

// Main chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        details: 'Field "message" is required and must be a string'
      });
      return;
    }

    // Get agent and generate response
    const agent = getAgent('camperAgent');
    const result = await agent.generate(message);

    // Return response
    res.json({
      response: result.text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Park4Night Agent API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
});

'use strict';

const config = require('./config');
const logger = require('./logger');

/**
 * Transcribe a voice note Buffer to text using Gemini API for free.
 * Returns: { text, language }
 */
async function transcribe(buffer, mimetype) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

  const t0 = Date.now();
  const fetch = (await import('node-fetch')).default;

  // Enhance MIME types for Gemini. MediaRecorder often uses video/webm for audio.
  let safeMime = mimetype || 'audio/ogg'; // fallback
  if (safeMime === 'audio/mpeg') safeMime = 'audio/mp3';
  if (safeMime === 'application/octet-stream') safeMime = 'audio/ogg';

  const payload = {
    contents: [
      {
        parts: [
          { text: "Please carefully transcribe this audio. If the audio is in Marathi or Hindi, automatically translate and transcribe it entirely into perfect English. Do not summarize, just provide the exact English translation of everything that is said." },
          {
            inlineData: {
              mimeType: safeMime,
              data: buffer.toString('base64')
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1
    }
  };

  const { getModelPool } = require('./services/ai/geminiService');
  const pool = getModelPool('gemini-transcription');

  let lastErrorText = null;

  for (let i = 0; i < pool.length; i++) {
    const currentModelId = pool[i];
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModelId}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        lastErrorText = await res.text();
        if (res.status === 404 || res.status === 503) {
          continue; // Skip out to retry
        }
        throw new Error(`Gemini Transcription Failed (${res.status}): ${lastErrorText}`);
      }

      const data = await res.json();
      const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      logger.info(
        { ms: Date.now() - t0, len: transcript.length, model: currentModelId },
        'Gemini transcription done'
      );

      return { text: transcript.trim(), language: 'auto' };
    } catch (e) {
      if (i === pool.length - 1) throw e;
    }
  }

  throw new Error(`Gemini Transcription Failed. Exhausted models. Last err: ${lastErrorText}`);
}

module.exports = { transcribe };

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
          { text: "Please carefully transcribe this audio. Do not summarize. Just provide the exact text of what is said. Support Hindi and English natively." },
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

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini Transcription Failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  logger.info(
    { ms: Date.now() - t0, len: transcript.length },
    'Gemini transcription done'
  );

  return { text: transcript.trim(), language: 'auto' };
}

module.exports = { transcribe };

// api/ai.js — Vercel serverless function using Groq (free)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { system, messages, max_tokens } = req.body

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',  // free, fast, smart
        max_tokens: max_tokens || 1000,
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json(data)

    // Normalize to Anthropic-style response so frontend doesn't change
    return res.status(200).json({
      content: [{ type: 'text', text: data.choices?.[0]?.message?.content || '' }]
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
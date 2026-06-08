import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY no configurada' },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { mode, input, existingCards, count, deckName } = body;

  if (!mode) {
    return NextResponse.json(
      { error: 'Faltan parámetros' },
      { status: 400 }
    );
  }

  const cardCount = Math.min(count || 10, 30);

  if (cardCount < 1) {
  return NextResponse.json(
    { error: 'Cantidad inválida de tarjetas' },
    { status: 400 }
  );
}

  const jsonFormat = (n: number) => `
Responde ÚNICAMENTE con un JSON válido.
Sin markdown.
Sin explicaciones.
Sin texto adicional.

Formato exacto:
[
  {
    "question": "...",
    "answer": "...",
    "tags": ["tag1", "tag2"]
  }
]`;

  let prompt = '';

  // ───────────────── FREE MODE ─────────────────
  if (mode === 'free') {
    prompt = `
Eres experto en crear flashcards para repetición espaciada.

Mazo: "${deckName}"

Contenido:
"""
${input}
"""

Crea ${cardCount} tarjetas de estudio.

Reglas:
- Preguntas claras y directas
- Respuestas concisas pero útiles
- Añade 1-3 tags relevantes
- Si es vocabulario, incluye ejemplos o pronunciación
- Varía el tipo de preguntas
- Una idea importante por tarjeta

${jsonFormat(cardCount)}
`;
  }

  // ───────────────── IMPROVE MODE ─────────────────
  else if (mode === 'improve') {
    const cardsText = (existingCards || [])
      .map(
        (c: any, i: number) =>
          `Tarjeta ${i + 1}
Pregunta: ${c.question}
Respuesta: ${c.answer}`
      )
      .join('\n\n');

    const n = (existingCards || []).length;

    prompt = `
Eres experto en aprendizaje y repetición espaciada.

Mazo: "${deckName}"

Tarjetas actuales:
"""
${cardsText}
"""

Mejora estas ${n} tarjetas.

Reglas:
- Preguntas más claras
- Respuestas enriquecidas
- Mantén el idioma original
- Añade mejores tags
- No cambies el significado

${jsonFormat(n)}
`;
  }

  // ───────────────── MIMIC MODE ─────────────────
  else if (mode === 'mimic') {
    const examples = (existingCards || [])
      .slice(0, 5)
      .map(
        (c: any, i: number) =>
          `Ejemplo ${i + 1}
Pregunta: ${c.question}
Respuesta: ${c.answer}`
      )
      .join('\n\n');

    prompt = `
Eres experto creando flashcards.

Mazo: "${deckName}"

El usuario usa este estilo:
"""
${examples}
"""

Nuevo contenido:
"""
${input}
"""

Crea ${cardCount} tarjetas nuevas siguiendo EXACTAMENTE el mismo estilo.

Reglas:
- Mismo tono
- Mismo formato
- Misma dificultad
- No repetir tarjetas

${jsonFormat(cardCount)}
`;
  }

  try {
    const res = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            'Error generando tarjetas',
        },
        { status: res.status }
      );
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim() || '';

    const clean = text
      .replace(/```json/gi, '')
      .replace(/```/gi, '')
      .trim();

    let cards;

    try {
      cards = JSON.parse(clean);
    } catch {
      const match = clean.match(/\[[\s\S]*\]/);

      if (match) {
        cards = JSON.parse(match[0]);
      } else {
        return NextResponse.json(
          {
            error:
              'La IA no devolvió JSON válido',
          },
          { status: 500 }
        );
      }
    }

    if (!Array.isArray(cards)) {
      return NextResponse.json(
        {
          error: 'Formato inválido',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ cards });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

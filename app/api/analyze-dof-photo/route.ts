import { NextRequest, NextResponse } from "next/server";
import { CHECKLIST } from "../../lib/dofVisionChecklist";

export const runtime = "nodejs";

type ModelDetection = {
  id: string;
  confidence: number;
  evidence: string;
};

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeDetections(value: unknown): ModelDetection[] {
  if (!value || typeof value !== "object") return [];
  const detected = (value as { detected?: unknown }).detected;
  if (!Array.isArray(detected)) return [];

  const validIds = new Set(CHECKLIST.map(item => item.id));
  return detected
    .map(item => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const id = String(raw.id || "");
      if (!validIds.has(id)) return null;
      const confidence = Number(raw.confidence);
      return {
        id,
        confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
        evidence: String(raw.evidence || "").slice(0, 500),
      };
    })
    .filter((item): item is ModelDetection => Boolean(item));
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "Fotoğraf verisi gerekli" }, { status: 400 });
    }

    const apiKey = process.env["OPENAI_API_KEY"]?.trim();
    if (!apiKey) {
      console.error("OPENAI_API_KEY missing at runtime", {
        openaiEnvKeys: Object.keys(process.env).filter(key => key.includes("OPENAI")),
        vercelEnv: process.env["VERCEL_ENV"],
      });
      return NextResponse.json({ error: "OPENAI_API_KEY tanımlı değil" }, { status: 500 });
    }

    const checklistForPrompt = CHECKLIST.map(item => ({
      id: item.id,
      visionCue: item.visionCue,
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env["OPENAI_VISION_MODEL"] || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Sen bir İSG fotoğraf kontrol asistanısın. Yönetmelik, madde numarası veya düzeltici faaliyet üretme. Sadece verilen CHECKLIST içindeki gözlemlenebilir durumların fotoğrafta var olup olmadığını değerlendir. CHECKLIST dışındaki hiçbir id döndürme. Yanıt yalnızca şu JSON formatında olsun: {\"detected\":[{\"id\":\"...\",\"confidence\":0.0,\"evidence\":\"fotoğrafta gördüğün kısa kanıt\"}]}",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "CHECKLIST id + visionCue listesi:\n" +
                  JSON.stringify(checklistForPrompt) +
                  "\nFotoğrafı incele ve sadece fotoğrafta gözlemlenebilir şekilde mevcut olan checklist id'lerini JSON olarak döndür.",
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: payload?.error?.message || "Vision API hatası" }, { status: response.status });
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Modelden geçerli yanıt alınamadı" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonFence(content));
    } catch {
      return NextResponse.json({ error: "Model JSON yanıtı ayrıştırılamadı" }, { status: 502 });
    }

    return NextResponse.json({ detected: normalizeDetections(parsed) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

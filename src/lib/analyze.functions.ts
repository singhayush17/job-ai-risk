import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  jd: z.string().min(20).max(20000),
});

const ResultSchema = z.object({
  percentage: z.number().min(0).max(100),
  verdict: z.string(),
  reasoning: z.string(),
  at_risk_tasks: z.array(z.string()),
  resilient_tasks: z.array(z.string()),
  advice: z.string(),
});

export type AnalysisResult = z.infer<typeof ResultSchema>;

function extractJson(response: string): unknown {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.search(/[\{\[]/);
  const endChar = start !== -1 && cleaned[start] === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(endChar);
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  cleaned = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

export const analyzeJD = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You are a labor-market analyst specializing in AI automation. Given a job description, estimate the probability (0-100) that AI will substantially replace this role within the next 10 years. Be calibrated and specific: routine cognitive/clerical work scores high (70-95), creative/strategic/interpersonal/physical-skilled work scores moderate (30-60), highly relational/leadership/care work scores low (5-30). Respond ONLY with a valid JSON object matching this shape: {\"percentage\": number 0-100, \"verdict\": string (one line), \"reasoning\": string, \"at_risk_tasks\": string[], \"resilient_tasks\": string[], \"advice\": string}. No markdown, no prose outside JSON.",
      prompt: `Job Description:\n\n${data.jd}`,
    });

    const parsed = extractJson(text);
    return ResultSchema.parse(parsed);
  });

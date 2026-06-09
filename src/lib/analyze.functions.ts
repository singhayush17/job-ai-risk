import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
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

export const analyzeJD = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      experimental_output: Output.object({ schema: ResultSchema }),
      system:
        "You are a labor-market analyst specializing in AI automation. Given a job description, estimate the probability (0-100) that AI will substantially replace this role within the next 10 years. Be calibrated and specific: routine cognitive/clerical work scores high (70-95), creative/strategic/interpersonal/physical-skilled work scores moderate (30-60), highly relational/leadership/care work scores low (5-30). Provide a one-line verdict, concise reasoning, lists of at-risk and resilient task categories drawn from the JD, and pragmatic advice to stay relevant.",
      prompt: `Job Description:\n\n${data.jd}`,
    });

    return experimental_output as AnalysisResult;
  });

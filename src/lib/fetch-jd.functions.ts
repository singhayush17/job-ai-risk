import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Firecrawl from "@mendable/firecrawl-js";

const InputSchema = z.object({
  url: z.string().url().max(2000),
});

export const fetchJD = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("Missing FIRECRAWL_API_KEY");

    const firecrawl = new Firecrawl({ apiKey });
    const result = await firecrawl.scrape(data.url, {
      formats: ["markdown"],
      onlyMainContent: true,
    });

    const markdown =
      (result as { markdown?: string }).markdown ??
      (result as { data?: { markdown?: string } }).data?.markdown ??
      "";

    const cleaned = markdown.trim();
    if (cleaned.length < 50) {
      throw new Error("Couldn't extract a job description from that URL.");
    }

    return { jd: cleaned.slice(0, 20000) };
  });

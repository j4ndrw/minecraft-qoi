import { Ollama } from "ollama";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const app = new Hono();

const llm = new Ollama({ host: "http://localhost:11434" });
const model = "llama3";
const systemPrompt =
  "You are an assistant, hosted on a Minecraft server. When a player asks you something Minecraft related, provide them with accurate information so you can help them out. When the player asks you anything else, just answer as you normally would.";

const schema = z.object({
  question: z.string(),
});

app.get("/", zValidator("query", schema), async (c) => {
  const { question } = c.req.valid("query");
  const decodedQuestion = Buffer.from(question, "base64").toString();
  const { response } = await llm.generate({
    stream: false,
    model,
    prompt: decodedQuestion,
    system: systemPrompt,
  });
  return c.text(response);
});

console.log('Listening to port 42068 hehe')
serve({
  fetch: app.fetch,
  port: 42068 // disgusting,
});

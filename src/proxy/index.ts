import { Message, Ollama } from "ollama";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const MAX_MESSAGES = 100;
let messages: Message[] = [];

const pushMessage = (message: Message) => {
  if (messages.length > MAX_MESSAGES) return;
  messages.push(message);
};

const app = new Hono();

const llm = new Ollama({ host: "http://localhost:11434" });
const model = "llama3";
const systemPrompt = (user: string) =>
  `You are a Minecraft expert, responsible with helping players on the server with whatever they need, as well as help them have a good time. For reference, the user interacting with you directly is called '${user}'.`;

const schema = z.object({
  question: z.string(),
  user: z.string(),
});

app.get("/", zValidator("query", schema), async (c) => {
  const { question, user } = c.req.valid("query");
  const decodedQuestion = Buffer.from(question, "base64").toString();

  pushMessage({ role: "user", content: decodedQuestion });
  pushMessage({ role: "system", content: systemPrompt(user) });

  const { message } = await llm.chat({
    stream: false,
    model,
    messages,
  });

  pushMessage(message);
  return c.text(message.content);
});

console.log("Listening to port 42068 hehe");

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;
setInterval(() => (messages = []), FIVE_MINUTES_IN_MS);

serve({
  fetch: app.fetch,
  port: 42068, // disgusting,
});

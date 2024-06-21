import { Message, Ollama } from "ollama";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const MAX_MESSAGES = 100;
let messages: Message[] = [];

const systemPrompts = new Map<string, string>();

const pushMessage = (message: Message) => {
  if (messages.length > MAX_MESSAGES) return;
  messages.push(message);
};

const app = new Hono();

const llm = new Ollama({ host: "http://localhost:11434" });
const model = "llama3";
const systemPrompt = (user: string) =>
  `
You are a Minecraft expert, responsible with helping players on the server
with whatever they need, as well as help them have a good time.

For reference, the user interacting with you directly is called '${user}'.

Try to answer in using 3 paragraphs maximum and make them concise.
`;

const schema = z.object({
  question: z.string(),
  user: z.string(),
});

app.get("/", zValidator("query", schema), async (c) => {
  if (messages.length > MAX_MESSAGES) messages = [];

  const { question, user } = c.req.valid("query");
  const decodedQuestion = Buffer.from(question, "base64").toString();

  if (!systemPrompts.has(user)) systemPrompts.set(user, systemPrompt(user));
  pushMessage({ role: "user", content: decodedQuestion });

  const { message } = await llm.chat({
    model,
    messages: [
      { role: "system", content: systemPrompts.get(user)! },
      ...messages,
    ],
  });

  pushMessage(message);
  return c.text(message.content);
});

console.log("Listening to port 42068 hehe");

serve({
  fetch: app.fetch,
  port: 42068, // disgusting,
});

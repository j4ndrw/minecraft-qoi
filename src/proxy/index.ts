import { Message, Ollama } from "ollama";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const DEFAULT_MODEL = "llama3";
const MAX_MESSAGES = 100;

let model = DEFAULT_MODEL;
let messages: Message[] = [];

const systemPrompts = new Map<string, string>();

const pushMessage = (message: Message) => {
  if (messages.length > MAX_MESSAGES) return;
  messages.push(message);
};

const app = new Hono();

const llm = new Ollama({ host: "http://localhost:11434" });
const systemPrompt = (user: string) =>
  `
You are a Minecraft expert, responsible with helping players on the server
with whatever they need, as well as help them have a good time.

For reference, the user interacting with you directly is called '${user}'.

Try to answer in using 3 paragraphs maximum and make them concise.
`;

const askSchema = z.object({
  question: z.string(),
  user: z.string(),
});

app.get("/ask", zValidator("query", askSchema), async (c) => {
  if (messages.length > MAX_MESSAGES) {
    messages = messages.slice(Math.max(messages.length - MAX_MESSAGES, 1));
  }

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

const setModelSchema = z.object({ model: z.string() });

app.get("/set-model", zValidator("query", setModelSchema), async (c) => {
  if (messages.length > MAX_MESSAGES) {
    messages = messages.slice(Math.max(messages.length - MAX_MESSAGES, 1));
  }

  const { model: modelToSet } = c.req.valid("query");
  const { models } = await llm.list();

  if (!models.find((m) => m.name === modelToSet)) {
    return c.json({ status: "failure" });
  }
  model = modelToSet;

  return c.json({ status: "success" });
});

app.get("/new-chat", async (c) => {
  messages = [];
  return c.json({});
});

app.get("/get-models", async (c) => {
  const { models } = await llm.list();
  return c.json({ models: models.map(({ name }) => name) });
});

console.log("Listening to port 42068 hehe");

serve({
  fetch: app.fetch,
  port: 42068, // disgusting,
});

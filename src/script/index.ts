import core from "@grakkit/stdlib-paper";

const Base64 = core.type("java.util.Base64");
const JavaString = core.type("java.lang.String");
const Thread = core.type("java.lang.Thread");
const Bukkit = core.type("org.bukkit.Bukkit");

function broadcastMessage(message: string) {
  for (const player of Bukkit.getOnlinePlayers()) {
    // @ts-ignore
    player.sendMessage(message);
  }
}

(() => {
  type Payload = { id: string; question: string };
  let payloads: Payload[] = [];

  function qoiAsk() {
    let payload = payloads.pop();
    if (!payload) return;

    try {
      const base64EncodedQuestion = Base64.getEncoder().encodeToString(
        new JavaString(payload.question).getBytes(),
      );
      const response = core.fetch(
        new JavaString(
          `http://localhost:42068/ask?question=${base64EncodedQuestion}&user=${payload.id}`,
        ).toString(),
      );
      const answer = response.read();
      broadcastMessage(`[Qoi's answer to ${payload.id}] ${answer}`);
    } catch (e) {
      broadcastMessage(
        // @ts-ignore
        `[Qoi's answer to ${payload.id}] Bro something went wrong, sorries... ${e.message}`,
      );
      console.error(e);
    }
  }
  core.command({
    name: "qoi",
    permission: "qoi.qoi.ask",
    execute: (sender, ...tokens) => {
      if (tokens.length === 0) {
        sender.sendMessage("Ayo, wassup bro. Asking me anything!");
        return;
      }

      const question = tokens.join(" ");
      payloads.push({ id: sender.getName(), question });

      broadcastMessage(`${sender.getName()} asked Qoi: ${question}`);

      new Thread({
        run() {
          qoiAsk();
        },
      }).start();
    },
  });
})();

core.command({
  name: "qoi-set-model",
  permission: "qoi.qoi.setmodel",
  execute: (sender, ...tokens) => {
    if (tokens.length === 0) return;
    const [model] = tokens;

    const response = core.fetch(
      new JavaString(
        `http://localhost:42068/set-model?model=${model}`,
      ).toString(),
    );

    const { status } = response.json();
    if (status === "success") sender.sendMessage(`[Qoi] Model set to ${model}`);
    else sender.sendMessage(`[Qoi] Could not set model to ${model}`);
  },
});

core.command({
  name: "qoi-set-model",
  permission: "qoi.qoi.setmodel",
  tabComplete: () => {
    try {
      const response = core.fetch(
        new JavaString(`http://localhost:42068/get-models`).toString(),
      );
      const { models } = response.json();
      return models;
    } catch (e) {
      return [];
    }
  },
  execute: (sender, ...tokens) => {
    try {
      if (tokens.length === 0) return;
      const [model] = tokens;

      const response = core.fetch(
        new JavaString(
          `http://localhost:42068/set-model?model=${model}`,
        ).toString(),
      );

      const { status } = response.json();
      if (status === "success")
        sender.sendMessage(`[Qoi] Model set to ${model}`);
      else sender.sendMessage(`[Qoi] Could not set model to ${model}`);
    } catch (e) {
      // @ts-ignore
      sender.sendMessage(`[Qoi] Could not set model: ${e.message}`);
    }
  },
});

core.command({
  name: "qoi-new-chat",
  permission: "qoi.qoi.newchat",
  execute: (sender) => {
    try {
      core.fetch(new JavaString(`http://localhost:42068/new-chat`).toString());
    } catch (e) {
      // @ts-ignore
      sender.sendMessage(`[Qoi] Could not create new chat: ${e.message}`);
    }
  },
});

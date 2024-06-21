import core from "@grakkit/stdlib-paper";

type Payload = { id: string; question: string };

const Base64 = core.type("java.util.Base64");
const JavaString = core.type("java.lang.String");
const Thread = core.type("java.lang.Thread");
const Bukkit = core.type("org.bukkit.Bukkit");

let payloads: Payload[] = [];

function broadcastMessage(message: string) {
  for (const player of Bukkit.getOnlinePlayers()) {
    // @ts-ignore
    player.sendMessage(message)
  }
}

function qoiAsk() {
  let payload = payloads.pop();
  if (!payload) return;

  try {
    const base64EncodedQuestion = Base64.getEncoder().encodeToString(
      new JavaString(payload.question).getBytes(),
    );
    const response = core.fetch(
      `http://localhost:42068?question=${base64EncodedQuestion}&user=${payload.id}`,
    );
    const answer = response.read();
    broadcastMessage(`[Qoi's answer to ${payload.id}] ${answer}`);
  } catch (e) {
    broadcastMessage(
      // @ts-ignore
      `[Qoi's answer to ${payload.id}] Bro something went wrong, sorries... ${e.message}`,
    );
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

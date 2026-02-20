import {
  cli,
  defineAgent,
  voice,
  WorkerOptions
} from "@livekit/agents";

import * as openai from "@livekit/agents-plugin-openai";
import { BackgroundVoiceCancellation } from "@livekit/noise-cancellation-node";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

class HospitalReceptionist extends voice.Agent {
  constructor() {
    super({
      instructions: `
You are a hospital receptionist.

Rules:
- greet the patient
- ask their name
- ask which department they want
- be short and polite
- never give medical advice
`
    });
  }
}

export default defineAgent({
  entry: async (ctx) => {

    const session = new voice.AgentSession({
      llm: new openai.realtime.RealtimeModel({
        voice: "coral"
      })
    });

    await session.start({
      agent: new HospitalReceptionist(),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation()
      }
    });

    await ctx.connect();

    const handle = session.generateReply({
      instructions: "Greet the patient and ask how you can help."
    });

    await handle.waitForPlayout();
  }
});

if (process.env.VITEST === undefined) {
  cli.runApp(
    new WorkerOptions({
      agent: fileURLToPath(import.meta.url)
    })
  );
}

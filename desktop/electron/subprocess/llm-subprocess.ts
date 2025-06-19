import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { createStreamIterator } from "../helpers/createStreamIterator.js";
import { BaseSubprocess } from "./base-subbprocess.js";

class LLMSubprocess extends BaseSubprocess {
  private llama!: Awaited<ReturnType<typeof getLlama>>;
  private sessions: Array<{ session: LlamaChatSession, taken: boolean, abortController: AbortController, id?: string }> = [];

  async onInitialize(): Promise<void> {
    this.llama = await getLlama();
    const model = await this.llama.loadModel({
      modelPath: process.argv[2],
    })
    const numOfSequences = 2;
    const context = await model.createContext({ sequences: numOfSequences, contextSize: { min: 512 } });
    for (let i = 0; i < numOfSequences; i++) {
      this.sessions.push({
        session: new LlamaChatSession({
          contextSequence: context.getSequence(),
        }),
        taken: false,
        abortController: new AbortController(),
      });
    }
  }

  getSession() {
    const session = this.sessions.find(s => !s.taken);
    if (session) {
      return session;
    }
    return this.sessions[0];
  }

  async handleMessage(message: any) {
    switch (message.type) {
      case 'abort':
        return await this.abortSession(message.id);
      case 'structuredResponse':
        return await this.structuredResponse(
          message.prompt,
          message.grammar
        )
    }
  }

  async *handleMessageGenerator(message: any) {
    let result = null
    switch (message.type) {
      case 'prompt':
        result = this.processPrompt(message.prompt, message.id);
        break;
    }

    if (!result) return;
    for await (const chunk of result) {
      yield chunk;
    }
  }

  async abortSession(id: string) {
    const session = this.sessions.find(s => s.id === id);
    if (session) {
      session.abortController.abort();
      session.abortController = new AbortController();
      session.taken = false;
      session.session.resetChatHistory();
      session.id = undefined;
    }
  }

  async *processPrompt(prompt: string, id: string) {
    const session = this.getSession();
    session.taken = true;
    session.id = id;
    try {
      const streamIterator = createStreamIterator();
      let fullContent = '';
      session.session.prompt(prompt, {
        signal: session.abortController.signal,
        stopOnAbortSignal: true,
        onResponseChunk: (chunk) => {
          if (chunk.text) {
            fullContent += chunk.text;
            streamIterator.push({
              type: 'content_chunk',
              delta: chunk.text,
              content: fullContent,
              sessionId: session.id,
            })
          } else {
            streamIterator.complete()
          }
        }
      })

      for await (const chunk of streamIterator) {
        yield chunk;
      }

    } finally {
      session.taken = false;
      session.session.resetChatHistory()
      session.id = undefined;
    }
  }

  async structuredResponse(prompt: string, grammar: any) {
    const session = this.getSession();
    session.taken = true;
    try {
      const structure = await this.llama.createGrammarForJsonSchema(grammar);
      const res = await session.session.prompt(prompt, { grammar: structure });
      return structure.parse(res)
    } finally {
      session.taken = false;
      session.session.resetChatHistory();
    }
  }


  async cleanup(): Promise<void> {
    for (const session of this.sessions) {
      session.session.dispose({ disposeSequence: true });
    }
    await this.llama.dispose();
  }
}

import { fileURLToPath } from 'url';
const currentFile = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === currentFile;

if (isMain) {
  new LLMSubprocess();
}
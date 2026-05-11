import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import logger from "../logger";
import { config } from "../config";

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class LLMService {
  private provider: "openai" | "claude";
  private openaiClient?: OpenAI;
  private claudeClient?: Anthropic;
  private openaiModel: string = "";
  private isReasoningModel: boolean = false;

  constructor() {
    this.provider = config.llm.provider;

    if (this.provider === "openai") {
      this.openaiModel = (config.llm.openai.model || "")
        .trim()
        .replace(/^['"]|['"]$/g, "");
      this.isReasoningModel = /^(o1|o3|o4|gpt-5)/i.test(this.openaiModel);

      this.openaiClient = new OpenAI({
        apiKey: config.llm.openai.apiKey,
      });
    } else {
      this.claudeClient = new Anthropic({
        apiKey: config.llm.claude.apiKey,
      });
    }

    logger.info(
      `LLM Service initialized with provider: ${this.provider}${
        this.provider === "openai" ? ` (model: ${this.openaiModel})` : ""
      }`
    );
  }

  async analyzeText(prompt: string, context?: string): Promise<LLMResponse> {
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    try {
      if (this.provider === "openai") {
        return await this.analyzeWithOpenAI(fullPrompt);
      } else {
        return await this.analyzeWithClaude(fullPrompt);
      }
    } catch (error) {
      logger.error(
        `LLM analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  private async analyzeWithOpenAI(prompt: string): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const params: Record<string, unknown> = {
      model: this.openaiModel,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    if (this.isReasoningModel) {
      params.max_completion_tokens = 4096;
    } else {
      params.max_tokens = 4096;
      params.temperature = 0.7;
    }

    const response = await this.openaiClient.chat.completions.create(
      params as unknown as Parameters<
        typeof this.openaiClient.chat.completions.create
      >[0]
    );

    // Type guard for non-streaming response
    if (!("choices" in response)) {
      throw new Error("Unexpected streaming response from OpenAI");
    }

    const content = response.choices[0]?.message?.content || "";

    return {
      content,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }

  private async analyzeWithClaude(prompt: string): Promise<LLMResponse> {
    if (!this.claudeClient) {
      throw new Error("Claude client not initialized");
    }

    const response = await this.claudeClient.messages.create({
      model: config.llm.claude.model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in Claude response");
    }

    return {
      content: textContent.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async extractJSON<T>(text: string): Promise<T> {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in LLM response");
    }
    return JSON.parse(jsonMatch[0]) as T;
  }

  /**
   * Multi-turn chat with system prompt + history.
   * Used by /api/chat to ground answers in analysis context.
   */
  async chat(
    systemPrompt: string,
    history: LLMMessage[],
    userMessage: string
  ): Promise<LLMResponse> {
    try {
      if (this.provider === "openai") {
        return await this.chatWithOpenAI(systemPrompt, history, userMessage);
      } else {
        return await this.chatWithClaude(systemPrompt, history, userMessage);
      }
    } catch (error) {
      logger.error(
        `LLM chat failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  private async chatWithOpenAI(
    systemPrompt: string,
    history: LLMMessage[],
    userMessage: string
  ): Promise<LLMResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    // Reasoning models (o1, o3, gpt-5) don't accept system role messages
    // before all user messages — fold the system prompt into the first user message.
    const messages = this.isReasoningModel
      ? [
          {
            role: "user" as const,
            content: `${systemPrompt}\n\n---\n\nHistory of the conversation so far:\n${history
              .map((m) => `${m.role}: ${m.content}`)
              .join("\n")}\n\n---\n\nUser's latest message: ${userMessage}`,
          },
        ]
      : [
          { role: "system" as const, content: systemPrompt },
          ...history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content: userMessage },
        ];

    const params: Record<string, unknown> = {
      model: this.openaiModel,
      messages,
    };

    if (this.isReasoningModel) {
      params.max_completion_tokens = 1500;
    } else {
      params.max_tokens = 1500;
      params.temperature = 0.7;
    }

    const response = await this.openaiClient.chat.completions.create(
      params as unknown as Parameters<
        typeof this.openaiClient.chat.completions.create
      >[0]
    );

    if (!("choices" in response)) {
      throw new Error("Unexpected streaming response from OpenAI");
    }

    return {
      content: response.choices[0]?.message?.content || "",
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }

  private async chatWithClaude(
    systemPrompt: string,
    history: LLMMessage[],
    userMessage: string
  ): Promise<LLMResponse> {
    if (!this.claudeClient) {
      throw new Error("Claude client not initialized");
    }

    const response = await this.claudeClient.messages.create({
      model: config.llm.claude.model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: userMessage },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in Claude response");
    }

    return {
      content: textContent.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}

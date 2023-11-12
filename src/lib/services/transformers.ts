import { pipeline } from "transformers.ts";
import { Pipeline } from "@xenova/transformers";

export class TransformersService {
  private constructor() {}

  public static async zeroShotClassification(
    text: string,
    commands: Array<string>
  ) {
    const classifier: Pipeline = await pipeline(
      "zero-shot-classification",
      "Xenova/mobilebert-uncased-mnli"
    );
    return classifier(text, commands);
  }

  public static async summarization(text: string): Promise<string> {
    const generator: Pipeline = await pipeline(
      "summarization",
      "Xenova/distilbart-cnn-6-6"
    );
    const [{ summary_text: summaryText }] = await generator(text, {
      max_new_tokens: 180,
    });
    return String(summaryText);
  }

  public static async sentimentAnalysis(
    text: string
  ): Promise<Array<{ label: string; score: number }>> {
    const classifier = await pipeline(
      "sentiment-analysis",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
    );
    return classifier(text);
  }

  public static async questionAnswering(
    question: string,
    context: string
  ): Promise<string> {
    let answerer = await pipeline(
      "question-answering",
      "Xenova/distilbert-base-uncased-distilled-squad"
    );
    const output = await answerer(question, context);
    return output?.answer;
  }

  public static async tokenClassification(text: string) {
    const classifier = await pipeline(
      "token-classification",
      "Xenova/bert-base-multilingual-cased-ner-hrl"
    );
    const output = await classifier(text);
    return output;
  }
}

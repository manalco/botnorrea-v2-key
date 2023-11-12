import axios, { AxiosResponse, AxiosInstance } from "axios";
import { EntityTg, UserTg, FormattingOptionsTg } from "../models";

const { TELEGRAM_BOT_TOKEN } = process.env;

interface SetWebhookResponse {
  ok: boolean;
  result: boolean;
  description: string;
}

interface GetWebhookInfoResponse {
  ok: boolean;
  result: {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    max_connections: number;
    ip_address: string;
  };
}

export interface SendMessageParams {
  chat_id: number | string;
  text: string;
  message_thread_id?: number;
  parse_mode?: FormattingOptionsTg;
  entities?: Array<EntityTg>;
  protect_content?: boolean;
  reply_to_message_id?: number;
  reply_markup?: any;
}

interface SendMessageResponse {
  message_id: number;
  message_thread_id: number;
  from: UserTg;
  sender_chat: any;
  date: number;
  entities: Array<EntityTg>;
}

export class TelegramService {
  private static instance: AxiosInstance;

  private constructor() {}

  public static initInstance(): void {
    if (!this.instance) {
      this.instance = axios.create({
        baseURL: `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`,
      });
    }
  }

  public static setWebhook(
    url: string
  ): Promise<AxiosResponse<SetWebhookResponse>> {
    return TelegramService.instance.post("/setWebhook", { url });
  }

  public static getWebhookInfo(): Promise<
    AxiosResponse<GetWebhookInfoResponse>
  > {
    return TelegramService.instance.get("/getWebhookInfo");
  }

  public static sendMessage(
    params: SendMessageParams
  ): Promise<AxiosResponse<SendMessageResponse>> {
    return TelegramService.instance.post("/sendMessage", params);
  }
}

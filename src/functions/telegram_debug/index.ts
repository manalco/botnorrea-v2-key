import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import { OK, BAD_REQUEST } from "http-status";
import { TelegramService } from "../../lib/services/telegram";
import { FormattingOptionsTg, UpdateTg } from "../../lib/models";

const getMessageToDebug = (body: UpdateTg): string => {
  if (body?.message?.reply_to_message) {
    return JSON.stringify(body?.message?.reply_to_message, null, 2);
  }

  return JSON.stringify(body, null, 2);
};

const execute = async (
  body: UpdateTg
): Promise<{ statusCode: number; body?: string }> => {
  TelegramService.initInstance();
  const bodyString: string = getMessageToDebug(body);
  console.log(`telegramDebug: ${bodyString}`);
  await TelegramService.sendMessage({
    chat_id: body?.message?.chat?.id,
    reply_to_message_id: body?.message?.message_id,
    parse_mode: FormattingOptionsTg.HTML,
    text: `<code>${bodyString}</code>`,
  });

  return { statusCode: OK };
};

export const telegramDebug = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback
): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!event?.body) {
    return callback(null, { statusCode: BAD_REQUEST });
  }

  const body = JSON.parse(event?.body);
  const response = await execute(body);
  return callback(null, response);
};

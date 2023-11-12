import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import { OK, BAD_REQUEST, NOT_MODIFIED } from "http-status";
import { TelegramService } from "../../lib/services/telegram";

const execute = async (
  url: string
): Promise<{ statusCode: number; body?: string }> => {
  if (!url.trim()) {
    return { statusCode: BAD_REQUEST };
  }

  TelegramService.initInstance();

  const webhookOld = await TelegramService.getWebhookInfo();
  if (webhookOld?.data?.result?.url === url) {
    return { statusCode: NOT_MODIFIED };
  }

  await TelegramService.setWebhook(url);

  const response = JSON.stringify({
    old: webhookOld?.data?.result?.url,
    new: url,
  });

  return { statusCode: OK, body: response };
};

export const telegramSetWebhook = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback
): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!event?.body) {
    return callback(null, { statusCode: BAD_REQUEST });
  }

  const body = JSON.parse(event?.body);
  const response = await execute(body?.url);
  return callback(null, response);
};

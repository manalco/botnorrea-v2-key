import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import { OK, BAD_REQUEST } from "http-status";
import axios from "axios";
import { UpdateTg } from "../../lib/models";
import { getCommand } from "../../lib/utils/telegramHelper";

const sendToEndpointCommand = async (body: UpdateTg, key: string) => {
  const command = {
    endpoint: "https://c11eba33cf72d4a0e912aa5f0ed702ca.m.pipedream.net",
    key,
  };
  if (command?.endpoint === "") {
    return;
  }

  await axios.post(command?.endpoint, body);
};

export const execute = async (
  body: UpdateTg
): Promise<{ statusCode: number }> => {
  if (body?.message?.from?.is_bot) {
    return { statusCode: OK };
  }

  const key = getCommand(body);
  if (key) {
    await sendToEndpointCommand(body, key);
  }

  return { statusCode: OK };
};

export const telegramWebhook = async (
  event: APIGatewayEvent,
  _context: Context,
  callback: Callback
): Promise<void> => {
  if (!event?.body) {
    return callback(null, { statusCode: BAD_REQUEST });
  }

  const body = JSON.parse(event?.body);
  const response = await execute(body);
  return callback(null, response);
};

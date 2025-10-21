import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import {
  OK,
  BAD_REQUEST,
  NO_CONTENT,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} from "http-status";
import { UpdateTg } from "../../lib/models";
import { getTextCommand } from "../../lib/utils/telegramHelper";
import { UserDao } from "../../lib/dao";
import { BotnorreaService } from "../../lib/services";

const sendMessage = async (body: UpdateTg, text: string): Promise<void> => {
  await BotnorreaService.sendMessage({
    chat_id: body?.message!.chat?.id,
    text,
    reply_to_message_id: body?.message?.message_id,
  });
  return;
};

const sendKey = async (
  body: UpdateTg,
  key: string | undefined
): Promise<{ statusCode: number }> => {
  if (!key) {
    await sendMessage(body, "Key not found");
    return { statusCode: NOT_FOUND };
  }

  await BotnorreaService.sendMessage({
    chat_id: body?.message!.chat?.id,
    text: key,
    reply_to_message_id: body?.message?.message_id,
  });
  return { statusCode: OK };
};

const getKey = async (body: UpdateTg): Promise<string | undefined> => {
  const key = getTextCommand(body);
  if (!key) {
    return;
  }

  if (body?.message?.text === key) {
    const self = await UserDao.findByUsername(body?.message?.from?.username);
    return self?.key;
  }

  const [username] = body
    ?.message!.text?.replace(key, "")
    ?.replace("@", "")
    ?.toLowerCase()
    ?.trim()
    ?.split(" ");

  const user = await UserDao.findByUsername(username);
  return user?.key;
};

const updateKey = async (body: UpdateTg): Promise<{ statusCode: number }> => {
  const [key] = body?.message!.text?.split(" ")[1];

  const user = await UserDao.findByUsername(body?.message!.from?.username);
  if (!user) {
    return { statusCode: NOT_FOUND };
  }

  await UserDao.save({ ...user, key: key });
  await sendMessage(body, "Key updated successfully");
  return { statusCode: OK };
};

const execute = async (body: UpdateTg): Promise<{ statusCode: number }> => {
  BotnorreaService.initInstance();
  await UserDao.initInstance();

  if (body?.message?.from?.is_bot) {
    return { statusCode: OK };
  }

  if (body?.message?.photo) {
    return updateKey(body);
  }

  if (body?.message?.text) {
    const key = await getKey(body);
    return sendKey(body, key); //review
  }

  return { statusCode: NO_CONTENT };
};

export const key = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback
): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!event?.body) {
    return callback(null, { statusCode: BAD_REQUEST });
  }

  const body = JSON.parse(event?.body);

  try {
    const response = await execute(body);
    return callback(null, response);
  } catch (error) {
    console.log(`${error?.message}\n${JSON.stringify(body)}`);
    return callback(error, { statusCode: INTERNAL_SERVER_ERROR });
  }
};

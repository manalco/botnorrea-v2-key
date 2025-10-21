import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import {
  OK,
  BAD_REQUEST,
  NO_CONTENT,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} from "http-status";
import { UpdateTg } from "../../lib/models";
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

  return { statusCode: NO_CONTENT };
};

export const keyUpdate = async (
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

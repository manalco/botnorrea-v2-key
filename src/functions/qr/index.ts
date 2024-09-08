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

const sendPhoto = async (
  body: UpdateTg,
  qrPathId: string | undefined
): Promise<{ statusCode: number }> => {
  if (!qrPathId) {
    await sendMessage(body, "Qr not found");
    return { statusCode: NOT_FOUND };
  }

  await BotnorreaService.sendPhoto({
    chat_id: body?.message!.chat?.id,
    photo: qrPathId,
    reply_to_message_id: body?.message?.message_id,
  });
  return { statusCode: OK };
};

const getQr = async (body: UpdateTg): Promise<string | undefined> => {
  const key = getTextCommand(body);
  if (!key) {
    return;
  }

  if (body?.message?.text === key) {
    const self = await UserDao.findByUsername(body?.message?.from?.username);
    return self?.qrPathId;
  }

  const [username] = body
    ?.message!.text?.replace(key, "")
    ?.replace("@", "")
    ?.toLowerCase()
    ?.trim()
    ?.split(" ");

  const user = await UserDao.findByUsername(username);
  return user?.qrPathId;
};

const updateQr = async (body: UpdateTg): Promise<{ statusCode: number }> => {
  const [photo] = body?.message!.photo?.sort(
    (first, last) => last.file_size - first.file_size
  );

  const user = await UserDao.findByUsername(body?.message!.from?.username);
  if (!user) {
    return { statusCode: NOT_FOUND };
  }

  await UserDao.save({ ...user, qrPathId: photo.file_id });
  await sendMessage(body, "Qr updated successfully");
  return { statusCode: OK };
};

const execute = async (body: UpdateTg): Promise<{ statusCode: number }> => {
  BotnorreaService.initInstance();
  await UserDao.initInstance();

  if (body?.message?.from?.is_bot) {
    return { statusCode: OK };
  }

  if (body?.message?.photo) {
    return updateQr(body);
  }

  if (body?.message?.text) {
    const qrPathId = await getQr(body);
    return sendPhoto(body, qrPathId);
  }

  return { statusCode: NO_CONTENT };
};

export const qr = async (
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

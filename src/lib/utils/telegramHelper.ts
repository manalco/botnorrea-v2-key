import { EntityTypeTg, UpdateTg } from "../models";

export const filterCommandEntity = ({ type, offset }) =>
  type === EntityTypeTg.BOT_COMMAND && offset === 0;

export const checkIfHasCommand = (body: UpdateTg) => {
  const commands = body?.message?.entities?.filter(filterCommandEntity);
  return Boolean(commands?.length);
};

export const getCommandPosition = (
  body: UpdateTg
): { offset: number; length: number } => {
  const commands = body?.message?.entities?.filter(filterCommandEntity);
  if (!commands?.length) {
    return { offset: 0, length: 0 };
  }

  const [{ offset, length }] = commands;
  return { offset, length };
};

export const getCommandKey = (
  body: UpdateTg,
  position: { offset: number; length: number }
) => {
  const key = body?.message?.text?.substring(
    position?.offset,
    position?.length
  );

  return key?.trim();
};

export const getCommand = (body: UpdateTg): null | string => {
  const hasCommand = checkIfHasCommand(body);
  if (!hasCommand) {
    return null;
  }

  const position = getCommandPosition(body);
  const key = getCommandKey(body, position);
  if (key === "") {
    return null;
  }

  return key;
};

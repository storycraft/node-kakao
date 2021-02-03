/*
 * Created on Tue Jan 19 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum KnownDataStatusCode {

  SUCCESS = 0,
  INVALID_USER = -1,
  INVALID_METHOD = -202,
  INVALID_PARAMETER = -203,
  INVALID_CHATROOM_OPERATION = -401,
  CHAT_BLOCKED_BY_FRIEND = -402,
  BLOCKED_IP = -444,
  OPERATION_DENIED = -500,
  INVALID_ACCESS_TOKEN = -950,
  BLOCKED_ACCOUNT = -997,
  AUTH_REQUIRED = -998,
  UPDATE_REQUIRED = -999,
  SERVER_UNDER_MAINTENANCE = -9797

}

export type DataStatusCode = KnownDataStatusCode | number;

export interface DefaultReq {

  [key: string]: unknown;

}

export interface DefaultRes {

  status: DataStatusCode;
  [key: string]: unknown;

}

/**
 * Wrapped request response.
 */
interface RootCommandResult {

  readonly success: boolean;
  readonly status: DataStatusCode;

}

export interface CommandResultFailed extends RootCommandResult {

  readonly success: false;

}

interface CommandResultDoneValue<T> extends RootCommandResult {

  readonly success: true;
  readonly result: T;

}

interface CommandResultDoneVoid extends RootCommandResult {

  readonly success: true;

}

export type CommandResultDone<T> = (T extends void ? CommandResultDoneVoid : CommandResultDoneValue<T>);
export type CommandResult<T = void> = CommandResultFailed | CommandResultDone<T>;
export type AsyncCommandResult<T = void> = Promise<CommandResult<T>>;

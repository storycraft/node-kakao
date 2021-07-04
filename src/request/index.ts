/*
 * Created on Tue Jan 19 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum KnownDataStatusCode {

  SUCCESS = 0,
  INVALID_USER = -1,
  CLIENT_ERROR = -200,
  NOT_LOGON = -201,
  INVALID_METHOD = -202,
  INVALID_PARAMETER = -203,
  INVALID_BODY = -203,
  INVALID_HEADER = -204,
  UNAUTHORIZED_CHAT_DELETE = -210,
  MEDIA_SERVER_ERROR = -300,
  CHAT_SPAM_LIMIT = -303,
  RESTRICTED_APP = -304,
  LOGINLIST_CHATLIST_FAILED = -305,
  MEDIA_NOT_FOUND = -306,
  MEDIA_THUMB_GEN_FAILED = -307,
  UNSUPPORTED = -308,
  PARTIAL = -310,
  LINK_JOIN_TPS_EXCEEDED = -312,
  CHAT_SEND_RESTRICTED = -321,
  CHANNEL_CREATE_TEMP_RESTRICTED = -322,
  CHANNEL_CREATE_RESTRICTED = -323,
  OPENLINK_UNAVAILABLE = -324,
  INVITE_COUNT_LIMITED = -325,
  OPENLINK_CREATE_RESTRICTED = -326,
  INVALID_CHANNEL = -401,
  CHAT_BLOCKED_BY_FRIEND = -402,
  NOT_CHATABLE_USER = -403,
  GAME_MESSAGE_BLOCKED = -406,
  BLOCKED_IP = -444,
  BACKGROUND_LOGIN_BLOCKED = -445,
  OPERATION_DENIED = -500,
  CHANNEL_USER_LIMITED = -501,
  TEMP_RESTRICTED = -805,
  WRITE_WHILE_BLOCKED = -814,
  OPENCHAT_REJOIN_REQUIRED = -815,
  OPENCHAT_TIME_RESTRICTED = -819,
  INVALID_ACCESS_TOKEN = -950,
  BLOCKED_ACCOUNT = -997,
  AUTH_REQUIRED = -998,
  UPDATE_REQUIRED = -999,
  SERVER_UNDER_MAINTENANCE = -9797

}

export type DataStatusCode = KnownDataStatusCode | number;

export interface ResponseState {

  status: DataStatusCode;

}

export interface DefaultReq {

  [key: string]: unknown;

}

export interface DefaultRes extends DefaultReq, ResponseState {

}

/**
 * Wrapped request response.
 */
interface RootCommandResult extends ResponseState {

  readonly success: boolean;

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

export type CommandResultDone<T = void> = (T extends void ? CommandResultDoneVoid : CommandResultDoneValue<T>);
export type CommandResult<T = void> = CommandResultFailed | CommandResultDone<T>;
export type AsyncCommandResult<T = void> = Promise<CommandResult<T>>;

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
    INVALID_ACCESSTOKEN = -950,
    BLOCKED_ACCOUNT = -997,
    AUTH_REQUIRED = -998,
    UPDATE_REQUIRED = -999,
    SERVER_UNDER_MAINTENANCE = -9797

}

export type DataStatusCode = KnownDataStatusCode | number;

export interface DefaultReq {

    [key: string]: any;

}

export interface DefaultRes {

    status: DataStatusCode;
    [key: string]: any;

}

/**
 * Wrapped request response.
 */
interface RootCommandResult {

    readonly success: boolean;
    readonly status: DataStatusCode;

}

interface CommandResultFailed extends RootCommandResult {

    readonly success: false;

}

interface CommandResultDone<T> extends RootCommandResult {

    readonly success: true;
    readonly result: T;

}

interface CommandResultDoneVoid extends RootCommandResult {

    readonly success: true;

}

export type CommandResult<T = void> = CommandResultFailed | (T extends void ? CommandResultDoneVoid : CommandResultDone<T>);
export type AsyncCommandResult<T = void> = Promise<CommandResult<T>>;
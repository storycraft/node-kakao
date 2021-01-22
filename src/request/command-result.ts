/*
 * Created on Tue Jan 19 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DataStatusCode, KnownDataStatusCode } from "../packet/status-code";

/**
 * Wrapped request response.
 */
interface CommandResultFailed {

    readonly success: false;
    readonly status: DataStatusCode;

}

interface CommandResultDone<T> {

    readonly success: true;
    readonly status: DataStatusCode;
    readonly result: T;

}

interface CommandResultDoneVoid {

    readonly success: true;
    readonly status: DataStatusCode;

}

export type CommandResult<T = void> = CommandResultFailed | (T extends void ? CommandResultDoneVoid : CommandResultDone<T>);
export type AsyncCommandResult<T = void> = Promise<CommandResult<T>>;
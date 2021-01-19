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

    readonly status: DataStatusCode;

}
interface CommandResultDone<T> {

    readonly status: KnownDataStatusCode.SUCCESS;
    readonly result: T;

}

export type CommandResult<T = void> = CommandResultDone<T> | CommandResultFailed;
/*
 * Created on Sun Jul 04 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { CommandResult, CommandResultDone } from "../request";

/**
 * Unwrap CommandResult and convert failed case into error.
 *
 * @template T
 * @param {CommandResult<T>} commandRes CommandResult to unwrap
 * @return {T} Unwrapped result
 */
export function unwrapResult<T>(commandRes: CommandResult<T>): CommandResultDone<T> {
  if (!commandRes.success) {
    throw new Error(`Request failed with status: ${commandRes.status}`);
  }

  return commandRes;
}

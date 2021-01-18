/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export function* createIdGen(start: number = 0) {
    let current = start;

    while (true) {
        yield ++current;
    }
}
/*
 * Created on Mon Jun 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface RequestResult<T> {

    status: number;
    result?: T;

}
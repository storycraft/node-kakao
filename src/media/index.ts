/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatType } from "../chat/chat-type";

export interface MediaComponent {

    key: string;

}

export interface MediaTypeComponent {

    type: ChatType;

}

export interface SizedMediaComponent {

    width: number;
    height: number;

}
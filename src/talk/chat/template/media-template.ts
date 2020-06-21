/*
 * Created on Wed Jun 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatType } from "../chat-type";

export interface SizedMediaParam {

    width: number;
    height: number;

    ext: string;

}

export interface MediaTemplate<T extends ChatType> extends Partial<SizedMediaParam> {

    name: string;

    type: T;

    data: Buffer;

}

export type MediaTemplates = MediaTemplate<ChatType.Audio> | MediaTemplate<ChatType.File> | (MediaTemplate<ChatType.Photo> | MediaTemplate<ChatType.Video>) & SizedMediaParam | MediaTemplate<ChatType.Text>;
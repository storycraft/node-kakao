/*
 * Created on Wed Jun 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatType } from "../chat-type";

export interface MediaItemTemplate {

    name: string;
    data: Buffer;

    ext?: string;

}

export interface SizedMediaItemTemplate extends MediaItemTemplate {

    width: number;
    height: number;

}

export interface BaseMediaTemplate<T extends ChatType> {

    type: T;

}

export interface MediaTemplate<T extends ChatType> extends BaseMediaTemplate<T>, MediaItemTemplate {

}

export interface MultiMediaTemplate<T extends ChatType> extends BaseMediaTemplate<T> {

    mediaList: SizedMediaItemTemplate[];

}

export type MultiMediaTemplates = MultiMediaTemplate<ChatType.MultiPhoto>;
export type MediaTemplates = MediaTemplate<ChatType.Audio> | MediaTemplate<ChatType.File> | (MediaTemplate<ChatType.Photo> | MediaTemplate<ChatType.Video>) & SizedMediaItemTemplate | MediaTemplate<ChatType.Text> | MultiMediaTemplates;
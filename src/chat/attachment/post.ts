/*
 * Created on Fri Feb 12 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Attachment } from '.';
import { EmoticonAttachment } from './emoticon';

export enum KnownPostItemType {

  TEXT = 1,
  FOOTER = 2,
  HEADER = 3,
  EMOTICON = 4,
  IMAGE = 5,
  VIDEO = 6,
  FILE = 7,
  SCHEDULE = 8,
  VOTE = 9,
  SCRAP = 10,

}

export type PostItemType = KnownPostItemType | number;

export enum KnownPostSubItemType {

}

export type PostSubItemType = KnownPostSubItemType | number;

export enum KnownPostFooterStyle {
  ARTICLE = 1,
  SCHEDULE = 2,
  SCHEDULE_ANSWER = 3,
  VOTE = 4,
  VOTE_RESULT = 5,
}

export type PostFooterStyle = KnownPostFooterStyle | number;

export namespace PostItem {

  export interface Unknown extends Record<string, unknown> {
    /**
     * Item type
     */
    t: PostItemType;
  }

  export interface Text extends Unknown {
    t: KnownPostItemType.TEXT;
    
    /**
     * Content text
     */
    ct: string;

    /**
     * JSON content text
     */
    jct: string;
  }

  export interface Header extends Unknown {
    t: KnownPostItemType.HEADER;

    /**
     * Item style (unknown)
     */
    st: number;

    /**
     * User
     */
    u?: {
      /**
       * User id
       */
      id: number | Long
    };
  }

  export interface Image extends Unknown {
    t: KnownPostItemType.IMAGE;

    /**
     * Title
     */
    tt?: string;

    /**
     * Thumbnail url list
     */
    th: string[];

    /**
     * true if images are gif
     */
    g?: boolean;
  }

  export interface Emoticon extends Unknown {
    t: KnownPostItemType.EMOTICON;

    /**
     * Emoticon attachment
     */
    ct: EmoticonAttachment;
  }

  export interface Vote extends Unknown {
    t: KnownPostItemType.VOTE;

    /**
     * Item style (unknown)
     */
    st: number;

    /**
     * Title
     */
    tt: string;

    /**
     * Sub type(?)
     */
    ittpe?: string;

    /**
     * Sub item list
     */
    its: Record<string, unknown>[];

  }

  export interface Video extends Unknown {
    t: KnownPostItemType.VIDEO;

    /**
     * Thumbnail url
     */
    th: string;
  }

  export interface File extends Unknown {
    t: KnownPostItemType.FILE;

    /**
     * First file name
     */
    tt: string;

    /**
     * File count
     */
    c: number;
  }

  export interface Footer extends Unknown {
    t: KnownPostItemType.FOOTER;

    /**
     * Item style
     */
    st: PostFooterStyle;

    /**
     * URL
     */
    url: string;
  }

}

export interface PostAttachment extends Attachment {
  
  /**
   * Sub PostItem type(?)
   */
  subtype?: PostSubItemType;

  /**
   * Post item object list
   */
  os: PostItem.Unknown[];
}

export interface VoteAttachment extends PostAttachment {

  /**
   * Vote id
   */
  voteId: number;

  /**
   * Vote title
   */
  title: string;
}

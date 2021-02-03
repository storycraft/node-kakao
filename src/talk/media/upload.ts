/*
 * Created on Wed Feb 03 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface MediaUploadTemplate {

    /**
     * Name of the file
     */
    name: string;

    /**
     * File data
     */
    data: ArrayBuffer;

    /**
     * Media width (only photo, video)
     */
    width?: number;

    /**
     * Media height (only photo, video)
     */
    height?: number;

    /**
     * File extension (optional?)
     */
    ext?: string;

}

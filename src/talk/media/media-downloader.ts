/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { MediaComponent } from "../../media/media";
import { Stream } from "../../network/stream";

export class MediaDownloader {
    
    constructor(private _stream: Stream, private _media: MediaComponent) {

    }

}
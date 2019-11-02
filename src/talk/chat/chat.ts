import { MessageType } from "./message-type";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class Chat {

    abstract get Type(): MessageType;
    
}

export class TextChat extends Chat {
    
    get Type() {
        return MessageType.Text;
    }
}

export class PhotoChat extends Chat {
    
    get Type() {
        return MessageType.Photo;
    }

}

export class VideoChat extends Chat {
    
    get Type() {
        return MessageType.Video;
    }

}

export class LongTextChat extends Chat {
    
    get Type() {
        return MessageType.Text;
    }

}

export class EmoticonChat extends Chat {
    
    get Type() {
        return MessageType.DitemEmoticon;
    }

}

export class SharpSearchChat extends Chat {
    
    get Type() {
        return MessageType.Search;
    }

}
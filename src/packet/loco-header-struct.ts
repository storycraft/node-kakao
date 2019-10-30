/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoHeaderStruct {
    
    PacketId: number = 0;
    StatusCode: number = 0;
    PacketName: string = '';
    BodyType: number = 0;
    BodySize: number = 0;

}

export class LocoEncryptedHeaderStruct {
    
    EncryptedSize: number = 0;

}
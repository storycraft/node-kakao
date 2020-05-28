/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface PacketHeader {
    
    packetId: number;
    statusCode: number;
    packetName: string;
    bodyType: number;
    bodySize: number;

}

export interface EncryptedPacketHeader {
    
    encryptedSize: number;

}
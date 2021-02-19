/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface NetworkConfig {

  /**
   * Background keep interval
   */
  bgKeepItv: number;

  /**
   * Background reconnect interval
   */
  bgReconnItv: number;

  /**
   * Background ping interval
   */
  bgPingItv: number;

  /**
   * Foreground ping interval
   */
  fgPingItv: number;

  /**
   * Timeout
   */
  reqTimeout: number;

  /**
   * Encrypt type (secure layer)
   */
  encType: number;

  /**
   * Connection timeout
   */
  connTimeout: number;

  /**
   * Packet heaader receive timeout(?)
   */
  recvHeaderTimeout: number;

  inSegTimeout: number;
  outSegTimeout: number;

  /**
   * Max tcp packet size(?)
   */
  blockSendBufSize: number;

  /**
   * Usable port list
   */
  ports: number[];

}

export interface GetConfRes {

  /**
   * Last revision
   */
  revision: number;

  /**
   * Network config by speed
   */
  '3g': NetworkConfig;
  wifi: NetworkConfig;

  /**
   * Contains checkin server host list.
   * lsl and lsl6 only work. (Unused(?))
   */
  ticket: { ssl: string[], v2sl: string[], lsl: string[], lsl6: string[] };

  /**
   * Contains information about video profile
   */
  profile: { vBitrate: number, vResolution: number };


  etc: { writeRetryTimeout: number, tracerouteHost: string[], tracerouteHost6: string[] };

  /**
   * Video resolution, bitrate, audio frequency, file transfer(?) config.
   *
   */
  trailer: {
    tokenExpireTime: number,
    resolution: number,
    resolutionHD: number,
    compRatio: number,
    compRatioHD: number,
    downMode: number,
    concurrentDownLimit: number,
    concurrentUpLimit: number,
    maxRelaySize: number,
    downCheckSize: number,
    upMaxSize: number,
    videoUpMaxSize: number,
    vCodec: number,
    vFps: number,
    aCodec: number,
    contentExpireTime: number,
    vResolution: number,
    vBitrate: number,
    aFrequency: number
  };

  /**
   * High quality video resolution, bitrate, audio frequency config
   */
  'trailer.h': { vResolution: number, vBitrate: number, aFrequency: number };

}

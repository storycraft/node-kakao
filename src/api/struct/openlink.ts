/*
 * Created on Sat Apr 10 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface OpenProfileUploadStruct {

  'access_key': string;

}

export interface OpenPostUploadInfoItemStruct {

  filename: string,
  width: number,
  'content_type': string,
  length: number,
  height: number

}

export interface OpenPostUploadInfoStruct {

  original: OpenPostUploadInfoItemStruct;
  small: OpenPostUploadInfoItemStruct;
  large: OpenPostUploadInfoItemStruct;
  scrap: OpenPostUploadInfoItemStruct;

}

export interface OpenProfilePostUploadStruct extends OpenProfileUploadStruct {

  info: OpenPostUploadInfoStruct

}

/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface OAuthCredential {

  readonly deviceUUID: string;

  readonly accessToken: string;
  readonly refreshToken: string;

}

/**
 * Provides oauth credential data
 */
export interface CredentialProvider {

  getCredential(): OAuthCredential;

}

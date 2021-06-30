/*
 * Created on Wed Feb 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * Renew oauth credential using OAuthApiClient
 */
import { Long } from 'bson';
import { OAuthApiClient } from 'node-kakao';

const DEVICE_UUID = process.env['deviceUUID'] as string;
const ACCESS_TOKEN = process.env['accessToken'] as string;
const REFRESH_TOKEN = process.env['refreshToken'] as string;
const USER_ID = Long.fromValue(process.env['userId'] as string);

async function main() {
  const oAuthClient = await OAuthApiClient.create();

  const newTokenRes = await oAuthClient.renew({
    userId: USER_ID,
    deviceUUID: DEVICE_UUID,
    accessToken: ACCESS_TOKEN,
    refreshToken: REFRESH_TOKEN
  });
  if (!newTokenRes.success) throw new Error(`Cannot renew oauth token: ${newTokenRes.status}`);

  const res = newTokenRes.result;
  console.log('OAuth renew success');
  console.log(`ExpiresIn: ${res.expiresIn}, type: ${res.type}, accessToken: ${res.credential.accessToken}`);
}
main().then();
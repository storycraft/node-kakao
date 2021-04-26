/*
 * Created on Fri Apr 16 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * This example relogin to keep session when the server request to switch server.
 */

import { AuthApiClient, TalkClient, api } from 'node-kakao';

// Supply env variables or replace to value.
const DEVICE_UUID = process.env['deviceUUID'] as string;
const DEVICE_NAME = process.env['deviceName'] as string;

const EMAIL = process.env['accountEmail'] as string;
const PASSWORD = process.env['accountPwd'] as string;

const CLIENT = new TalkClient();

// It is usually triggered in 1 ~ 2 days depend on the server.
// So if you want to keep your bot or program running,
// you should handle this event or the client will get disconnected after awhile.
CLIENT.on('switch_server', () => {
  // Refresh credential and relogin client.
  login().then(() => {
    console.log('Server switched!');
  });
});

async function getLoginData(): Promise<api.LoginData> {
  const api = await AuthApiClient.create(DEVICE_NAME, DEVICE_UUID);
  const loginRes = await api.login({
    email: EMAIL,
    password: PASSWORD,
    forced: true,
  });
  if (!loginRes.success) throw new Error(`Web login failed with status: ${loginRes.status}`);

  return loginRes.result;
}

async function login() {
  const loginData = await getLoginData();

  const res = await CLIENT.login(loginData);
  if (!res.success) throw new Error(`Login failed with status: ${res.status}`);

  console.log('Login success');
}

async function main() {
  await login();
}
main().then();

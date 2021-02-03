/*
 * Created on Sun Jan 31 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/*
 * Following this example will make automatic response at text "안녕하세요".
 */

import { AuthApiClient, TalkClient } from "node-kakao";

// Supply env variables or replace to value.
const DEVICE_UUID = process.env['deviceUUID'];
const DEVICE_NAME = process.env['deviceName'];

const EMAIL = process.env['accountEmail'];
const PASSWORD = process.env['accountPwd'];

const CLIENT = new TalkClient();

CLIENT.on('chat', (data, channel) => {
    if (data.chat.text === '안녕하세요') {
        channel.sendChat('안녕하세요');
    }
});

async function main() {
    const api = await AuthApiClient.create(DEVICE_NAME, DEVICE_UUID);
    const loginRes = await api.login({
        email: EMAIL,
        password: PASSWORD,

        // This option force login even other devices are logon
        forced: true
    });
    if (!loginRes.success) throw new Error(`Web login failed with status: ${loginRes.status}`);

    console.log(`Received access token: ${loginRes.result.accessToken}`);

    const res = await CLIENT.login(loginRes.result);
    if (!res.success) throw new Error(`Login failed with status: ${res.status}`);

    console.log('Login success');
}
main().then();

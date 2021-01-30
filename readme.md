[![npm version](https://badge.fury.io/js/node-kakao.svg)](https://www.npmjs.com/package/node-kakao)
# DenoKakao - Loco protocol compatible library

Note: this implemention can stop working anytime.

## Version Information

| v3 | (Recommended) Current |
|----|-----------------------|
| v2 |      deprecated       |
| v1 | experimental. buggy   |

## Warning

Client can act differently unlike official client. Abusing this client can cause permanent service restriction.

## Example

Common code
```typescript
import { TalkClient, LoginError } from 'node-kakao';

let client = new TalkClient('TEST_CLIENT', 'random base64 device id');

client.login('123456789@email.com', '123456')
        .then(() => console.log('Login succeed'))
        .catch((err: LoginError) => {
            console.error(`Login failed. status: ${err.status}, message: ${err.message}`);
        });
```

### Simple text reply

```typescript

import { Chat, ChatMention } from 'node-kakao';

client.on('message', (chat: Chat) => {
    let userInfo = chat.Channel.getUserInfo(chat.Sender);

    if (!userInfo) return;

    if (chat.Text === '안녕하세요') {
        chat.replyText('안녕하세요 ', new ChatMention(userInfo)); // Ex) 안녕하세요 @storycraft
        //chat.Channel.sendTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat), '안녕하세요')); // 답장형식
    }
});
```

### Simple photo reply

```typescript

import { Chat, ChatType } from 'node-kakao';
import * as fs from 'fs';

client.on('message', (chat: Chat) => {
    let userInfo = chat.Channel.getUserInfo(chat.Sender);

    if (!userInfo) return;

    if (chat.Text === '/example') {
        chat.replyMedia({
            type: ChatType.Photo,
            name: 'nyancat.png',
            width: 800,
            height: 800,
            data: fs.readFileSync('C:\\nyancat.png'), // sync method is not recommended
            ext: 'png'
        });
    }
});
```

### Type filtering

```typescript

import { Chat, SharpAttachment } from 'node-kakao';

client.on('message', (chat: Chat) => {
    let userInfo = chat.Channel.getUserInfo(chat.Sender);

    if (!userInfo) return;

    if (chat.Type === ChatType.Search) {
        let attachment = chat.AttachmentList[0] as SharpAttachment;

        chat.replyText(`${userInfo.Nickname}님이 샵 검색 전송 ${attachment.Question}. 리다이렉트 경로: ${attachment.RedirectURL}`);
    }
});
```

### Join message

```typescript

import { ChatChannel, ChatUser, FeedChat, OpenJoinFeed, InviteFeed } from 'node-kakao';

client.on('user_join', (channel: ChatChannel, user: ChatUser, feed?: FeedChat<OpenJoinFeed | InviteFeed>) => {
    let info = channel.getUserInfo(user);

    if (!info) return;

    channel.sendText(info.Nickname + ' 님 안녕하세요');
});
```

### Web api only

```typescript
import { TalkApiClient, OpenRecommendStruct } from 'node-kakao';

let client = new TalkApiClient('TEST_CLIENT', 'random base64 device id');

async function sample() {
    try {
        await client.login('123456789@email.com', '123456');

        let openRecommend: OpenRecommendStruct = await client.OpenChat.requestRecommend();
    } catch (err) {
        console.error(`Login failed. status: ${err.status}, message: ${err.message}`);
    }
}

sample();
```

License
-------
node-kakao is following MIT License.

Basic Reference
---------
[pykakao](https://github.com/hallazzang/pykakao/)(hallazzang)  
[pykakao](https://github.com/ssut/pykakao)(ssut)
- [[KakaoTalk+] LOCO 프로토콜 분석 (1)](http://www.bpak.org/blog/2012/12/kakaotalk-loco-프로토콜-분석-1/)
- [[KakaoTalk+] LOCO 프로토콜 분석 (2)](http://www.bpak.org/blog/2012/12/kakaotalk-loco-프로토콜-분석-2/)
- [[KakaoTalk+] LOCO 프로토콜 분석 (3)](http://www.bpak.org/blog/2012/12/kakaotalk-loco-프로토콜-분석-3/)
- [[KakaoTalk+] LOCO 프로토콜 분석 (4)](http://www.bpak.org/blog/2012/12/kakaotalk-loco-프로토콜-분석-4/)
- [[KakaoTalkPC] 카카오톡 PC 버전 분석 (1)](https://www.bpak.org/blog/2013/08/kakaotalkpc-카카오톡-pc-버전-분석-1/)

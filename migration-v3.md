# Upgrade guide from v3
아래에는 중요한 변화점에 대해서만 설명하고 있으며 TypeDoc는 [이곳](https://storycraft.github.io/node-kakao/) 에서 찾을 수 있습니다.

## Client
TalkClient에서 더이상 id / passwd 형식으로 로그인 할 수 없으며 아래 코드와 같이 웹 api 클라이언트를 만든뒤 oauth 토큰을 얻어 로그인 할 수 있습니다.
```typescript
const api = await AuthApiClient.create('디바이스 이름', '디바이스 uuid');
const loginRes = await api.login({
  email: 'sample@email.com',
  password: '1234'
});
if (!loginRes.success) throw new Error(`로그인 실패 status: ${loginRes.status}`);

const client = new TalkClient({
  // 콘픽 설정 (optional)
});
await client.login(loginRes.result);
```

TalkClient객체에 더이상 로그인 정보를 저장하지 않습니다. 재 로그인이나 서버 전환 이벤트 시 재 로그인 해야 합니다.

## Event
이벤트 발동 순서는 v3와 같이 아래서 위로 올라가는 방식

>> Ex) TalkNormalChannel 에서 이벤트 발생시  
>> TalkClient <- TalkChannelList <- TalkNormalChannelList <- TalkNormalChannel  
>> 하위 트리서 상위 트리로 전파

이벤트 목록은 `event` 모듈에서 확인 할 수 있습니다.

## Request result
모든 요청 메서드들은 CommandResult, AsyncCommandResult 타입으로 반환 됩니다.
```typescript
try {
  const res = await someRequest();
  if (!res.success) {
    console.err(`request 실패 status: ${res.status}`);
    return;
  }

  console.log(`request 성공 status: ${res.status} result: ${res.result}`);
} catch (err) {
  console.err(`네트워크 에러. error: ${err}`);
}
```
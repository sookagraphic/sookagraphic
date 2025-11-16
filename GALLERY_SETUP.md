# 갤러리 이미지 설정 가이드

`work-01.svg` ~ `work-16.svg` 이미지를 로컬 이미지 또는 인스타그램 이미지로 설정할 수 있습니다.

## 설정 파일: `gallery-config.json`

각 이미지의 소스를 설정하려면 `gallery-config.json` 파일을 수정하세요.

### 로컬 이미지 사용

```json
{
  "id": "work-01",
  "source": "local",
  "localPath": "assets/images/work-01.svg",
  "instagramUrl": null
}
```

### 인스타그램 이미지 사용 (직접 URL 지정)

```json
{
  "id": "work-01",
  "source": "instagram",
  "localPath": "assets/images/work-01.svg",
  "instagramUrl": "https://instagram.com/p/xxxxx/media/?size=l"
}
```

**인스타그램 이미지 URL 얻는 방법:**
1. 인스타그램에서 이미지 우클릭 → "이미지 주소 복사"
2. 또는 인스타그램 포스트 URL 끝에 `/media/?size=l` 추가

### 인스타그램 자동 동기화

인스타그램에 업로드된 최신 이미지를 자동으로 가져오려면:

1. **Instagram Graph API Access Token 발급**
   - https://developers.facebook.com/ 에서 앱 생성
   - Instagram Graph API 권한 추가
   - Access Token 발급

2. **설정 파일 수정**
```json
{
  "instagram": {
    "username": "sookagraphic",
    "autoSync": true,
    "accessToken": "YOUR_ACCESS_TOKEN"
  }
}
```

3. **자동 동기화 활성화**
   - `autoSync: true`로 설정하면 페이지 로드 시 최신 인스타그램 이미지 16개를 자동으로 가져옵니다.
   - 이미지는 업로드 순서대로 `work-01`부터 `work-16`까지 할당됩니다.

## 사용 예시

### 예시 1: 일부만 인스타그램 이미지 사용
```json
{
  "images": [
    {
      "id": "work-01",
      "source": "local",
      "localPath": "assets/images/work-01.svg",
      "instagramUrl": null
    },
    {
      "id": "work-02",
      "source": "instagram",
      "localPath": "assets/images/work-02.svg",
      "instagramUrl": "https://instagram.com/p/xxxxx/media/?size=l"
    }
  ]
}
```

### 예시 2: 자동 동기화 사용
```json
{
  "instagram": {
    "username": "sookagraphic",
    "autoSync": true,
    "accessToken": "YOUR_ACCESS_TOKEN"
  }
}
```

## 주의사항

1. **로컬 이미지 우선**: 인스타그램 이미지 로드 실패 시 자동으로 로컬 이미지로 fallback됩니다.
2. **CORS 문제**: 인스타그램 이미지를 직접 사용할 때는 CORS 문제가 발생할 수 있습니다. 이 경우 프록시 서버나 CDN을 사용하세요.
3. **Access Token 보안**: Access Token은 클라이언트에 노출되므로, 프로덕션 환경에서는 서버 사이드에서 처리하는 것을 권장합니다.


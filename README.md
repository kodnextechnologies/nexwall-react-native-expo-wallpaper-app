# React Native Wallpaper App using a Free Wallpaper API (NexWall + Expo)

A minimal, open-source React Native wallpaper app built with Expo and TypeScript on top of the [NexWall **free wallpaper API**](https://nexwall.kodnextech.com/wallpaper-api/free-wallpaper-api). It lists wallpaper categories, shows a paginated `FlatList` grid with infinite scroll, opens a full-screen preview, and saves wallpapers to the phone's photo library with `expo-media-library`.

> Step-by-step tutorial: [React Native wallpaper app guide](https://nexwall.kodnextech.com/wallpaper-api/guides/react-native-wallpaper-app-guide)

## Features

- Expo SDK 57, React Native 0.86, TypeScript strict mode
- Category grid with cover images and wallpaper counts
- Wallpaper grid with `FlatList` **infinite scroll pagination** (`onEndReached` + `page`)
- Sort by newest, popular, random or oldest
- Full-screen preview (thumbnail shown as placeholder while the full image loads)
- **Save to photos** with [`expo-media-library`](https://docs.expo.dev/versions/latest/sdk/media-library/) and [`expo-file-system`](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- Image caching with [`expo-image`](https://docs.expo.dev/versions/latest/sdk/image/)
- Shows your **remaining daily API quota** in the header
- Handles `401`, `404`, `422` and `429` (quota exceeded, with `Retry-After`); stops paging after an error until you tap Retry
- No navigation library: a three-route stack in `App.tsx`
- Typed API client in one file (`src/api/nexwall.ts`) that you can copy into any React / React Native project

## What it does

1. **Categories**: the categories available on your plan, plus a "Browse all wallpapers" button.
2. **Wallpapers**: a 3-column 9:16 grid. The next page loads as you approach the end of the list.
3. **Preview**: the full-resolution image with **Save to photos**. Set it as your wallpaper from the Gallery or Photos app.

React Native and Expo have no cross-platform API for setting the wallpaper directly (iOS does not allow it at all), so this starter saves to the photo library. If you need one-tap "set as wallpaper" on Android, see the [Flutter](https://github.com/kodnextechnologies/nexwall-flutter-wallpaper-app) or [Kotlin](https://github.com/kodnextechnologies/nexwall-android-kotlin-wallpaper-app) starters.

## Quick start

### 1. Get a free API key

Sign up at **https://nexwall.kodnextech.com/developers/register**. The free plan needs no credit card.

### 2. Configure

```bash
git clone https://github.com/kodnextechnologies/nexwall-react-native-expo-wallpaper-app.git
cd nexwall-react-native-expo-wallpaper-app
npm install
cp .env.example .env
```

Edit `.env`:

```
EXPO_PUBLIC_NEXWALL_API_KEY=your_key_here
```

`.env` is in `.gitignore`. Never commit it.

### 3. Run

```bash
npx expo start          # then press "a" for Android, "i" for iOS, or scan the QR code
npm run typecheck       # tsc --noEmit
```

Browsing works in Expo Go. Media library access in Expo Go is limited (especially on Android), so for saving images use a development build:

```bash
npx expo run:android    # or: npx expo run:ios
```

> **Security warning:** every `EXPO_PUBLIC_*` variable is **inlined into the JavaScript bundle** at build time. Anyone who installs your app can extract the key. That is fine for learning and prototypes, but not for a published app. See [Production note](#production-note).

## Project structure

```
App.tsx                       # tiny route stack + Android back button
src/
├── api/nexwall.ts            # typed client, errors, quota store
├── components.tsx            # header, quota badge, error view, colors
├── saveWallpaper.ts          # download to cache + save to photo library
└── screens/
    ├── CategoriesScreen.tsx
    ├── WallpapersScreen.tsx  # FlatList pagination
    └── PreviewScreen.tsx
app.json                      # expo-media-library permission strings
.env.example                  # copy to .env
```

## API endpoints used

Base URL: `https://nexwall.kodnextech.com/api/developer/v1`

Every request sends `Authorization: Bearer <API_KEY>` and `Accept: application/json`.

| Endpoint | Used for |
| --- | --- |
| `GET /categories` | Category grid |
| `GET /wallpapers?page=&per_page=&category_id=&sort=&type=image` | Paginated wallpaper grid |
| `GET /categories/{categoryId}/wallpapers` | Available as `nexwall.getCategoryWallpapers()` |

`/wallpapers` also accepts `search` (2-100 characters, matches tags). `per_page` is 1-100 (default 50); this app uses 30. The API also has `GET /wallpapers/{id}` for a single wallpaper.

Full reference: [API docs](https://nexwall.kodnextech.com/wallpaper-api/docs) · [OpenAPI spec](https://nexwall.kodnextech.com/openapi.json) · [Sandbox](https://nexwall.kodnextech.com/wallpaper-api/sandbox)

## Rate limits & plans

| Plan | Price | Requests per day | Content |
| --- | --- | --- | --- |
| Free | Free, no credit card | 100 | Non-premium categories |
| Pro | ₹399 / $4.99 per month | 10,000 | |
| Ultra | ₹899 / $10.99 per month | 50,000 | Includes live (video) wallpapers |

- The free plan also allows up to 60 requests per minute.
- Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` and `X-Developer-Api-Plan` headers; the JSON body includes `plan` and `remaining_requests_today`.
- When you run out, the API returns **HTTP 429** with a `Retry-After` header. The app shows the wait time and does not retry on its own.
- Screens stay mounted when you go back, so returning to a list does not repeat requests.

## Production note

Do not ship your API key inside the app. Put a small **backend proxy** (a serverless function, Express route, Laravel route, etc.) between the app and NexWall:

1. The app calls your proxy, e.g. `https://your-server.example.com/nexwall/wallpapers?page=2`.
2. The proxy adds `Authorization: Bearer <key>` from a server-side secret and forwards the request.
3. Optionally cache `/categories` and popular pages on the proxy to save quota.

Then remove `EXPO_PUBLIC_NEXWALL_API_KEY` from `.env` and set `EXPO_PUBLIC_NEXWALL_BASE_URL` to your proxy URL. When a proxy URL is set, the client in `src/api/nexwall.ts` no longer requires a key and sends no `Authorization` header.

## Related starters

- [Flutter wallpaper app](https://github.com/kodnextechnologies/nexwall-flutter-wallpaper-app)
- [Android Kotlin wallpaper app (Jetpack Compose)](https://github.com/kodnextechnologies/nexwall-android-kotlin-wallpaper-app)
- [Python client and CLI with a daily wallpaper changer](https://github.com/kodnextechnologies/nexwall-python)

## License

The source code is released under the [MIT License](LICENSE).

Wallpaper images and videos returned by the API are **not** covered by the MIT license. Their use is governed by the [NexWall Developer API License](https://nexwall.kodnextech.com/wallpaper-api/license).

# Подключение собственного TonConnect bridge

Кошелёк ДАО Градосфера (`GradospheraWallet`) слушает SSE-мост, задаваемый `SSE_BRIDGE_URL` (`src/config.ts`).
Dapp'ы выбирают bridge из записи в [ton-connect/wallets-list](https://github.com/ton-connect/wallets-list), а не из конфига кошелька —
поэтому для работы «конца в конец» должны совпасть обе стороны.

Кошелёк автоматически распознаёт TonConnect universal-ссылку при запуске: при открытии
`https://gradosphera-wallet.vercel.app/ton-connect?v=...&id=...&r=...&ret=...`
приложение само вызывает `startSseConnection` и показывает экран подтверждения подключения
(`isUniversalTonConnectUrl` в `src/util/deeplink/index.ts`).

## Обязательное условие согласования

`device.appName`, который кошелёк шлёт в `ConnectEventSuccess`, берётся из `APP_NAME` (env).
По спецификации wallets-list `app_name` обязан быть равен `device.appName`. Дефолт в `src/config.ts` — `'MyTonWallet'`
(нижний регистр `'mytonwallet'`) — уже занят оригинальным кошельком, поэтому нужен уникальный идентификатор.
Для Кошелька ДАО Градосфера это `GradospheraWallet` → `app_name: "gradospherawallet"`.

Комбинация для деплоя (указать в Vercel Environment Variables):

| Переменная                | Значение                                                          |
|---------------------------|-------------------------------------------------------------------|
| `SSE_BRIDGE_URL`          | `https://gradosphera-tonconnect-bridge.dao-f7d.workers.dev/bridge/` (слэш обязателен) |
| `APP_NAME`                | `GradospheraWallet`                                                 |
| `TONCONNECT_UNIVERSAL_URL`| домен кошелька, если он отличен от дефолтного (см. ниже)           |
| `TONCONNECT_WALLET_JSBRIDGE_KEY` | глобал, который расширение инжектит в страницу dApp (`window.<key>`); по умолчанию `tonwallet` для `IS_CORE_WALLET=1`, иначе `mytonwallet`. Нужен только для сборки расширения — в записи списка кошельков блок `js` можно не указывать |
| `TONCONNECT_PROTOCOL_SELF` | deeplink-схема с `://`, по умолчанию `mytonwallet-tc://`. В нативных сборках схемы заданы в проектах iOS/Android, env на них не действует |
| `SELF_PROTOCOL`           | deeplink-схема с `://`, по умолчанию `mtw://`                     |
| `SELF_UNIVERSAL_URLS`     | universal-ссылки через пробел, по умолчанию `https://my.tt https://go.mytonwallet.org` |

Все эти переменные прокидываются через `EnvironmentPlugin` в `webpack.config.ts`, `webpack-electron.config.ts`
(схемы deeplink), `webpack-multisend.config.ts` и `webpack-giveaways.config.ts` (`APP_NAME`).

Без явного `SSE_BRIDGE_URL` при сборке подставляется дефолт `https://tonconnectbridge.mytonwallet.org/bridge/`
(кошелёк продолжает работать через мост оригинального MyTonWallet — безопасный режим по умолчанию).

## Как достигается `universal_url`

Запись использует `universal_url` с параметрами Ton Connect. Dapp открывает
`universal_url?<v|id|r|ret>`, в этой ссылке должен быть распознан deeplink.

В коде распознавание TonConnect-ссылок завязано на `TONCONNECT_UNIVERSAL_URL`
(`https://connect.mytonwallet.org`), `SELF_UNIVERSAL_URLS` и схемы `SELF_PROTOCOL`/`TONCONNECT_PROTOCOL_SELF`
в `src/util/deeplink/constants.ts` (и checkin.mytonwallet.org). Все эти значения выносятся в env,
поэтому варианта два:
- задать `TONCONNECT_UNIVERSAL_URL` (и, при необходимости, `SELF_UNIVERSAL_URLS`) на деплое — тогда
  наш `universal_url` распознаётся сразу, без правок кода;
- либо определить переводящий домен (аналог `connect.mytonwallet.*`) на деплой: отдельный Vercel-проект/Worker,
  который отдаёт `universal_url`-параметры.

Отдельно `isUniversalTonConnectUrl` (`src/util/deeplink/index.ts`) принимает любую ссылку с параметрами
`v`, `id`, `r` — то есть `https://<домен>/ton-connect` распознаётся как TonConnect-ссылка сам по себе.

`deepLink` на чисто web-кошелёк не работает (нет нативного приложения) — поле оставлено формальным,
реальная связка идёт через `universal_url`. Для нативной сборки схему надо ещё зарегистрировать
в `mobile/ios/App/App/Info.plist` (`CFBundleURLSchemes`) и `mobile/android/.../res/values/strings.xml`
(`custom_url_scheme_*`).

## Внутренние self-lookup кошелька

Поиск собственной записи в списке кошельков для кнопки «подключить кошелёк»:
- `src/multisend/index.tsx` — Mini-Send;
- `src/giveaways/index.tsx` — giveaways.

Оба ищут `walletInfo.appName === APP_NAME.toLowerCase()`, где `APP_NAME` берётся из env
(по умолчанию `MyTonWallet`). Поэтому при `APP_NAME=GradospheraWallet` нужно передать `APP_NAME`
и в сборки multisend/giveaways — иначе мини-приложения продолжат искать оригинального `mytonwallet`.

## Публикация

1. Задеплоить bridge (`cf-bridge/`, см. его README): `npx wrangler deploy`.
2. Проверить мост: `curl https://gradosphera-tonconnect-bridge.dao-f7d.workers.dev/bridge/events` → 400.
3. Собрать и задеплоить web-кошелёк с env из таблицы выше.
4. Залить `public/tonconnect-icon.png` (288×288, PNG, непрозрачный фон, без скруглений) на домен `image`.
   Это тот же логотип, что у жетона Благо.
5. Добавить запись из `gradosphera-wallet.json` **в конец** `wallets.json` (v2 → `wallets-v2.json`) PR'ом в `ton-connect/wallets-list`.

## Локальная проверка без публикации

Проверять связку можно через custom wallets list в dapp (SDK `ton-connect/ui` — `walletsListConfiguration`,
или ручной `WalletsListConfiguration` в `ton-connect/sdk`), где указать запись из `gradosphera-wallet.json`:
кошелёк откроется по `universal_url`, подпишется на наш bridge (`SSE_BRIDGE_URL`),
а dapp будет слать сообщения на URL из записи. Обе стороны должны указывать на один и тот же bridge.
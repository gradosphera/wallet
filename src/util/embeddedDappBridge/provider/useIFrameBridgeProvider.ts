import { useEffect, useRef } from '../../../lib/teact/teact';

import { EMBEDDED_DAPP_BRIDGE_CHANNEL } from '../../../config';
import { createReverseIFrameInterface } from '../../createPostMessageInterface';
import { buildBridgeApi } from './bridgeApi';

import useLastCallback from '../../../hooks/useLastCallback';

export function useIFrameBridgeProvider(pageUrl?: string) {
  const cleanupRef = useRef<NoneToVoidFunction>();
  const iframeRef = useRef<HTMLIFrameElement>();

  // Д-app внутри iframe может отправить `tonConnect:connect` сразу при своей
  // загрузке — РАНЬШЕ, чем родительское окно выполнит onLoad iframe и повесит
  // слушатель. Раньше слушатель вешался только в onLoad, поэтому ранние
  // сообщения терялись и кошелёк «не производил вывод подключения». Теперь
  // слушатель вешается СРАЗУ в useEffect (до загрузки iframe), а onLoad лишь
  // запоминает iframe — ответы уходят в его contentWindow через геттер.
  const setupDappBridge = useLastCallback((e) => {
    iframeRef.current = e.target as HTMLIFrameElement;
  });

  useEffect(() => {
    if (!pageUrl) return;

    cleanupRef.current = createReverseIFrameInterface(
      buildBridgeApi(pageUrl),
      new URL(pageUrl).origin,
      () => iframeRef.current?.contentWindow ?? undefined,
      EMBEDDED_DAPP_BRIDGE_CHANNEL,
    );

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    };
  }, [pageUrl]);

  return {
    setupDappBridge,
  };
}

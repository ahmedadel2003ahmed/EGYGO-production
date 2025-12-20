Error: [00:01:39:330 Agora-SDK [ERROR]: "[client-3b648] join number: 1, Joining channel failed, rollback" AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: flag: 4096, message: AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: invalid token, authorized failed
data: {"retry":false,"csIp":"103.198.202.62","desc":["invalid token, authorized failed"]}
    at createConsoleError (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/errors/console-error.js:27:71)
    at handleConsoleError (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/errors/use-error-handler.js:47:54)
    at console.error (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/globals/intercept-console-error.js:47:57)
    at Object.log (webpack-internal:///(app-pages-browser)/./node_modules/agora-rtc-sdk-ng/AgoraRTC_N-production.js:7:311660)
    at Object.error (webpack-internal:///(app-pages-browser)/./node_modules/agora-rtc-sdk-ng/AgoraRTC_N-production.js:7:310432)
    at RH.join (webpack-internal:///(app-pages-browser)/./node_modules/agora-rtc-sdk-ng/AgoraRTC_N-production.js:8:294855)
    at async initializeCall (webpack-internal:///(app-pages-browser)/./src/app/(pages)/call/[callId]/page.jsx:116:13)
    at async CallPage.useEffect.init (webpack-internal:///(app-pages-browser)/./src/app/(pages)/call/[callId]/page.jsx:54:25)


    AgoraRTCException: AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: flag: 4096, message: AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: invalid token, authorized failed

AgoraRTCException: AgoraRTCError OPERATION_ABORTED: cancel token canceled


Error: Error details: undefined
    at createConsoleError (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/errors/console-error.js:27:71)
    at handleConsoleError (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/errors/use-error-handler.js:47:54)
    at console.error (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/globals/intercept-console-error.js:47:57)
    at initializeCall (webpack-internal:///(app-pages-browser)/./src/app/(pages)/call/[callId]/page.jsx:149:21)
    at async CallPage.useEffect.init (webpack-internal:///(app-pages-browser)/./src/app/(pages)/call/[callId]/page.jsx:54:25)
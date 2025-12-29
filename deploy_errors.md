03:16:27.257 Running build in Washington, D.C., USA (East) – iad1
03:16:27.258 Build machine configuration: 2 cores, 8 GB
03:16:27.267 Cloning github.com/ebrahim-mamdoh/EGYGO (Branch: main, Commit: 400398d)
03:16:27.268 Skipping build cache, deployment was triggered without cache.
03:16:27.943 Cloning completed: 676.000ms
03:16:28.404 Running "vercel build"
03:16:28.827 Vercel CLI 50.1.3
03:16:29.186 Installing dependencies...
03:16:31.826 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
03:16:32.219 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
03:16:33.274 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
03:16:33.443 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
03:16:33.448 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
03:16:33.945 npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
03:16:36.976 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
03:16:43.882 
03:16:43.882 added 442 packages in 14s
03:16:43.883 
03:16:43.883 154 packages are looking for funding
03:16:43.883   run `npm fund` for details
03:16:43.941 Detected Next.js version: 15.3.0
03:16:43.946 Running "npm run build"
03:16:44.043 
03:16:44.044 > EGYGO@0.1.0 build
03:16:44.044 > next build
03:16:44.044 
03:16:44.610 Attention: Next.js now collects completely anonymous telemetry regarding usage.
03:16:44.610 This information is used to shape Next.js' roadmap and prioritize features.
03:16:44.611 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
03:16:44.611 https://nextjs.org/telemetry
03:16:44.611 
03:16:44.667    ▲ Next.js 15.3.0
03:16:44.668 
03:16:44.691    Creating an optimized production build ...
03:17:13.766  ✓ Compiled successfully in 25.0s
03:17:13.769    Linting and checking validity of types ...
03:17:17.175 
03:17:17.175 Failed to compile.
03:17:17.175 
03:17:17.175 ./src/app/(pages)/AboutUs/page.jsx
03:17:17.175 134:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.175 
03:17:17.175 ./src/app/(pages)/ExploreDestinations/page.jsx
03:17:17.175 261:25  Error: Component definition is missing display name  react/display-name
03:17:17.175 303:25  Error: Component definition is missing display name  react/display-name
03:17:17.175 
03:17:17.175 ./src/app/(pages)/Governorate/page.jsx
03:17:17.176 43:49  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
03:17:17.176 
03:17:17.176 ./src/app/(pages)/call/[callId]/call_oldProject.jsx
03:17:17.176 4:12  Error: Parsing error: Unexpected token, expected "from" (4:12)
03:17:17.176 
03:17:17.176 ./src/app/(pages)/call/[callId]/page.jsx
03:17:17.176 59:6  Warning: React Hook useEffect has missing dependencies: 'cleanup' and 'initializeCall'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
03:17:17.176 
03:17:17.176 ./src/app/(pages)/create-trip/[tripId]/select-guide/page.jsx
03:17:17.176 38:6  Warning: React Hook useEffect has missing dependencies: 'auth?.loading' and 'auth?.token'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
03:17:17.176 349:29  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.176 
03:17:17.176 ./src/app/(pages)/create-trip/page.jsx
03:17:17.176 75:6  Warning: React Hook useEffect has a missing dependency: 'FALLBACK_GOVERNORATES'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
03:17:17.176 
03:17:17.176 ./src/app/(pages)/my-trips/page.jsx
03:17:17.177 151:6  Warning: React Hook useEffect has a missing dependency: 'trips'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
03:17:17.177 423:31  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.178 
03:17:17.178 ./src/app/(pages)/place/[id]/page.jsx
03:17:17.178 133:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.178 321:29  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.178 360:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.178 387:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.181 437:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.181 
03:17:17.181 ./src/app/admin/guides/[id]/page.jsx
03:17:17.181 122:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.181 220:49  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
03:17:17.181 
03:17:17.181 ./src/app/components/LoginModal.jsx
03:17:17.181 27:8  Warning: React Hook useEffect has a missing dependency: 'formik'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
03:17:17.181 193:32  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
03:17:17.181 
03:17:17.181 ./src/app/components/RegisterModal.jsx
03:17:17.181 26:8  Warning: React Hook useEffect has a missing dependency: 'formik'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
03:17:17.181 
03:17:17.181 ./src/app/components/RevealOnScroll.jsx
03:17:17.181 30:21  Warning: The ref value 'ref.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'ref.current' to a variable inside the effect, and use that variable in the cleanup function.  react-hooks/exhaustive-deps
03:17:17.181 
03:17:17.181 ./src/components/trip/LocationPicker.jsx
03:17:17.181 98:6  Warning: React Hook useEffect has a missing dependency: 'selectedLocation'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
03:17:17.181 
03:17:17.181 ./src/components/trip/TripModal.jsx
03:17:17.181 68:6  Warning: React Hook React.useEffect has a missing dependency: 'FALLBACK_GOVERNORATES'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
03:17:17.181 
03:17:17.181 info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
03:17:17.208 Error: Command "npm run build" exited with 1
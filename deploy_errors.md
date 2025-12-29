
Failed to compile.
./src/app/(pages)/AboutUs/page.jsx
134:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
./src/app/(pages)/ExploreDestinations/page.jsx
261:25  Error: Component definition is missing display name  react/display-name
303:25  Error: Component definition is missing display name  react/display-name
./src/app/(pages)/Governorate/page.jsx
43:49  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
./src/app/(pages)/call/[callId]/call_oldProject.jsx
4:12  Error: Parsing error: Unexpected token, expected "from" (4:12)
./src/app/components/LoginModal.jsx
27:8  Warning: React Hook useEffect has a missing dependency: 'formik'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
193:32  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
./src/app/components/RegisterModal.jsx
26:8  Warning: React Hook useEffect has a missing dependency: 'formik'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
./src/app/components/RevealOnScroll.jsx
30:21  Warning: The ref value 'ref.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'ref.current' to a variable inside the effect, and use that variable in the cleanup function.  react-hooks/exhaustive-deps
./src/components/trip/LocationPicker.jsx
98:6  Warning: React Hook useEffect has a missing dependency: 'selectedLocation'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
./src/components/trip/TripModal.jsx
68:6  Warning: React Hook React.useEffect has a missing dependency: 'FALLBACK_GOVERNORATES'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
Error: Command "npm run build" exited with 1
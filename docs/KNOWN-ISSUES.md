# Known issues & limits (demo honesty)

Use this in **Q&A** and internal prep. Update after every dry run.

## External dependencies

- **TinyFish / pharmacy sites** can be **slow**, **rate-limit**, or **change HTML** without notice.  
- **Proxies** (e.g. Bright Data) affect reliability and cost if misconfigured.

## Environment

- **`CORS_ORIGINS`** must include the **exact** browser origin (scheme + host + port). Missing → browser blocks API calls.  
- **`NEXT_PUBLIC_API_URL`** is baked at **Next build**; change → **rebuild** frontend.  
- **SQLite** on Railway (default) is **ephemeral** unless you attach a **volume**.

## Product / UX

- Not all strings are **i18n**-wired in every sub-component.  
- **Charts / Recharts** may warn about container size during SSR or small viewports.  
- **Voice search** depends on **browser Web Speech API** (often **Chrome**, **vi-VN**).

## Legal / ethics (talk track)

- **Research / hackathon** use; respect **robots.txt**, **terms of service**, and **rate limits** for any production path.  
- Not medical advice; **pricing only**.

## Open bugs (fill as you find)

| Date | Symptom | Workaround |
|------|---------|------------|
| | | |

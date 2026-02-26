# Security

## Threat Model

Prism is a read-only browser extension that makes zero network requests. The primary security considerations are data privacy and extension permissions.

## Permissions

| Permission | Reason | Risk |
|-----------|--------|------|
| `tabs` | Read URL on navigation for source matching | Can see all URLs visited. Mitigated: data stays local, no transmission. |
| `storage` | Store user settings | Low risk. Small data. |
| `alarms` | Weekly notification scheduling | No risk. |
| `notifications` | Deliver weekly media report | Low risk. User-dismissable. |
| `sidePanel` | Display full dashboard | No risk. |

### Permissions NOT requested
- No `<all_urls>` or host permissions
- No content scripts
- No `webRequest` or `declarativeNetRequest`
- No `cookies`, `history`, or `bookmarks`
- No remote code loading

## Data Storage

- **Reading records**: stored in IndexedDB (`prism` database). Contains URL, domain, title, timestamp, bias rating, credibility score, source name.
- **Settings**: stored in `chrome.storage.local`. Contains period preference and notification toggle.
- **No data is ever transmitted.** The extension makes zero fetch/XHR/WebSocket calls.

## Data Retention

- Records older than 90 days are automatically pruned (daily alarm check).
- Users can clear all data at any time from the side panel dashboard.
- Uninstalling the extension removes all data.

## Source Database

The MBFC source database is bundled as static JSON at build time. It is not fetched from any remote server. Updates require a new extension version.

## Content Security Policy

Default MV3 CSP applies. No inline scripts, no eval, no remote code.

## Supply Chain

- Dependencies: `idb` (IndexedDB wrapper, well-maintained, minimal)
- Dev dependencies: `esbuild`, `sharp`, `typescript`, `@types/chrome`
- All dependencies are pinned in `package-lock.json`

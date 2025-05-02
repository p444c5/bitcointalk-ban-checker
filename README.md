# Bitcointalk-ban-checker

## Key Features

*   **Banned User Highlighting:** Automatically scans BitcoinTalk forum threads and user profiles (`action=profile`) for usernames present in a known banned list.
*   **Visual Indicators:** Applies distinct styling (red color, strikethrough) and adds a "[BANNED]" label next to the usernames of identified banned users.
*   **External List Source:** Fetches the list of banned users (expected format: `userId:username`) from `https://loyce.club/bans/usernames.txt`.
*   **Efficient Caching (Extension):** The browser extension caches the fetched banned list for 24 hours to reduce redundant requests and improve performance.
*   **Toggle Functionality (Extension):** Easily enable or disable the highlighting feature via the extension's toolbar icon when viewing `bitcointalk.org`. The state (enabled/disabled) is remembered.
*   **Cross-Browser Compatibility (Extension):** Designed to work on both Chrome (and Chromium-based browsers) and Firefox.
*   **User Script Adaptable:** The core content script logic for identifying and styling users can be extracted and used within user script managers like Tampermonkey or Greasemonkey.

## How it Works

1.  **Fetching (Extension):** The extension's background script periodically fetches the list of banned users from the specified URL and caches it.
2.  **Requesting (Extension):** When you visit a BitcoinTalk page, the content script requests the cached list from the background script.
3.  **Scanning:** The content script scans the page content (posts, profile information) for usernames.
4.  **Matching & Styling:** It compares found usernames against the banned list. If a match is found and the feature is enabled, the script applies the visual highlighting.

## Installation

*   **Browser Extension:**
    *   Load the extension directory as an unpacked extension via your browser's extension management page (`chrome://extensions` or `about:debugging`).
*   **User Script (Adaptation):**
    *   Requires a user script manager (e.g., Tampermonkey, Greasemonkey).
    *   Adapt the `bitcointalk-ban-checker-userscript.user` logic into a new user script, ensuring it includes the necessary `@match` directive for `*://bitcointalk.org/*` and 
        potentially `@grant` directives if needing to fetch the list directly or store state.

## Notes

*   The accuracy of the highlighting depends entirely on the content and format of the list provided at `https://loyce.club/bans/usernames.txt`.
*   The extension requires permissions to access `bitcointalk.org` and `loyce.club`, store user preferences (`storage`), and interact with tabs (`tabs`, `scripting`, `activeTab`).

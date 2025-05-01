// ==UserScript==
// @name         Bitcointalk Banned user Checker
// @namespace    http://tampermonkey.net/
// @version      0.3 // Consider incrementing version
// @description  Checks if a user is banned on Bitcointalk
// @author       promise444c5
// @match        https://bitcointalk.org/index.php?action=profile*
// @match        https://bitcointalk.org/index.php?topic=*
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @resource     bannedUsersList https://your-external-website.com/path/to/banned_users.txt // <-- Replace with the actual external URL
// @updateURL    https://raw.githubusercontent.com/YourUsername/YourRepositoryName/main/bitcointalk-ban-checker-userscript.user.js // Optional: Keep or remove if not using GitHub for the script itself
// @downloadURL  https://raw.githubusercontent.com/YourUsername/YourRepositoryName/main/bitcointalk-ban-checker-userscript.user.js // Optional: Keep or remove if not using GitHub for the script itself
// ==/UserScript==

(function() {
    'use strict';

    // Fetchs the content of the file specified by @resource bannedUsersList
    // GM_getResourceText bypasses standard CORS for @resource URLs... 
    const bannedUsersText = GM_getResourceText("bannedUsersList");
    const bannedUsers = {};

    // Parse the text content line by line
    bannedUsersText.split('\n').forEach(line => {
        const [userId, username] = line.trim().split(':'); 
        // Store username and userId in the bannedUsers object, keyed by username
        if (username && userId) {
            bannedUsers[username] = userId;
        }
    });
    console.log("Loaded banned users:", bannedUsers); // Log loaded users for debugging

    const currentUrl = window.location.href;
    const isProfilePage = currentUrl.includes('action=profile');
    const isThreadPage = currentUrl.includes('topic=');

    // Add CSS style to the page
    const style = document.createElement('style');
    style.textContent = `
      .banned-user {
        text-decoration: line-through;
        color: red;
        position: relative;
      }

      .banned-label {
        background-color: red;
        color: white;
        font-size: 10px;
        padding: 1px 3px;
        border-radius: 3px;
        margin-left: 5px;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);


    if (isProfilePage) {
        // Logic for profile pages
        let profileUsernameElement = $('td.caption_top:contains("Username:")').next('td');
        let profileUsername = profileUsernameElement.text().trim();

        if (bannedUsers[profileUsername]) {
            // let banUserId = bannedUsers[profileUsername]; // Get the stored userId
            // let banMessage = `User ${profileUsername} is banned. (User ID: ${banUserId})`; // Adjusted message
            let banMessage = `User ${profileUsername} is listed as banned.`; // Simplified message
            let banStatusElement = $('<div style="color: red; font-weight: bold; margin-top: 5px;"></div>').text(banMessage);
            profileUsernameElement.closest('tr').after($('<tr>').append($('<td colspan="2">').append(banStatusElement)));

            // Apply CSS style to the username
            profileUsernameElement.addClass('banned-user');
            profileUsernameElement.wrap('<span style="position: relative;"></span>');
            profileUsernameElement.after('<span class="banned-label">BANNED</span>');
        }

    } else if (isThreadPage) {
    
        function checkBannedUsersOnThread() {
            console.log("Bitcointalk Ban Checker: Running check on thread page");
            const postElements = document.querySelectorAll(".windowbg, .windowbg2");
            let bannedFound = 0;

            postElements.forEach((post) => {
                const usernameElement = post.querySelector(".poster_info b a");
                if (!usernameElement) return;

                const username = usernameElement.textContent.trim();

                if (bannedUsers[username]) { 
                    // Mark the username as banned
                    if (!usernameElement.classList.contains('banned-user')) {
                        usernameElement.classList.add("banned-user");

                        // create a label next to the username
                        if (!usernameElement.nextElementSibling || !usernameElement.nextElementSibling.classList.contains("banned-label")) {
                            const bannedLabel = document.createElement("span");
                            bannedLabel.textContent = "BANNED";
                            bannedLabel.classList.add("banned-label");
                            // Insert after the <a> tag
                            usernameElement.parentNode.insertBefore(bannedLabel, usernameElement.nextSibling);
                            bannedFound++;
                        }
                    }
                }
            });
            if (bannedFound > 0) {
                console.log(`Bitcointalk Ban Checker: Found ${bannedFound} banned users on this page`);
            }
        }

        // Initial check
        checkBannedUsersOnThread();

        // Watch for dynamic content changes (like AJAX-loaded posts)
        const observer = new MutationObserver(function (mutations) {
             // Check only if new nodes were added that might contain posts
             let checkNeeded = false;
             for (const mutation of mutations) {
                 if (mutation.addedNodes.length > 0) {
                     checkNeeded = true;
                     break;
                 }
             }
             if (checkNeeded) {
                 checkBannedUsersOnThread();
             }
        });

        // Start observing changes to the body content
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

})();

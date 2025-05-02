// ==UserScript==
// @name         Bitcointalk Banned Users Checker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Checks if a user is banned on Bitcointalk
// @author       promise444c5
// @match        https://bitcointalk.org/index.php?action=profile*
// @match        https://bitcointalk.org/index.php?topic=*
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @resource     bannedUsersList https://loyce.club/bans/usernames.txt
// ==/UserScript==

(function() {
    'use strict';

    const bannedUsers = []; 
    let resourceError = false;

    try {
        // Fetch the content of the file specified by @resource bannedUsersList
        const bannedUsersText = GM_getResourceText("bannedUsersList");

        if (!bannedUsersText) {
            console.error("Bitcointalk Ban Checker: Failed to load banned users list. Resource might be unavailable or empty.");
            resourceError = true;
        } else {
            // Parse the text content line by line
            bannedUsersText.split('\n').forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    const parts = trimmedLine.split(':');
                    // Expecting format: userId:username
                    if (parts.length === 2 && parts[0] && parts[1]) {
                        const userId = parts[0].trim(); 
                        const username = parts[1].trim(); 
                        bannedUsers.push({ username: username, userId: userId }); // Push object to array
                    } else {
                        console.warn(`Bitcointalk Ban Checker: Skipping malformed line: ${trimmedLine}`);
                    }
                }
            });

            console.log(`Bitcointalk Ban Checker: Loaded ${bannedUsers.length} banned users.`);
            console.log("First 5 loaded users:", bannedUsers.slice(0, 5)); // Optional: for debugging,if you see this: i forgot to remove it

        }
    } catch (e) {
        console.error("Bitcointalk Ban Checker: Error processing banned users list.", e);
        resourceError = true;
    }

    // If the resource failed to load, don't proceed further
    if (resourceError) {
        console.error("Bitcointalk Ban Checker: Aborting script due to resource loading error.");
        alert("Bitcointalk Ban Checker: Could not load the banned users list. Please check the script's resource URL.");
        return;
    }

    const currentUrl = window.location.href;
    const isProfilePage = currentUrl.includes('action=profile');
    const isThreadPage = currentUrl.includes('topic=');

    // Add CSS style to the page
    const style = document.createElement('style');
    style.textContent = `
      .banned-user-text {
        text-decoration: line-through;
        color: red;
      }

      .banned-label {
        background-color: red;
        color: white;
        font-size: 10px;
        padding: 1px 3px;
        border-radius: 3px;
        margin-left: 5px;
        font-weight: bold;
        display: inline-block;
        vertical-align: middle;
      }
    `;
    document.head.appendChild(style);


    if (isProfilePage) {
        console.log("Bitcointalk Ban Checker: Running on profile page.");
        let profileUsernameElement = null;
        // Find the 'Name:' cell and get the next sibling cell which contains the username
        document.querySelectorAll('td.windowbg table td').forEach(td => {
            const boldElement = td.querySelector('b');
            if (boldElement && boldElement.textContent.trim() === 'Name:') {
                profileUsernameElement = td.nextElementSibling;
                console.log("Bitcointalk Ban Checker: Found potential username TD element.");
            }
        });


        if (profileUsernameElement) {
            let profileUsername = profileUsernameElement.textContent.trim();
            console.log(`Bitcointalk Ban Checker: Checking profile username: ${profileUsername}`);

            // Check if the username exists in the bannedUsers array
            const isBanned = bannedUsers.find(user => user.username === profileUsername);

            if (isBanned) {
                console.log(`Bitcointalk Ban Checker: User ${profileUsername} IS BANNED.`);
                let banMessage = `User ${profileUsername} is listed as banned.`;

                // Create and insert the ban status message below the username row
                let banStatusElement = document.createElement('div');
                banStatusElement.style.color = 'red';
                banStatusElement.style.fontWeight = 'bold';
                banStatusElement.style.marginTop = '5px';
                banStatusElement.textContent = banMessage;

                let usernameRow = profileUsernameElement.closest('tr');
                if (usernameRow && usernameRow.parentNode) {
                    let newRow = document.createElement('tr');
                    let newCell = document.createElement('td');
                    newCell.colSpan = 2; 
                    newCell.appendChild(banStatusElement);
                    newRow.appendChild(newCell);
                    usernameRow.parentNode.insertBefore(newRow, usernameRow.nextSibling);
                    console.log("Bitcointalk Ban Checker: Inserted ban status message row.");
                } else {
                     console.warn("Bitcointalk Ban Checker: Could not find username row to insert message.");
                }


                // Check if label already exists to prevent duplicates on potential re-runs (though unlikely on profile)
                if (!profileUsernameElement.querySelector('.banned-label')) {
                    const bannedLabel = document.createElement("span");
                    bannedLabel.textContent = "BANNED";
                    bannedLabel.classList.add("banned-label");
                    // Append the label to the TD containing the username
                    profileUsernameElement.appendChild(bannedLabel);
                    console.log("Bitcointalk Ban Checker: Appended BANNED label to username TD.");
                    // The following lines attempt to wrap the text and re-append the label,
                    profileUsernameElement.childNodes[0].nodeValue = profileUsernameElement.childNodes[0].nodeValue + ' '; // Add space before label - This assumes first child is text node
                    profileUsernameElement.innerHTML = `<span class="banned-user-text">${profileUsername}</span>`; // Wrap text - This overwrites existing content including the label just added
                    profileUsernameElement.appendChild(bannedLabel); 
                }

            } else {
                 console.log(`Bitcointalk Ban Checker: User ${profileUsername} is not listed as banned.`);
            }
        } else {
            console.log("Bitcointalk Ban Checker: Could not find username element on profile page using the 'Name:' label.");
        }

    } else if (isThreadPage) {
        console.log("Bitcointalk Ban Checker: Running on thread page.");
        function checkBannedUsersOnThread() {
            const postElements = document.querySelectorAll(".windowbg, .windowbg2");
            let bannedFound = 0;

            postElements.forEach((post) => {
                const usernameElement = post.querySelector(".poster_info b a");
                if (!usernameElement) return;

                // Check if style already applied to prevent redundant checks/updates
                if (usernameElement.style.textDecoration === 'line-through') return;

                const username = usernameElement.textContent.trim();

                // Check if the username exists in the bannedUsers array
                const isBanned = bannedUsers.find(user => user.username === username);

                if (isBanned) {
                    // Apply styles directly to the <a> tag
                    usernameElement.style.textDecoration = 'line-through';
                    usernameElement.style.color = 'red';

                    // create a label next to the username link
                    if (!usernameElement.parentNode.querySelector(".banned-label")) {
                        const bannedLabel = document.createElement("span");
                        bannedLabel.textContent = "BANNED";
                        bannedLabel.classList.add("banned-label");
                        usernameElement.parentNode.insertBefore(bannedLabel, usernameElement.nextSibling);
                        bannedFound++;
                        console.log(`Bitcointalk Ban Checker: Added BANNED label for ${username}.`);
                    }
                }
            });
            if (bannedFound > 0) {
                console.log(`Bitcointalk Ban Checker: Found ${bannedFound} banned occurence`);
            }
        }

        // Initial check
        checkBannedUsersOnThread();

    }

})();

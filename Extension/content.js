// Initialize browser API compatibility layer
const browserAPI = typeof browser !== "undefined" ? browser : chrome;
// Initialize banned users data structures
let Banned = [];
let bannedUsernamesSet = new Set(); //set for fast lookups


// Function to request banned users from the background script
function requestBannedUsers() {
  console.log("Bitcoin Forum Ban Checker: Requesting banned users from background script...");
  browserAPI.runtime.sendMessage({ action: 'getBannedUsers' }, (response) => {
    if (browserAPI.runtime.lastError) {
      console.error("Error requesting banned users:", browserAPI.runtime.lastError);
      Banned = []; // Use empty list on error
      bannedUsernamesSet = new Set(); // Clear the set as well
    } else if (response && response.bannedUsers) {
      Banned = response.bannedUsers;
      // Create a Set of usernames for efficient lookups
      bannedUsernamesSet = new Set(Banned.map(user => user.username));
      console.log(`BitcoinTalk Ban Checker: Successfully received ${Banned.length} banned users`);
      // console.log("First 5 banned users:", Banned.slice(0, 5)); // for debugging
      // Check for banned users after receiving the list
      if (isEnabled) {
        checkBannedUsers();
      }
    } else {
      console.error("Received invalid response from background script.");
      Banned = []; // Use empty list on invalid response
      bannedUsernamesSet = new Set(); // Clear the set
    }
    // future use:if (bannedListElement) { /* updates  ui element */ }
  });
}

// Add CSS styles for banned users
const style = document.createElement("style");
style.textContent = `
  a.banned-user {
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

let isEnabled = false; // Default state is off

// Function to check if a user is banned
function checkBannedUsers() {
  // Only run if the feature is enabled and the list is loaded (Set has items)
  if (!isEnabled || bannedUsernamesSet.size === 0) {
    // Optionally log if the list isn't ready yet
    if (isEnabled && bannedUsernamesSet.size === 0) {
        console.log("Bitcoin Forum Ban Checker: Banned user list not yet loaded or empty. Check will run once loaded.");
    }
    return;
  }

  console.log("Bitcoin Forum Ban Checker: Running check for banned users");

  // Check if it's a profile page
  const isProfilePage = window.location.search.includes("action=profile");
  let bannedFound = 0;

  if (isProfilePage) {
    // Handle profile page - Slightly refined query
    let profileUsernameElement = null;
    let username = null;
    const nameLabelTd = Array.from(document.querySelectorAll('td > b')).find(b => b.textContent.trim() === 'Name:')?.parentElement;

    if (nameLabelTd && nameLabelTd.nextElementSibling && nameLabelTd.nextElementSibling.tagName === 'TD') {
        profileUsernameElement = nameLabelTd.nextElementSibling; 
        // Get username from the correct place 
        const usernameSpan = profileUsernameElement.querySelector("span:not(.banned-label)");
        username = usernameSpan ? usernameSpan.textContent.trim() : profileUsernameElement.textContent.trim();
        console.log("Bitcoin Forum Ban Checker: Found 'Name:' label and username TD on profile page.");
    }


    if (profileUsernameElement && username) {
      console.log(`Bitcoin Forum Ban Checker: Checking profile username: ${username}`);
      // Check if the username exists in the Set
      const isBanned = bannedUsernamesSet.has(username);

      if (isBanned) {
        // Check if label already exists next to the username TD
        if (!profileUsernameElement.querySelector(".banned-label")) { // Check inside the TD
          // Ensure we don't re-wrap the username if already done
          if (!profileUsernameElement.querySelector("span:not(.banned-label)")) {
            const usernameText = profileUsernameElement.textContent.trim(); // Get existing text
            profileUsernameElement.textContent = ''; // Clear the TD

            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = usernameText;
            profileUsernameElement.appendChild(usernameSpan); // Add span first
          }

          // Style the username span (which should now exist)
          const usernameSpanElement = profileUsernameElement.querySelector("span:not(.banned-label)");
          if (usernameSpanElement) {
            usernameSpanElement.style.textDecoration = 'line-through';
          }

          // Add the banned label
          const bannedLabel = document.createElement("span");
          bannedLabel.textContent = "BANNED";
          bannedLabel.classList.add("banned-label");
          profileUsernameElement.appendChild(bannedLabel);

          profileUsernameElement.style.color = "red"; // Style the TD text color

          bannedFound++;
          console.log(
            `Bitcoin Forum Ban Checker: Found banned user on profile page: ${username}`
          );
        }
      }
    } else {
        console.log("Bitcoin Forum Ban Checker: Could not find username element on profile page using expected structure.");
    }
  } else {
    // Handle forum threads (existing logic)
    const postElements = document.querySelectorAll(".windowbg, .windowbg2");

    postElements.forEach((post) => {
      // Try to find the username in each post
      const usernameElement = post.querySelector(".poster_info b a");
      if (!usernameElement) return;

      const username = usernameElement.textContent;

      // Check if user is in banned list using the Set
      const isBanned = bannedUsernamesSet.has(username);

      if (isBanned) {
        // Mark the username as banned
        usernameElement.classList.add("banned-user");

        // create a label next to the username
        if (
          !usernameElement.nextElementSibling ||
          !usernameElement.nextElementSibling.classList.contains("banned-label")
        ) {
          const bannedLabel = document.createElement("span");
          bannedLabel.textContent = "BANNED";
          bannedLabel.classList.add("banned-label");
          usernameElement.parentNode.insertBefore(
            bannedLabel,
            usernameElement.nextSibling
          );
          bannedFound++;
        }
      }
    });
  }

  if (!isProfilePage) {
    console.log(
      `Bitcoin Forum Ban Checker: Found ${bannedFound} banned users on thread page`
    );
  }
}

// Function to toggle the ban checker on and off
function toggleBanChecker(enabled) {
  isEnabled = enabled;

  if (isEnabled) {
    // Re-check immediately when enabled
    checkBannedUsers();
    console.log("Bitcoin Forum Ban Checker: Enabled");
  } else {
    // Remove all ban styling from posts
    const bannedUsers = document.querySelectorAll(".banned-user");
    const bannedLabels = document.querySelectorAll(".banned-label");

    bannedUsers.forEach((element) => {
      element.classList.remove("banned-user"); 
    });

    bannedLabels.forEach((element) => {
      element.remove();
    });

    // Remove styling from profile page username if present
    const nameLabelTd = Array.from(document.querySelectorAll('td > b')).find(b => b.textContent.trim() === 'Name:')?.parentElement;
    let profileUsernameElement = null;

    if (nameLabelTd && nameLabelTd.nextElementSibling && nameLabelTd.nextElementSibling.tagName === 'TD') {
        profileUsernameElement = nameLabelTd.nextElementSibling; 
    }

    if (profileUsernameElement) {
      profileUsernameElement.style.color = ""; // Reset TD color

      // Find the username span if it exists and remove its decoration
      const usernameSpan = profileUsernameElement.querySelector("span:not(.banned-label)"); // Find the span that isn't the label
      if (usernameSpan) {
          usernameSpan.style.textDecoration = ""; 
      }

      // Remove the label if it exists within the TD
      const profileBannedLabel = profileUsernameElement.querySelector(".banned-label");
      if (profileBannedLabel) {
        profileBannedLabel.remove();
      }

    }

    console.log("Bitcoin Forum Ban Checker: Disabled");
  }
}

// Check for stored state and initialize
browserAPI.storage.sync.get(["banCheckerEnabled"], function (result) {
  isEnabled = result.banCheckerEnabled === true;

  // Request banned users from background script
  /* Remove periodic refresh - background script handles updates*/
  requestBannedUsers();

});



// Listen for messages from the extension popup or background script
browserAPI.runtime.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.action === "checkBannedUsers") {
    checkBannedUsers();
    sendResponse({ status: "Check complete" });
  } else if (request.action === "toggleBanChecker") {
    toggleBanChecker(request.enabled);
    sendResponse({ status: "Toggle complete", enabled: isEnabled });
  } else if (request.action === "getStatus") {
    sendResponse({ enabled: isEnabled });
  }
  return true; // Keeps the message channel open for async responses
});

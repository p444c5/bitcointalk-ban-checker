const bannedListElement = document.getElementById("bannedList");
// Initialize browser API compatibility layer
const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const currentUpdate = "26-April-2025";
// Initialize banned users array
let Banned = [];

// Load banned users from local text file
function loadBannedUsers() {
  console.log(
    "Bitcoin Forum Ban Checker: Loading banned users from local file..."
  );

  fetch(browserAPI.runtime.getURL("banned_users.txt"))
    .then((response) => response.text())
    .then((data) => {
      // Parse each line and extract usernames
      Banned = data
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          // Each line format: username:id
          return line.split(":")[0];
        });

      console.log(
        `BitcoinTalk Ban Checker: Successfully loaded ${Banned.length} banned users from local file`
      );
      // Display the number of banned users in the UI
      if (Banned) {
        Placeholder.textContent = `current update is at ${currentUpdate}`;
        Placeholder.style.color = "green";
        userText.textContent = `Successfully loaded ${Banned.length} banned users from local file`;
        userText.style.color = "red";
        userText.style.textDecoration = "line-through";
        bannedListElement.appendChild(userText);
        bannedListElement.appendChild(Placeholder);
      }
      // Check for banned users after loading the list
      if (isEnabled) {
        checkBannedUsers();
      }
    })
    .catch((error) => {
      console.error("Error loading banned users from file:", error);
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
  // Only run if the feature is enabled
  if (!isEnabled) {
    return;
  }

  console.log("Bitcoin Forum Ban Checker: Running check for banned users");

  // Find all user posts
  const postElements = document.querySelectorAll(".windowbg, .windowbg2");
  let bannedFound = 0;

  postElements.forEach((post) => {
    // Try to find the username in each post
    const usernameElement = post.querySelector(".poster_info b a");
    if (!usernameElement) return;

    const username = usernameElement.textContent;

    // Check if user is in banned list
    if (Banned.includes(username)) {
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

  console.log(`Bitcoin Forum Ban Checker: Found ${bannedFound} banned users`);
}

// Function to toggle the ban checker on and off
function toggleBanChecker(enabled) {
  isEnabled = enabled;

  if (isEnabled) {
    checkBannedUsers();
    console.log("Bitcoin Forum Ban Checker: Enabled");
  } else {
    // Remove all ban styling
    const bannedUsers = document.querySelectorAll(".banned-user");
    const bannedLabels = document.querySelectorAll(".banned-label");

    bannedUsers.forEach((element) => {
      element.classList.remove("banned-user");
    });

    bannedLabels.forEach((element) => {
      element.remove();
    });

    console.log("Bitcoin Forum Ban Checker: Disabled");
  }
}

// Check for stored state and initialize
browserAPI.storage.sync.get(["banCheckerEnabled"], function (result) {
  isEnabled = result.banCheckerEnabled === true;

  // Load banned users from local file
  loadBannedUsers();

  // Set up a periodic refresh (every 24 hours)
  setInterval(loadBannedUsers, 24 * 60 * 60 * 1000);
});

// Watch for dynamic content changes (like AJAX-loaded posts)
const observer = new MutationObserver(function (mutations) {
  checkBannedUsers();
});

// Start observing changes to the body content
observer.observe(document.body, {
  childList: true,
  subtree: true,
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
  return true; // Keep the message channel open for async responses
});

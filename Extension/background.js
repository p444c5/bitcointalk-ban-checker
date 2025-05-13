/* 
** Background script for the Bitcointalk Ban Checker extension..
*/

// Initialize browser API compatibility layer
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let bannedUsersCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000 * 24; // Cache for 1day (24 hours)

// Function to fetch banned users
async function fetchBannedUsers() {
  const now = Date.now();
  // Check cache first
  if (now - lastFetchTime < CACHE_DURATION && bannedUsersCache.length > 0) {
    console.log("Returned cached banned users.");
    return bannedUsersCache;
  }

  console.log("Fetching banned users from loyce.club...");
  try {
    const response = await fetch('https://loyce.club/bans/usernames.txt'); 
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    
    // Process the text 
    const parsedUsers = text.split('\n')
      .map(line => line.trim()) 
      .filter(line => line) // Filter out empty lines
      .map(line => {
        const parts = line.split(':');
        if (parts.length === 2 && parts[0] && parts[1]) {
          return { userId: parts[0].trim(), username: parts[1].trim() };
        } else {
          console.warn(`Bitcointalk Ban Checker: Skipping malformed line (expected userId:username): ${line}`);
          return null; // Return null for invalid lines
        }
      })
      .filter(user => user !== null); // Filter out the null entries from malformed lines

    bannedUsersCache = parsedUsers; // Update the cache
    lastFetchTime = now;
    console.log(`Fetched ${bannedUsersCache.length} banned users.`);
    return bannedUsersCache; // Return the newly fetched list
  } catch (error) {
    console.error("Failed to fetch banned users:", error);
    // Return the potentially stale cache or an empty array if fetch fails
    return bannedUsersCache.length > 0 ? bannedUsersCache : [];
  }
}

// Listen for installation
browserAPI.runtime.onInstalled.addListener(function() {
  console.log("Bitcointalk Ban Checker installed!");
  // Initialize storage with default values
  browserAPI.storage.sync.set({ banCheckerEnabled: false });
});

// Function to update icon based on enabled state, ...to be worked on 
function updateIcon(enabled) {
  const path = enabled ? {
    16: "images/image1.png",
    48: "images/image2.png",
    128: "images/image3.png"
  } : {
    16: "images/image1.png",
    48: "images/image2.png",
    128: "images/image3.png"
  };
  
  if (browserAPI.action) {
    // MV3 style for Chrome
    browserAPI.action.setIcon({ path: path });
  } else if (browserAPI.browserAction) {
    // MV2 style for Firefox
    browserAPI.browserAction.setIcon({ path: path });
  }
}

// Initialize extension state and fetch initial list
browserAPI.storage.sync.get(['banCheckerEnabled'], function(result) {
  const enabled = result.banCheckerEnabled === true;
  updateIcon(enabled);
  fetchBannedUsers(); 
});

// Listen for clicks on the browser action
if (browserAPI.action) {
  // MV3 style for Chrome
  browserAPI.action.onClicked.addListener(function(tab) {
    handleClick(tab);
  });
} else if (browserAPI.browserAction) {
  // MV2 style for Firefox
  browserAPI.browserAction.onClicked.addListener(function(tab) {
    handleClick(tab);
  });
}

function handleClick(tab) {
  if (!tab.url.includes("bitcointalk.org")) {
    return;
  }
  
  browserAPI.storage.sync.get(['banCheckerEnabled'], function(result) {
    const newState = !(result.banCheckerEnabled === true);
    browserAPI.storage.sync.set({ banCheckerEnabled: newState });
    updateIcon(newState);
    
    browserAPI.tabs.sendMessage(
      tab.id,
      { action: 'toggleBanChecker', enabled: newState }
    );
  });
}

// Listen for tab updates to set correct icon state
browserAPI.tabs.onActivated.addListener(function(activeInfo) {
  browserAPI.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url && tab.url.includes("bitcointalk.org")) {
      browserAPI.storage.sync.get(['banCheckerEnabled'], function(result) {
        updateIcon(result.banCheckerEnabled);
      });
    }
  });
});

browserAPI.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes("bitcointalk.org")) {
    browserAPI.storage.sync.get(['banCheckerEnabled'], function(result) {
      updateIcon(result.banCheckerEnabled);
    });
  }
});

// Listen for messages from content script
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getBannedUsers') {
    fetchBannedUsers().then(bannedUsers => {
      // Send the array of objects
      sendResponse({ bannedUsers: bannedUsers });
    }).catch(error => {
      console.error("Error responding with banned users:", error);
      sendResponse({ bannedUsers: [] }); // Send empty list on error
    });
    return true; 
  }
});

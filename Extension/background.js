// Background script for the Bitcoin Forum Ban Checker extension

// Initialize browser API compatibility layer
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Listen for installation
browserAPI.runtime.onInstalled.addListener(function() {
  console.log("Bitcoin Forum Ban Checker installed!");
  // Initialize storage with default values
  browserAPI.storage.sync.set({ banCheckerEnabled: false });
});

// Function to update icon based on enabled state
function updateIcon(enabled) {
  const path = enabled ? {
    16: "images/image1.png",
    48: "images/image2.png",
    128: "images/image3.png"
  } : {
    16: "images/image1_inactive.png",
    48: "images/image2_inactive.png",
    128: "images/image3_inactive.png"
  };
  
  if (browserAPI.action) {
    // MV3 style for Chrome
    browserAPI.action.setIcon({ path: path });
  } else if (browserAPI.browserAction) {
    // MV2 style for Firefox
    browserAPI.browserAction.setIcon({ path: path });
  }
}

// Initialize extension state
browserAPI.storage.sync.get(['banCheckerEnabled'], function(result) {
  const enabled = result.banCheckerEnabled === true;
  updateIcon(enabled);
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

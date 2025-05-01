// Initialize browser API compatibility layer
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusElement = document.getElementById('status');
  const bannedListElement = document.getElementById('bannedList');
  // Check current state and update UI
  browserAPI.storage.sync.get(['banCheckerEnabled'], function(result) {
    const isEnabled = result.banCheckerEnabled === true;
    toggleSwitch.checked = isEnabled;
    updateStatus(isEnabled);
  });

 
  // Add event listener for the toggle switch
  toggleSwitch.addEventListener('change', function() {
    const enabled = toggleSwitch.checked;
    
    // Save state
    browserAPI.storage.sync.set({ banCheckerEnabled: enabled });
    
    // Update status
    updateStatus(enabled);
    
    // Send message to active tab
    browserAPI.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes('bitcointalk.org')) {
        browserAPI.tabs.sendMessage(
          tabs[0].id,
          { action: 'toggleBanChecker', enabled: enabled }
        );
      }
    });
    
    // Update icon
    updateIcon(enabled);
  });
  
  function updateStatus(enabled) {
    statusElement.textContent = enabled ? 
      'Status: Active - Banned users are highlighted' : 
      'Status: Inactive - No highlighting';
    statusElement.style.color = enabled ? '#008800' : '#666666';
  }
  
  function updateIcon(enabled) {
    const path = enabled ? {
      16: "images/image1.png",
      48: "images/image2.png",
      128: "images/image3.png"
    } : {
      //inacctive to be added
      16: "images/image1_inactive.png",
      48: "images/image2_inactive.png",
      128: "images/image3_inactive.png"
    };
    
    if (browserAPI.action) {
      browserAPI.action.setIcon({ path: path });
    } else if (browserAPI.browserAction) {
      browserAPI.browserAction.setIcon({ path: path });
    }
  }
});

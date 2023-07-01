chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.text && message.color) {
    const activeTabId = sender.tab.id;
    chrome.tabs.get(activeTabId, function (tab) {
      if (tab.url && tab.title) {
        handleSelectionUrl(message, tab.url, tab.title);
        highlightTextInTab(message.text, message.color, activeTabId);
      } else {
        chrome.tabs.sendMessage(
          activeTabId,
          { action: "retrieveURL" },
          function (response) {
            if (response && response.url) {
              handleSelectionUrl(message, response.url, tab.title);
              highlightTextInTab(message.text, message.color, activeTabId);
            } else {
              console.log("Failed to retrieve URL for the active tab.");
            }
          }
        );
      }
    });
  }

  if (message.redirect) {
    chrome.tabs.create({ url: chrome.runtime.getURL(message.redirect) });
  }
});

function handleSelectionUrl(message, url, title) {
  const date = new Date();
  const websiteName = title || extractWebsiteName(url);
  const selection = {
    text: message.text,
    color: message.color,
    link: url,
    title: websiteName,
    date: date.toLocaleDateString(),
  };

  const tablink = {
    link: url,
    title: websiteName,
    selections: [selection],
    date: date.toLocaleDateString(),
  };

  chrome.storage.local.get({ selections: [], tablinks: [] }, function (result) {
    const { selections, tablinks } = result;
    const updatedSelections = [selection, ...selections];
    let updatedTablinks = tablinks || [];

    const existingTablinkIndex = updatedTablinks.findIndex(
      (tab) => tab.link === url
    );

    if (existingTablinkIndex !== -1) {
      updatedTablinks[existingTablinkIndex].selections.unshift(selection); // Add the latest selection to the beginning of the array
    } else {
      updatedTablinks.unshift(tablink); // Add the tablink to the beginning of the array
    }

    chrome.storage.local.set(
      { selections: updatedSelections, tablinks: updatedTablinks },
      function () {
        console.log("Selection and Tablink stored successfully.");
      }
    );
  });
}

function extractWebsiteName(url) {
  const hostname = new URL(url).hostname;
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

document.addEventListener("DOMContentLoaded", function () {
  var homeIcon = document.getElementById("home-icon");
  homeIcon.addEventListener("click", function () {
    chrome.runtime.sendMessage({ redirect: "landingPage.html" });
  });
  let toggleCheckbox = document.getElementById("toggleCheckbox");
  console.log(toggleCheckbox.checked);

  // Retrieve the stored state from chrome.storage
  chrome.storage.local.get({ isEnabled: true }, function (result) {
    var isEnabled = result.isEnabled;
    // Set the checkbox state based on the stored value
    toggleCheckbox.checked = isEnabled;
  });

  toggleCheckbox.addEventListener("change", function () {
    // Store the state in chrome.storage
    chrome.storage.local.set({ isEnabled: this.checked }, function () {
      // Log a message when the state is stored successfully
      console.log("Extension state updated.");

      // Send a message to content.js to update the functionality
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { isEnabled: this.checked });
      });
    });
  });
});

chrome.storage.local.get({ selections: [] }, function (result) {
  let container = document.getElementById("text-container");
  let emptyPage = document.getElementsByClassName("empty-popup")[0];
  let highlights = document.getElementsByClassName("highlights")[0];
  let selections = result.selections;

  if (selections.length === 0) {
    container.style.display = "none";
    emptyPage.style.display = "block";
    highlights.style.display = "none";
  } else {
    container.style.display = "flex";
    highlights.style.display = "block";
    emptyPage.style.display = "none";

    selections.forEach((selection) => {
      let rectangle2Div = document.createElement("div");
      rectangle2Div.className = "rectangle-2";

      let rectangle3Div = document.createElement("div");
      rectangle3Div.className = "rectangle-3";
      rectangle3Div.style.background = selection.color;

      let textDiv = document.createElement("div");
      textDiv.className = "text";
      textDiv.textContent = selection.text;

      rectangle2Div.appendChild(rectangle3Div);
      rectangle2Div.appendChild(textDiv);
      container.appendChild(rectangle2Div);
    });
  }
});

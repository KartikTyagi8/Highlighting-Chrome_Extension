window.addEventListener("load", function () {
  chrome.storage.local.get(
    { selections: [], tablinks: [], currentTab: null },
    function (result) {
      const featuredContainer =
        document.getElementsByClassName("featured-container")[0];
      const emptyPage = document.getElementsByClassName("empty-page")[0];
      const selections = result.selections;
      const tablinks = result.tablinks;
      const currentTab = result.currentTab;

      if (selections.length === 0) {
        featuredContainer.style.display = "none";
        emptyPage.style.display = "block";
      } else {
        emptyPage.style.display = "none";
        const link_container =
          document.getElementsByClassName("link-container")[0];
        showTabDetails(currentTab || tablinks[0]);

        window.addEventListener("load", function () {
          getSavedCurrentTabDetails(function (currentTab) {
            showTabDetails(currentTab);
          });
        });

        tablinks.forEach((tab) => {
          let rectangle_main = document.createElement("div");
          rectangle_main.className = "rectangle-main";
          rectangle_main.style.cursor = "pointer";
          rectangle_main.addEventListener("click", function () {
            saveCurrentTabDetails(tab);
            showTabDetails(tab);
          });

          let tab_title = document.createElement("h1");
          tab_title.className = "tab-title";
          tab_title.textContent = tab.title;

          let container_date = document.createElement("div");
          container_date.className = "container-date";

          let dateDiv = document.createElement("div");
          dateDiv.className = "link-date";
          dateDiv.textContent = tab.date;

          let tab_link = document.createElement("a");
          tab_link.className = "tab-link";
          tab_link.href = tab.link;
          tab_link.textContent = tab.link;

          let container_first = document.createElement("div");
          container_first.className = "container-first";

          let highlight_text = document.createElement("p");
          highlight_text.className = "highlight-text";
          highlight_text.textContent = "Highlight";

          let highlight_container = document.createElement("div");
          highlight_container.className = "highlight-container";

          let colorCounts = {};
          selections.forEach((selection) => {
            if (selection.date === tab.date && selection.link === tab.link) {
              if (!colorCounts[selection.color]) {
                colorCounts[selection.color] = 0;
              }
              colorCounts[selection.color]++;
            }
          });

          let colorCountsContainer = document.createElement("div");
          colorCountsContainer.className = "color-counts-container";

          Object.keys(colorCounts).forEach((color) => {
            let colorCount = colorCounts[color];

            let circleDiv = document.createElement("div");
            circleDiv.className = "circle";
            circleDiv.style.background = color;

            let countSpan = document.createElement("span");
            countSpan.className = "count";
            countSpan.textContent = colorCount;

            circleDiv.appendChild(countSpan);
            colorCountsContainer.appendChild(circleDiv);
          });

          highlight_container.appendChild(highlight_text);
          highlight_container.appendChild(colorCountsContainer);
          container_date.appendChild(tab_title);
          container_date.appendChild(dateDiv);
          container_first.appendChild(container_date);
          container_first.appendChild(tab_link);
          rectangle_main.appendChild(container_first);
          rectangle_main.appendChild(highlight_container);

          link_container.appendChild(rectangle_main);
        });

        const searchInput = document.getElementById("search-input");
        searchInput.addEventListener("input", function () {
          const searchTerm = searchInput.value.toLowerCase();
          const linkContainer =
            document.getElementsByClassName("link-container")[0];
          const tabElements =
            linkContainer.getElementsByClassName("rectangle-main");

          for (let i = 0; i < tabElements.length; i++) {
            const tabElement = tabElements[i];
            const tabTitle = tabElement
              .getElementsByClassName("tab-title")[0]
              .textContent.toLowerCase();

            if (tabTitle.includes(searchTerm)) {
              tabElement.style.display = "block";
            } else {
              tabElement.style.display = "none";
            }
          }
        });
      }
    }
  );
});

function showTabDetails(tab) {
  let container = document.getElementById("text-container");
  container.innerHTML = "";

  let linkTitleRight = document.getElementsByClassName("link-title-right")[0];
  linkTitleRight.textContent = tab.title;

  let dateNow = document.getElementsByClassName("date-now")[0];
  dateNow.textContent = tab.date;

  let rightLink = document.getElementsByClassName("right-link")[0];
  rightLink.innerHTML = "";

  let link = document.createElement("a");
  link.href = tab.link;
  link.textContent = tab.link;

  rightLink.appendChild(link);

  tab.selections.forEach((selection) => {
    let rectangle2Div = document.createElement("div");
    rectangle2Div.className = "rectangle-2";

    let rectangle3Div = document.createElement("div");
    rectangle3Div.className = "rectangle-3";
    rectangle3Div.style.background = selection.color;

    let textDiv = document.createElement("div");
    textDiv.className = "text";
    textDiv.textContent = selection.text;

    let btnCopy = document.createElement("button");
    btnCopy.className = "btn-copy";
    btnCopy.textContent = "copy";

    let copy_fun = document.createElement("div");
    copy_fun.className = "copy-func";
    copy_fun.appendChild(btnCopy);

    btnCopy.addEventListener("click", function () {
      copyToClipboard(textDiv.textContent);
      showCopiedMessage(copy_fun, selection.color);
    });

    rectangle2Div.appendChild(rectangle3Div);
    rectangle2Div.appendChild(textDiv);
    rectangle2Div.appendChild(copy_fun);
    container.appendChild(rectangle2Div);
    rectangle2Div.style.height = textDiv.offsetHeight + "px";
  });
}

function copyToClipboard(text) {
  // Create a temporary textarea element
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);

  // Select and copy the text
  textarea.select();
  document.execCommand("copy");

  // Remove the temporary textarea element
  document.body.removeChild(textarea);

  // Optional: Provide user feedback
  // alert("Text copied to clipboard!");
}
function showCopiedMessage(element, color) {
  let toast = document.createElement("div");
  toast.textContent = "Copied to clipboard";
  toast.className = "toast";
  toast.style.backgroundColor = color;
  // toast.color = white;
  toast.style.color = "white";

  element.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = "0";
    setTimeout(function () {
      element.removeChild(toast);
    }, 1000);
  }, 2000);
}

function getSavedCurrentTabDetails(callback) {
  chrome.storage.local.get("currentTab", function (result) {
    callback(result.currentTab);
  });
}

function saveCurrentTabDetails(tab) {
  chrome.storage.local.set({ currentTab: tab });
}

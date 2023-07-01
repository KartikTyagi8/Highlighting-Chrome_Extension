function saveHighlight(xpath, text, color) {
  console.log(xpath);

  const highlight = { text, color, xpath };

  // Retrieve existing highlights from storage for the current page
  chrome.storage.local.get({ highlights: {} }, function (result) {
    const highlights = result.highlights;
    const url = window.location.href;

    // Add or update highlights for the current page
    highlights[url] = highlights[url] || [];
    highlights[url].push(highlight);

    // Save the updated highlights back to storage
    chrome.storage.local.set({ highlights }, function () {
      console.log(highlights);
      console.log("Highlight saved successfully.");
    });
  });
}

function applyStoredHighlights() {
  const url = window.location.href;
  console.log(url);

  chrome.storage.local.get({ highlights: {} }, function (result) {
    const highlights = result.highlights[url] || [];
    console.log(highlights);

    highlights.forEach((highlight) => {
      const xpath = highlight.xpath;
      const text = highlight.text;
      const color = highlight.color;

      const elements = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );

      for (let i = 0; i < elements.snapshotLength; i++) {
        const element = elements.snapshotItem(i);
        const node = element.firstChild;

        if (node && node.nodeType === Node.TEXT_NODE) {
          const ranges = getRangesForText(node, text);

          ranges.forEach((range) => {
            const span = document.createElement("span");
            span.style.backgroundColor = color;

            range.surroundContents(span);
          });
        }
      }
    });
  });
}

function getRangesForText(node, searchText) {
  const ranges = [];

  const text = node.textContent;
  let searchIndex = text.indexOf(searchText);

  while (searchIndex !== -1) {
    const range = document.createRange();
    range.setStart(node, searchIndex);
    range.setEnd(node, searchIndex + searchText.length);

    ranges.push(range);

    searchIndex = text.indexOf(searchText, searchIndex + searchText.length);
  }

  return ranges;
}

window.addEventListener("load", applyStoredHighlights); // Apply stored highlights on page load

window.addEventListener("mouseup", wordSelectHandler);

function wordSelectHandler() {
  const colorOptions = [
    "rgba(165,219,12,1)",
    "rgba(1,169,240,1)",
    "rgba(250,8,211,1)",
    "rgba(255,199,0,1)",
    "rgba(24,249,181,1)",
  ];

  const selectedText = window.getSelection().toString().trim();
  const selectedRange = window.getSelection().getRangeAt(0);

  let colorTimeout; // Timer reference

  function createColorOptions() {
    const container = document.createElement("div");
    container.className = "color-container";

    const colors = document.createElement("div");
    colors.className = "colors";
    colors.style.display = "flex";
    colors.style.background = "black";
    colors.style.justifyContent = "space-between";
    colors.style.width = "180px";
    colors.style.padding = "5px";

    const arrow = document.createElement("div");
    arrow.className = "arrow";
    arrow.style.width = "0";
    arrow.style.height = "0";
    arrow.style.borderLeft = "8px solid transparent";
    arrow.style.borderRight = "8px solid transparent";
    arrow.style.borderTop = "8px solid black";
    arrow.style.position = "absolute";
    arrow.style.left = "8%";
    arrow.style.transform = "translateX(-50%)";

    colorOptions.forEach((color) => {
      const colorOption = document.createElement("div");
      colorOption.className = `color-option ${color}`;
      colorOption.style.backgroundColor = color;
      colorOption.style.width = "25px";
      colorOption.style.height = "25px";
      colorOption.style.borderRadius = "50%";

      colorOption.addEventListener("click", function () {
        const selectedColor = color;
        highlightTextSelected(selectedText, selectedColor);

        container.style.display = "none";

        chrome.storage.local.get({ isEnabled: true }, function (message) {
          if (message.isEnabled) {
            chrome.runtime.sendMessage({
              text: selectedText,
              color: selectedColor,
            });
          }
        });
      });

      colors.appendChild(colorOption);
    });

    container.appendChild(colors);
    container.appendChild(arrow);
    return container;
  }
  function removeLastSpanFromXPath(xpath) {
    var lastSpanIndex = xpath.lastIndexOf("/span");
    if (lastSpanIndex !== -1) {
      return xpath.substring(0, lastSpanIndex);
    }
    return xpath;
  }

  function createXPathFromElement(elm) {
    var allNodes = document.getElementsByTagName("*");
    for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) {
      if (elm.hasAttribute("id")) {
        var uniqueIdCount = 0;
        for (var n = 0; n < allNodes.length; n++) {
          if (allNodes[n].hasAttribute("id") && allNodes[n].id == elm.id)
            uniqueIdCount++;
          if (uniqueIdCount > 1) break;
        }
        if (uniqueIdCount == 1) {
          segs.unshift('id("' + elm.getAttribute("id") + '")');
          return segs.join("/");
        } else {
          segs.unshift(
            elm.localName.toLowerCase() +
              '[@id="' +
              elm.getAttribute("id") +
              '"]'
          );
        }
      } else if (elm.hasAttribute("class")) {
        segs.unshift(
          elm.localName.toLowerCase() +
            '[@class="' +
            elm.getAttribute("class") +
            '"]'
        );
      } else {
        for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
          if (sib.localName == elm.localName) i++;
        }
        segs.unshift(elm.localName.toLowerCase() + "[" + i + "]");
      }
    }
    return segs.length ? "/" + segs.join("/") : null;
  }
  function getSelectedNodes(startContainer, endContainer) {
    const nodes = [];
    let node = startContainer;

    while (node && node !== endContainer.nextSibling) {
      nodes.push(node);
      node = node.nextSibling;
    }

    return nodes;
  }

  function highlightTextSelected(selectedText, color) {
    const range = selectedRange.cloneRange();
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    console.log(startContainer, endContainer, color);

    if (
      startContainer === endContainer &&
      startContainer.nodeType === Node.TEXT_NODE
    ) {
      // Case where the selected range is within a single text node
      const newSpan = document.createElement("span");
      newSpan.style.backgroundColor = color;

      range.surroundContents(newSpan);
      range.collapse(false); // Collapse range to the end

      const xpath = createXPathFromElement(newSpan);
      console.log("xpath in highlight text is  =" + xpath);
      const modifiedXPath = removeLastSpanFromXPath(xpath);
      saveHighlight(modifiedXPath, selectedText, color);
    } else {
      // Case where the selected range spans multiple nodes
      const selectedNodes = getSelectedNodes(startContainer, endContainer);
      const xpathList = [];

      selectedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);

          if (node === startContainer) {
            nodeRange.setStart(node, range.startOffset);
          }
          if (node === endContainer) {
            nodeRange.setEnd(node, range.endOffset);
          }

          const newSpan = document.createElement("span");
          newSpan.style.backgroundColor = color;

          nodeRange.surroundContents(newSpan);
          xpathList.push(createXPathFromElement(newSpan));
        }
      });

      xpathList.forEach((xpath) => {
        const modifiedXPath = removeLastSpanFromXPath(xpath);
        saveHighlight(modifiedXPath, selectedText, color);
      });
    }

    // Override styles for tags within the selected text
    const selectedTags = document.getElementsByTagName("*");
    for (let i = 0; i < selectedTags.length; i++) {
      const tag = selectedTags[i];
      if (tag.textContent === selectedText) {
        tag.style.backgroundColor = color;
      }
    }
  }

  const container = createColorOptions();

  if (selectedText.length > 0) {
    const boundingRect = selectedRange.getBoundingClientRect();
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const xPos =
      boundingRect.left +
      window.pageXOffset -
      containerWidth +
      boundingRect.width / 2;
    const yPos = boundingRect.top + window.pageYOffset - containerHeight - 52;

    container.style.position = "absolute";
    container.style.left = xPos + "px";
    container.style.top = yPos + "px";

    chrome.storage.local.get({ isEnabled: true }, function (message) {
      if (message.isEnabled) {
        document.body.appendChild(container);

        // Clear previous timeout, if any
        clearTimeout(colorTimeout);

        // Set a timeout to remove color options after 5 seconds
        colorTimeout = setTimeout(function () {
          container.style.display = "none";
        }, 2000);
      }
    });
  }
}

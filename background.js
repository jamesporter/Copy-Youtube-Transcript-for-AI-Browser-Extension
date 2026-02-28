chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes("youtube.com/watch")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: automatedTranscriptCopy,
    });
  }
});

async function automatedTranscriptCopy() {
  function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.innerText = message;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      left: "20px",
      backgroundColor: isError ? "#cc0000" : "#282828",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      zIndex: "9999",
      fontSize: "14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
      transition: "opacity 0.5s ease",
      fontFamily: "Roboto, Arial, sans-serif",
    });

    document.body.appendChild(toast);

    // Fade out and remove after 5 seconds
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 5000);
  }

  // 1. Try to find the transcript button if the panel isn't open
  const transcriptPanel = document.querySelector("ytd-transcript-renderer");

  if (!transcriptPanel) {
    // Click "More" in description to reveal "Show Transcript" button
    const moreButton = document.querySelector(
      "#expand, #description-inline-expander",
    );
    if (moreButton) moreButton.click();

    // Wait a split second for the UI to expand, then click "Show transcript"
    setTimeout(() => {
      const showTranscriptBtn = Array.from(
        document.querySelectorAll("button"),
      ).find((btn) => btn.innerText.includes("Show transcript"));

      if (showTranscriptBtn) {
        showTranscriptBtn.click();
        // Wait for segments to load, then copy
        setTimeout(copyLogic, 1000);
      }
    }, 500);
  } else {
    copyLogic();
  }

  function copyLogic() {
    const segments = document.querySelectorAll(
      "ytd-transcript-segment-renderer yt-formatted-string",
    );

    const backup = document.querySelectorAll(
      ".style-scope ytd-macro-markers-list-renderer",
    );

    const items = segments.length > 0 ? segments : backup;

    if (items.length > 0) {
      const text = Array.from(items)
        .map((s) => s.innerText)
        .join("\n");

      const augmentedText = `Please take this transcript and clean it up. Add section headings, fix grammar, remove filler words. 
        
        At the end please add two new sections. The first should be an Executive Summary. The second should be a set of bullet points of Questions for Reflection which should be based on the content. 
        
        Transcript:
        
        ${text}`;

      const el = document.createElement("textarea");
      el.value = augmentedText;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      showToast("Transcript copied to clipboard!");
    } else {
      showToast("Transcript not found. Is it available for this video?", true);
    }
  }
}

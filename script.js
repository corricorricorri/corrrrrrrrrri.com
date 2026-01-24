// ---------------------
// TICKER
// ---------------------
const ticker = document.getElementById("time");

// Build ticker text from all work items
function buildTickerText() {
  const workItems = document.querySelectorAll(".work-item");
  let text = "";
  workItems.forEach((item, i) => {
    text += item.textContent.trim();
    if (i < workItems.length - 1) {
      text += " "; // spacing handled in CSS ::after
    }
  });
  return text;
}

// Set initial ticker text
ticker.textContent = buildTickerText();

// Optional: refresh ticker text every 10s in case work items change
setInterval(() => {
  ticker.textContent = buildTickerText();
}, 10000);

// ---------------------
// IMAGE PREVIEWS
// ---------------------
const workItems = document.querySelectorAll(".work-item");
const previewContainer = document.getElementById("preview-container");

let activeItem = null;

function showPreview(item) {
  previewContainer.innerHTML = "";
  const images = item.dataset.img.split(",");
  images.forEach(src => {
    const img = document.createElement("img");
    img.src = src.trim();
    img.style.display = "inline-block";
    previewContainer.appendChild(img);
  });
  previewContainer.style.display = "block";
}

function hidePreview() {
  previewContainer.style.display = "none";
  previewContainer.innerHTML = "";
  activeItem = null;
}

// Event handlers for desktop hover and mobile tap
workItems.forEach(item => {
  // DESKTOP hover
  item.addEventListener("mouseenter", () => {
    if (window.matchMedia("(hover: hover)").matches) {
      showPreview(item);
      activeItem = item;
    }
  });

  item.addEventListener("mouseleave", () => {
    if (window.matchMedia("(hover: hover)").matches) {
      hidePreview();
    }
  });

  // MOBILE tap toggle
  item.addEventListener("click", e => {
    if (window.matchMedia("(hover: none)").matches) {
      e.preventDefault(); // first tap prevents navigation for links

      // Toggle preview on mobile
      if (activeItem === item) {
        hidePreview(); // second tap closes
      } else {
        activeItem = item;
        showPreview(item); // first tap opens
      }
    }
  });
});

// Tap outside to close preview on mobile
document.addEventListener("click", e => {
  if (window.matchMedia("(hover: none)").matches) {
    if (activeItem && !e.target.classList.contains("work-item")) {
      hidePreview();
    }
  }
});

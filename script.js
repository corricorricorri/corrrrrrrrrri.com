// ---------------------
// IMAGE PREVIEWS
// ---------------------
const workItems = document.querySelectorAll(".work-item");
const previewContainer = document.getElementById("preview-container");

let activeItem = null;

// Detect hover capability
const canHover = window.matchMedia("(hover: hover)").matches;

function showPreview(item) {
  const data = item.getAttribute("data-img");
  if (!data) return; // skip if no images

  // Clear old images
  previewContainer.innerHTML = "";

  const images = data.split(",");

  images.forEach(src => {
    const cleanSrc = src.trim();
    if (!cleanSrc) return;

    const img = document.createElement("img");
    img.src = cleanSrc;

    // Force size to 25vw x auto
    img.style.width = "25vw";
    img.style.height = "auto";
    img.style.maxHeight = "25vh";
    img.style.display = "block";
    img.style.margin = "10px auto";

    previewContainer.appendChild(img);
  });

  previewContainer.style.display = "block";
}


// ---------------------
// HIDE PREVIEW
// ---------------------
function hidePreview() {
  previewContainer.style.display = "none";
  previewContainer.innerHTML = "";
  activeItem = null;
}

// ---------------------
// DESKTOP HOVER
// ---------------------
if (canHover) {
  workItems.forEach(item => {
    item.addEventListener("mouseenter", () => {
      showPreview(item);
    });

    item.addEventListener("mouseleave", () => {
      hidePreview();
    });
  });
}

// ---------------------
// MOBILE TAP
// ---------------------
if (!canHover) {
  workItems.forEach(item => {
    item.addEventListener("click", e => {
      const hasImages = item.getAttribute("data-img");
      if (!hasImages) return;

      e.preventDefault();

      if (activeItem === item) {
        hidePreview();
      } else {
        activeItem = item;
        showPreview(item);
      }
    });
  });

  // Tap outside closes
  document.addEventListener("click", e => {
    if (
      activeItem &&
      !e.target.classList.contains("work-item") &&
      !previewContainer.contains(e.target)
    ) {
      hidePreview();
    }
  });
}

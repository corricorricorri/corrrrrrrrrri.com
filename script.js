// ---------------------
// IMAGE PREVIEWS
// ---------------------
const workItems = document.querySelectorAll(".work-item");
const previewContainer = document.getElementById("preview-container");

let activeItem = null;

function showPreview(item) {
  // Remove old images
  previewContainer.innerHTML = "";

  if (!item.dataset.img) return; // skip if no images

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

// ---------------------
// DESKTOP HOVER / MOBILE TAP
// ---------------------
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
      e.preventDefault(); // first tap prevents navigation

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

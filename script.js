const workItems = document.querySelectorAll(".work-item");
const previewContainer = document.getElementById("preview-container");

let activeItem = null;
const canHover = window.matchMedia("(hover: hover)").matches;

function showPreview(item) {
  const data = item.getAttribute("data-img");
  if (!data) return;

  previewContainer.innerHTML = "";

  const images = data.split(",");

  images.forEach(src => {
    const img = document.createElement("img");
    img.src = src.trim();
    previewContainer.appendChild(img);
  });

  previewContainer.classList.add("active");
}

function hidePreview() {
  previewContainer.classList.remove("active");
  previewContainer.innerHTML = "";
  activeItem = null;
}

/* ---------------- Desktop Hover ---------------- */
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

/* ---------------- Mobile Tap (Toggle Behavior) ---------------- */
if (!canHover) {
  workItems.forEach(item => {
    item.addEventListener("click", e => {
      const hasImages = item.getAttribute("data-img");
      if (!hasImages) return;

      e.stopPropagation();

      // If tapping the same active item → close
      if (activeItem === item) {
        hidePreview();
        return;
      }

      // Otherwise open new item
      activeItem = item;
      showPreview(item);
    });
  });

  // Tap anywhere else closes
  document.addEventListener("click", e => {
    if (
      activeItem &&
      !e.target.closest(".work-item")
    ) {
      hidePreview();
    }
  });
}

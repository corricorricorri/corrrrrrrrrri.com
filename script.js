const ticker = document.getElementById("time");

function updateTicker() {
  const now = new Date();

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = days[now.getDay()];

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Remove milliseconds
  ticker.textContent = `${dayOfWeek}, ${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

setInterval(updateTicker, 1000); // update every 1s now, no need for 10ms

const workItems = document.querySelectorAll(".work-item");
const previewContainer = document.getElementById("preview-container");

let activeItem = null;

// Show the preview images
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

// Hide the preview
function hidePreview() {
  previewContainer.style.display = "none";
  previewContainer.innerHTML = "";
  activeItem = null;
}

// Main event handlers
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
      e.preventDefault(); // stop navigation for first tap
      if (activeItem === item) {
        hidePreview(); // second tap closes
      } else {
        activeItem = item;
        showPreview(item); // first tap opens
      }
    }
  });
});

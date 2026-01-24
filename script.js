// ---------------------
// TICKER (Day + Date + Time with milliseconds, MM/DD/YYYY format)
// ---------------------
const ticker = document.getElementById("time");

function updateTicker() {
  const now = new Date();

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = days[now.getDay()];

  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const millis = String(now.getMilliseconds()).padStart(3, "0");

  ticker.textContent = `${dayOfWeek}, ${month}/${day}/${year} ${hours}:${minutes}:${seconds}:${millis}`;
}

// Update very frequently for smooth milliseconds display
setInterval(updateTicker, 10);

// Initial update
updateTicker();



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

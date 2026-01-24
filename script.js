// ----------------- Ticker -----------------
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
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  // Red milliseconds
  ticker.innerHTML = `${dayOfWeek}, ${day}/${month}/${year}, ${hours}:${minutes}:${seconds}.<span style="color:red">${milliseconds}</span>`;
}

// Update every 10ms
setInterval(updateTicker, 10);


// ----------------- Work Preview -----------------
const workItems = document.querySelectorAll(".work-item");
const previewContainer = document.getElementById("preview-container");

// Create a close button
let closeBtn = document.createElement("button");
closeBtn.id = "close-preview";
closeBtn.textContent = "×";
closeBtn.addEventListener("click", () => {
  previewContainer.style.display = "none";
  previewContainer.innerHTML = "";
});
previewContainer.appendChild(closeBtn);

let activeItem = null;

function showPreview(item) {
  previewContainer.innerHTML = "";
  previewContainer.appendChild(closeBtn); // re-add close button

  const images = item.dataset.img.split(",");
  images.forEach(src => {
    const img = document.createElement("img");
    img.src = src.trim();
    img.style.display = "inline-block"; // side by side
    previewContainer.appendChild(img);
  });

  previewContainer.style.display = "block";
}

function hidePreview() {
  previewContainer.style.display = "none";
  previewContainer.innerHTML = "";
  previewContainer.appendChild(closeBtn); // keep close button
  activeItem = null;
}

// Event listeners
workItems.forEach(item => {
  // Desktop hover
  item.addEventListener("mouseenter", () => {
    if (window.matchMedia("(hover: hover)").matches) {
      showPreview(item);
    }
  });
  item.addEventListener("mouseleave", () => {
    if (window.matchMedia("(hover: hover)").matches) {
      hidePreview();
    }
  });

  // Mobile tap
  item.addEventListener("click", e => {
    if (window.matchMedia("(hover: none)").matches) {
      e.preventDefault();

      if (activeItem === item) {
        hidePreview();
      } else {
        activeItem = item;
        showPreview(item);
      }
    }
  });
});

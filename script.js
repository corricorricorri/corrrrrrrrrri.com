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

  ticker.textContent = `${dayOfWeek}, ${day}/${month}/${year}, ${hours}:${minutes}:${seconds}.${milliseconds} `;
}

setInterval(updateTicker, 10);

const workItems = document.querySelectorAll(".work-item");
const previewContainer = document.getElementById("preview-container");

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
}

workItems.forEach(item => {
  item.addEventListener("mouseenter", () => {
    showPreview(item);
  });

  item.addEventListener("mouseleave", () => {
    hidePreview();
  });

  // ✅ click now HIDES instead of shows
  item.addEventListener("click", () => {
    hidePreview();
  });
});

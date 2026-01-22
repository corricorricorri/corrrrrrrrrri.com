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

// Update every 10ms for real-time milliseconds
setInterval(updateTicker, 10);
const workItems = document.querySelectorAll(".work-item");
const previewContainer = document.getElementById("preview-container");

workItems.forEach(item => {
  item.addEventListener("mouseenter", () => {
    // clear previous images
    previewContainer.innerHTML = "";

    // split multiple images
    const images = item.dataset.img.split(",");

    images.forEach(src => {
      const img = document.createElement("img");
      img.src = src.trim();
      img.style.display = "inline-block";  // allow multiple side by side
      previewContainer.appendChild(img);
    });

    // show container
    previewContainer.style.display = "block";
  });

  item.addEventListener("mouseleave", () => {
    previewContainer.style.display = "none";
  });

  // optional click for mobile
  item.addEventListener("click", () => {
    previewContainer.innerHTML = "";
    const images = item.dataset.img.split(",");
    images.forEach(src => {
      const img = document.createElement("img");
      img.src = src.trim();
      previewContainer.appendChild(img);
    });
    previewContainer.style.display = "block";
  });
});


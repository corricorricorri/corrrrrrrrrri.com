// ---------------- Work Item Hover / Tap Preview ----------------
const workItems = document.querySelectorAll(".work-item");
const previewContainer = document.getElementById("preview-container");

let activeItem = null;
const canHover = window.matchMedia("(hover: hover)").matches;

function showPreview(item) {
  const data = item.getAttribute("data-img");
  if (!data) return;

  // Clear previous previews
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

// ---------------- Desktop Hover ----------------
if (canHover) {
  workItems.forEach(item => {
    item.addEventListener("mouseenter", () => showPreview(item));
    item.addEventListener("mouseleave", hidePreview);
  });
}

// ---------------- Mobile Tap (Toggle Behavior) ----------------
if (!canHover) {
  workItems.forEach(item => {
    item.addEventListener("click", e => {
      const hasImages = item.getAttribute("data-img");
      if (!hasImages) return;

      e.stopPropagation();

      if (activeItem === item) {
        hidePreview();
        return;
      }

      activeItem = item;
      showPreview(item);
    });
  });

  // Tap anywhere else closes preview
  document.addEventListener("click", e => {
    if (activeItem && !e.target.closest(".work-item")) {
      hidePreview();
    }
  });
}

// ---------------- Live Date / Time Under CG ----------------
function updateDateTime() {
  const now = new Date();

  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  const dateEl = document.getElementById("date");
  const timeEl = document.getElementById("time");

  if (dateEl) dateEl.textContent = `${month}/${day}/${year}`;
  if (timeEl) timeEl.textContent = `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

// Update every 10ms for smooth milliseconds
setInterval(updateDateTime, 10);
updateDateTime();

// ---------------- Gallery Images ----------------
document.addEventListener("DOMContentLoaded", () => {
  const galleryCover = document.getElementById("galleryCover");
  const nextArrow = document.getElementById("nextArrow");

  const images = [
    "../images/team-1.webp",
    "../images/sign-2.webp",
    "../images/sign-1.webp",
    "../images/sign-3.webp",
    "../images/nikecraft-1.webp",
    "../images/ten-bullets-1.webp",
    "../images/tom-2.webp",
    "../images/tom-3.webp",
    "../images/run-1.webp",
    "../images/tom-4.webp",
    "../images/run-3.webp",
    "../images/runners-6.webp",
    "../images/tom-7.webp",
    "../images/runners-2.webp",
    "../images/runners-5.webp",
    "../images/books-4.webp",
    "../images/books-3.webp"
  ];

  let currentIndex = 0;

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    galleryCover.src = images[currentIndex];
  }

  // Desktop & mobile click
  nextArrow.addEventListener("click", nextImage);
  galleryCover.addEventListener("click", nextImage);

  // Mobile touch support
  nextArrow.addEventListener("touchend", e => { e.preventDefault(); nextImage(); });
  galleryCover.addEventListener("touchend", e => { e.preventDefault(); nextImage(); });

  // Optional: swipe left/right support for mobile
  let startX = 0;
  galleryCover.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });
  galleryCover.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    if (endX < startX - 30) nextImage(); // swipe left = next
    // you could implement prevImage if you want swipe right
  });
});
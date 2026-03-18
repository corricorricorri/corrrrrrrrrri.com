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
    "../images/team-1.JPG",
    "../images/sign-2.JPG",
    "../images/sign-1.JPG",
    "../images/sign-3.JPG",
    "../images/nikecraft-1.JPG",
    "../images/ten-bullets-1.JPG",
    "../images/tom-2.JPG",
    "../images/tom-3.jpg",
    "../images/run-1.JPG",
    "../images/tom-4.jpg",
    "../images/run-3.JPG",
    "../images/runners-6.JPG",
    "../images/tom-7.JPG",
    "../images/runners-2.JPG",
    "../images/runners-5.JPG",
    "../images/books-4.JPG",
    "../images/books-3.JPG"
  ];

  let currentIndex = 0; // starting index

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    galleryCover.src = images[currentIndex];
  }

  // Desktop & mobile click
  nextArrow.addEventListener("click", nextImage);
  galleryCover.addEventListener("click", nextImage);

  // Mobile touch support
  nextArrow.addEventListener("touchstart", nextImage);
  galleryCover.addEventListener("touchstart", nextImage);
});
const $ = (selector) => document.querySelector(selector);

// ---------------- AUDIO ----------------
// Music is owned by the parent login page. The successful login click starts it.
const birthdayAudio = $("#birthdayAudio"); // kept for compatibility if an audio is added later
const soundButton = $("#sound");

function updateSoundLabel(text) {
    if (soundButton) soundButton.innerHTML = `● <span>${text}</span>`;
}

function parentAudio(action, value) {
    try {
        window.parent.postMessage({ type: "birthday-audio", action, value }, "*");
    } catch (e) {}
}

function startBirthdayMusic() {
    parentAudio("play");
    updateSoundLabel("Playing");
    return Promise.resolve(true);
}

if (soundButton) {
    soundButton.addEventListener("click", () => {
        const isPlaying = soundButton.dataset.playing === "true";
        if (isPlaying) {
            parentAudio("pause");
            soundButton.dataset.playing = "false";
            updateSoundLabel("Paused");
        } else {
            parentAudio("play");
            soundButton.dataset.playing = "true";
            updateSoundLabel("Playing");
        }
    });
}

// Parent page can report playback state to this page.
window.addEventListener("message", (event) => {
    if (!event.data || event.data.type !== "birthday-audio-state") return;
    if (event.data.playing) {
        if (soundButton) soundButton.dataset.playing = "true";
        updateSoundLabel("Playing");
    }
});

// ---------------- MODAL ----------------
const modal = $("#modal");
const surpriseButton = $("#surprise");
const readLetterButton = $("#readLetter");
const closeButton = $("#close");
const wishButton = $("#wish");

if (surpriseButton && modal) surpriseButton.addEventListener("click", () => modal.classList.add("show"));
if (readLetterButton && modal) readLetterButton.addEventListener("click", () => modal.classList.add("show"));
if (closeButton && modal) closeButton.addEventListener("click", () => modal.classList.remove("show"));
if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("show"); });
if (wishButton && modal) {
    wishButton.addEventListener("click", () => {
        modal.classList.add("show");
        const scriptText = $(".modal-card .script");
        if (scriptText) scriptText.textContent = "Wish granted ✨";
    });
}

// ---------------- PHOTO CAROUSEL ----------------
const gallery = document.querySelector(".memory-orbit");
const photos = document.querySelectorAll(".memory");
const prevPhotoButton = $("#prevPhoto");
const nextPhotoButton = $("#nextPhoto");
const photoCounter = $("#photoCounter");
const photoProgress = $("#photoProgress");
const sliderDots = $("#sliderDots");

let currentPhoto = 0;
let sliderTimer = null;
let resumeTimer = null;
let galleryVisible = true;
const PHOTO_INTERVAL = 5000;

function updatePhotoUI() {
    if (!photos.length) return;
    const total = photos.length;
    if (photoCounter) photoCounter.textContent = `${String(currentPhoto + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    if (photoProgress) photoProgress.style.width = `${((currentPhoto + 1) / total) * 100}%`;
    photos.forEach((photo, i) => {
        photo.classList.toggle("active", i === currentPhoto);
        photo.setAttribute("aria-hidden", i === currentPhoto ? "false" : "true");
    });
    if (sliderDots) {
        sliderDots.querySelectorAll(".slider-dot").forEach((dot, i) => {
            dot.classList.toggle("active", i === currentPhoto);
            dot.setAttribute("aria-current", i === currentPhoto ? "true" : "false");
        });
    }
}

function showPhoto(index) {
    if (!photos.length) return;
    currentPhoto = (index + photos.length) % photos.length;
    updatePhotoUI();
}

function buildSliderDots() {
    if (!sliderDots || !photos.length) return;
    sliderDots.innerHTML = "";
    photos.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slider-dot";
        dot.setAttribute("aria-label", `Show memory ${index + 1}`);
        dot.addEventListener("click", () => { showPhoto(index); restartAutoplay(); });
        sliderDots.appendChild(dot);
    });
}

function stopAutoplay() {
    if (sliderTimer !== null) {
        clearInterval(sliderTimer);
        sliderTimer = null;
    }
}

function startAutoplay() {
    stopAutoplay();
    if (!gallery || photos.length < 2 || !galleryVisible) return;
    sliderTimer = setInterval(() => showPhoto(currentPhoto + 1), PHOTO_INTERVAL);
}

function restartAutoplay() {
    stopAutoplay();
    if (resumeTimer !== null) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAutoplay, PHOTO_INTERVAL);
}

if (nextPhotoButton) nextPhotoButton.addEventListener("click", () => { showPhoto(currentPhoto + 1); restartAutoplay(); });
if (prevPhotoButton) prevPhotoButton.addEventListener("click", () => { showPhoto(currentPhoto - 1); restartAutoplay(); });

// One swipe handler only — prevents duplicate photo changes on mobile.
if (gallery && photos.length) {
    let touchStartX = 0;
    gallery.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
    }, { passive: true });
    gallery.addEventListener("touchend", (e) => {
        const distance = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(distance) > 45) showPhoto(currentPhoto + (distance > 0 ? 1 : -1));
        restartAutoplay();
    }, { passive: true });
    gallery.addEventListener("mouseenter", stopAutoplay);
    gallery.addEventListener("mouseleave", startAutoplay);
}

if (gallery && photos.length && "IntersectionObserver" in window) {
    const galleryObserver = new IntersectionObserver((entries) => {
        galleryVisible = !!entries[0]?.isIntersecting;
        if (galleryVisible) startAutoplay();
        else stopAutoplay();
    }, { threshold: 0.25 });
    galleryObserver.observe(gallery);
}

buildSliderDots();
updatePhotoUI();
startAutoplay();

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { showPhoto(currentPhoto + 1); restartAutoplay(); }
    if (e.key === "ArrowLeft") { showPhoto(currentPhoto - 1); restartAutoplay(); }
});

// ---------------- FALLING PETALS ----------------
const petals = $("#petals");
function createPetal() {
    if (!petals) return;
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.textContent = Math.random() > 0.35 ? "✿" : "♡";
    petal.style.left = Math.random() * 100 + "vw";
    petal.style.top = "-30px";
    petal.style.fontSize = 8 + Math.random() * 16 + "px";
    petal.style.animationDuration = 5 + Math.random() * 7 + "s";
    petals.appendChild(petal);
    setTimeout(() => petal.remove(), 13000);
}
setInterval(createPetal, 800);

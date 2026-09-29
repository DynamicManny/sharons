(() => {
  // ------------------------------------------------------------------
  // EDIT THESE. Everything else on the page reads from here.
  // ------------------------------------------------------------------
  const CONFIG = {
    name: "Sharons",
    // Digits only, country code first, no plus sign or spaces.
    // Barbados numbers look like 1246XXXXXXX.
    whatsapp: "1246243-4022",
    area: "St. Joseph, Barbados",
    // Example: "Tuesday to Saturday, 9am to 5pm". Leave empty to hide the line.
    hours: "",
    // Example: "sharons.studio". Leave empty to hide the link.
    instagram: "",
    // true: missing photos show a labelled placeholder (good while building).
    // false: any slot without a photo is hidden (use once the site is live).
    showPlaceholders: true,
  };
  // ------------------------------------------------------------------

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const numberSet = /^\d{7,15}$/.test(CONFIG.whatsapp);
  const waUrl = (text) =>
    `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

  // Name, area, year
  document.title = `${CONFIG.name} | Dressmaking and alterations in ${CONFIG.area}`;
  $$("[data-brand]").forEach((el) => (el.textContent = CONFIG.name));
  $$("[data-area]").forEach((el) => (el.textContent = CONFIG.area));
  $("#year").textContent = new Date().getFullYear();

  // Optional details
  const hours = $("#hours");
  if (CONFIG.hours) {
    hours.textContent = CONFIG.hours;
    hours.hidden = false;
  }
  const instagram = $("#instagram");
  if (CONFIG.instagram) {
    instagram.href = `https://instagram.com/${CONFIG.instagram.replace(/^@/, "")}`;
    instagram.hidden = false;
  }

  // Plain WhatsApp links. Until a number is set they fall back to the form.
  $$("[data-wa]").forEach((link) => {
    if (!numberSet) return;
    link.href = waUrl(`Hi ${CONFIG.name}, I'd like to ask about your services.`);
    link.target = "_blank";
    link.rel = "noopener";
  });

  // Photos: swap missing images for a labelled placeholder (or hide them)
  function markEmpty(img) {
    const slot = img.closest(".slot");
    if (!slot || slot.classList.contains("is-empty")) return;
    slot.classList.add("is-empty");

    const label = document.createElement("span");
    label.className = "slot-label";
    label.append("Add a photo");
    const file = document.createElement("small");
    file.textContent = img.getAttribute("src");
    label.append(file);
    slot.append(label);

    if (!CONFIG.showPlaceholders) {
      const container =
        slot.closest(".hero-photo") || slot.closest(".ba") || slot;
      container.hidden = true;
    }
  }

  $$(".slot img").forEach((img) => {
    img.addEventListener("error", () => markEmpty(img));
    if (img.complete && img.naturalWidth === 0) markEmpty(img);
  });

  // Before and after slider
  $$(".ba").forEach((ba) => {
    const range = $(".ba-range", ba);
    const handle = $(".ba-handle", ba);
    const update = () => ba.style.setProperty("--pos", `${range.value}%`);
    range.addEventListener("input", update);
    update();

    // Nudge the handle once, the first time it scrolls into view, as a
    // hint that it drags. Not a scroll-reveal, just a one-time invitation.
    if ("IntersectionObserver" in window) {
      const hint = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            handle.classList.add("hint");
            observer.disconnect();
          });
        },
        { threshold: 0.6 }
      );
      hint.observe(ba);
    }
  });

  // Measuring tape numbers
  function buildTapes() {
    $$(".tape").forEach((tape) => {
      const marks = $(".tape-marks", tape);
      const count = Math.ceil(tape.clientWidth / 80) + 1;
      if (marks.childElementCount === count) return;
      marks.textContent = "";
      for (let i = 1; i <= count; i += 1) {
        const mark = document.createElement("span");
        mark.textContent = i;
        marks.append(mark);
      }
    });
  }
  buildTapes();
  window.addEventListener("resize", buildTapes);

  // Fitting request form: builds a WhatsApp message, no backend needed
  const form = $("#fitting");
  if (!form) return;

  const nameInput = $("#f-name");
  const serviceInput = $("#f-service");
  const dateInput = $("#f-date");
  const detailsInput = $("#f-details");
  const status = $("#f-status");

  const pad = (n) => String(n).padStart(2, "0");
  const now = new Date();
  dateInput.min = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const formatDate = (value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  function setError(input, message) {
    $(`#${input.id}-error`).textContent = message;
    input.setAttribute("aria-invalid", "true");
  }

  function clearError(input) {
    const error = $(`#${input.id}-error`);
    if (error) error.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  [nameInput, serviceInput].forEach((input) => {
    input.addEventListener("input", () => clearError(input));
    input.addEventListener("change", () => clearError(input));
  });

  // "Ask about this" links preselect the service
  $$("[data-service]").forEach((link) => {
    link.addEventListener("click", () => {
      serviceInput.value = link.dataset.service;
      clearError(serviceInput);
      setTimeout(() => nameInput.focus({ preventScroll: true }), 500);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";
    clearError(nameInput);
    clearError(serviceInput);

    if (!nameInput.value.trim()) {
      setError(nameInput, "Add your name so we know who to reply to.");
    }
    if (!serviceInput.value) {
      setError(serviceInput, "Choose what you need.");
    }
    const firstInvalid = $('[aria-invalid="true"]', form);
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    if (!numberSet) {
      status.textContent =
        "The WhatsApp number is not set yet. Add it to CONFIG in script.js.";
      return;
    }

    const lines = [
      `Hi ${CONFIG.name}, I'd like to request a fitting.`,
      "",
      `Name: ${nameInput.value.trim()}`,
      `Need: ${serviceInput.value}`,
    ];
    if (dateInput.value) lines.push(`Needed by: ${formatDate(dateInput.value)}`);
    if (detailsInput.value.trim()) lines.push(`Details: ${detailsInput.value.trim()}`);

    const url = waUrl(lines.join("\n"));
    window.open(url, "_blank", "noopener");

    const fallback = document.createElement("a");
    fallback.href = url;
    fallback.target = "_blank";
    fallback.rel = "noopener";
    fallback.textContent = "Open it here";
    status.textContent = "";
    status.append("Opening WhatsApp. Nothing happened? ", fallback, ".");
  });
})();

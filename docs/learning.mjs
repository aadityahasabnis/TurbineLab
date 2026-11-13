const root = document.documentElement;
const themeButton = document.querySelector("#theme-toggle");
const savedTheme = localStorage.getItem("EnergyLab-theme") || localStorage.getItem("TurbineLab-theme");
root.dataset.theme = savedTheme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

function updateThemeButton() {
  const targetTheme = root.dataset.theme === "dark" ? "light" : "dark";
  themeButton.setAttribute("aria-label", `Switch to ${targetTheme} theme`);
  themeButton.title = `Switch to ${targetTheme} theme`;
}

themeButton.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("EnergyLab-theme", root.dataset.theme);
  updateThemeButton();
});
updateThemeButton();

const sections = [...document.querySelectorAll(".lesson-section[id]")];
const links = [...document.querySelectorAll(".chapter-nav a, .lesson-rail a")];
const progressBar = document.querySelector("#reading-progress-bar");
function setActiveChapter(id) {
  for (const link of links) {
    if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}
const observer = new IntersectionObserver((entries) => {
  const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (active) setActiveChapter(active.target.id);
}, { rootMargin: "-24% 0px -62% 0px", threshold: [0, 0.15, 0.4] });
sections.forEach((section) => observer.observe(section));

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${(scrollable > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollable)) : 0) * 100}%`;
}
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();

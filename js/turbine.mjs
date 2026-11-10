export function createTurbine(canvas, getState, reduceMotion) {
  const context = canvas.getContext("2d");
  const particles = Array.from({ length: 90 }, () => ({
    x: Math.random(), y: Math.random(), speed: Math.random(), size: Math.random()
  }));
  let visible = true;
  let angle = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(delta) {
    const { inputs, results } = getState();
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    const centerX = width * .51;
    const centerY = height * .48;
    const radius = Math.min(height * .34, width * .23);
    const theme = getComputedStyle(document.documentElement);
    const cyan = theme.getPropertyValue("--cyan").trim();
    const border = theme.getPropertyValue("--border-strong").trim();
    const surface = theme.getPropertyValue("--surface-raised").trim();
    const muted = theme.getPropertyValue("--text-faint").trim();
    const speed = results.rpm / 3600;
    angle += delta * speed * (reduceMotion.matches ? .12 : 1) * 1.35;

    context.save();
    context.translate(centerX, centerY);
    context.beginPath();
    context.arc(0, 0, radius + 16, 0, Math.PI * 2);
    context.strokeStyle = border;
    context.lineWidth = 1;
    context.stroke();
    context.beginPath();
    context.arc(0, 0, radius + 10, Math.PI * .15, Math.PI * .85);
    context.strokeStyle = cyan;
    context.globalAlpha = .45;
    context.lineWidth = 2;
    context.stroke();
    context.globalAlpha = 1;

    for (let index = 0; index < 12; index += 1) {
      context.save();
      context.rotate(angle + (index / 12) * Math.PI * 2);
      context.beginPath();
      context.moveTo(6, -3);
      context.quadraticCurveTo(radius * .48, -radius * .15, radius * .78, -2);
      context.quadraticCurveTo(radius * .44, radius * .12, 6, 3);
      context.closePath();
      context.fillStyle = index % 3 === 0 ? cyan : muted;
      context.globalAlpha = index % 3 === 0 ? .9 : .5;
      context.fill();
      context.restore();
    }
    context.globalAlpha = 1;
    context.beginPath();
    context.arc(0, 0, radius * .18, 0, Math.PI * 2);
    context.fillStyle = surface;
    context.fill();
    context.strokeStyle = cyan;
    context.lineWidth = 2;
    context.stroke();
    context.restore();

    const particleCount = reduceMotion.matches ? 0 : Math.round(16 + inputs.flowKgS * .38);
    const flowSpeed = .00008 + (inputs.pressureMPa / 25) * .00015;
    const gradient = context.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, `${cyan}00`);
    gradient.addColorStop(.45, cyan);
    gradient.addColorStop(1, `${cyan}00`);
    context.fillStyle = gradient;
    for (let index = 0; index < particleCount; index += 1) {
      const particle = particles[index];
      particle.x += flowSpeed * delta * (.6 + particle.speed);
      if (particle.x > 1) particle.x = 0;
      const x = particle.x * width;
      const y = centerY + (particle.y - .5) * radius * 1.45;
      const size = 1 + particle.size * 2;
      context.globalAlpha = .17 + particle.speed * .34;
      context.beginPath();
      context.ellipse(x, y, size * (1.3 + speed), size, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);
  resize();
  return { draw, isVisible: () => visible };
}

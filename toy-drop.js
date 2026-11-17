// Animate a falling toy into its laid-out position, then bleed off the impact.
function animateToyDrop(image, delay, distance, size, tilt = 0) {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const skid = direction * Math.min(22, size * (0.06 + Math.random() * 0.14));
  const drift = -direction * Math.min(115, size * (0.23 + Math.random() * 0.45));
  const spin = direction * (45 + Math.random() * 200);
  const rockAngle = direction * (6 + Math.random() * 15);
  const bounce = Math.min(27, 3 + size * (0.04 + Math.random() * 0.10));
  const falling = 225 + Math.min(940, Math.sqrt(Math.max(1, distance)) * 22);
  const settling = 235 + Math.random() * 145;
  const duration = falling + settling;
  const impact = falling / duration;
  const frames = [];
  const frame = (offset, x, y, angle, opacity = 1) => ({
    offset, opacity,
    transform: `translate(${x}px, ${y}px) rotate(${tilt + angle}deg)`,
  });

  for (let step = 0; step <= 18; step++) {
    const t = step / 18;
    frames.push(frame(t * impact, drift + (skid - drift) * t,
      -distance * (1 - t * t), -spin + (spin + rockAngle) * t,
      Math.min(1, t * 18)));
  }

  // Short, decreasing bounces and a rock from the corner onto the final pose.
  for (let step = 1; step <= 20; step++) {
    const t = step / 20;
    const friction = (1 - t) ** 2.5;
    const hop = Math.abs(Math.sin(2 * Math.PI * t)) * friction;
    const rock = Math.cos(2.7 * Math.PI * t) * friction;
    frames.push(frame(impact + (1 - impact) * t,
      skid * friction, -bounce * hop, rockAngle * rock));
  }

  return image.animate(frames, { duration, delay, fill: "backwards" });
}

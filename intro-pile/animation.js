async function playOpeningPile() {
  const pile = document.querySelector(".intro-toys");
  const width = pile.clientWidth;
  const height = pile.clientHeight;
  if (!width || !height) return;

  const radius = Math.max(34, Math.min(83, width / 13));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const landed = [];
  const drops = [];
  let previousColor;
  let previousX;
  let delay = 0;

  // Return the first point of contact on a straight drop.
  function landingY(x, r) {
    let y = height - r;
    for (const other of landed) {
      const dx = x - other.x;
      const reach = r + other.r;
      if (Math.abs(dx) < reach) {
        y = Math.min(y, other.y - Math.sqrt(reach * reach - dx * dx));
      }
    }
    return y;
  }

  const shuffledToys = [];
  for (const [color, toys] of introToyColors) {
    for (const toy of toys) shuffledToys.push({ color, ...toy });
  }
  let remaining = [...shuffledToys];

  const maxToys = Math.ceil(width * height / (radius * radius * 2.2));
  for (let index = 0; index < maxToys; index++) {
    const r = radius * (0.8 + Math.random() * 0.35);
    const slots = Array.from({ length: 36 }, (_, i) => {
      const x = r + (width - 2 * r) * i / 35;
      return { x, y: landingY(x, r) };
    });
    const floor = Math.max(...slots.map(({ y }) => y));
    if (floor < r * 0.45) break;

    // Choose among the low spots and keep successive drops apart.
    const lowSlots = slots.filter(({ y }) => y >= floor - r * 0.7);
    const distant = lowSlots.filter(({ x }) => previousX === undefined
      || Math.abs(x - previousX) >= radius * 1.8);
    const separated = slots.filter(({ x, y }) => y >= -r * 0.25
      && (previousX === undefined || Math.abs(x - previousX) >= radius * 1.8));
    const choices = distant.length ? distant : separated;
    if (!choices.length) break;
    const bestY = Math.max(...choices.map(({ y }) => y));
    const lowChoices = choices.filter(({ y }) => y >= bestY - r * 0.7);
    const { x, y } = lowChoices[Math.floor(Math.random() * lowChoices.length)];

    const touchingColors = new Set(landed.filter((other) =>
      Math.hypot(x - other.x, y - other.y) < r + other.r + 4
    ).map((other) => other.color));
    if (!remaining.length) remaining = [...shuffledToys];
    const assorted = remaining.filter(({ color }) =>
      color !== previousColor && !touchingColors.has(color)
    );
    const pool = assorted.length ? assorted : remaining;
    const toy = pool[Math.floor(Math.random() * pool.length)];
    remaining.splice(remaining.indexOf(toy), 1);

    // Let the visible cutouts overlap a little to close gaps between narrow shapes.
    const image = document.createElement("img");
    const overlapScale = 1.27;
    const scale = overlapScale * 2 * r / Math.max(toy.w, toy.h);
    const imageWidth = toy.width * scale;
    const imageHeight = toy.height * scale;
    image.src = toy.src;
    image.alt = "";
    image.style.width = imageWidth + "px";
    image.style.height = imageHeight + "px";
    image.style.left = x - (toy.x + toy.w / 2) * scale + "px";
    image.style.top = y - (toy.y + toy.h / 2) * scale + "px";
    image.style.transformOrigin = (toy.x + toy.w / 2) * scale + "px "
      + (toy.y + toy.h / 2) * scale + "px";
    const tilt = Math.random() * 50 - 25;
    image.style.transform = `rotate(${tilt}deg)`;
    pile.append(image);

    if (!reducedMotion) {
      drops.push(animateToyDrop(image, delay, Math.max(0, y) + 2 * r, 2 * r, tilt).finished);
      delay += 45 + Math.random() * 105;
    }

    landed.push({ x, y, r, color: toy.color });
    previousColor = toy.color;
    previousX = x;
  }
  await Promise.allSettled(drops);
}

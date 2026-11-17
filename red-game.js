(() => {
  const board = document.querySelector("#red-board");
  const clues = document.querySelector("#clues");
  const status = document.querySelector("#round-status");

  const redClues = [
    ["16", "A dragon with its mouth open/Charizard"],
    ["21", "A mushroom with big spots"],
    ["22", "A little car with two big headlights"],
    ["14", "An octopus"],
    ["9", "A little figure holding a spiked club"],
    ["24-20", "A horseshoe"],
    ["24-32", "A lightning bolt"],
    ["24-38", "A planet with a ring"],
    ["24-41", "A key with a clover-shaped handle"],
    ["24-69", "A pumpkin"],
    ["24-74", "A heart"],
    ["24-78", "A padlock"],
  ];

  const clueCount = document.querySelector("#clue-count");
  const hintButton = document.querySelector("#hint-button");
  const roundSize = 4;
  const nextLevel = document.querySelector("#next-level");
  const titleScreen = document.querySelector("#title-screen");
  const gameScreen = document.querySelector("#game-screen");
  const playButton = document.querySelector("#play-button");
  const rainbowButton = document.querySelector("#rainbow-button");
  const rainbowOptions = document.querySelector("#rainbow-options");
  const clueControl = document.querySelector(".clue-control");

  function assortedLevel(name) {
    return { name, ...assortedBoards[name], directory: "assorted-toys" };
  }

  const levels = [
    { name: "Red", pieces: redObjects, directory: "objects", pool: redClues },
    { name: "Orange", pieces: orangeObjects, directory: "orange-objects", pool: orangeClues },
    { name: "Yellow", pieces: yellowObjects, directory: "yellow-objects", pool: yellowClues },
    { name: "Green", pieces: greenObjects, directory: "green-objects", pool: greenClues },
    { name: "Blue", pieces: blueObjects, directory: "blue-objects", pool: blueClues },
    assortedLevel("Light Blue"),
    assortedLevel("Purple"),
    assortedLevel("Pink"),
    assortedLevel("Teal and Friends"),
  ];

  let levelIndex = 0;
  let boardHeight = 2000;
  let objects = [];
  let hovered;
  let hinted;
  const targets = new Map();
  const found = new Set();
  const clueElements = new Map();

  function prepareLevel(level) {
    const { name, pieces, directory, pool, height = 2000 } = level;
    const assorted = directory === "assorted-toys";
    boardHeight = height;
    board.style.aspectRatio = `1600 / ${boardHeight}`;
    setHovered();
    setHint();
    hintButton.disabled = false;
    targets.clear();
    found.clear();
    clueElements.clear();
    fallingToys.clear();
    clues.replaceChildren();
    board.replaceChildren();
    board.setAttribute("aria-label", name + " toy collage");
    nextLevel.hidden = true;
    clueCount.textContent = `0/${roundSize}`;
    status.textContent = `${name} round. 0 of ${roundSize} found.`;

    // Draw different targets for this round.
    const remainingClues = [...pool];
    for (let i = 0; i < roundSize; i++) {
      const index = Math.floor(Math.random() * remainingClues.length);
      const [[id, clue]] = remainingClues.splice(index, 1);
      const item = document.createElement("li");
      item.textContent = clue;
      clues.append(item);
      targets.set(id, clue);
      clueElements.set(id, item);
    }

    // Keep each toy at its original position in the collage.
    objects = pieces.map(([id, x, y, width, height, mask, displayWidth = width, displayHeight = height]) => {
      const image = new Image(width, height);
      image.src = directory + "/" + id + (assorted ? ".webp" : ".png");
      image.alt = "";
      image.draggable = false;
      image.style.left = (x / 1600 * 100) + "%";
      image.style.top = (y / boardHeight * 100) + "%";
      image.style.width = (displayWidth / 1600 * 100) + "%";

      const pixels = atob(assorted ? assortedMasks[id] : mask);
      // Use the center of the visible pixels as the pivot.
      let totalX = 0;
      let totalY = 0;
      let count = 0;
      for (let pixel = 0; pixel < width * height; pixel++) {
        if (!(pixels.charCodeAt(pixel >> 3) & (1 << (pixel & 7)))) continue;
        totalX += pixel % width;
        totalY += Math.floor(pixel / width);
        count++;
      }

      if (count) {
        image.style.transformOrigin = (totalX / count / width * 100) + "% "
          + (totalY / count / height * 100) + "%";
      }
      board.append(image);
      return { id, x, y, width, height, displayWidth, displayHeight, pixels, image };
    }).reverse();
  }

  const fallingToys = new Set();

  function objectAtPixel(x, y) {
    return objects.find((object) => {
      if (fallingToys.has(object)) return false;
      const column = Math.floor((x - object.x) * object.width / object.displayWidth);
      const row = Math.floor((y - object.y) * object.height / object.displayHeight);
      if (column < 0 || column >= object.width || row < 0 || row >= object.height) {
        return false;
      }

      const pixel = row * object.width + column;
      return (object.pixels.charCodeAt(pixel >> 3) & (1 << (pixel & 7))) !== 0;
    });
  }

  function objectAt(event, padding = 0) {
    const rect = board.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * 1600 / rect.width);
    const y = Math.floor((event.clientY - rect.top) * boardHeight / rect.height);
    const exact = objectAtPixel(x, y);

    if (exact || !padding) return exact;

    // A narrow buffer helps with thin edges. Exact hits always win.
    for (let distance = 1; distance <= padding; distance++) {
      const dx = Math.round(distance * 1600 / rect.width);
      const dy = Math.round(distance * boardHeight / rect.height);
      const nearby = objectAtPixel(x - dx, y) || objectAtPixel(x + dx, y)
        || objectAtPixel(x, y - dy) || objectAtPixel(x, y + dy);

      if (nearby) return nearby;
    }
  }

  function setHovered(object) {
    if (object === hovered) return;

    hovered?.image.classList.remove("wiggle");
    hovered = object;
    hovered?.image.classList.add("wiggle");
    board.classList.toggle("over-object", Boolean(object));
  }

  function setHint(object) {
    hinted?.image.classList.remove("hint-wiggle");
    hinted = object;
    hinted?.image.classList.add("hint-wiggle");
  }

  hintButton.addEventListener("click", () => {
    const target = hinted ?? objects.find((object) =>
      targets.has(object.id) && !found.has(object.id));
    if (!target) return;

    if (!hinted) setHint(target);
    status.textContent = "One of the remaining toys is highlighted.";
  });

  function hoverAt(event) {
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      setHovered(objectAt(event, 4));
    }
  }

  board.addEventListener("pointerenter", hoverAt);
  board.addEventListener("pointermove", hoverAt);
  board.addEventListener("pointerleave", () => setHovered());

  board.addEventListener("click", (event) => {
    const object = objectAt(event);
    if (!object) return;

    // Give tapped toys a short wiggle on touchscreens.
    if (event.pointerType === "touch") {
      object.image.classList.remove("tap-wiggle");
      void object.image.offsetWidth;
      object.image.classList.add("tap-wiggle");
    }

    if (found.size === targets.size) return;

    if (!targets.has(object.id)) {
      status.textContent = `Keep looking! ${found.size} of ${roundSize} found.`;
      return;
    }

    if (found.has(object.id)) return;

    if (object === hinted) setHint();
    found.add(object.id);
    clueCount.textContent = `${found.size}/${targets.size}`;
    const clue = clueElements.get(object.id);
    clue.classList.add("found-clue");
    clue.textContent += " ✓";
    object.image.classList.add("found-object");

    status.textContent = found.size === targets.size
      ? "You found them all!"
      : `${found.size} of ${roundSize} found.`;

    hintButton.disabled = found.size === targets.size;

    if (found.size === targets.size) {
      const upcoming = levelIndex >= 0 ? levels[levelIndex + 1] : undefined;
      nextLevel.textContent = upcoming ? "Play " + upcoming.name : "Back to menu";
      nextLevel.hidden = false;
    }
  });

  function dropLevelToys() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scale = board.getBoundingClientRect().width / 1600;
    // Lower toys generally arrive first. Offset their order so a whole row
    // never starts falling in lockstep.
    const drops = objects.map((toy) => ({
      toy,
      priority: toy.y + toy.displayHeight + (Math.random() - 0.5) * 620,
    })).sort((a, b) => b.priority - a.priority);
    const interval = Math.min(140, 6100 / Math.max(1, objects.length - 1));
    let delay = 0;

    for (const { toy } of drops) {
      const size = Math.max(toy.displayWidth, toy.displayHeight) * scale;
      const distance = (toy.y + toy.displayHeight) * scale + size / 2 + 20;
      fallingToys.add(toy);
      const drop = animateToyDrop(toy.image, delay, distance, size);
      drop.finished.then(() => fallingToys.delete(toy), () => fallingToys.delete(toy));
      delay += interval * (0.34 + Math.random() * 1.14);
    }
  }

  function setRainbowOptions(open) {
    rainbowOptions.hidden = !open;
    rainbowButton.setAttribute("aria-expanded", String(open));
  }

  function showMenu() {
    gameScreen.hidden = true;
    titleScreen.hidden = false;
    setRainbowOptions(false);
    window.scrollTo(0, 0);
    playButton.focus({ preventScroll: true });
  }

  function startLevel(level) {
    titleScreen.hidden = true;
    gameScreen.hidden = false;
    clueControl.open = false;
    prepareLevel(level);
    window.scrollTo(0, 0);
    dropLevelToys();
    clueControl.querySelector("summary").focus({ preventScroll: true });
  }

  playButton.addEventListener("click", () => {
    levelIndex = 0;
    startLevel(levels[0]);
  });

  document.querySelector("#mix-button").addEventListener("click", () => {
    levelIndex = -1;
    startLevel(assortedLevel("Mix"));
  });

  rainbowButton.addEventListener("click", () => {
    setRainbowOptions(rainbowOptions.hidden);
  });

  for (const difficulty of ["Easy", "Medium", "Hard"]) {
    document.querySelector("#rainbow-" + difficulty.toLowerCase()).addEventListener("click", () => {
      levelIndex = -1;
      startLevel(assortedLevel("Rainbow " + difficulty));
    });
  }

  document.querySelector("#menu-button").addEventListener("click", showMenu);
  nextLevel.addEventListener("click", () => {
    if (nextLevel.hidden) return;
    if (levelIndex >= 0 && levelIndex + 1 < levels.length) {
      levelIndex++;
      startLevel(levels[levelIndex]);
    } else {
      showMenu();
    }
  });
})();

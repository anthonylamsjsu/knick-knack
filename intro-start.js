(() => {
  const trigger = document.querySelector("#intro-trigger");
  const menu = document.querySelector("#mode-menu");
  const play = document.querySelector("#play-button");

  trigger.addEventListener("click", async () => {
    const fromKeyboard = document.activeElement === trigger;
    trigger.hidden = true;

    // Start audio directly from the first interaction so browsers allow playback.
    const music = new Audio("./music/knick-knack-monochrome.mp3");
    music.loop = true;
    music.currentTime = 2;
    music.play().catch((error) => console.warn("Music could not start:", error));

    try {
      await playOpeningPile();
    } finally {
      menu.hidden = false;
      if (fromKeyboard) play.focus();
    }
  }, { once: true });
})();

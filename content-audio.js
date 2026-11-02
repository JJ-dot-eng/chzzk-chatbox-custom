function isTopLevelAudioPage() {
  try {
    return window.top === window;
  } catch (_error) {
    return false;
  }
}

function setAudioCompressorState(state, error = "") {
  if (document.documentElement.dataset[AUDIO_COMPRESSOR_STATE_DATASET_KEY] !== state) {
    document.documentElement.dataset[AUDIO_COMPRESSOR_STATE_DATASET_KEY] = state;
  }

  audioCompressorState.lastError = error;
}

function disconnectAudioNode(node) {
  try {
    node?.disconnect();
  } catch (_error) {
    // A node can already be disconnected while CHZZK replaces its player.
  }
}

function connectAudioNode(source, destination) {
  try {
    source?.connect(destination);
    return true;
  } catch (error) {
    setAudioCompressorState("error", error?.message || "audio-node-connect-failed");
    return false;
  }
}

function findPrimaryVideoElement() {
  const candidates = [...document.querySelectorAll("video")]
    .filter((video) => !video.closest("[data-chzzk-chat-ui-toggle-generated]"))
    .map((video) => {
      const rect = video.getBoundingClientRect();
      const visibility = window.getComputedStyle(video).visibility;
      return {
        video,
        area: Math.max(0, rect.width) * Math.max(0, rect.height),
        visible: rect.width > 0 && rect.height > 0 &&
          visibility !== "hidden" && visibility !== "collapse"
      };
    });
  const visibleCandidates = candidates.filter(({ visible }) => visible);
  // Prefer visible videos, then player videos within that pool, so the hidden
  // fallback also keeps the player ahead of a larger video elsewhere.
  const pool = visibleCandidates.length > 0 ? visibleCandidates : candidates;
  const playerCandidates = pool.filter(({ video }) =>
    video.closest("#live_player_layout, #player_layout, .pzp-pc")
  );
  const rankedCandidates = playerCandidates.length > 0 ? playerCandidates : pool;

  rankedCandidates.sort((left, right) => right.area - left.area);
  return rankedCandidates[0]?.video || null;
}

function updateAudioCompressorParameters() {
  const { compressor, gain } = audioCompressorState;

  if (!compressor || !gain) {
    return;
  }

  compressor.threshold.value = currentOptions.audioCompressorThreshold;
  compressor.knee.value = currentOptions.audioCompressorKnee;
  compressor.ratio.value = currentOptions.audioCompressorRatio;
  compressor.attack.value = currentOptions.audioCompressorAttack;
  compressor.release.value = currentOptions.audioCompressorRelease;
  gain.gain.value = currentOptions.audioCompressorGain;
}

function bypassAudioCompressor() {
  const { context, compressor, gain, source } = audioCompressorState;

  if (audioCompressorState.graphMode === "bypass") {
    setAudioCompressorState("off");
    return;
  }

  disconnectAudioNode(source);
  disconnectAudioNode(compressor);
  disconnectAudioNode(gain);

  if (source && context && connectAudioNode(source, context.destination)) {
    audioCompressorState.graphMode = "bypass";
    setAudioCompressorState("off");
    return;
  }

  audioCompressorState.graphMode = "off";
  setAudioCompressorState("off");
}

function canStartAudioContext(userGestureActive) {
  const userActivation = navigator.userActivation;

  // Chrome/Edge allow an AudioContext to start once the page has sticky user
  // activation, even outside the input event (popup toggle, SPA navigation).
  // A touch pointerdown is not an activation, so a fresh gesture flag alone
  // would create a context that stays suspended.
  if (userActivation && typeof userActivation.hasBeenActive === "boolean") {
    return userActivation.hasBeenActive;
  }

  return userGestureActive;
}

function connectAudioCompressorResumeListener() {
  if (audioCompressorState.resumeListenerConnected) {
    return;
  }

  audioCompressorState.resumeListenerConnected = true;
  const resume = (event) => {
    const context = audioCompressorState.context;

    if (event?.type === "pointerup" && event.pointerType === "mouse") {
      // Mouse input already activated the page on pointerdown.
      return;
    }

    if (!currentOptions.useAudioCompressor) {
      return;
    }

    if (!context) {
      syncAudioCompressor(true);
      return;
    }

    if (context.state !== "suspended") {
      scheduleAudioCompressorSync(0);
      return;
    }

    context.resume()
      .catch(() => {})
      .finally(() => scheduleAudioCompressorSync(0));
  };

  document.addEventListener("pointerdown", resume, { capture: true, passive: true });
  // Touch and pen input activate the page on pointerup, not pointerdown.
  document.addEventListener("pointerup", resume, { capture: true, passive: true });
  document.addEventListener("keydown", resume, { capture: true });
  // Input inside an iframe (guest chat, mini chat) also activates this page,
  // but its events stay in the frame. Moving focus into the frame blurs this
  // window, so retry only while waiting and once the page has been activated.
  window.addEventListener("blur", (event) => {
    if (
      event.target !== window ||
      document.documentElement.dataset[AUDIO_COMPRESSOR_STATE_DATASET_KEY] !== "waiting" ||
      navigator.userActivation?.hasBeenActive !== true
    ) {
      return;
    }

    resume(event);
  });
}

function connectAudioCompressorMediaListener() {
  if (audioCompressorState.mediaListenerConnected) {
    return;
  }

  audioCompressorState.mediaListenerConnected = true;
  const syncOnPlayback = (event) => {
    const video = event.target;

    if (
      !currentOptions.useAudioCompressor ||
      !(video instanceof HTMLVideoElement) ||
      video === audioCompressorState.video ||
      video.closest("[data-chzzk-chat-ui-toggle-generated]")
    ) {
      return;
    }

    scheduleAudioCompressorSync();
  };

  // Media events do not bubble. Capture also catches a previously hidden video
  // starting playback without any nodes being added to the document.
  document.addEventListener("play", syncOnPlayback, { capture: true, passive: true });
  document.addEventListener("playing", syncOnPlayback, { capture: true, passive: true });
}

function ensureAudioCompressorNodes(video, userGestureActive = false) {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    setAudioCompressorState("unsupported", "audio-context-unavailable");
    return false;
  }

  connectAudioCompressorResumeListener();

  if (!audioCompressorState.context) {
    if (!canStartAudioContext(userGestureActive)) {
      setAudioCompressorState("waiting");
      return false;
    }

    audioCompressorState.context = new AudioContextConstructor();
    audioCompressorState.compressor = audioCompressorState.context.createDynamicsCompressor();
    audioCompressorState.gain = audioCompressorState.context.createGain();
  }

  if (audioCompressorState.context.state === "suspended") {
    setAudioCompressorState("waiting");

    if (userGestureActive) {
      audioCompressorState.context.resume()
        .catch(() => {})
        .finally(() => {
          if (audioCompressorState.context?.state === "running") {
            scheduleAudioCompressorSync(0);
          }
        });
    }

    return false;
  }

  if (audioCompressorState.video !== video) {
    bypassAudioCompressor();
    audioCompressorState.video = video;
    audioCompressorState.source = audioCompressorState.sources.get(video) || null;
  }

  if (!audioCompressorState.source) {
    try {
      audioCompressorState.source =
        audioCompressorState.context.createMediaElementSource(video);
      audioCompressorState.sources.set(video, audioCompressorState.source);
    } catch (error) {
      setAudioCompressorState("error", error?.message || "media-element-source-failed");
      return false;
    }
  }

  return true;
}

function syncAudioCompressor(userGestureActive = false) {
  window.clearTimeout(audioCompressorState.syncTimer);
  audioCompressorState.syncTimer = 0;

  if (!isTopLevelAudioPage()) {
    setAudioCompressorState("off");
    return;
  }

  if (!currentOptions.useAudioCompressor) {
    bypassAudioCompressor();
    return;
  }

  connectAudioCompressorMediaListener();
  const video = findPrimaryVideoElement();

  if (!video) {
    // Keep the previous source audible if CHZZK reuses its element later, but
    // stop treating the detached video and its bypass graph as the active one.
    bypassAudioCompressor();
    audioCompressorState.video = null;
    audioCompressorState.source = null;
    audioCompressorState.graphMode = "off";
    setAudioCompressorState("waiting");
    return;
  }

  if (!ensureAudioCompressorNodes(video, userGestureActive)) {
    return;
  }

  const { context, compressor, gain, source } = audioCompressorState;

  updateAudioCompressorParameters();

  if (audioCompressorState.graphMode === "compressor") {
    setAudioCompressorState("on");
    return;
  }

  audioCompressorState.graphMode = "off";
  disconnectAudioNode(source);
  disconnectAudioNode(compressor);
  disconnectAudioNode(gain);

  const connected =
    connectAudioNode(source, compressor) &&
    connectAudioNode(compressor, gain) &&
    connectAudioNode(gain, context.destination);

  if (connected) {
    audioCompressorState.graphMode = "compressor";
    setAudioCompressorState("on");
  } else {
    const error = audioCompressorState.lastError || "audio-graph-connect-failed";
    bypassAudioCompressor();
    setAudioCompressorState("error", error);
  }
}

function audioCompressorMutationNeedsSync(mutations) {
  if (!isTopLevelAudioPage() || !currentOptions.useAudioCompressor) {
    return false;
  }

  if (audioCompressorState.video && !audioCompressorState.video.isConnected) {
    return true;
  }

  return mutations.some((mutation) => [...mutation.addedNodes].some((node) => {
    return (
      node instanceof HTMLVideoElement ||
      (node instanceof Element && Boolean(node.querySelector("video")))
    );
  }));
}

function scheduleAudioCompressorSync(delay = 50) {
  // Mutations and playback events must not postpone an already queued sync.
  // Settings and input still replace the pending timer with an immediate sync.
  if (delay > 0 && audioCompressorState.syncTimer) {
    return;
  }

  window.clearTimeout(audioCompressorState.syncTimer);
  audioCompressorState.syncTimer = 0;

  if (!isTopLevelAudioPage()) {
    setAudioCompressorState("off");
    return;
  }

  audioCompressorState.syncTimer = window.setTimeout(syncAudioCompressor, delay);
}

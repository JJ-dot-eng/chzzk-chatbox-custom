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
  const candidates = [
    ...document.querySelectorAll(
      "#live_player_layout video, #player_layout video, .pzp-pc video, video"
    )
  ];

  if (candidates.length === 0) {
    return null;
  }

  const visibleCandidates = candidates
    .map((video) => {
      const rect = video.getBoundingClientRect();
      return {
        video,
        area: Math.max(0, rect.width) * Math.max(0, rect.height),
        visible: rect.width > 0 && rect.height > 0
      };
    })
    .filter(({ video }) => !video.closest("[data-chzzk-chat-ui-toggle-generated]"));
  const rankedCandidates = visibleCandidates.some(({ visible }) => visible)
    ? visibleCandidates.filter(({ visible }) => visible)
    : visibleCandidates;

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

function connectAudioCompressorResumeListener() {
  if (audioCompressorState.resumeListenerConnected) {
    return;
  }

  audioCompressorState.resumeListenerConnected = true;
  const resume = () => {
    const context = audioCompressorState.context;

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
  document.addEventListener("keydown", resume, { capture: true });
}

function ensureAudioCompressorNodes(video, userGestureActive = false) {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    setAudioCompressorState("unsupported", "audio-context-unavailable");
    return false;
  }

  connectAudioCompressorResumeListener();

  if (!audioCompressorState.context) {
    if (!userGestureActive) {
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

  const video = findPrimaryVideoElement();

  if (!video) {
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
  window.clearTimeout(audioCompressorState.syncTimer);
  audioCompressorState.syncTimer = 0;

  if (!isTopLevelAudioPage()) {
    setAudioCompressorState("off");
    return;
  }

  audioCompressorState.syncTimer = window.setTimeout(syncAudioCompressor, delay);
}

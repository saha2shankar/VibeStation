const PlayerApp = (() => {
  const BASE_URL = "http://127.0.0.1:3000";
  const STORAGE_KEY = "vibeStationPlayerState";

  const state = {
    playlists: [
      {
        id: "all-songs",
        name: "All Library",
        description: "Everything in your VibeStation",
        folder: "songs",
        cover:
          "https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg",
      },
      {
        id: "focus-flow",
        name: "Focus Flow",
        description: "Deep beats to lock in and create",
        folder: "songs/focus-flow",
        cover:
          "https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        id: "sk",
        name: "SK",
        description: "Deep beats to lock in and create",
        folder: "songs/sk",
        cover:
          "https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        id: "midnight-drive",
        name: "Midnight Drive",
        description: "Neon synths and late-night energy",
        folder: "songs/midnight-drive",
        cover:
          "https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        id: "sunset-chill",
        name: "Sunset Chill",
        description: "Warm lofi and acoustic vibes",
        folder: "songs/sunset-chill",
        cover:
          "https://images.pexels.com/photos/847402/pexels-photo-847402.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        id: "bass-booster",
        name: "Bass Booster",
        description: "Heavy low-end to shake your room",
        folder: "songs/bass-booster",
        cover:
          "https://images.pexels.com/photos/167637/pexels-photo-167637.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        id: "vibe-classics",
        name: "Vibe Classics",
        description: "Timeless tracks you always return to",
        folder: "songs/vibe-classics",
        cover:
          "https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
    currentPlaylistId: "all-songs",
    songs: [],
    filteredSongs: [],
    currentIndex: 0,
    audio: new Audio(),
    isPlaying: false,
    isShuffle: false,
    repeatMode: "off",
    volume: 0.8,
    previousVolume: 0.8,
    isMuted: false,
    isSeeking: false,
    restoredTrack: null,
    restoredPosition: 0,
    audioContext: null,
    audioSource: null,
    analyser: null,
    dataArray: null,
    animationFrameId: null,
    favorites: new Set(),
    toastTimeoutId: null,
  };

  const dom = {};

  function cacheDom() {
    dom.playlistContainer = document.getElementById("playlistContainer");
    dom.libraryList = document.querySelector(".library-list");
    dom.songSearch = document.getElementById("songSearch");
    dom.globalSearch = document.getElementById("globalSearch");
    dom.coverArt = document.getElementById("coverArt");
    dom.songTitle = document.getElementById("songTitle");
    dom.songArtist = document.getElementById("songArtist");
    dom.currentTime = document.getElementById("currentTime");
    dom.totalTime = document.getElementById("totalTime");
    dom.seekbar = document.getElementById("seekbar");
    dom.seekbarFill = document.getElementById("seekbarFill");
    dom.seekHandle = document.getElementById("seekHandle");
    dom.shuffleBtn = document.getElementById("shuffleBtn");
    dom.previousBtn = document.getElementById("previousBtn");
    dom.playPauseBtn = document.getElementById("playPauseBtn");
    dom.nextBtn = document.getElementById("nextBtn");
    dom.repeatBtn = document.getElementById("repeatBtn");
    dom.muteBtn = document.getElementById("muteBtn");
    dom.volumeSlider = document.getElementById("volumeSlider");
    dom.visualizer = document.getElementById("audioVisualizer");
    dom.loadingOverlay = document.getElementById("loadingOverlay");
    dom.sidebar = document.querySelector(".left");
    dom.hamburger = document.querySelector(".hamburger");
    dom.closeSidebar = document.querySelector(".close");
    dom.likeBtn = document.getElementById("likeBtn");
    dom.toast = document.getElementById("toast");
    dom.trackIndex = document.getElementById("trackIndex");
  }

  async function fetchSongsList(folder) {
    const folderPath = folder.replace(/\/$/, "");
    const response = await fetch(`${BASE_URL}/${folderPath}/`);
    const data = await response.text();

    const div = document.createElement("div");
    div.innerHTML = data;
    const links = div.getElementsByTagName("a");
    const result = [];

    for (const link of links) {
      const href = link.href || link.getAttribute("href") || "";
      if (!href.endsWith(".mp3")) continue;
      const decoded = decodeURIComponent(href);
      const filename = decoded.split(/[/\\]/).pop();
      if (filename) {
        result.push(filename);
      }
    }

    return result;
  }

  function parseSongMeta(filename) {
    const withoutExt = filename.replace(/\.[^/.]+$/, "");
    const cleaned = withoutExt.replace(/_/g, " ").trim();

    let title = cleaned;
    let artist = "Unknown Artist";

    const dashIndex = cleaned.indexOf("-");
    if (dashIndex > -1) {
      const left = cleaned.slice(0, dashIndex).trim();
      const right = cleaned.slice(dashIndex + 1).trim();
      if (right) {
        title = left || cleaned;
        artist = right;
      }
    }

    return { title, artist };
  }

  function showLoadingOverlay(show) {
    if (!dom.loadingOverlay) return;
    if (show) {
      dom.loadingOverlay.classList.add("visible");
    } else {
      dom.loadingOverlay.classList.remove("visible");
    }
  }

  function renderPlaylists() {
    if (!dom.playlistContainer) return;
    dom.playlistContainer.innerHTML = "";

    state.playlists.forEach((playlist) => {
      const card = document.createElement("article");
      card.className = "card";
      if (playlist.id === state.currentPlaylistId) {
        card.classList.add("active-playlist");
      }
      card.dataset.playlistId = playlist.id;

      card.innerHTML = `
        <div class="play">
          <svg
            width="40"
            height="40"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="50" fill="#1db954" />
            <polygon points="40,30 40,70 70,50" />
          </svg>
        </div>
        <img
          src="${playlist.cover}"
          alt="${playlist.name}"
        />
        <h2>${playlist.name}</h2>
        <p>${playlist.description}</p>
      `;

      card.addEventListener("click", () => {
        if (playlist.id !== state.currentPlaylistId) {
          switchPlaylist(playlist.id);
        }
      });

      dom.playlistContainer.appendChild(card);
    });
  }

  function renderSongList() {
    if (!dom.libraryList) return;
    dom.libraryList.innerHTML = "";

    state.filteredSongs.forEach((song, index) => {
      const li = document.createElement("li");
      li.dataset.index = String(index);
      li.dataset.file = song.file;

      li.innerHTML = `
        <div class="sideplaylist">
          <div class="flex gap-1">
            <img
              src="public/music.svg"
              class="invert"
              width="20"
            />
            <div>
              <p class="songName">${song.title}</p>
              <p class="songCount">${song.artist}</p>
            </div>
          </div>
          <div class="playbutton">
            <span>Play Now</span>
            <span class="favorite-indicator">★</span>
          </div>
        </div>
      `;

      li.addEventListener("click", () => {
        const originalIndex = state.songs.findIndex(
          (s) => s.file === song.file,
        );
        if (originalIndex !== -1) {
          playAtIndex(originalIndex, true);
        }
      });

      dom.libraryList.appendChild(li);
    });

    updateActiveSongHighlight();
    updateFavoriteIndicators();
  }

  function updateActiveSongHighlight() {
    if (!dom.libraryList) return;
    const items = dom.libraryList.querySelectorAll("li");
    items.forEach((li) => {
      li.classList.remove("active");
      const file = li.dataset.file;
      const current = state.songs[state.currentIndex];
      if (current && current.file === file) {
        li.classList.add("active");
      }
    });
  }

  function updateFavoriteIndicators() {
    if (!dom.libraryList) return;
    const items = dom.libraryList.querySelectorAll("li");
    items.forEach((li) => {
      const file = li.dataset.file;
      const indicator = li.querySelector(".favorite-indicator");
      if (!indicator) return;
      if (state.favorites.has(file)) {
        indicator.classList.add("visible");
      } else {
        indicator.classList.remove("visible");
      }
    });
  }

  function getCurrentSong() {
    return state.songs[state.currentIndex];
  }

  function updateMetadataDisplay() {
    const song = getCurrentSong();
    if (!song) {
      dom.songTitle.textContent = "Nothing playing";
      dom.songArtist.textContent = "Select a track to start";
      if (dom.trackIndex) {
        dom.trackIndex.textContent = "";
      }
      updateLikeButton();
      return;
    }
    dom.songTitle.textContent = song.title;
    dom.songArtist.textContent = song.artist;
    if (dom.trackIndex) {
      const index = state.currentIndex + 1;
      const total = state.songs.length;
      dom.trackIndex.textContent = total > 0 ? `${index} / ${total}` : "";
    }
    updateLikeButton();
    updateFavoriteIndicators();
  }

  function updateLikeButton() {
    if (!dom.likeBtn) return;
    const song = getCurrentSong();
    if (!song) {
      dom.likeBtn.classList.remove("active");
      dom.likeBtn.textContent = "♡";
      dom.likeBtn.disabled = true;
      return;
    }
    dom.likeBtn.disabled = false;
    const isFav = state.favorites.has(song.file);
    dom.likeBtn.classList.toggle("active", isFav);
    dom.likeBtn.textContent = isFav ? "♥" : "♡";
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function updateProgressUI() {
    const audio = state.audio;
    if (!audio.duration) return;

    dom.currentTime.textContent = formatTime(audio.currentTime);
    dom.totalTime.textContent = formatTime(audio.duration);

    if (state.isSeeking) return;

    const percent = (audio.currentTime / audio.duration) * 100;
    dom.seekbarFill.style.width = `${percent}%`;
    dom.seekHandle.style.left = `${percent}%`;
  }

  function seekToPercent(percent) {
    const audio = state.audio;
    if (!audio.duration) return;
    const clamped = Math.max(0, Math.min(100, percent));
    const seconds = (audio.duration * clamped) / 100;
    audio.currentTime = seconds;
    dom.seekbarFill.style.width = `${clamped}%`;
    dom.seekHandle.style.left = `${clamped}%`;
  }

  function handleSeekPointerDown(event) {
    state.isSeeking = true;
    const rect = dom.seekbar.getBoundingClientRect();
    const percent = ((event.clientX - rect.left) / rect.width) * 100;
    seekToPercent(percent);
  }

  function handleSeekPointerMove(event) {
    if (!state.isSeeking) return;
    const rect = dom.seekbar.getBoundingClientRect();
    const percent = ((event.clientX - rect.left) / rect.width) * 100;
    seekToPercent(percent);
  }

  function handleSeekPointerUp() {
    if (!state.isSeeking) return;
    state.isSeeking = false;
  }

  function updatePlayPauseButton() {
    if (!dom.playPauseBtn) return;
    dom.playPauseBtn.textContent = state.isPlaying ? "⏸" : "▶";
    dom.playPauseBtn.setAttribute(
      "aria-label",
      state.isPlaying ? "Pause" : "Play",
    );
  }

  function updateShuffleButton() {
    if (!dom.shuffleBtn) return;
    dom.shuffleBtn.classList.toggle("active", state.isShuffle);
  }

  function updateRepeatButton() {
    if (!dom.repeatBtn) return;
    dom.repeatBtn.classList.remove("active");
    if (state.repeatMode !== "off") {
      dom.repeatBtn.classList.add("active");
    }
    dom.repeatBtn.textContent = state.repeatMode === "one" ? "🔂" : "🔁";
  }

  function updateMuteButton() {
    if (!dom.muteBtn) return;
    dom.muteBtn.textContent = state.isMuted ? "🔇" : "🔊";
  }

  function applyVolume() {
    state.audio.volume = state.isMuted ? 0 : state.volume;
    dom.volumeSlider.value = String(state.volume);
    updateMuteButton();
  }

  function showToast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.add("visible");
    if (state.toastTimeoutId) {
      clearTimeout(state.toastTimeoutId);
    }
    state.toastTimeoutId = setTimeout(() => {
      dom.toast.classList.remove("visible");
    }, 2200);
  }

  function fadeIn(targetVolume) {
    if (targetVolume <= 0) return;
    const steps = 10;
    const stepTime = 20;
    let currentStep = 0;
    state.audio.volume = 0;
    const id = setInterval(() => {
      currentStep += 1;
      const ratio = currentStep / steps;
      state.audio.volume = targetVolume * ratio;
      if (currentStep >= steps) {
        clearInterval(id);
        state.audio.volume = targetVolume;
      }
    }, stepTime);
  }

  function fadeOutAndPause(onDone) {
    const startVolume = state.audio.volume;
    if (startVolume === 0) {
      state.audio.pause();
      if (typeof onDone === "function") onDone();
      return;
    }
    const steps = 10;
    const stepTime = 20;
    let currentStep = 0;
    const id = setInterval(() => {
      currentStep += 1;
      const ratio = 1 - currentStep / steps;
      state.audio.volume = startVolume * Math.max(ratio, 0);
      if (currentStep >= steps) {
        clearInterval(id);
        state.audio.pause();
        state.audio.volume = state.isMuted ? 0 : state.volume;
        if (typeof onDone === "function") onDone();
      }
    }, stepTime);
  }

  function saveState() {
    try {
      const currentSong = getCurrentSong();
      const payload = {
        currentPlaylistId: state.currentPlaylistId,
        currentFile: currentSong ? currentSong.file : null,
        volume: state.volume,
        isMuted: state.isMuted,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
        favorites: Array.from(state.favorites),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

  function restoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw);

      if (stored.currentPlaylistId) {
        state.currentPlaylistId = stored.currentPlaylistId;
      }
      if (typeof stored.volume === "number") {
        state.volume = stored.volume;
        state.previousVolume = stored.volume;
      }
      if (typeof stored.isMuted === "boolean") {
        state.isMuted = stored.isMuted;
      }
      if (typeof stored.isShuffle === "boolean") {
        state.isShuffle = stored.isShuffle;
      }
      if (
        stored.repeatMode === "off" ||
        stored.repeatMode === "one" ||
        stored.repeatMode === "all"
      ) {
        state.repeatMode = stored.repeatMode;
      }
      if (stored.currentFile) {
        state.restoredTrack = stored.currentFile;
      }
      if (Array.isArray(stored.favorites)) {
        state.favorites = new Set(stored.favorites);
      }
    } catch (_) {}
  }

  function ensureAudioGraph() {
    if (!dom.visualizer) return;
    if (!window.AudioContext && !window.webkitAudioContext) return;

    if (!state.audioContext) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new Ctor();
    }

    if (!state.audioSource && state.audioContext) {
      state.audioSource = state.audioContext.createMediaElementSource(
        state.audio,
      );
      state.analyser = state.audioContext.createAnalyser();
      state.analyser.fftSize = 256;
      const bufferLength = state.analyser.frequencyBinCount;
      state.dataArray = new Uint8Array(bufferLength);

      state.audioSource.connect(state.analyser);
      state.analyser.connect(state.audioContext.destination);
    }
  }

  function startVisualizer() {
    if (!state.analyser || !dom.visualizer) return;

    const canvas = dom.visualizer;
    const ctx = canvas.getContext("2d");
    const bufferLength = state.analyser.frequencyBinCount;

    function draw() {
      state.animationFrameId = requestAnimationFrame(draw);
      state.analyser.getByteFrequencyData(state.dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const value = state.dataArray[i];
        const barHeight = (value / 255) * height;
        ctx.fillStyle = `rgba(29, 185, 84, ${0.2 + barHeight / height})`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    }

    if (!state.animationFrameId) {
      draw();
    }
  }

  function stopVisualizer() {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
  }

  async function playCurrent(shouldPlay) {
    const song = getCurrentSong();
    if (!song) return;

    state.audio.src = song.src;

    updateMetadataDisplay();
    updateActiveSongHighlight();
    saveState();

    if (!shouldPlay) {
      state.isPlaying = false;
      updatePlayPauseButton();
      return;
    }

    try {
      ensureAudioGraph();
      if (state.audioContext && state.audioContext.state === "suspended") {
        await state.audioContext.resume();
      }
      const targetVolume = state.isMuted ? 0 : state.volume;
      state.audio.volume = 0;
      await state.audio.play();
      state.isPlaying = true;
      updatePlayPauseButton();
      startVisualizer();
      if (targetVolume > 0) {
        fadeIn(targetVolume);
      }
      showToast(`Now playing: ${song.title}`);
    } catch (_) {
      state.isPlaying = false;
      updatePlayPauseButton();
      stopVisualizer();
    }
  }

  function playAtIndex(index, autoplay) {
    if (index < 0 || index >= state.songs.length) return;
    state.currentIndex = index;
    playCurrent(autoplay);
  }

  function togglePlayPause() {
    if (!state.audio.src) {
      if (state.songs.length > 0) {
        playAtIndex(state.currentIndex, true);
      }
      return;
    }

    if (state.audio.paused) {
      playCurrent(true);
    } else {
      fadeOutAndPause(() => {
        state.isPlaying = false;
        updatePlayPauseButton();
        stopVisualizer();
      });
    }
  }

  function nextTrack(fromEnded) {
    if (state.songs.length === 0) return;

    if (state.repeatMode === "one" && fromEnded) {
      playCurrent(true);
      return;
    }

    if (state.isShuffle) {
      if (state.songs.length === 1) return;
      let nextIndex = state.currentIndex;
      while (nextIndex === state.currentIndex) {
        nextIndex = Math.floor(Math.random() * state.songs.length);
      }
      playAtIndex(nextIndex, true);
      return;
    }

    if (state.currentIndex < state.songs.length - 1) {
      playAtIndex(state.currentIndex + 1, true);
    } else if (state.repeatMode === "all") {
      playAtIndex(0, true);
    } else if (!fromEnded) {
      playAtIndex(state.currentIndex, true);
    }
  }

  function previousTrack() {
    if (state.songs.length === 0) return;
    if (state.audio.currentTime > 3) {
      state.audio.currentTime = 0;
      return;
    }
    if (state.currentIndex > 0) {
      playAtIndex(state.currentIndex - 1, true);
    } else {
      playAtIndex(0, true);
    }
  }

  function toggleShuffle() {
    state.isShuffle = !state.isShuffle;
    updateShuffleButton();
    saveState();
  }

  function cycleRepeatMode() {
    if (state.repeatMode === "off") {
      state.repeatMode = "all";
    } else if (state.repeatMode === "all") {
      state.repeatMode = "one";
    } else {
      state.repeatMode = "off";
    }
    updateRepeatButton();
    saveState();
  }

  function changeVolume(value) {
    state.volume = Math.max(0, Math.min(1, value));
    state.previousVolume = state.volume;
    if (state.volume === 0) {
      state.isMuted = true;
    } else {
      state.isMuted = false;
    }
    applyVolume();
    saveState();
  }

  function toggleMute() {
    if (!state.isMuted) {
      state.previousVolume = state.volume;
      state.isMuted = true;
    } else {
      state.isMuted = false;
      state.volume = state.previousVolume || 0.5;
    }
    applyVolume();
    saveState();
  }

  function toggleFavorite() {
    const song = getCurrentSong();
    if (!song) return;
    if (state.favorites.has(song.file)) {
      state.favorites.delete(song.file);
      showToast("Removed from Favorites");
    } else {
      state.favorites.add(song.file);
      showToast("Added to Favorites");
    }
    updateLikeButton();
    updateFavoriteIndicators();
    saveState();
  }

  function switchPlaylist(playlistId) {
    state.currentPlaylistId = playlistId;
    state.currentIndex = 0;
    state.songs = [];
    state.filteredSongs = [];
    renderPlaylists();
    loadPlaylist(playlistId);
  }

  async function loadPlaylist(playlistId) {
    const playlist = state.playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    showLoadingOverlay(true);
    try {
      const filenames = await fetchSongsList(playlist.folder);
      const folderPath = playlist.folder.replace(/\/$/, "");

      state.songs = filenames.map((file) => {
        const meta = parseSongMeta(file);
        return {
          file,
          title: meta.title,
          artist: meta.artist,
          src: `${BASE_URL}/${folderPath}/${file}`,
        };
      });
      state.filteredSongs = [...state.songs];

      let indexToPlay = 0;
      if (state.restoredTrack) {
        const idx = state.songs.findIndex(
          (s) => s.file === state.restoredTrack,
        );
        if (idx !== -1) {
          indexToPlay = idx;
        }
      }
      state.currentIndex = indexToPlay;

      renderSongList();
      await playCurrent(false);
    } catch (error) {
      console.error("Failed to load playlist", error);
    } finally {
      showLoadingOverlay(false);
    }
  }

  function handleSongSearch() {
    const term = dom.songSearch.value.trim().toLowerCase();
    if (!term) {
      state.filteredSongs = [...state.songs];
    } else {
      state.filteredSongs = state.songs.filter((song) => {
        const title = song.title.toLowerCase();
        const artist = song.artist.toLowerCase();
        return title.includes(term) || artist.includes(term);
      });
    }
    renderSongList();
  }

  function handleKeyboard(event) {
    const tag = document.activeElement.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    if (event.code === "Space") {
      event.preventDefault();
      togglePlayPause();
    } else if (event.code === "ArrowRight") {
      event.preventDefault();
      state.audio.currentTime += 5;
    } else if (event.code === "ArrowLeft") {
      event.preventDefault();
      state.audio.currentTime = Math.max(0, state.audio.currentTime - 5);
    } else if (event.code === "ArrowUp") {
      event.preventDefault();
      changeVolume(state.volume + 0.05);
    } else if (event.code === "ArrowDown") {
      event.preventDefault();
      changeVolume(state.volume - 0.05);
    } else if (event.key.toLowerCase() === "m") {
      event.preventDefault();
      toggleMute();
    }
  }

  function bindUI() {
    dom.playPauseBtn.addEventListener("click", togglePlayPause);
    dom.nextBtn.addEventListener("click", () => nextTrack(false));
    dom.previousBtn.addEventListener("click", previousTrack);
    dom.shuffleBtn.addEventListener("click", toggleShuffle);
    dom.repeatBtn.addEventListener("click", cycleRepeatMode);

    dom.volumeSlider.addEventListener("input", (e) => {
      changeVolume(parseFloat(e.target.value));
    });

    dom.muteBtn.addEventListener("click", toggleMute);
    if (dom.likeBtn) {
      dom.likeBtn.addEventListener("click", toggleFavorite);
    }

    dom.seekbar.addEventListener("pointerdown", (event) => {
      handleSeekPointerDown(event);
    });
    window.addEventListener("pointermove", handleSeekPointerMove);
    window.addEventListener("pointerup", handleSeekPointerUp);

    if (dom.songSearch) {
      dom.songSearch.addEventListener("input", handleSongSearch);
    }

    if (dom.hamburger && dom.sidebar) {
      dom.hamburger.addEventListener("click", () => {
        dom.sidebar.style.transform = "translateX(0)";
        dom.sidebar.style.opacity = "1";
      });
    }

    if (dom.closeSidebar && dom.sidebar) {
      dom.closeSidebar.addEventListener("click", () => {
        dom.sidebar.style.transform = "translateX(-100%)";
        dom.sidebar.style.opacity = "0";
      });
    }

    window.addEventListener("keydown", handleKeyboard);

    state.audio.addEventListener("timeupdate", updateProgressUI);
    state.audio.addEventListener("loadedmetadata", updateProgressUI);
    state.audio.addEventListener("ended", () => {
      nextTrack(true);
    });
  }

  async function init() {
    cacheDom();
    restoreState();
    bindUI();
    applyVolume();
    updatePlayPauseButton();
    updateShuffleButton();
    updateRepeatButton();
    renderPlaylists();
    await loadPlaylist(state.currentPlaylistId);
  }

  return {
    init,
  };
})();

PlayerApp.init();

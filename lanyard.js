// lanyard.js — Discord presence via Lanyard API
// https://github.com/phineas/lanyard

const LANYARD_ID = '875703615099134013';
const REFRESH_MS = 10000;

const IDLE_LINES = [
  "He is being boring again sigh",
  "Doing nothing",
  "Nothing interesting",
  "zzz...",
  "Technoblade never dies",
  ];

let spBarTimer  = null;
let lastIdleIdx = -1;

async function fetchDiscord() {
  try {
    const res  = await fetch(`https://api.lanyard.rest/v1/users/${LANYARD_ID}`);
    const json = await res.json();
    if (!json.success) throw new Error('Lanyard error');
    const d = json.data;

    // ===== avatar =====
    const avatarHash = d.discord_user.avatar;
    const avatarUrl  = avatarHash
      ? `https://cdn.discordapp.com/avatars/${LANYARD_ID}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(d.discord_user.discriminator || '0') % 5}.png`;
    document.getElementById('dc-avatar').src = avatarUrl;

    // ===== names =====
    const displayName = d.discord_user.global_name || d.discord_user.username;
    document.getElementById('dc-displayname').textContent = displayName;
    document.getElementById('dc-username').textContent = '@' + d.discord_user.username;

    // ===== status dot =====
    const status = d.discord_status || 'offline';
    document.getElementById('dc-dot').className = 'dc-dot ' + status;

    // ===== activity text =====
    const actEl  = document.getElementById('dc-activity');
    const TYPE_LABELS = ['Playing', 'Streaming', 'Listening to', 'Watching', '', 'Competing in'];
    const act    = (d.activities || []).find(a => a.type !== 4 && a.type !== 2);
    const custom = (d.activities || []).find(a => a.type === 4);

    if (act) {
      actEl.textContent = `${TYPE_LABELS[act.type] || ''} ${act.name}${act.details ? ' — ' + act.details : ''}`.trim();
    } else if (custom && custom.state) {
      actEl.textContent = custom.state;
    } else {
      actEl.textContent = '';
    }

    // ===== bottom section — always visible =====
    const sp        = d.spotify;
    const spEl      = document.getElementById('dc-spotify');
    const dividerEl = document.getElementById('dc-divider');
    dividerEl.classList.add('visible'); // always show divider

    if (sp && sp.song) {
      // ── listening to spotify ──
      spEl.classList.remove('dc-spotify--idle');

      document.getElementById('dc-sp-song').textContent   = sp.song;
      document.getElementById('dc-sp-artist').textContent = sp.artist;

      const artEl = document.getElementById('dc-sp-art');
      artEl.style.display = 'block';
      if (sp.album_art_url) artEl.src = sp.album_art_url;

      document.getElementById('dc-sp-label').style.display = 'flex';
      document.getElementById('dc-sp-bar-wrap').style.display = 'block';

      startSpotifyBar(sp.timestamps.start, sp.timestamps.end);
    } else {
      // ── idle — show placeholder text ──
      stopSpotifyBar();
      spEl.classList.add('dc-spotify--idle');

      // pick a different idle line each time
      let idx;
      do { idx = Math.floor(Math.random() * IDLE_LINES.length); } while (idx === lastIdleIdx && IDLE_LINES.length > 1);
      lastIdleIdx = idx;

      document.getElementById('dc-sp-song').textContent   = IDLE_LINES[idx];
      document.getElementById('dc-sp-artist').textContent = '';

      const artEl = document.getElementById('dc-sp-art');
      artEl.style.display = 'none';

      document.getElementById('dc-sp-label').style.display = 'none';
      document.getElementById('dc-sp-bar-wrap').style.display = 'none';
    }

    // always show the section
    spEl.style.display = 'flex';

  } catch {
    const actEl = document.getElementById('dc-activity');
    if (actEl) actEl.innerHTML = '<span class="dc-loading">// could not reach Lanyard</span>';
  }
}

// ===== spotify progress bar =====
function startSpotifyBar(start, end) {
  stopSpotifyBar();
  function tick() {
    const pct = Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
    const bar = document.getElementById('dc-sp-bar');
    if (bar) bar.style.width = pct + '%';
  }
  tick();
  spBarTimer = setInterval(tick, 1000);
}

function stopSpotifyBar() {
  if (spBarTimer) { clearInterval(spBarTimer); spBarTimer = null; }
  const bar = document.getElementById('dc-sp-bar');
  if (bar) bar.style.width = '0%';
}

fetchDiscord();
setInterval(fetchDiscord, REFRESH_MS);

// lanyard.js — Discord presence via Lanyard API
// https://github.com/phineas/lanyard

const LANYARD_ID = '875703615099134013';
const REFRESH_MS = 30000;

async function fetchDiscord() {
  try {
    const res  = await fetch(`https://api.lanyard.rest/v1/users/${LANYARD_ID}`);
    const json = await res.json();
    if (!json.success) throw new Error('Lanyard error');
    const d = json.data;

    // ── Avatar ──────────────────────────────────────────────────
    const avatarHash = d.discord_user.avatar;
    const avatarUrl  = avatarHash
      ? `https://cdn.discordapp.com/avatars/${LANYARD_ID}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(d.discord_user.discriminator || '0') % 5}.png`;
    document.getElementById('dc-avatar').src = avatarUrl;

    // ── Username ────────────────────────────────────────────────
    const uname = d.discord_user.global_name || d.discord_user.username;
    document.getElementById('dc-username').textContent = uname;

    // ── Discriminator (hidden for new-style usernames) ──────────
    const disc = d.discord_user.discriminator;
    document.getElementById('dc-tag').textContent = disc && disc !== '0' ? '#' + disc : '';

    // ── Status dot ──────────────────────────────────────────────
    const status = d.discord_status || 'offline';
    document.getElementById('dc-dot').className = 'dc-dot ' + status;

    // ── Activity ────────────────────────────────────────────────
    const actEl  = document.getElementById('dc-activity');
    const act    = (d.activities || []).find(a => a.type !== 4); // skip custom status
    const custom = (d.activities || []).find(a => a.type === 4);

    if (act) {
      const TYPE_LABELS = ['Playing', 'Streaming', 'Listening to', 'Watching', '', 'Competing in'];
      const typeLabel   = TYPE_LABELS[act.type] || '';
      const detail      = act.details ? ` — ${act.details}` : '';
      actEl.textContent = `${typeLabel} ${act.name}${detail}`.trim();
    } else if (custom && custom.state) {
      actEl.textContent = custom.state;
    } else {
      actEl.textContent = status === 'offline' ? 'Offline' : 'Online';
    }

  } catch {
    const actEl = document.getElementById('dc-activity');
    if (actEl) actEl.innerHTML = '<span class="dc-loading">// could not reach Lanyard</span>';
  }
}

fetchDiscord();
setInterval(fetchDiscord, REFRESH_MS);

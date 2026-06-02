// Videos & Notes tab for a topic (question slot) — Studyclix-style community
// videos. Reads public `topic_videos` rows; any signed-in student can suggest a
// YouTube link. Degrades gracefully if the table hasn't been created yet.
import { supabase } from '../lib/supabase.js';

export function topicVideosTab({ slot, user }) {
  const box = document.createElement('div');
  box.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  load();
  return box;

  async function load() {
    const { data, error } = await supabase
      .from('topic_videos')
      .select('id, title, youtube_url, created_at')
      .eq('slot_id', slot.id)
      .order('created_at', { ascending: false });

    if (error) {
      // 42P01 = table doesn't exist yet (schema not applied).
      box.innerHTML = `<div class="empty-list">Videos &amp; notes aren't switched on yet for this topic.</div>`;
      return;
    }
    render(data || []);
  }

  function render(videos) {
    box.innerHTML = `
      <div class="sx-videos-head">
        <div class="practice-intro">Helpful YouTube walkthroughs for <strong>${escapeHtml(slot.topic)}</strong>, suggested by the community.</div>
        ${user ? `<button class="practice-btn-slim" id="suggestBtn">➕ Suggest a video</button>` : ''}
      </div>
      <div id="suggestForm"></div>
      <div class="sx-video-grid">
        ${videos.length
          ? videos.map(v => videoCard(v)).join('')
          : `<div class="empty-list">No videos yet${user ? ' — be the first to suggest one.' : '.'}</div>`}
      </div>
    `;
    box.querySelector('#suggestBtn')?.addEventListener('click', showForm);
  }

  function showForm() {
    const slotEl = box.querySelector('#suggestForm');
    if (slotEl.querySelector('form')) { slotEl.innerHTML = ''; return; }
    slotEl.innerHTML = `
      <form class="sx-suggest" autocomplete="off">
        <input class="sx-input" name="title" placeholder="Short title (e.g. Nov 2022 Q1 walkthrough)" maxlength="120" required>
        <input class="sx-input" name="url" placeholder="Paste the YouTube link" required>
        <div class="sx-suggest-actions">
          <button class="sx-memo-btn" type="submit">Add video</button>
          <span class="sx-suggest-msg"></span>
        </div>
      </form>`;
    const form = slotEl.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = form.title.value.trim();
      const url = form.url.value.trim();
      const msg = form.querySelector('.sx-suggest-msg');
      if (!youtubeId(url)) { msg.textContent = 'That doesn’t look like a YouTube link.'; return; }
      msg.textContent = 'Saving…';
      const { error } = await supabase.from('topic_videos').insert({
        slot_id: slot.id, title, youtube_url: url, added_by: user.id,
      });
      if (error) { msg.textContent = `Could not save: ${error.message}`; return; }
      load();
    });
  }

  function videoCard(v) {
    const id = youtubeId(v.youtube_url);
    const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
    return `
      <a class="sx-video-card" href="${escapeAttr(v.youtube_url)}" target="_blank" rel="noopener">
        ${thumb ? `<img class="sx-video-thumb" src="${escapeAttr(thumb)}" alt="" loading="lazy">` : ''}
        <div class="sx-video-title">${escapeHtml(v.title)}</div>
      </a>`;
  }
}

function youtubeId(url) {
  if (!url) return '';
  const m = String(url).match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

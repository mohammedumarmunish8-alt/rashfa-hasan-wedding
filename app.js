import { saveRsvp, saveWish, listWishes, backendMode } from './backend.js';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// 1. Guest & Sender Personalization from URL (?guest=...&from=...)
const params = new URLSearchParams(location.search);
const guest = (params.get('guest') || '').trim().slice(0, 80);
const sender = (params.get('from') || '').trim().slice(0, 50);

const senderMap = {
  father: 'B K Abdul Rauf',
  mother: 'Safana',
  parents: 'B K Abdul Rauf & Safana',
  family: 'The Host Family'
};
const resolvedSender = senderMap[sender.toLowerCase()] || sender;

if (guest) {
  const greeting = `Assalamu Alaikum, ${guest}`;
  const sub = resolvedSender ? ` · Invited with love by ${resolvedSender}` : '';
  $('#guestWelcome').innerHTML = `<strong>${escapeHtml(greeting)}</strong><br><small>${escapeHtml(sub.replace(/^ · /, ''))}</small>`;
  $('#heroGuestPill').textContent = `✨ ${greeting}${sub}`;
  $('#rsvpName').value = guest;
  $('#wishName').value = guest;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// 2. Preloader Splash Transition
window.addEventListener('load', () => {
  setTimeout(() => {
    const pre = $('#preloader');
    if (pre) pre.classList.add('fade-out');
  }, 650);
});

// 3. Wax-Sealed Gate Opening
function openInvite() {
  if ($('#welcome').hidden) return;
  const finish = () => {
    $('#welcome').hidden = true;
    $('#topBar').hidden = false;
    $('#site').hidden = false;
    $('#floatingNav').hidden = false;
    sessionStorage.setItem('invitationOpened', '1');
    window.scrollTo(0, 0);
    renderKeepsakeCard($('#previewCanvas'), 540, 675);
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish();
    return;
  }
  $('#welcome').classList.add('is-opening');
  setTimeout(finish, 720);
}

$('#envelope').addEventListener('click', () => { startWelcomeNasheed(); openInvite(); });
$('#open').addEventListener('click', () => { startWelcomeNasheed(); openInvite(); });
if (sessionStorage.getItem('invitationOpened')) openInvite();

// 4. Live Countdown & Post-Wedding Elapsed Days Counter
const wedding = new Date('2027-05-23T11:30:00+05:30');

function updateCountdown() {
  const now = Date.now();
  const diff = wedding - now;

  if (diff <= 0) {
    $('#countdownHeading').textContent = 'ALHAMDULILLAH · THE NIKAH HAS TAKEN PLACE';
    $('#countdown').innerHTML = [
      ['00', 'Days'],
      ['00', 'Hours'],
      ['00', 'Minutes'],
      ['00', 'Seconds']
    ].map(([n, l]) => `<div><b>${n}</b><small>${l}</small></div>`).join('');

    const daysMarried = Math.max(1, Math.floor((now - wedding) / 864e5));
    $('#marriedCounter').hidden = false;
    $('#marriedDays').textContent = `${daysMarried} ${daysMarried === 1 ? 'Day' : 'Days'}`;
    return;
  }

  const d = Math.floor(diff / 864e5);
  const h = Math.floor(diff / 36e5) % 24;
  const m = Math.floor(diff / 6e4) % 60;
  const s = Math.floor(diff / 1e3) % 60;

  $('#countdown').innerHTML = [
    [String(d).padStart(2, '0'), 'Days'],
    [String(h).padStart(2, '0'), 'Hours'],
    [String(m).padStart(2, '0'), 'Minutes'],
    [String(s).padStart(2, '0'), 'Seconds']
  ].map(([n, l]) => `<div><b>${n}</b><small>${l}</small></div>`).join('');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// 5. Calendar Actions (Google Calendar + .ICS File Download)
$('#calendar').addEventListener('click', () => {
  const start = '20270523T060000Z';
  const end = '20270523T083000Z';
  const u = new URL('https://calendar.google.com/calendar/render');
  u.searchParams.set('action', 'TEMPLATE');
  u.searchParams.set('text', 'Nikah & Reception — Fathima Rashfa & Hasan Zubair');
  u.searchParams.set('dates', `${start}/${end}`);
  u.searchParams.set('details', 'Sacred Nikah at 11:30 AM IST followed by Reception at 11:45 AM IST.');
  u.searchParams.set('location', 'Indiana Convention Center, Jeppinamogaru, Mangaluru, Karnataka, India');
  window.open(u, '_blank', 'noopener,noreferrer');
});

$('#downloadIcs').addEventListener('click', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RashfaHasanWedding//EN',
    'BEGIN:VEVENT',
    'DTSTART:20270523T060000Z',
    'DTEND:20270523T083000Z',
    'SUMMARY:Nikah & Reception — Fathima Rashfa & Hasan Zubair',
    'DESCRIPTION:Sacred Nikah at 11:30 AM IST followed by Reception at 11:45 AM IST.',
    'LOCATION:Indiana Convention Center, Jeppinamogaru, Mangaluru, Karnataka, India',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Fathima-Rashfa-Hasan-Zubair-Wedding.ics';
  a.click();
});

// 6. User-Initiated Nasheed Audio Control
const audio = $('#nasheed');
const sound = $('#sound');
const soundLabel = $('#soundLabel');

function updateSound() {
  const playing = !audio.paused;
  soundLabel.textContent = playing ? 'Pause Nasheed' : 'Play Nasheed';
  sound.setAttribute('aria-pressed', String(playing));
  sound.setAttribute('aria-label', playing ? 'Pause Bride of Light wedding Nasheed' : 'Play Bride of Light wedding Nasheed');
}

sound.addEventListener('click', async () => {
  if (!audio.paused) {
    audio.pause();
    updateSound();
    return;
  }
  try {
    await audio.play();
    updateSound();
  } catch {
    updateSound();
    console.info('Nasheed playback unavailable; please try the play button again.');
  }
});
audio.addEventListener('ended', updateSound);
audio.addEventListener('pause', updateSound);
audio.addEventListener('error', updateSound);

// Start softly when the guest opens the invitation (a user gesture).
function startWelcomeNasheed() {
  if (!audio || !audio.paused) return;
  audio.volume = 0;
  audio.play().then(() => {
    updateSound();
    const start = performance.now();
    const fade = (now) => {
      if (audio.paused) return;
      const t = Math.min(1, (now - start) / 2200);
      audio.volume = 0.65 * t;
      if (t < 1) requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }).catch(() => { updateSound(); });
}

// 7. Interactive RSVP Pills & Submission
$$('.choice-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.choice-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const val = btn.dataset.val;
    $('#attendance').value = val;
    $('#guestCountWrap').hidden = val === 'no';
  });
});

$('#rsvpForm').addEventListener('submit', async e => {
  e.preventDefault();
  const status = $('#rsvpStatus');
  const attendance = $('#attendance').value;
  const name = $('#rsvpName').value.trim();
  const guests = attendance === 'yes' ? Number($('#guestCount').value) : 1;
  const note = $('#rsvpNote').value.trim();

  try {
    await saveRsvp({
      name,
      attendance,
      guests,
      invitedBy: resolvedSender || sender,
      createdAt: new Date().toISOString()
    });

    // If the guest also wrote a blessing note, optionally save it to wishes too
    if (note) {
      await saveWish({
        name,
        message: note,
        createdAt: new Date().toISOString()
      });
      await refreshWishes();
    }

    status.textContent = backendMode === 'firebase'
      ? 'Thank you for confirming your response! We eagerly look forward to celebrating this blessed day with you.'
      : 'Your response has been saved in this browser (demo mode). Configure Firebase for centralized tracking.';

    $('#rsvpForm').hidden = true;
    $('#rsvpThanks').hidden = false;
  } catch (err) {
    console.error(err);
    alert('Unable to submit RSVP right now. Please try again.');
  }
});

$('#rsvpAgain').addEventListener('click', () => {
  $('#rsvpThanks').hidden = true;
  $('#rsvpForm').hidden = false;
});

// 8. Guestbook Carousel
const defaultBlessings = [
  {
    name: 'Host Family',
    message: 'Barakallahu lakuma wa baraka alaykuma wa jama’a baynakuma fi khayr. May Allah fill your home with peace, barakah, and endless mercy.'
  }
];

function renderWishes(items) {
  const host = $('#wishList');
  host.replaceChildren();
  const list = items.length ? items.slice(0, 20) : defaultBlessings;
  list.forEach(item => {
    const d = document.createElement('article');
    d.className = 'wish';
    const strong = document.createElement('strong');
    strong.textContent = item.name;
    const p = document.createElement('p');
    p.textContent = item.message;
    d.append(strong, p);
    host.append(d);
  });
}

async function refreshWishes() {
  try {
    renderWishes(await listWishes());
  } catch (err) {
    console.error(err);
    renderWishes(defaultBlessings);
  }
}
refreshWishes();

$('#wishForm').addEventListener('submit', async e => {
  e.preventDefault();
  const status = $('#wishStatus');
  status.textContent = 'Posting your blessing...';
  try {
    await saveWish({
      name: $('#wishName').value.trim(),
      message: $('#wishText').value.trim(),
      createdAt: new Date().toISOString()
    });
    status.textContent = backendMode === 'firebase'
      ? 'Jazakum Allahu Khayran! Your blessing has been submitted for approval.'
      : 'Your blessing has been added below (demo mode).';
    $('#wishText').value = '';
    await refreshWishes();
  } catch (err) {
    console.error(err);
    status.textContent = 'Unable to submit your blessing right now.';
  }
});

// 9. Personalized HD Keepsake Card Renderer (Preview + 4K Download)
function renderKeepsakeCard(canvas, w, h) {
  if (!canvas) return;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const scale = w / 1080;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#fffaf7');
  grad.addColorStop(0.5, '#fdf1f2');
  grad.addColorStop(1, '#f9e6ea');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Double gold border
  ctx.strokeStyle = '#b6915c';
  ctx.lineWidth = 6 * scale;
  ctx.strokeRect(48 * scale, 48 * scale, w - 96 * scale, h - 96 * scale);
  ctx.lineWidth = 2 * scale;
  ctx.strokeRect(66 * scale, 66 * scale, w - 132 * scale, h - 132 * scale);

  ctx.textAlign = 'center';

  // Floral header
  ctx.fillStyle = '#d99ba8';
  ctx.font = `${64 * scale}px Georgia, serif`;
  ctx.fillText('❀  ✿  ❀', w / 2, 195 * scale);

  // Bismillah / Header
  ctx.fillStyle = '#b6915c';
  ctx.font = `600 ${24 * scale}px sans-serif`;
  ctx.fillText('WITH WARMEST PRAYERS & BLESSINGS', w / 2, 275 * scale);

  // Guest name if present
  if (guest) {
    ctx.fillStyle = '#5e4450';
    ctx.font = `italic ${34 * scale}px Georgia, serif`;
    ctx.fillText(`From ${guest}`, w / 2, 345 * scale);
  }

  // Couple Names
  ctx.fillStyle = '#5e4450';
  ctx.font = `600 ${74 * scale}px Georgia, serif`;
  ctx.fillText('Fathima Rashfa', w / 2, 495 * scale);

  ctx.fillStyle = '#b6915c';
  ctx.font = `italic ${64 * scale}px Georgia, serif`;
  ctx.fillText('&', w / 2, 575 * scale);

  ctx.fillStyle = '#5e4450';
  ctx.font = `600 ${74 * scale}px Georgia, serif`;
  ctx.fillText('Hasan Zubair', w / 2, 660 * scale);

  // Du'a quote
  ctx.fillStyle = '#856874';
  ctx.font = `${32 * scale}px Georgia, serif`;
  ctx.fillText('“Barakallahu lakuma wa baraka alaykuma', w / 2, 810 * scale);
  ctx.fillText('wa jama’a baynakuma fi khayr.”', w / 2, 860 * scale);

  ctx.font = `${28 * scale}px Georgia, serif`;
  ctx.fillText('May Allah bless your union with love, mercy & barakah.', w / 2, 945 * scale);

  // Date & Venue
  ctx.fillStyle = '#b6915c';
  ctx.font = `600 ${30 * scale}px sans-serif`;
  ctx.fillText('SUNDAY · 23 MAY 2027', w / 2, 1085 * scale);

  ctx.fillStyle = '#5e4450';
  ctx.font = `${26 * scale}px Georgia, serif`;
  ctx.fillText('Indiana Convention Center, Mangaluru', w / 2, 1135 * scale);
}

renderKeepsakeCard($('#previewCanvas'), 540, 675);

$('#downloadCard').addEventListener('click', () => {
  const exportCanvas = $('#hdExportCanvas');
  renderKeepsakeCard(exportCanvas, 2160, 2700);
  const a = document.createElement('a');
  a.download = `Rashfa-Hasan-Wishes${guest ? '-' + guest.replace(/[^a-z0-9]/gi, '_') : ''}.png`;
  a.href = exportCanvas.toDataURL('image/png');
  a.click();
});

// 10. Share & Modals (WhatsApp & Travel Cab Partner)
function shareWhatsApp() {
  const msg = `Assalamu Alaikum! You are warmly invited to the wedding of Fathima Rashfa & Hasan Zubair on Sunday, 23 May 2027 at Indiana Convention Center, Mangaluru: ${location.href}`;
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
}

$('#whatsapp').addEventListener('click', shareWhatsApp);
$('#waGeneralShare').addEventListener('click', shareWhatsApp);

$('#copyLink').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    alert('Invitation link copied!');
  } catch {
    prompt('Copy your invitation link:', location.href);
  }
});

$('#openWaModal').addEventListener('click', () => { $('#waModal').hidden = false; });
$('#openCabModal').addEventListener('click', () => {
  $('#cabModal').hidden = false;
  if ('geolocation' in navigator) {
    $('#geoStatus').textContent = '📍 Detecting your pickup location for Uber...';
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        $('#geoStatus').textContent = '📍 Pickup location ready! Tap below to open Uber.';
        $('#uberLink').href = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${latitude}&pickup[longitude]=${longitude}&dropoff[formatted_address]=Indiana%20Convention%20Center%2C%20Jeppinamogaru%2C%20Mangaluru`;
      },
      () => {
        $('#geoStatus').textContent = 'Destination: Indiana Convention Center, Jeppinamogaru, Mangaluru';
      },
      { timeout: 5000 }
    );
  }
});

$$('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.close;
    if (id) $('#' + id).hidden = true;
  });
});

$$('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) backdrop.hidden = true;
  });
});

// 11. Floating Bottom Nav Active Highlighting & Scroll Reveal
const navPills = $$('.nav-pill');
const sections = ['top', 'couple', 'events', 'venue', 'rsvp', 'wishes']
  .map(id => document.getElementById(id))
  .filter(Boolean);

window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY + 220;
  let currentId = 'top';
  for (const sec of sections) {
    if (sec.offsetTop <= scrollPos) currentId = sec.id;
  }
  navPills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.target === currentId);
  });
}, { passive: true });

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });
  $$('.reveal').forEach(el => io.observe(el));
}

// 12. Subtle Floating Pastel Petals Canvas Animation
(function initPetals() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = $('#petalCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  const petals = Array.from({ length: 18 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 4 + Math.random() * 5,
    speedY: 0.35 + Math.random() * 0.55,
    speedX: -0.25 + Math.random() * 0.5,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.02,
    color: Math.random() > 0.5 ? 'rgba(235, 185, 196, 0.35)' : 'rgba(218, 190, 148, 0.28)'
  }));

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of petals) {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.angle) * 0.25;
      p.angle += p.spin;
      if (p.y > h + 15) { p.y = -15; p.x = Math.random() * w; }
      if (p.x > w + 15) p.x = -15;
      if (p.x < -15) p.x = w + 15;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

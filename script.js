/* ═══════════════════════════════════════════
   TRADING PRO LAB — script.js
═══════════════════════════════════════════ */

/* ─── SCROLL REVEAL ─── */
(function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.11 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // Immediately reveal hero
  setTimeout(() => {
    document.querySelectorAll('#hero .reveal').forEach(el => el.classList.add('visible'));
  }, 120);
})();

/* ─── NAVBAR SCROLL ─── */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

/* ─── HAMBURGER MENU ─── */
(function initHamburger() {
  const btn  = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('navLinks');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('mobile-open');
    btn.setAttribute('aria-expanded', open);
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => menu.classList.remove('mobile-open'));
  });
})();

/* ═══════════════════════════════════════════
   MULTI-STEP FORM + CALENDAR
═══════════════════════════════════════════ */
(function initForm() {
  let currentStep = 0;
  let selectedDate = null;
  let selectedHour = null;
  const answers   = {};
  const TOTAL_STEPS = 7; // 5 questions + data + calendar

  /* ── Progress ── */
  function updateProgress(step) {
    const dots = document.querySelectorAll('.prog-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('done',   i < step);
      d.classList.toggle('active', i === step);
    });
  }

  /* ── Show step ── */
  function showStep(n) {
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.getElementById('calendarStep').classList.remove('active');

    if (n < 6) {
      const el = document.getElementById('step' + n);
      if (el) el.classList.add('active');
    } else if (n === 6) {
      document.getElementById('calendarStep').classList.add('active');
      buildCalendar();
    }
    currentStep = n;
    updateProgress(n);
  }

  /* ── Option selection ── */
  window.selectOpt = function(btn, key) {
    btn.closest('.opts-grid').querySelectorAll('.opt').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    answers[key] = btn.textContent.trim();

    const nb = btn.closest('.form-step').querySelector('.btn-next');
    if (nb) { nb.disabled = false; nb.style.opacity = '1'; nb.style.cursor = 'pointer'; }
  };

  /* ── Next / back ── */
  window.formNext = function(from) {
    // Step 4 = open question (textarea), always allow
    if (from === 4) {
      const val = document.getElementById('q5open').value.trim();
      answers['q5'] = val || '(sin respuesta)';
    }
    showStep(from + 1);
  };
  window.formBack = function(from) { showStep(from - 1); };

  /* ══════════════════
     CALENDAR
  ══════════════════ */
  const ALLOWED_SLOTS = ['8:00 AM – 9:00 AM', '9:00 AM – 10:00 AM', '10:00 AM – 11:00 AM',
                          '11:00 AM – 12:00 PM', '2:00 PM – 3:00 PM', '3:00 PM – 4:00 PM'];
  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAYS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  let calYear, calMonth;

  function buildCalendar() {
    const today = new Date();
    if (!calYear)  { calYear = today.getFullYear(); calMonth = today.getMonth(); }

    // Header
    document.getElementById('calMonthLabel').textContent =
      `${MONTHS_ES[calMonth]} ${calYear}`;

    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';

    // Day names
    DAYS_ES.forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-day-name'; el.textContent = d;
      grid.appendChild(el);
    });

    // First weekday of month
    const first   = new Date(calYear, calMonth, 1).getDay();
    const daysInM = new Date(calYear, calMonth + 1, 0).getDate();

    for (let i = 0; i < first; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day empty'; grid.appendChild(el);
    }

    for (let d = 1; d <= daysInM; d++) {
      const el   = document.createElement('div');
      const date = new Date(calYear, calMonth, d);
      const isToday = (today.getDate() === d && today.getMonth() === calMonth && today.getFullYear() === calYear);
      const isPast  = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isSun   = date.getDay() === 0;
      const isSat   = date.getDay() === 6;

      el.className = 'cal-day';
      if (isPast || isSun || isSat) el.classList.add('disabled');
      if (isToday) el.classList.add('today');

      const dateStr = `${d} de ${MONTHS_ES[calMonth]} ${calYear}`;
      if (selectedDate === dateStr) el.classList.add('selected');

      el.textContent = d;
      if (!isPast && !isSun && !isSat) {
        el.addEventListener('click', () => {
          document.querySelectorAll('.cal-day').forEach(c => c.classList.remove('selected'));
          el.classList.add('selected');
          selectedDate = dateStr;
          checkCalReady();
        });
      }
      grid.appendChild(el);
    }

    // Render hour slots
    const hoursEl = document.getElementById('hourSlots');
    hoursEl.innerHTML = '';
    ALLOWED_SLOTS.forEach(slot => {
      const btn = document.createElement('button');
      btn.className = 'hour-slot';
      btn.textContent = slot;
      if (selectedHour === slot) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        document.querySelectorAll('.hour-slot').forEach(h => h.classList.remove('selected'));
        btn.classList.add('selected');
        selectedHour = slot;
        checkCalReady();
      });
      hoursEl.appendChild(btn);
    });
  }

  window.calPrev = function() {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    buildCalendar();
  };
  window.calNext = function() {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    buildCalendar();
  };

  function checkCalReady() {
    const btn = document.getElementById('btnConfirmCal');
    const ready = selectedDate && selectedHour;
    btn.disabled = !ready;
    btn.style.opacity  = ready ? '1'            : '0.45';
    btn.style.cursor   = ready ? 'pointer'       : 'not-allowed';
  }

  /* ── Submit form (show success) ── */
  window.submitForm = function() {
    const name  = document.getElementById('userName').value.trim();
    const wa    = document.getElementById('userWA').value.trim();
    const email = document.getElementById('userEmail').value.trim();

    if (!name || !wa || !email) {
      alert('Por favor completá todos los campos antes de continuar.');
      return;
    }
    showStep(6);
  };

  /* ── Confirm booking ── */
  window.confirmBooking = function() {
    const name  = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const wa    = document.getElementById('userWA').value.trim();

    if (!selectedDate || !selectedHour) return;

    // Build summary
    document.getElementById('confirmName').textContent    = name;
    document.getElementById('confirmDate').textContent    = selectedDate;
    document.getElementById('confirmHour').textContent    = selectedHour + ' (hora Nueva York)';
    document.getElementById('confirmEmail').textContent   = email;

    // Build Google Calendar invite link
    const dateObj = parseDate(selectedDate, selectedHour);
    const gcalUrl = buildGcalUrl(name, email, dateObj);
    document.getElementById('gcalLink').href = gcalUrl;

    // Build WhatsApp notification
    const waMsgArr = [
      `📅 *Nueva solicitud de llamada — Trading Pro Lab*`,
      `Nombre: ${name}`,
      `Email: ${email}`,
      `WhatsApp: ${wa}`,
      `Fecha: ${selectedDate}`,
      `Hora: ${selectedHour} (NY)`,
      `---`,
      Object.entries(answers).map(([,v]) => `• ${v}`).join('\n')
    ];
    document.getElementById('waLink').href =
      `https://wa.me/50371179235?text=${encodeURIComponent(waMsgArr.join('\n'))}`;

    // Hide everything, show success
    document.getElementById('formProgress').style.display = 'none';
    document.getElementById('calendarStep').classList.remove('active');
    document.getElementById('formSuccess').classList.add('active');
  };

  /* ─ Date helpers ─ */
  function parseDate(dateStr, slotStr) {
    // dateStr = "15 de Mayo 2025", slotStr = "9:00 AM – 10:00 AM"
    const MONTHS_MAP = {
      'Enero':1,'Febrero':2,'Marzo':3,'Abril':4,'Mayo':5,'Junio':6,
      'Julio':7,'Agosto':8,'Septiembre':9,'Octubre':10,'Noviembre':11,'Diciembre':12
    };
    const parts = dateStr.split(' de ');
    const day = parseInt(parts[0]);
    const rest = parts[1].split(' ');
    const month = MONTHS_MAP[rest[0]];
    const year  = parseInt(rest[1]);

    // Parse start hour from slot
    const startStr = slotStr.split('–')[0].trim(); // "9:00 AM"
    const [timePart, ampm] = startStr.split(' ');
    let [h, m] = timePart.split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    // NY timezone offset (EST = UTC-5, but we just store the raw time)
    return { year, month, day, h, m };
  }

  function buildGcalUrl(name, email, d) {
    const pad = n => String(n).padStart(2,'0');
    const fmt = (y, mo, day, h, min) =>
      `${y}${pad(mo)}${pad(day)}T${pad(h)}${pad(min)}00`;

    const start = fmt(d.year, d.month, d.day, d.h, d.m);
    const endH  = d.h + 1;
    const end   = fmt(d.year, d.month, d.day, endH, d.m);

    const params = new URLSearchParams({
      action:   'TEMPLATE',
      text:     `Llamada gratuita con Williams Ramos — Trading Pro Lab`,
      dates:    `${start}/${end}`,
      details:  `Hola ${name}!\n\nTu llamada con Williams Ramos de Trading Pro Lab está confirmada.\n\nTe contactará por WhatsApp antes de la llamada.\n\nTemas: Evaluación de tu perfil como trader, acceso a cuenta de fondeo y próximos pasos.\n\nInstagram: @tradingprolab_trading`,
      location: 'Google Meet (enlace enviado por WhatsApp)',
      add:      email,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // Init
  showStep(0);
})();

/* ─── SMOOTH SCROLL for nav links ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});

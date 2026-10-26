/* ============================================================
   WAQAS AZIZ - main site script
   Navigation, filters, accordions, forms, consent, reveal.
   No frameworks. Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';
  document.documentElement.classList.replace('no-js', 'js');
  var cfg = window.SITE_CONFIG || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var mobileMenu = document.getElementById('mobileMenu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      mobileMenu.hidden = open;
      document.body.style.overflow = open ? '' : 'hidden';
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        mobileMenu.hidden = true;
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Active nav link ---------- */
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a, .mobile-menu a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    var panel = item.querySelector('.faq-a');
    if (!btn || !panel) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = item.classList.contains('open');
      // close siblings in the same list
      var list = item.closest('.faq-list');
      if (list) list.querySelectorAll('.faq-item.open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('open', !open);
      btn.setAttribute('aria-expanded', String(!open));
      panel.style.maxHeight = !open ? panel.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Case studies marquee: left to right ---------- */
  (function () {
    var grids = document.querySelectorAll('#workGrid, [data-case-marquee]');
    if (!grids.length) return;
    grids.forEach(function (grid) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var originals = Array.prototype.slice.call(grid.children);
    var setW = 0;
    originals.forEach(function (card) {
      setW += card.getBoundingClientRect().width + parseFloat(getComputedStyle(card).marginRight || 0);
    });
    var copiesPerGroup = Math.max(1, Math.ceil(document.documentElement.clientWidth / Math.max(setW, 1)));
    var totalSets = copiesPerGroup * 2;
    for (var s = 1; s < totalSets; s++) {
      originals.forEach(function (card) {
        var clone = card.cloneNode(true);
        clone.classList.add('is-clone');
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
        grid.appendChild(clone);
      });
    }
    if (grid.id) document.querySelectorAll('[data-filter-target="#' + grid.id + '"] .pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        grid.classList.toggle('is-filtered', pill.getAttribute('data-filter') !== 'all');
      });
    });
    });
  })();

  /* ---------- Work filters ---------- */
  var pillGroups = document.querySelectorAll('[data-filter-group]');
  pillGroups.forEach(function (group) {
    var pills = group.querySelectorAll('.pill');
    var targetSel = group.getAttribute('data-filter-target');
    var cards = document.querySelectorAll(targetSel + ' [data-category]');
    var empty = document.querySelector(targetSel + '-empty') || document.getElementById('workEmpty');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        pills.forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
        pill.setAttribute('aria-pressed', 'true');
        var f = pill.getAttribute('data-filter');
        var visible = 0;
        cards.forEach(function (card) {
          var cats = (card.getAttribute('data-category') || '').split(' ');
          var show = f === 'all' || cats.indexOf(f) !== -1;
          card.classList.toggle('hide', !show);
          if (show) visible++;
        });
        if (empty) empty.classList.toggle('show', visible === 0);
      });
    });
  });

  /* ---------- Shop search + category filter ---------- */
  var searchInput = document.getElementById('shopSearch');
  var shopGrid = document.getElementById('shopGrid');
  var activeCat = 'all';
  function applyShopFilter() {
    if (!shopGrid) return;
    var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var cards = shopGrid.querySelectorAll('[data-category]');
    var visible = 0;
    cards.forEach(function (card) {
      var cats = (card.getAttribute('data-category') || '').split(' ');
      var text = (card.textContent || '').toLowerCase();
      var okCat = activeCat === 'all' || cats.indexOf(activeCat) !== -1;
      var okQ = !q || text.indexOf(q) !== -1;
      var show = okCat && okQ;
      card.classList.toggle('hide', !show);
      if (show) visible++;
    });
    var empty = document.getElementById('shopEmpty');
    if (empty) empty.classList.toggle('show', visible === 0);
  }
  if (searchInput) searchInput.addEventListener('input', applyShopFilter);
  document.querySelectorAll('[data-shop-filter]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      document.querySelectorAll('[data-shop-filter]').forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
      pill.setAttribute('aria-pressed', 'true');
      activeCat = pill.getAttribute('data-shop-filter');
      applyShopFilter();
    });
  });

  /* ---------- Product gallery thumbs ---------- */
  document.querySelectorAll('.pd-gallery').forEach(function (gal) {
    var main = gal.querySelector('.pd-main-img img');
    gal.querySelectorAll('.pd-thumbs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var img = btn.querySelector('img');
        if (!img || !main) return;
        gal.querySelectorAll('.pd-thumbs button').forEach(function (b) { b.setAttribute('aria-current', 'false'); });
        btn.setAttribute('aria-current', 'true');
        main.src = img.src.replace('-thumb', '');
        main.srcset = '';
        main.alt = img.alt;
      });
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('projectForm');
  if (form) {
    var note = document.getElementById('formNote');
    // Custom calendar for the deadline field.
    var calInput = document.getElementById('f-deadline');
    var calValue = document.getElementById('f-deadline-value');
    var calPop = document.getElementById('calPop');
    if (calInput && calPop) {
      var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      var DOWS = ['Mo','Tu','We','Th','Fr','Sa','Su'];
      var calToday = new Date(); calToday.setHours(0,0,0,0);
      var vy = calToday.getFullYear(), vm = calToday.getMonth(), selISO = '';
      var p2 = function (n) { return String(n).padStart(2, '0'); };
      var iso = function (d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
      var nice = function (d) { return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(); };
      var renderCal = function () {
        document.getElementById('calTitle').textContent = MONTHS[vm] + ' ' + vy;
        var grid = document.getElementById('calGrid');
        grid.innerHTML = '';
        DOWS.forEach(function (d) {
          var s = document.createElement('span'); s.className = 'dow'; s.textContent = d; grid.appendChild(s);
        });
        var offset = (new Date(vy, vm, 1).getDay() + 6) % 7;
        for (var i = 0; i < offset; i++) grid.appendChild(document.createElement('span'));
        var days = new Date(vy, vm + 1, 0).getDate();
        for (var d = 1; d <= days; d++) {
          (function (day) {
            var dt = new Date(vy, vm, day);
            var b = document.createElement('button');
            b.type = 'button'; b.textContent = day;
            b.disabled = dt < calToday;
            if (iso(dt) === iso(calToday)) b.classList.add('today');
            if (iso(dt) === selISO) b.classList.add('sel');
            b.addEventListener('click', function () {
              selISO = iso(dt);
              calInput.value = nice(dt);
              calValue.value = selISO;
              calPop.hidden = true;
            });
            grid.appendChild(b);
          })(d);
        }
      };
      var toggleCal = function () { calPop.hidden ? (renderCal(), calPop.hidden = false) : calPop.hidden = true; };
      document.getElementById('calOpen').addEventListener('click', function (e) { e.stopPropagation(); toggleCal(); });
      calInput.addEventListener('click', toggleCal);
      document.getElementById('calPrev').addEventListener('click', function () { vm--; if (vm < 0) { vm = 11; vy--; } renderCal(); });
      document.getElementById('calNext').addEventListener('click', function () { vm++; if (vm > 11) { vm = 0; vy++; } renderCal(); });
      document.addEventListener('click', function (e) { if (!e.target.closest('.cal-wrap')) calPop.hidden = true; });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') calPop.hidden = true; });
    }
    // Brief: allow at most 3 personality picks.
    var pboxes = form.querySelectorAll('input[name="personality"]');
    pboxes.forEach(function (box) {
      box.addEventListener('change', function () {
        var checked = form.querySelectorAll('input[name="personality"]:checked');
        if (checked.length > 3) box.checked = false;
      });
    });
    function setInvalid(input, bad) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('invalid', bad);
      return !bad;
    }
    function showNote(type, title, html) {
      note.className = 'form-note show ' + type;
      note.innerHTML = '<strong>' + title + '</strong><span>' + html + '</span>';
      note.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
    // No endpoint configured: never fake a success. Offer real channels.
    if (!cfg.formEndpoint) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        form.querySelectorAll('[required]').forEach(function (input) {
          var bad = !input.value.trim() ||
            (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
          if (bad) ok = false;
          setInvalid(input, bad);
        });
        if (!ok) {
          showNote('error', 'Please review the highlighted fields.',
            'A few required fields need attention before you can send this.');
          return;
        }
        showNote('success', 'Your message is ready. One step left.',
          'Direct form delivery is being connected. For now, send your brief instantly on ' +
          '<a href="' + cfg.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a> or email ' +
          '<a href="mailto:' + cfg.email + '">' + cfg.email + '</a>. ' +
          'Everything you typed above is still on this page, ready to copy.');
      });
      return;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Honeypot: bots fill it, humans never see it.
      if (form.querySelector('.honeypot input').value) return;
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (input) {
        var bad = !input.value.trim() ||
          (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
        if (bad) ok = false;
        setInvalid(input, bad);
      });
      if (!ok) {
        showNote('error', 'Please review the highlighted fields.',
          'A few required fields need attention before you can send this.');
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending...';
      var data = {};
      new FormData(form).forEach(function (v, k) {
        data[k] = (data[k] === undefined) ? v : data[k] + ', ' + v;
      });
      fetch(cfg.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('send failed');
        form.reset();
        showNote('success', 'Message sent. Thank you.',
          'Your project brief is on its way. Expect a reply within 2 business days. ' +
          'Need it faster? Message on <a href="' + cfg.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a>.');
        var payPanel = document.getElementById('payPanel');
        if (payPanel) {
          payPanel.hidden = false;
          payPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        }
      }).catch(function () {
        showNote('error', 'Something went wrong sending your message.',
          'Please try again, or reach out directly on <a href="' + cfg.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a> ' +
          'or <a href="mailto:' + cfg.email + '">' + cfg.email + '</a>.');
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = 'Send Project Inquiry';
      });
    });
    form.querySelectorAll('[required]').forEach(function (input) {
      input.addEventListener('input', function () { setInvalid(input, false); });
    });
  }

  /* ---------- Newsletter ---------- */
  document.querySelectorAll('.newsletter-form').forEach(function (nf) {
    var msg = nf.parentElement.querySelector('.newsletter-msg') || nf.querySelector('.newsletter-msg');
    nf.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = nf.querySelector('input[type="email"]');
      var val = email.value.trim();
      function say(cls, text) {
        if (!msg) return;
        msg.className = 'newsletter-msg show ' + cls;
        msg.textContent = text;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { say('err', 'Please enter a valid email address.'); return; }
      if (!cfg.newsletterEndpoint) {
        say('ok', 'Noted. Email signup is being connected, meanwhile product news goes out on Instagram @designbywaqasa.');
        nf.reset();
        return;
      }
      fetch(cfg.newsletterEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: val })
      }).then(function () { say('ok', 'You are on the list. Welcome.'); nf.reset(); })
        .catch(function () { say('err', 'Could not subscribe right now. Please try again later.'); });
    });
  });

  /* ---------- Cookie consent ---------- */
  var banner = document.getElementById('cookieBanner');
  try {
    if (banner && !localStorage.getItem('waqas-cookie-consent')) {
      banner.classList.add('show');
      banner.querySelectorAll('[data-consent]').forEach(function (b) {
        b.addEventListener('click', function () {
          localStorage.setItem('waqas-cookie-consent', b.getAttribute('data-consent'));
          banner.classList.remove('show');
        });
      });
    }
  } catch (err) { /* storage unavailable: keep banner hidden */ }

  /* ---------- Analytics (GA4), loads only after cookie consent ---------- */
  (function () {
    var id = (window.SITE_CONFIG && window.SITE_CONFIG.analyticsId) || '';
    if (!id) return;
    function loadAnalytics() {
      if (window.gtag) return;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', id, { anonymize_ip: true });
    }
    try {
      if (localStorage.getItem('waqas-cookie-consent') === 'accepted') { loadAnalytics(); return; }
    } catch (err) { /* no storage: wait for explicit accept */ }
    document.addEventListener('click', function handler(e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-consent="accepted"]') : null;
      if (b) { document.removeEventListener('click', handler); loadAnalytics(); }
    });
  })();

  /* ---------- Koto-style motion ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('h2').forEach(function (h) {
      if (h.querySelector('*')) return;
      var words = h.textContent.trim().split(/\s+/);
      h.textContent = '';
      h.classList.add('mask-h');
      h.classList.remove('reveal');
      words.forEach(function (w, i) {
        var mw = document.createElement('span'); mw.className = 'mw';
        var mwi = document.createElement('span'); mwi.className = 'mwi';
        mwi.style.setProperty('--i', i); mwi.textContent = w;
        mw.appendChild(mwi); h.appendChild(mw);
        h.appendChild(document.createTextNode(' '));
      });
    });
  }

  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    var badge = document.createElement('div');
    badge.className = 'cursor-badge'; badge.setAttribute('aria-hidden', 'true');
    document.body.appendChild(badge);
    var bx = 0, by = 0, tx = 0, ty = 0, raf = null;
    var loop = function () {
      bx += (tx - bx) * 0.22; by += (ty - by) * 0.22;
      badge.style.left = bx + 'px'; badge.style.top = by + 'px';
      raf = (Math.abs(tx - bx) > 0.5 || Math.abs(ty - by) > 0.5) ? requestAnimationFrame(loop) : null;
    };
    document.querySelectorAll('.work-grid').forEach(function (grid) {
      grid.addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      grid.querySelectorAll('.work-card').forEach(function (card) {
        card.addEventListener('mouseenter', function () {
          grid.classList.add('has-focus'); card.classList.add('is-focus');
          if (card.querySelector('a')) {
            badge.innerHTML = 'View case <span aria-hidden="true">\u2197</span>';
            badge.classList.add('show');
          } else if (card.querySelector('.lightbox-open')) {
            badge.innerHTML = 'View <span aria-hidden="true">\u2197</span>';
            badge.classList.add('show');
          }
        });
        card.addEventListener('mouseleave', function () {
          grid.classList.remove('has-focus'); card.classList.remove('is-focus');
          badge.classList.remove('show');
        });
      });
    });
  }

  var roll = document.getElementById('heroRoll');
  if (roll && !reduceMotion) {
    var items = Array.prototype.slice.call(roll.children);
    var ri = 0;
    setInterval(function () {
      var cur = items[ri];
      ri = (ri + 1) % items.length;
      var nxt = items[ri];
      cur.classList.remove('on'); cur.classList.add('bye');
      nxt.classList.remove('bye'); nxt.classList.add('on');
      setTimeout(function () { cur.classList.remove('bye'); }, 220);
    }, 4000);
  }


  /* ---------- Lightbox ---------- */
  (function () {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.lightbox-open'));
    var lb = document.getElementById('lightbox');
    if (!lb || !triggers.length) return;
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCap');
    var lbi = 0;
    var showLb = function (i) {
      lbi = (i + triggers.length) % triggers.length;
      var t = triggers[lbi];
      lbImg.src = t.getAttribute('data-full');
      lbImg.alt = t.querySelector('img').alt;
      lbCap.textContent = t.getAttribute('data-title');
    };
    var openLb = function (i) { showLb(i); lb.hidden = false; document.body.style.overflow = 'hidden'; };
    var closeLb = function () { lb.hidden = true; document.body.style.overflow = ''; };
    triggers.forEach(function (t, i) { t.addEventListener('click', function () { openLb(i); }); });
    document.getElementById('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); showLb(lbi - 1); });
    document.getElementById('lbNext').addEventListener('click', function (e) { e.stopPropagation(); showLb(lbi + 1); });
    lb.querySelectorAll('[data-lb-close]').forEach(function (el) { el.addEventListener('click', closeLb); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') showLb(lbi - 1);
      else if (e.key === 'ArrowRight') showLb(lbi + 1);
    });
  })();
  /* ---------- Reveal on scroll ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .mask-h').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal, .mask-h').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Testimonials slider (neon frame + decorative dots) ---------- */
  (function () {
    var slider = document.getElementById('tSlider');
    var track = document.getElementById('tTrack');
    var dotsWrap = document.getElementById('tDots');
    if (!slider || !track || !dotsWrap) return;
    var slides = track.children.length;
    var DOTS = 5, current = 0, dotPos = 0, slideTimer = null, dotTimer = null;
    function perView() {
      if (window.innerWidth >= 1200) return 3;
      if (window.innerWidth >= 900) return 2;
      return 1;
    }
    function pages() { return Math.max(1, slides - perView() + 1); }
    for (var i = 0; i < DOTS; i++) {
      var d = document.createElement('span');
      d.className = 't-dot' + (i === 0 ? ' active' : '');
      dotsWrap.appendChild(d);
    }
    function cycleDot() {
      dotPos = (dotPos + 1) % DOTS;
      for (var j = 0; j < dotsWrap.children.length; j++) {
        dotsWrap.children[j].classList.toggle('active', j === dotPos);
      }
    }
    function go(i) {
      current = Math.max(0, Math.min(i, pages() - 1));
      track.style.transform = 'translateX(-' + (current * (100 / perView())) + '%)';
    }
    function stop() {
      if (slideTimer) clearInterval(slideTimer);
      if (dotTimer) clearInterval(dotTimer);
      slideTimer = null; dotTimer = null;
    }
    function start() {
      if (reduceMotion) return;
      stop();
      slideTimer = setInterval(function () { go((current + 1) % pages()); }, 6000);
      dotTimer = setInterval(cycleDot, 3500);
    }
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    window.addEventListener('resize', function () { go(current); });
    go(0); start();
  })();

  /* ---------- Stat count-up ---------- */
  (function () {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (reduceMotion || !target) { el.textContent = target; return; }
      var dur = 1600, t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * eased);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      nums.forEach(function (el) { cio.observe(el); });
    } else {
      nums.forEach(run);
    }
  })();

  /* ---------- Button click color flash ---------- */
  document.querySelectorAll('.btn').forEach(function (b) {
    b.addEventListener('click', function () {
      b.classList.add('btn-flash');
      setTimeout(function () { b.classList.remove('btn-flash'); }, 550);
    });
  });

  /* ---------- Header brand: logo wrap + typewriter subtitle ---------- */
  (function () {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var mark = header.querySelector('.brand-mark');
    if (mark && !mark.parentElement.classList.contains('brand-mark-wrap')) {
      var wrap = document.createElement('span');
      wrap.className = 'brand-mark-wrap';
      mark.parentElement.insertBefore(wrap, mark);
      wrap.appendChild(mark);
    }
    var sub = header.querySelector('.brand-text small');
    if (!sub) return;
    var full = sub.textContent.trim();
    if (reduceMotion) return;
    sub.setAttribute('aria-label', full);
    sub.innerHTML = '';
    var sizer = document.createElement('span');
    sizer.className = 'sub-sizer';
    sizer.textContent = full;
    sizer.setAttribute('aria-hidden', 'true');
    var typed = document.createElement('span');
    typed.className = 'sub-typed';
    typed.setAttribute('aria-hidden', 'true');
    sub.appendChild(sizer);
    sub.appendChild(typed);
    var i = 0, deleting = false;
    function tick() {
      if (!deleting) {
        i++;
        typed.textContent = full.slice(0, i);
        if (i === full.length) { deleting = true; return setTimeout(tick, 4200); }
        return setTimeout(tick, 230);
      }
      i--;
      typed.textContent = full.slice(0, i);
      if (i === 0) { deleting = false; return setTimeout(tick, 900); }
      return setTimeout(tick, 110);
    }
    setTimeout(tick, 600);
  })();

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

/* PWA: register service worker for installable app + offline support */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}

/* Speed: prerender same-site pages on hover intent (Chrome/Edge) for near-instant navigation */
try {
  if (!document.querySelector('script[type="speculationrules"]')) {
    var spec = document.createElement('script');
    spec.type = 'speculationrules';
    spec.textContent = JSON.stringify({prerender: [{source: 'document', where: {href_matches: '/*'}, eagerness: 'moderate'}]});
    document.head.appendChild(spec);
  }
} catch (e) {}

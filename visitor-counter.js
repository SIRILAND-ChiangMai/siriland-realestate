// SIRILAND Live Statistics - Firebase Visitor Counter + Online Users
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyC-arJS1pZkcVEXhYgOOOqg3wPZpF5L_fE",
    authDomain: "siriland-realestate.firebaseapp.com",
    databaseURL: "https://siriland-realestate-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "siriland-realestate",
    storageBucket: "siriland-realestate.firebasestorage.app",
    messagingSenderId: "967829423088",
    appId: "1:967829423088:web:e768d4908994b077f05335",
    measurementId: "G-8E32GKRSCE"
  };

  function load(src) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some(s => s.src === src)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const pad = n => String(n).padStart(2, '0');
  const dateKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const monthKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1);
  function sessionId() {
    let id = sessionStorage.getItem('siriland_session_id');
    if (!id) {
      id = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      sessionStorage.setItem('siriland_session_id', id);
    }
    return id;
  }
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  function setDateTime() {
    const now = new Date();
    setText('siriland-live-date', now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }));
    setText('siriland-live-time', now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }));
  }

  async function start() {
    await load('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    await load('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js');
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    const sid = sessionId();
    const today = dateKey();
    const month = monthKey();
    const page = location.pathname + location.search;
    const onlineRef = db.ref('online/' + sid);

    onlineRef.set({ at: Date.now(), page, ua: navigator.userAgent.slice(0, 120) });
    onlineRef.onDisconnect().remove();
    setInterval(() => onlineRef.update({ at: Date.now(), page: location.pathname + location.search }), 30000);

    // Count one page load
    db.ref('visits/total').transaction(v => (v || 0) + 1);
    db.ref('visits/daily/' + today).transaction(v => (v || 0) + 1);
    db.ref('visits/monthly/' + month).transaction(v => (v || 0) + 1);
    db.ref('visits/pages/' + encodeURIComponent(page)).transaction(v => (v || 0) + 1);
    db.ref('visits/lastVisit').set(Date.now());

    db.ref('online').on('value', snap => {
      const val = snap.val() || {};
      const cutoff = Date.now() - 120000;
      const count = Object.values(val).filter(x => x && x.at > cutoff).length;
      setText('siriland-online-count', count.toLocaleString());
    });
    db.ref('visits/daily/' + today).on('value', snap => setText('siriland-today-count', (snap.val() || 0).toLocaleString()));
    db.ref('visits/monthly/' + month).on('value', snap => setText('siriland-month-count', (snap.val() || 0).toLocaleString()));
    db.ref('visits/total').on('value', snap => setText('siriland-total-count', (snap.val() || 0).toLocaleString()));

    setDateTime();
    setInterval(setDateTime, 30000);
  }

  start().catch(err => console.error('SIRILAND live stats error:', err));
})();

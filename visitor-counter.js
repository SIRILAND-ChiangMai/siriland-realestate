// SIRILAND Visitor Counter + Online Users
// Add before </body> in index.html:
// <script src="visitor-counter.js"></script>

(function () {
  const firebaseConfig = {
  "apiKey": "AIzaSyC-arJS1pZkcVEXhYgOOOqg3wPZpF5L_fE",
  "authDomain": "siriland-realestate.firebaseapp.com",
  "databaseURL": "https://siriland-realestate-default-rtdb.asia-southeast1.firebasedatabase.app",
  "projectId": "siriland-realestate",
  "storageBucket": "siriland-realestate.firebasestorage.app",
  "messagingSenderId": "967829423088",
  "appId": "1:967829423088:web:e768d4908994b077f05335",
  "measurementId": "G-8E32GKRSCE"
};

  function load(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(d = new Date()) {
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  }
  function monthKey(d = new Date()) {
    return d.getFullYear() + '-' + pad(d.getMonth()+1);
  }
  function sessionId() {
    let id = sessionStorage.getItem('siriland_session_id');
    if (!id) {
      id = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      sessionStorage.setItem('siriland_session_id', id);
    }
    return id;
  }

  async function start() {
    if (!window.firebase) {
      await load('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
      await load('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js');
    }
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    const sid = sessionId();
    const now = Date.now();
    const today = dateKey();
    const month = monthKey();
    const path = location.pathname + location.search;

    const onlineRef = db.ref('online/' + sid);
    onlineRef.set({
      at: now,
      page: path,
      ua: navigator.userAgent.slice(0, 120)
    });
    onlineRef.onDisconnect().remove();

    db.ref('visits/total').transaction(v => (v || 0) + 1);
    db.ref('visits/daily/' + today).transaction(v => (v || 0) + 1);
    db.ref('visits/monthly/' + month).transaction(v => (v || 0) + 1);
    db.ref('visits/pages/' + encodeURIComponent(path)).transaction(v => (v || 0) + 1);
    db.ref('visits/lastVisit').set(now);

    setInterval(() => {
      onlineRef.update({ at: Date.now(), page: location.pathname + location.search });
    }, 30000);

    function ensureWidget() {
      let box = document.getElementById('siriland-live-stats');
      if (!box) {
        box = document.createElement('div');
        box.id = 'siriland-live-stats';
        box.innerHTML = '<span id="s-online">Online: -</span><span id="s-today">Today: -</span><span id="s-total">Total: -</span>';
        document.body.appendChild(box);
      }
      return box;
    }

    ensureWidget();

    db.ref('online').on('value', snap => {
      const val = snap.val() || {};
      const cutoff = Date.now() - 120000;
      const count = Object.values(val).filter(x => x && x.at > cutoff).length;
      const el = document.getElementById('s-online');
      if (el) el.textContent = '👥 Online: ' + count;
    });

    db.ref('visits/daily/' + today).on('value', snap => {
      const el = document.getElementById('s-today');
      if (el) el.textContent = '👁 Today: ' + (snap.val() || 0);
    });

    db.ref('visits/total').on('value', snap => {
      const el = document.getElementById('s-total');
      if (el) el.textContent = '🌍 Total: ' + (snap.val() || 0);
    });
  }

  start().catch(console.error);
})();

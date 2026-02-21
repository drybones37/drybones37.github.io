    // Initialize Gun.js
    // import Relays from 'https://cdn.jsdelivr.net/npm/gun-relays@latest/index.js';
    // import Gun from 'https://cdn.jsdelivr.net/npm/gun/gun.mjs';

    // This fetches the current list of working volunteer peers
    const relays = await Relays();
    const gun = new Gun({peers: relays});
    //  const gun = Gun([
    //    'https://gun-us.herokuapp.com/gun',
    //    'https://gun-eu.herokuapp.com/gun',
    //    'https://gunjs.herokuapp.com/gun',
    //    'https://peer.wall.org/gun',
    //   'https://gun-manhattan.herokuapp.com/gun',
    //  ]);


    // 1. Reference the data "node"
    const entries = gun.get('gematria-names-project');

    // 2. The Listener: This runs automatically whenever data is added to Gun
    entries.map().on((data, id) => {
      if (!data || !data.text) return;

      const listId = data.score === 666 ? 'watchlist-list' :
        (data.score >= 600 && data.score <= 700) ? 'suspicious-list' : null;

      if (listId) {
        const listDiv = document.getElementById(listId);

        // Check if it's already on the screen to avoid duplicates
        if (!document.getElementById(id)) {
          const item = document.createElement('div');
          item.id = id; // Use Gun's unique ID
          item.className = 'entry-item';
          item.innerHTML = `<strong>${data.text}</strong>: ${data.score}`;
          listDiv.prepend(item); // Put newest at the top
        }
      }
    });

    // --- YOUR CUSTOM CALCULATION LOGIC ---

    function greekCalc(gn) {
      const rules = [
        ['sampi', 900], ['kh', 600], ['ph', 500], ['ps', 700], ['th', 9], ['rh', 100],
        ['st', 6], ['ē', 8], ['ō', 800], ['a', 1], ['b', 2], ['g', 3], ['d', 4],
        ['e', 5], ['w', 6], ['z', 7], ['i', 10], ['k', 20], ['l', 30], ['m', 40],
        ['n', 50], ['x', 60], ['o', 70], ['p', 80], ['q', 90], ['r', 100], ['s', 200],
        ['t', 300], ['u', 400]
      ];
      let total = 0;
      let str = gn.toLowerCase();
      rules.forEach(([key, val]) => {
        const regex = new RegExp(key, 'g');
        const matches = (str.match(regex) || []).length;
        total += (matches * val);
        str = str.replace(regex, '');
      });
      return total;
    }

    function latinCalc(ln) {
      const replacements = [
        ['xxviii', 28], ['xxiii', 23], ['dccc', 800], ['lxxx', 80], ['xxvii', 27],
        ['xxiv', 24], ['xxii', 22], ['xviii', 18], ['xvii', 17], ['viii', 8],
        ['xiii', 13], ['dcc', 700], ['ccc', 300], ['lxx', 70], ['cii', 102],
        ['xix', 19], ['xiv', 14], ['xvi', 16], ['iii', 3], ['xxx', 30], ['vii', 7],
        ['xxi', 21], ['xii', 12], ['xx', 20], ['cc', 200], ['xv', 15], ['xl', 40],
        ['xc', 90], ['lx', 60], ['iv', 4], ['vi', 6], ['ix', 9], ['xi', 11],
        ['ci', 101], ['cd', 400], ['dc', 600], ['cm', 900], ['ii', 2], ['i', 1],
        ['v', 5], ['x', 10], ['l', 50], ['c', 100], ['d', 500], ['m', 1000]
      ];
      let total = 0;
      let tempStr = ln.toLowerCase();
      replacements.forEach(([key, val]) => {
        const regex = new RegExp(key, 'g');
        const matches = (tempStr.match(regex) || []).length;
        total += (matches * val);
        tempStr = tempStr.replace(regex, '');
      });
      return total;
    }

    function hebrewCalc(hn) {
      const replacements = [
        ['sh', 300], ['ch', 8], ['th', 400], ['ts', 90], ['a', 1], ['b', 2],
        ['g', 3], ['d', 4], ['h', 5], ['v', 6], ['z', 7], ['t', 9], ['y', 10],
        ['k', 20], ['l', 30], ['m', 40], ['n', 50], ['s', 60], ['p', 80],
        ['f', 80], ['q', 100], ['r', 200]
      ];
      let total = 0;
      let tempStr = hn.toLowerCase();
      replacements.forEach(([key, val]) => {
        const regex = new RegExp(key, 'g');
        const matches = (tempStr.match(regex) || []).length;
        total += (matches * val);
        tempStr = tempStr.replace(regex, '');
      });
      return total;
    }

    // --- APP FLOW ---
    function processName() {
      const rawName = document.getElementById('nameInput').value;
      if (!rawName) return;

      const normalized = rawName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cleaned = normalized.toLowerCase().replace(/[^a-z\s]/g, '');

      const scores = {
        greek: greekCalc(cleaned),
        hebrew: hebrewCalc(cleaned),
        latin: latinCalc(cleaned)
      };

      // We use the cleaned name as a unique key (soul) so we don't get duplicates
      const entryId = cleaned.replace(/\s+/g, '_');
      const entry = {name: rawName, ...scores, time: Date.now()};

      // Save to Gun using the unique ID
      const entryRef = gun.get('detector_all').get(entryId).put(entry);

      // Logical Routing
      const vals = Object.values(scores);
      if (vals.some(v => v >= 600 && v <= 700)) {
        gun.get('detector_suspicious').get(entryId).put(entry);
      }
      if (vals.includes(666)) {
        gun.get('detector_watchlist').get(entryId).put(entry);
      }

      document.getElementById('nameInput').value = '';
    }
    // UI RENDERER

    // Wait for the window to load so document.getElementById works
    window.onload = () => {
      console.log("Helix Gematria: Gun.js Listeners Active");

      const render = (containerId, data, id) => {
        if (!data || !data.name) return;
        const list = document.getElementById(containerId);
        if (!list) return; // Safety check

        const domId = `${containerId}-${id}`;
        if (document.getElementById(domId)) return;

        const div = document.createElement('div');
        div.id = domId;
        div.className = 'entry';
        div.innerHTML = `
      <strong>${data.name}</strong><br>
      <span class="val">G:${data.greek} | H:${data.hebrew} | L:${data.latin}</span>
    `;
        list.prepend(div);
      };

      gun.get('detector_all').map().on((data, id) => render('all-list', data, id));
      gun.get('detector_suspicious').map().on((data, id) => render('suspicious-list', data, id));
      gun.get('detector_watchlist').map().on((data, id) => render('watchlist-list', data, id));
    };


from bs4 import BeautifulSoup

firebase_setup = '''
<!-- FIREBASE SDK -->
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script>
  const firebaseConfig = {
    apiKey: "AIzaSyBS87d1Dv9nx6Yg_dqq-E3x9GI4gpSA7ps",
    authDomain: "encavi-go.firebaseapp.com",
    projectId: "encavi-go",
    storageBucket: "encavi-go.firebasestorage.app",
    messagingSenderId: "1073579842188",
    appId: "1:1073579842188:web:0b415778424a7bce5639a9"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
</script>
'''

# 1. Update INDEX.HTML
with open('index.html', 'r', encoding='utf-8') as f:
    soup_idx = BeautifulSoup(f.read(), 'html.parser')

# Find the existing <script> block and insert firebase before it
script_tag = soup_idx.find('script')
if script_tag:
    script_tag.insert_before(BeautifulSoup(firebase_setup, 'html.parser'))
    
    # We also want to add tracking logic inside the existing DOMContentLoaded
    tracking_logic = '''
    // REGISTRAR ESCANEO EN FIREBASE
    try {
        const docRef = db.collection('stats').doc('global');
        docRef.get().then((doc) => {
            if (doc.exists) {
                docRef.update({ scans: firebase.firestore.FieldValue.increment(1) });
            } else {
                docRef.set({ scans: 1, clicks: 0 });
            }
        });
        
        // Registrar en chofer específico
        if (session && session.chofer !== 'orgánico') {
            const chofRef = db.collection('choferes').doc(session.chofer);
            chofRef.get().then(doc => {
                if (doc.exists) {
                    chofRef.update({ scans: firebase.firestore.FieldValue.increment(1) });
                } else {
                    chofRef.set({ scans: 1, clicks: 0, lastActive: new Date() });
                }
            });
        }
    } catch(e) { console.error("Firebase no configurado aún", e); }

    // REGISTRAR CLIC AL ACTIVAR CÓDIGO
    document.querySelectorAll('a.swipe-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            try {
                db.collection('stats').doc('global').update({ clicks: firebase.firestore.FieldValue.increment(1) });
                if (session && session.chofer !== 'orgánico') {
                    db.collection('choferes').doc(session.chofer).update({ clicks: firebase.firestore.FieldValue.increment(1) });
                }
            } catch(e) {}
        });
    });
    '''
    # We'll just replace the start of the script with the start + tracking logic
    old_script_text = script_tag.string
    if old_script_text:
        script_tag.string = old_script_text.replace("const SESSION_HOURS = 24;", "const SESSION_HOURS = 24;\n" + tracking_logic)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup_idx))


# 2. Update ADMIN.HTML
with open('admin.html', 'r', encoding='utf-8') as f:
    soup_adm = BeautifulSoup(f.read(), 'html.parser')

body_adm = soup_adm.find('body')
if body_adm:
    body_adm.append(BeautifulSoup(firebase_setup, 'html.parser'))
    admin_logic = '''
    <script>
    document.addEventListener('DOMContentLoaded', () => {
        const valScans = document.getElementById('val-scans');
        const valClicks = document.getElementById('val-clicks');
        
        // Leer estadísticas globales en tiempo real
        db.collection('stats').doc('global').onSnapshot((doc) => {
            if(doc.exists) {
                const data = doc.data();
                if(valScans) valScans.innerText = (data.scans || 0).toLocaleString();
                if(valClicks) valClicks.innerText = (data.clicks || 0).toLocaleString();
            }
        });
        
        // Leer Top Chofer
        db.collection('choferes').orderBy('scans', 'desc').limit(1).onSnapshot(snapshot => {
            if(!snapshot.empty) {
                const topChofer = snapshot.docs[0];
                const topName = document.getElementById('val-top-chofer');
                const topScans = document.getElementById('val-top-scans');
                if(topName) topName.innerText = topChofer.id;
                if(topScans) topScans.innerText = topChofer.data().scans + " escaneos";
            }
        });
    });
    </script>
    '''
    # Replace the hardcoded metrics in admin.html to have IDs for JS targeting
    admin_html = str(soup_adm)
    admin_html = admin_html.replace('<div class="metric-value">12,845</div>', '<div class="metric-value" id="val-scans">0</div>')
    admin_html = admin_html.replace('<div class="metric-value">3,902</div>', '<div class="metric-value" id="val-clicks">0</div>')
    admin_html = admin_html.replace('<div class="metric-value">ALFA-01</div>', '<div class="metric-value" id="val-top-chofer">--</div>')
    admin_html = admin_html.replace('214 conversiones generadas', '<span id="val-top-scans">0 escaneos</span>')
    
    # Insert logic
    admin_html = admin_html.replace('</body>', admin_logic + '\n</body>')

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(admin_html)

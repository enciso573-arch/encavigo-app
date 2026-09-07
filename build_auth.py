from bs4 import BeautifulSoup
import time

with open('admin.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# 1. Add Firebase Auth SDK before the closing </head> or near the other SDKs
auth_sdk = BeautifulSoup('<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>', 'html.parser')
# Find the firestore SDK and insert auth before it
firestore_sdk = soup.find(lambda tag: tag.name == 'script' and 'firebase-firestore' in str(tag.get('src', '')))
if firestore_sdk:
    firestore_sdk.insert_before(auth_sdk)
    firestore_sdk.insert_before('\n')

# 2. Add Login CSS
style_tag = soup.find('style')
if style_tag:
    login_css = """
  /* LOGIN OVERLAY */
  #login-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #F3F4F6; z-index: 9999; display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .login-box { background: #FFF; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 350px; text-align: center; }
  .login-box h2 { font-weight: 800; font-size: 24px; margin-bottom: 20px; color: #111827; }
  .login-box input { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #E5E7EB; border-radius: 8px; font-family: 'Inter', sans-serif; background: #F9FAFB; }
  .login-box button { width: 100%; padding: 12px; background: #111827; color: #FFF; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  .login-box button:hover { opacity: 0.9; }
"""
    style_tag.append(login_css)

# 3. Add Login HTML inside body
login_html = """
<div id="login-overlay">
  <div class="login-box">
    <h2>🔒 EncaviGO Admin</h2>
    <input type="email" id="loginEmail" placeholder="Correo electrónico" autocomplete="email">
    <input type="password" id="loginPwd" placeholder="Contraseña">
    <button onclick="loginAdmin()">Ingresar</button>
    <p id="loginError" style="color: #EF4444; font-size: 12px; margin-top: 10px; display: none;">Credenciales incorrectas.</p>
  </div>
</div>
"""
soup.body.insert(0, BeautifulSoup(login_html, 'html.parser'))

# 4. Hide .app-container by default
app_container = soup.find('div', class_='app-container')
if app_container:
    app_container['style'] = "display: none;"
    # Add logout button in sidebar
    sidebar = app_container.find('div', class_='sidebar')
    if sidebar:
        logout_html = """
        <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <div class="nav-item" onclick="logoutAdmin()" style="color: #EF4444;">
              <svg fill="none" height="18" stroke="currentColor" stroke-width="2" viewbox="0 0 24 24" width="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
              Cerrar Sesión
            </div>
        </div>
        """
        sidebar.append(BeautifulSoup(logout_html, 'html.parser'))

# 5. Modify existing JS to include Auth Listener and Login Logic
# We need to find the main script block
scripts = soup.find_all('script')
# We need to find the one containing DOMContentLoaded
target_script = None
for s in scripts:
    if s.string and 'DOMContentLoaded' in s.string:
        target_script = s
        break

if target_script:
    js = target_script.string
    
    # Prepend auth logic
    auth_logic = """
    // FIREBASE AUTHENTICATION LOGIC
    const auth = firebase.auth();

    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('login-overlay').style.display = 'none';
            document.querySelector('.app-container').style.display = 'flex';
        } else {
            document.getElementById('login-overlay').style.display = 'flex';
            document.querySelector('.app-container').style.display = 'none';
        }
    });

    function loginAdmin() {
        const email = document.getElementById('loginEmail').value;
        const pwd = document.getElementById('loginPwd').value;
        const errObj = document.getElementById('loginError');
        errObj.style.display = 'none';
        
        auth.signInWithEmailAndPassword(email, pwd)
            .catch(error => {
                errObj.innerText = error.message;
                errObj.style.display = 'block';
            });
    }

    function logoutAdmin() {
        auth.signOut();
    }
    """
    
    # insert auth logic at the very top of the script
    new_js = auth_logic + "\n" + js
    target_script.string = new_js

html = str(soup)
html += f"<!-- v8 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)

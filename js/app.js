/* ==========================================================================
   GLOBALE ANWENDUNGSLOGIK (State Management & Globale UI)
   ========================================================================== */

// 1. Benutzerzustand (State) initialisieren
let user = null;
const savedUser = localStorage.getItem('bj_user');
if (savedUser) {
    user = JSON.parse(savedUser);
}

// 2. Funktion zum Speichern des Benutzers
function saveUser() {
    if (user) {
        localStorage.setItem('bj_user', JSON.stringify(user));
    }
}

// 3. Funktion zum Ausloggen
function logoutUser() {
    localStorage.removeItem('bj_user');
    user = null;
    window.location.href = 'index.html';
}

// 4. Globale UI-Aktualisierung (Guthaben)
function updateGlobalBalanceUI() {
    if (user) {
        const balanceDisplays = document.querySelectorAll('.balance-display, #balance-display');
        balanceDisplays.forEach(element => {
            element.innerText = user.balance;
        });
    }
}
document.addEventListener('DOMContentLoaded', updateGlobalBalanceUI);

// ==========================================================================
// 5. GLOBALE MODAL-STEUERUNG (RECHTLICHES & IMPRESSUM)
// ==========================================================================
function openLegalModal(tabName = 'impressum') {
    const modal = document.getElementById('legal-modal');
    if (modal) {
        modal.classList.remove('hidden');
        switchModalTab(tabName);
    }
}

function closeLegalModal() {
    const modal = document.getElementById('legal-modal');
    if (modal) {
        modal.classList.add('hidden');
        sessionStorage.setItem('bj_legal_confirmed', 'true');
    }
}

function switchModalTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.modal-tab-btn').forEach(btn => btn.classList.remove('active'));

    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.classList.remove('hidden');

    const buttons = document.querySelectorAll('.modal-tab-btn');
    if (tabName === 'regeln' && buttons[0]) buttons[0].classList.add('active');
    if (tabName === 'impressum' && buttons[1]) buttons[1].classList.add('active');
    if (tabName === 'datenschutz' && buttons[2]) buttons[2].classList.add('active');
}
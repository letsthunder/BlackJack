/* ==========================================================================
   GLOBALE ANWENDUNGSLOGIK (State Management)
   Diese Datei wird auf JEDER HTML-Seite im <head> oder vor dem </body> geladen.
   Sie kümmert sich um die dauerhafte Speicherung der Nutzerdaten.
   ========================================================================== */

// 1. Benutzerzustand (State) initialisieren
// Wir prüfen, ob im lokalen Speicher des Browsers ('localStorage') bereits Daten unter dem Schlüssel 'bj_user' liegen.
let user = null;

const savedUser = localStorage.getItem('bj_user');
if (savedUser) {
    // Da der localStorage nur Texte (Strings) speichern kann, 
    // müssen wir den Text wieder in ein echtes JavaScript-Objekt umwandeln (JSON.parse).
    user = JSON.parse(savedUser);
}

/**
 * 2. Funktion zum Speichern des Benutzers
 * Diese Funktion muss aufgerufen werden, wenn sich Daten ändern 
 * (z.B. beim Login, beim Aufladen oder nach einem Spiel).
 */
function saveUser() {
    if (user) {
        // Das JavaScript-Objekt wird in einen Text umgewandelt (JSON.stringify) und gespeichert.
        localStorage.setItem('bj_user', JSON.stringify(user));
    }
}

/**
 * 3. Funktion zum Ausloggen
 * Wird im Dashboard aufgerufen. Löscht den Schlüssel aus dem Speicher 
 * und wirft den Nutzer zurück auf die Login-Seite.
 */
function logoutUser() {
    localStorage.removeItem('bj_user');
    user = null;
    window.location.href = 'index.html';
}

/**
 * 4. (Optional aber Best Practice) Globale UI-Aktualisierung
 * Wenn du in deinen HTML-Seiten Elementen die Klasse 'balance-display' gibst,
 * werden diese hier automatisch beim Laden der Seite mit dem aktuellen Guthaben befüllt.
 */
function updateGlobalBalanceUI() {
    if (user) {
        const balanceDisplays = document.querySelectorAll('.balance-display');
        balanceDisplays.forEach(element => {
            element.innerText = user.balance;
        });
    }
}

// Wenn das HTML Dokument vollständig geladen ist, aktualisieren wir sicherheitshalber alle Kontostands-Anzeigen.
document.addEventListener('DOMContentLoaded', updateGlobalBalanceUI);
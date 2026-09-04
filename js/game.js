/* ==========================================================================
   BLACKJACK GAME ENGINE (FINALE VERSION)
   Verantwortlich für Spiellogik, Regeln (Hit, Stand, Split), Live-Punktestand 
   und saubere Lege-Animationen.
   ========================================================================== */

// --- 1. STATE (ZUSTANDSSPEICHER) ---
let deck = [];
let baseBet = 0;
let dealerHand = { cards: [] };
let playerHands = []; // Array für Multi-Hands (wegen Split)
let activeHandIndex = 0;

const suits = ['♥', '♦', '♣', '♠'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// --- 2. WETTEINSATZ & SPIELSTART ---
function placeBet() {
    const betInput = document.getElementById('bet-input').value;
    const bet = parseInt(betInput, 10);

    // Validierung
    if (isNaN(bet) || bet <= 0) {
        return alert("Bitte einen gültigen Einsatz eingeben.");
    }
    if (bet > user.balance) {
        return alert("Nicht genügend Guthaben! Bitte lade dein Konto auf.");
    }

    // Einsatz abziehen und speichern
    user.balance -= bet;
    baseBet = bet;
    saveUser();
    updateGlobalBalanceUI();

    // UI umbauen (Wetteinsatz ausblenden, Tisch einblenden)
    document.getElementById('bet-overlay').classList.add('hidden');
    document.getElementById('dealer-area').classList.remove('hidden');
    document.getElementById('player-area').classList.remove('hidden');
    document.getElementById('game-result').classList.add('hidden');
    
    startRound();
}

// --- 3. KARTEN & DECK LOGIK ---
function buildDeck() {
    deck = [];
    // 6 Decks (Casino-Standard)
    for (let i = 0; i < 6; i++) {
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value, weight: getCardWeight(value) });
            }
        }
    }
    // Mischen
    deck.sort(() => Math.random() - 0.5);
}

function getCardWeight(value) {
    if (['J', 'Q', 'K'].includes(value)) return 10;
    if (value === 'A') return 11;
    return parseInt(value);
}

function calculateScore(cards) {
    let score = 0;
    let aces = 0;
    
    cards.forEach(card => {
        score += card.weight;
        if (card.value === 'A') aces++;
    });
    
    // Wenn über 21 und Asse vorhanden, Asse als 1 statt 11 werten
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

// --- 4. HILFSFUNKTION: LIVE-PUNKTESTAND AKTUALISIEREN ---
function updatePlayerScore(idx) {
    const header = document.getElementById(`hand-header-${idx}`);
    if (header) {
        const score = calculateScore(playerHands[idx].cards);
        header.innerText = playerHands.length > 1 ? `Hand ${idx + 1} (${score})` : `Deine Hand (${score})`;
    }
}

// --- 5. ANIMATIONEN (ASYNC/AWAIT) ---
function dealCardAnim(card, containerId, isHidden = false) {
    return new Promise(resolve => {
        const container = document.getElementById(containerId);
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        
        if (isHidden) {
            cardEl.classList.add('hidden-card');
            cardEl.id = 'dealer-hidden-card';
        } else {
            if (card.suit === '♥' || card.suit === '♦') cardEl.classList.add('red');
            else cardEl.classList.add('black');
            cardEl.innerText = `${card.value} ${card.suit}`;
        }
        
        container.appendChild(cardEl);
        
        // Kurzer Delay für CSS Transition
        setTimeout(() => {
            cardEl.classList.add('dealt');
            setTimeout(resolve, 400); // 400ms warten, passend zur CSS Transition
        }, 50);
    });
}

// --- 6. RUNDENABLAUF ---
async function startRound() {
    buildDeck();
    dealerHand = { cards: [] };
    playerHands = [{ cards: [], bet: baseBet, isBust: false, isFinished: false }];
    activeHandIndex = 0;
    
    document.getElementById('dealer-cards').innerHTML = '';
    document.getElementById('dealer-score').innerText = '';

    // Spielerbereich mit Überschrift und Kartencontainer initialisieren
    const container = document.getElementById('player-hands-container');
    container.innerHTML = `
        <div id="hand-0" class="player-hand active-hand">
            <h4 id="hand-header-0" style="color: #fff; margin-bottom: 5px;">Deine Hand (0)</h4>
            <div id="cards-container-0" class="hand-cards"></div>
        </div>
    `;

    const pHand = playerHands[0].cards;
    
    // Karten abwechselnd animiert austeilen
    pHand.push(deck.pop());
    await dealCardAnim(pHand[0], 'cards-container-0');
    updatePlayerScore(0);
    
    dealerHand.cards.push(deck.pop());
    await dealCardAnim(dealerHand.cards[0], 'dealer-cards');
    
    pHand.push(deck.pop());
    await dealCardAnim(pHand[1], 'cards-container-0');
    updatePlayerScore(0);
    
    dealerHand.cards.push(deck.pop());
    await dealCardAnim(dealerHand.cards[1], 'dealer-cards', true); // Verdeckt

    document.getElementById('game-controls').classList.remove('hidden');
    updateControls();
}

function updateControls() {
    const hand = playerHands[activeHandIndex];
    if (!hand) return;

    // --- SPLIT-REGELN ---
    const isTwoCards = hand.cards.length === 2;
    const sameValue = isTwoCards && (getCardWeight(hand.cards[0].value) === getCardWeight(hand.cards[1].value));
    const enoughMoney = user.balance >= baseBet;
    const underMaxHands = playerHands.length < 4; // Max 3 Splits = 4 Hände

    document.getElementById('btn-split').disabled = !(sameValue && enoughMoney && underMaxHands);

    // Aktive Hand visuell hervorheben
    document.querySelectorAll('.player-hand').forEach((el, index) => {
        el.classList.toggle('active-hand', index === activeHandIndex);
    });
}

// --- 7. SPIELER AKTIONEN ---
async function hit() {
    document.getElementById('game-controls').classList.add('hidden'); 
    
    const hand = playerHands[activeHandIndex];
    const newCard = deck.pop();
    hand.cards.push(newCard);
    
    await dealCardAnim(newCard, `cards-container-${activeHandIndex}`);
    updatePlayerScore(activeHandIndex);
    
    const score = calculateScore(hand.cards);
    if (score > 21) {
        hand.isBust = true;
        hand.isFinished = true;
        nextHand();
    } else if (score === 21) {
        hand.isFinished = true;
        nextHand();
    } else {
        document.getElementById('game-controls').classList.remove('hidden');
        updateControls();
    }
}

function stand() {
    playerHands[activeHandIndex].isFinished = true;
    nextHand();
}

async function split() {
    document.getElementById('game-controls').classList.add('hidden');
    
    const currentHand = playerHands[activeHandIndex];
    
    // Einsatz für neue Hand abbuchen
    user.balance -= baseBet;
    saveUser();
    updateGlobalBalanceUI();

    // Hand aufteilen
    const splitCard = currentHand.cards.pop();
    const newHand = { cards: [splitCard], bet: baseBet, isBust: false, isFinished: false };
    playerHands.splice(activeHandIndex + 1, 0, newHand);

    // UI für alle Hände komplett neu aufbauen
    const container = document.getElementById('player-hands-container');
    container.innerHTML = '';
    
    playerHands.forEach((h, idx) => {
        const handDiv = document.createElement('div');
        handDiv.id = `hand-${idx}`;
        handDiv.className = `player-hand ${idx === activeHandIndex ? 'active-hand' : ''}`;
        
        const score = calculateScore(h.cards);
        const header = document.createElement('h4');
        header.id = `hand-header-${idx}`;
        header.style.color = '#fff';
        header.style.marginBottom = '5px';
        header.innerText = `Hand ${idx + 1} (${score})`;
        handDiv.appendChild(header);

        const cardsContainer = document.createElement('div');
        cardsContainer.id = `cards-container-${idx}`;
        cardsContainer.className = 'hand-cards';
        
        h.cards.forEach(c => {
            const el = document.createElement('div');
            el.className = `card dealt ${c.suit === '♥' || c.suit === '♦' ? 'red' : 'black'}`;
            el.innerText = `${c.value} ${c.suit}`;
            cardsContainer.appendChild(el);
        });

        handDiv.appendChild(cardsContainer);
        container.appendChild(handDiv);
    });

    updateControls();

    // Für beide Hände je eine neue Karte animiert ziehen
    const newCard1 = deck.pop();
    currentHand.cards.push(newCard1);
    await dealCardAnim(newCard1, `cards-container-${activeHandIndex}`);
    updatePlayerScore(activeHandIndex);

    const newCard2 = deck.pop();
    newHand.cards.push(newCard2);
    await dealCardAnim(newCard2, `cards-container-${activeHandIndex + 1}`);
    updatePlayerScore(activeHandIndex + 1);

    if (calculateScore(currentHand.cards) === 21) {
        currentHand.isFinished = true;
        nextHand();
    } else {
        document.getElementById('game-controls').classList.remove('hidden');
        updateControls();
    }
}

function nextHand() {
    activeHandIndex++;
    if (activeHandIndex >= playerHands.length) {
        playDealer();
    } else {
        document.getElementById('game-controls').classList.remove('hidden');
        updateControls();
    }
}

// --- 8. DEALER & AUSWERTUNG ---
async function playDealer() {
    document.getElementById('game-controls').classList.add('hidden');
    document.querySelectorAll('.player-hand').forEach(el => el.classList.remove('active-hand'));
    
    // Verdeckte Karte aufdecken
    const hiddenCardEl = document.getElementById('dealer-hidden-card');
    hiddenCardEl.classList.remove('hidden-card');
    const revealedCard = dealerHand.cards[1];
    
    if (revealedCard.suit === '♥' || revealedCard.suit === '♦') hiddenCardEl.classList.add('red');
    else hiddenCardEl.classList.add('black');
    
    hiddenCardEl.innerText = `${revealedCard.value} ${revealedCard.suit}`;

    document.getElementById('dealer-score').innerText = `(${calculateScore(dealerHand.cards)})`;

    const allBust = playerHands.every(h => h.isBust);
    
    if (!allBust) {
        // Dealer zieht bis 17
        while (calculateScore(dealerHand.cards) < 17) {
            const newCard = deck.pop();
            dealerHand.cards.push(newCard);
            await dealCardAnim(newCard, 'dealer-cards');
            document.getElementById('dealer-score').innerText = `(${calculateScore(dealerHand.cards)})`;
        }
    }
    
    determineWinners();
}

function determineWinners() {
    const dealerScore = calculateScore(dealerHand.cards);
    const dealerBust = dealerScore > 21;
    let totalWinnings = 0;
    let resultText = "";

    playerHands.forEach((hand, idx) => {
        const handNum = playerHands.length > 1 ? `Hand ${idx + 1}: ` : "";
        
        if (hand.isBust) {
            resultText += `${handNum}Überkauft (Verloren)<br>`;
        } else {
            const playerScore = calculateScore(hand.cards);
            
            if (dealerBust || playerScore > dealerScore) {
                totalWinnings += (hand.bet * 2);
                resultText += `${handNum}Gewonnen!<br>`;
            } else if (playerScore === dealerScore) {
                totalWinnings += hand.bet; // Push (Unentschieden)
                resultText += `${handNum}Unentschieden (Push)<br>`;
            } else {
                resultText += `${handNum}Verloren gegen Dealer<br>`;
            }
        }
    });

    user.balance += totalWinnings;
    saveUser();
    updateGlobalBalanceUI();

    const resultDiv = document.getElementById('game-result');
    const resultMsg = document.getElementById('result-msg');
    
    let moneyText = totalWinnings > 0 
        ? `<br><span style="color:var(--secondary-color);">+ ${totalWinnings} € gutgeschrieben!</span>` 
        : `<br><span style="color:var(--danger-color);">Kein Gewinn in dieser Runde.</span>`;
        
    resultMsg.innerHTML = resultText + moneyText;
    resultDiv.classList.remove('hidden');
}
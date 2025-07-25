class Deck {
    constructor() {
        this.cards = [];
        const suits = ['♠', '♥', '♣', '♦'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        for (let suit of suits) {
            for (let value of values) {
                this.cards.push({ suit, value });
            }
        }
        this.shuffle();
    }
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    draw() {
        return this.cards.pop();
    }
}

function cardValue(card) {
    if (card.value === 'A') return 11;
    if (['K', 'Q', 'J'].includes(card.value)) return 10;
    return parseInt(card.value);
}

function calculatePoints(hand) {
    let points = 0, aceCount = 0;
    hand.forEach(card => {
        if (card.value === 'A') {
            aceCount += 1;
            points += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            points += 10;
        } else {
            points += Number(card.value);
        }
    });
    while (points > 21 && aceCount > 0) {
        points -= 10;
        aceCount -= 1;
    }
    return points;
}

function renderHand(hand) {
    return hand.map(card => card.suit + card.value).join(' ');
}

let deck, playerHand, aiHand, gameOver, aiStyle = 'probability';

// ---------- AI决策部分：三种风格可选 ----------
function aiCustomTurn(deck, aiHand, aiStyle = 'probability') {
    let aiPoints = calculatePoints(aiHand);
    while (true) {
        if (aiStyle === 'aggressive') {
            // 激进型：18分以下都要牌，偶尔19分也搏一搏
            if (aiPoints < 18 || (aiPoints < 20 && Math.random() < 0.25)) {
                aiHand.push(deck.draw());
                aiPoints = calculatePoints(aiHand);
            } else break;
        } else if (aiStyle === 'defensive') {
            // 保守型：17以下要牌，17以上几乎不冒险
            if (aiPoints < 17 || (aiPoints < 19 && Math.random() < 0.03)) {
                aiHand.push(deck.draw());
                aiPoints = calculatePoints(aiHand);
            } else break;
        } else {
            // 概率型AI：剩余安全牌概率大于50%时才要牌
            let safeCards = deck.cards.filter(card => {
                let tempPoints = aiPoints + cardValue(card);
                return tempPoints <= 21;
            });
            let safeProb = safeCards.length / deck.cards.length;
            if (safeProb > 0.5 && aiPoints < 21) {
                aiHand.push(deck.draw());
                aiPoints = calculatePoints(aiHand);
            } else break;
        }
    }
    endGame();
}
// ------------------------------------------------

function checkWinner() {
    const playerPoints = calculatePoints(playerHand);
    const aiPoints = calculatePoints(aiHand);
    if (playerPoints > 21) return "你爆牌，AI获胜!";
    if (aiPoints > 21) return "AI爆牌，你获胜!";
    if (playerPoints === aiPoints) return "平局!";
    return playerPoints > aiPoints ? "你获胜!" : "AI获胜!";
}

function updateUI(showAllAI = false) {
    document.getElementById('player-cards').innerText = renderHand(playerHand);
    document.getElementById('player-points').innerText = calculatePoints(playerHand);
    if (showAllAI || gameOver) {
        document.getElementById('ai-cards').innerText = renderHand(aiHand);
        document.getElementById('ai-points').innerText = calculatePoints(aiHand);
    } else {
        document.getElementById('ai-cards').innerText = aiHand[0].suit + aiHand[0].value + ' [?]';
        document.getElementById('ai-points').innerText = '?';
    }
}

function setButtons(enable) {
    document.getElementById('hit-btn').disabled = !enable;
    document.getElementById('stand-btn').disabled = !enable;
}

function startGame() {
    deck = new Deck();
    playerHand = [deck.draw(), deck.draw()];
    aiHand = [deck.draw(), deck.draw()];
    gameOver = false;
    updateUI();
    setButtons(true);
    document.getElementById('result').innerText = '';
}

function playerHit() {
    if (gameOver) return;
    playerHand.push(deck.draw());
    updateUI();
    let points = calculatePoints(playerHand);
    if (points >= 21) {
        setButtons(false);
        aiCustomTurn(deck, aiHand, aiStyle);
    }
}

function playerStand() {
    if (gameOver) return;
    setButtons(false);
    aiCustomTurn(deck, aiHand, aiStyle);
}

function endGame() {
    gameOver = true;
    updateUI(true);
    document.getElementById('result').innerText = checkWinner();
}

// ------- 切换AI风格按钮 -------
document.getElementById('ai-aggressive').onclick = function() {
    aiStyle = 'aggressive';
    document.getElementById('ai-type').innerText = '激进型AI';
};
document.getElementById('ai-defensive').onclick = function() {
    aiStyle = 'defensive';
    document.getElementById('ai-type').innerText = '保守型AI';
};
document.getElementById('ai-probability').onclick = function() {
    aiStyle = 'probability';
    document.getElementById('ai-type').innerText = '概率型AI';
};

// ------- 游戏按钮 -------
document.getElementById('hit-btn').onclick = playerHit;
document.getElementById('stand-btn').onclick = playerStand;
document.getElementById('reset-btn').onclick = startGame;

// 初始化
startGame();

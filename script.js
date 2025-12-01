// ====================================================================
// MATH HERO - SCRIPT JAVASCRIPT UTAMA (VERSI MURID)
// ====================================================================

// --- DATABASE SIMULASI: Data Tim Balap/Memory/Mystery/Wheel ---
const teamRacers = [
    { name: "Kucing", char: "🐱", id: 1 },
    { name: "Kelinci", char: "🐰", id: 2 },
    { name: "Anjing", char: "🐶", id: 3 },
    { name: "Panda", char: "🐼", id: 4 },
    { name: "Monyet", char: "🐒", id: 5 }
];

// --- FUNGSI GENERATOR SOAL UNIK ---
function generateUniqueQuestions(count, maxResult, maxOperands, excludeAnswers = []) {
    let generatedQuestions = [];
    let uniqueAnswers = new Set(excludeAnswers);
    let attempts = 0; 
    
    while (generatedQuestions.length < count && attempts < count * 5) {
        attempts++;
        let a, b, op, questionText, answer;
        op = Math.floor(Math.random() * 3); 

        if (op === 0) { // Penjumlahan
            a = Math.floor(Math.random() * maxOperands) + 1;
            b = Math.floor(Math.random() * maxOperands) + 1;
            answer = a + b;
            questionText = `${a} + ${b}`;
            
        } else if (op === 1) { // Pengurangan
            let result = Math.floor(Math.random() * maxOperands) + 1;
            a = Math.floor(Math.random() * maxOperands) + result + 1;
            b = a - result;
            answer = result;
            questionText = `${a} - ${b}`;
            
        } else { // Perkalian
            a = Math.floor(Math.random() * 6) + 1;
            b = Math.floor(Math.random() * 5) + 2; 
            answer = a * b;
            questionText = `${a} x ${b}`;
        }
        
        if (answer <= maxResult && !uniqueAnswers.has(answer)) {
            const isQuestionUnique = !generatedQuestions.some(q => q[0] === questionText);
            
            if (isQuestionUnique) {
                generatedQuestions.push([questionText, answer]);
                uniqueAnswers.add(answer);
            }
        }
    }
    return generatedQuestions;
}


// --- DATABASE SIMULASI: Data Game (TEMPLATE) ---
const activeGames = [
    { 
        id: 1, 
        title: "Math Race: Balapan Rebutan", 
        description: "Siapa cepat, dia yang maju!", 
        icon: "🏆", 
        theme: "race-theme",
        type: "MathRace",
        questions: [] 
    },
    { 
        id: 2, 
        title: "Mystery Box: Rebutan Kotak", 
        description: "Pilih kotak dan rebut poin!", 
        icon: "🎁", 
        theme: "mystery-theme",
        type: "MysteryBox",
        questions: [] 
    },
    { 
        id: 3, 
        title: "Memory Card: Cari Pasangan", 
        description: "Uji daya ingatmu dengan angka!", 
        icon: "🧠", 
        theme: "memory-theme",
        type: "MemoryCard",
        cardPairs: [] 
    },
    { 
        id: 4, 
        title: "Wheel of Math: Roda Rebutan", 
        description: "Putar roda dan rebut soalnya!", 
        icon: "🎡", 
        theme: "wheel-theme",
        type: "WheelOfMath",
        wheelSegments: [
            { label: "Mudah", value: 1, color: "var(--color-success)", difficulty: 'EASY' },
            { label: "Sulit (x3)", value: 3, color: "var(--color-danger)", difficulty: 'HARD' },
            { label: "BONUS!", value: 0, color: "var(--color-accent)", difficulty: 'BONUS' },
            { label: "Sedang (x2)", value: 2, color: "var(--color-primary)", difficulty: 'MEDIUM' },
            { label: "Sulit (x3)", value: 3, color: "var(--color-danger)", difficulty: 'HARD' },
            { label: "Sedang (x2)", value: 2, color: "var(--color-primary)", difficulty: 'MEDIUM' },
            { label: "Mudah", value: 1, color: "var(--color-success)", difficulty: 'EASY' },
            { label: "BONUS!", value: 0, color: "var(--color-accent)", difficulty: 'BONUS' }
        ]
    }
];


// --- STATE GLOBAL GAME ---
let currentGameData = null; 
let currentQuestionIndex = 0; 
let activeTeamIndex = 0; 
const teamScores = teamRacers.reduce((acc, team) => ({ ...acc, [team.id]: 0 }), {});


// --- STATE MATH RACE ---
let racerPositions = teamRacers.reduce((acc, team) => { acc[team.id] = 0; return acc; }, {});
const trackLength = 100; 
const stepSize = 10; 
let availableQuestions = []; 
let isQuestionActive = false; 


// --- STATE MYSTERY BOX ---
const BOX_COUNT = 12; 
let mysteryBoxQuestions = [];
let mysteryBoxSolvedCount = 0;
let isBoxOpen = false; 


// --- STATE MEMORY CARD ---
let shuffledCards = [];
let cardsFlipped = [];
let lockBoard = false;
let matchedPairsCount = 0;
const MEMORY_PAIR_COUNT = 6;


// --- STATE WHEEL OF MATH ---
let wheelIsSpinning = false;
let wheelQuestion = null; 

// ====================================================================
// FUNGSI UTAMA NAVIGASI APLIKASI
// ====================================================================

function renderGameCards() {
    const gameListContainer = document.getElementById('game-list');
    
    gameListContainer.innerHTML = ''; 

    if (activeGames.length === 0) {
        document.getElementById('no-game-message').style.display = 'block';
        return;
    }

    activeGames.forEach(game => {
        if (game.type === "MathRace" || game.type === "MysteryBox" || game.type === "MemoryCard" || game.type === "WheelOfMath") {
            const cardHTML = `
                <div class="game-card ${game.theme}" data-game-id="${game.id}" onclick="startGame(${game.id})">
                    <div class="card-icon">${game.icon}</div>
                    <h3>${game.title}</h3>
                    <p>${game.description}</p>
                    <button>Mulai Game</button>
                </div>
            `;
            gameListContainer.innerHTML += cardHTML;
        }
    });
}

function startGame(gameId) {
    document.getElementById('game-list').parentElement.style.display = 'none';
    document.getElementById('game-area').style.display = 'block';

    currentGameData = activeGames.find(g => g.id === gameId);
    const gameContentDiv = document.getElementById('game-content');
    
    let gameHTML = `
        <h2 style="color: ${currentGameData.theme === 'race-theme' ? '#4CAF50' : (currentGameData.type === 'MysteryBox' ? '#9C27B0' : (currentGameData.type === 'WheelOfMath' ? '#FF5733' : '#ff5722'))};">${currentGameData.icon} ${currentGameData.title}</h2>
        <p>${currentGameData.description}</p>
        <hr/>
    `;
    
    activeTeamIndex = 0; 
    Object.keys(teamScores).forEach(key => teamScores[key] = 0); 
    
    if (currentGameData.type === "MathRace") {
        racerPositions = teamRacers.reduce((acc, team) => { acc[team.id] = 0; return acc; }, {});
        availableQuestions = generateUniqueQuestions(10, 30, 15); 
        
        gameHTML += renderMathRaceTrack();
        gameHTML += renderMathRaceQuestionBox(); 
        gameContentDiv.innerHTML = gameHTML;
        currentQuestionIndex = 0;
        isQuestionActive = true;
        displayNextMathRaceQuestion();

    } else if (currentGameData.type === "MysteryBox") {
        const generatedQuestions = generateUniqueQuestions(BOX_COUNT, 40, 20);
        
        mysteryBoxQuestions = generatedQuestions.map((q, index) => ({
            id: index + 1,
            question: `Berapa ${q[0]}?`,
            answer: q[1],
            color: `box-color-${(index % 4) + 1}`,
            opened: false
        }));
        
        mysteryBoxSolvedCount = 0;
        isBoxOpen = false;
        
        gameHTML += renderMysteryBoxGame(); 
        gameContentDiv.innerHTML = gameHTML;
        
        document.getElementById('mystery-character-feedback').innerHTML = '🤔'; 
        document.getElementById('mystery-turn-indicator').textContent = "Pilih Kotak untuk Mulai!";
        
    } else if (currentGameData.type === "MemoryCard") {
        gameHTML += renderMemoryCardGame();
        gameContentDiv.innerHTML = gameHTML;
        initializeMemoryCardGame();
        
    } else if (currentGameData.type === "WheelOfMath") {
        gameHTML += renderWheelOfMathGame();
        gameContentDiv.innerHTML = gameHTML;
        updateWheelScoreboard();
        
        document.getElementById('wheel-character-feedback').innerHTML = '👇'; 
        document.getElementById('wheel-question-box').style.display = 'none';
    }
}

function goBackToSelection() {
    document.getElementById('game-list').parentElement.style.display = 'block';
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('game-content').innerHTML = '';
    
    // Reset global states
    currentGameData = null;
    currentQuestionIndex = 0;
    activeTeamIndex = 0;
    Object.keys(teamScores).forEach(key => teamScores[key] = 0); 
    wheelIsSpinning = false; // Reset wheel state
}

// ====================================================================
// LOGIKA GAME 1: MATH RACE
// ====================================================================

function renderMathRaceTrack() {
    let trackHTML = `
        <div class="race-track-container">
            <div class="track">
    `;
    
    teamRacers.forEach(team => {
        trackHTML += `
            <div class="lane" id="lane-${team.id}">
                <div class="racer-label">Tim ${team.name}</div>
                <div class="racer" id="racer-${team.id}" style="transform: translateX(${racerPositions[team.id]}%);">${team.char}</div>
                <div class="finish-line"></div>
            </div>
        `;
    });

    trackHTML += `
            </div>
        </div>
    `;
    return trackHTML;
}

function renderMathRaceQuestionBox() {
    let boxHTML = `
        <div class="question-box" id="question-box">
            <h3 id="current-question" style="color:#D50000;">Soal Balapan akan muncul di sini...</h3>
            <p style="font-style: italic;">Tim tercepat yang menjawab benar akan maju!</p>
        </div>
    `;

    boxHTML += `<div class="math-race-answer-wrapper"><div class="group-answer-section">`;

    teamRacers.forEach(team => {
        boxHTML += `
            <div class="answer-col" id="col-${team.id}">
                <h4>Tim ${team.name}</h4>
                <input type="number" id="answer-input-${team.id}" placeholder="Jawab!" onkeydown="if(event.key === 'Enter') checkTeamAnswer(${team.id});">
                <button class="team-submit" onclick="checkTeamAnswer(${team.id})">Kirim!</button>
            </div>
        `;
    });

    boxHTML += `</div></div>`;
    return boxHTML;
}

function displayNextMathRaceQuestion() {
    document.getElementById('question-box').style.display = 'block'; 

    if (currentQuestionIndex >= availableQuestions.length) {
        showEndGamePopUp(null); 
        return;
    }

    const [questionText, _] = availableQuestions[currentQuestionIndex];
    document.getElementById('current-question').textContent = `❓ Soal #${currentQuestionIndex + 1} dari ${availableQuestions.length}: Berapakah ${questionText}?`;

    teamRacers.forEach(team => {
        const inputElement = document.getElementById(`answer-input-${team.id}`);
        const buttonElement = inputElement.parentElement.querySelector('button');
        const colElement = document.getElementById(`col-${team.id}`);

        inputElement.value = '';
        inputElement.disabled = false;
        buttonElement.disabled = false;
        colElement.style.backgroundColor = '#ffe0b2'; 
    });

    document.getElementById(`answer-input-${teamRacers[0].id}`).focus();
    isQuestionActive = true; 
}

function checkTeamAnswer(teamId) {
    if (!isQuestionActive) return; 

    const inputElement = document.getElementById(`answer-input-${teamId}`);
    const answerColElement = document.getElementById(`col-${teamId}`);
    const team = teamRacers.find(t => t.id === teamId);

    const userAnswer = parseInt(inputElement.value);
    const [_, correctAnswer] = availableQuestions[currentQuestionIndex]; 

    if (isNaN(userAnswer)) {
        answerColElement.style.animation = 'shake 0.3s';
        setTimeout(() => answerColElement.style.animation = 'none', 300);
        return;
    }

    if (userAnswer === correctAnswer) {
        isQuestionActive = false; 
        
        answerColElement.style.backgroundColor = '#b9f6ca'; 
        alert(`🥇 Tim ${team.name} TERCEPAT! Jawaban benar. ${team.name} Maju!`);
        
        const isWinner = moveRacer(teamId);
        
        if (!isWinner) {
            currentQuestionIndex++; 
            setTimeout(() => {
                displayNextMathRaceQuestion(); 
            }, 2000); 
        }

    } else {
        answerColElement.style.backgroundColor = '#ffcdd2'; 
        answerColElement.style.animation = 'shake 0.3s';
        setTimeout(() => {
            answerColElement.style.backgroundColor = '#ffe0b2'; 
            answerColElement.style.animation = 'none';
        }, 500); 

        alert(`❌ Tim ${team.name} SALAH! Coba lagi!`);
        inputElement.value = ''; 
        inputElement.focus();
    }
}

function moveRacer(teamId) {
    const team = teamRacers.find(t => t.id === teamId);
    
    racerPositions[teamId] += stepSize;
    let newPosition = racerPositions[teamId];

    if (newPosition > 100) newPosition = 100;
    
    document.getElementById(`racer-${teamId}`).style.transform = `translateX(${newPosition}%)`;
    
    if (newPosition >= trackLength) { 
        showEndGamePopUp(team); 
        return true;
    }
    return false;
}

// ====================================================================
// LOGIKA GAME 2: MYSTERY BOX
// ====================================================================

function renderMysteryBoxGame() {
    let html = `
        <div class="mystery-container">
            <div class="score-and-turn-indicator">
                <div id="mystery-turn-indicator" class="turn-indicator">Pilih Kotak untuk Mulai!</div>
                <div id="mystery-score-board" class="score-board">
                    ${teamRacers.map(t => `<div id="mystery-score-${t.id}" class="team-score-card team-${t.id}">${t.char} <span class="score-value">0</span></div>`).join('')}
                </div>
            </div>
            
            <div class="mystery-box-grid-wrapper">
                <div class="box-grid box-grid-12" id="mystery-box-grid">
                    ${mysteryBoxQuestions.map((q, index) => `
                        <button class="mystery-box-button ${q.color}" 
                                data-box-id="${q.id}"
                                onclick="openMysteryBox(${q.id})">
                            ${index + 1}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="question-box" id="mystery-question-box" style="display:none;">
                <div class="character-feedback-container">
                    <span id="mystery-character-feedback" class="character-feedback-emoji">🤔</span>
                    <h3 id="mystery-current-question" style="color:#D50000;"></h3>
                </div>
                <div class="group-answer-section mystery-rebutan-answer-section">
                    ${teamRacers.map(t => `
                        <div class="answer-col" id="mystery-col-${t.id}">
                            <h4>Tim ${t.name}</h4>
                            <input type="number" id="mystery-answer-input-${t.id}" placeholder="Jawab!" onkeydown="if(event.key === 'Enter') checkMysteryBoxAnswer(${t.id});" disabled>
                            <button class="team-submit" onclick="checkMysteryBoxAnswer(${t.id})" disabled>Kirim!</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    return html;
}

function openMysteryBox(boxId) {
    if (isBoxOpen) return; 
    
    const boxElement = document.querySelector(`[data-box-id="${boxId}"]`);
    const questionData = mysteryBoxQuestions.find(q => q.id === boxId);

    if (questionData.opened) return; 
    
    isBoxOpen = true; 
    document.getElementById('mystery-turn-indicator').textContent = "REBUT JAWABANNYA!";
    
    boxElement.classList.add('pop-up-box');
    
    const questionBox = document.getElementById('mystery-question-box');
    questionBox.style.display = 'block';
    
    document.getElementById('mystery-current-question').textContent = `${questionData.question}`;
    document.getElementById('mystery-character-feedback').innerHTML = '🧐'; 
    
    teamRacers.forEach(team => {
        document.getElementById(`mystery-answer-input-${team.id}`).value = '';
        document.getElementById(`mystery-answer-input-${team.id}`).disabled = false;
        document.querySelector(`#mystery-col-${team.id} button`).disabled = false;
        document.getElementById(`mystery-col-${team.id}`).style.backgroundColor = '#ffe0b2'; 
    });
    
    document.querySelectorAll('.mystery-box-button').forEach(btn => btn.disabled = true);
    
    activeBoxId = boxId;
    document.getElementById(`mystery-answer-input-${teamRacers[0].id}`).focus();
}

function checkMysteryBoxAnswer(teamId) {
    if (!isBoxOpen) return;
    
    const inputElement = document.getElementById(`mystery-answer-input-${teamId}`);
    const answerColElement = document.getElementById(`mystery-col-${teamId}`);
    const team = teamRacers.find(t => t.id === teamId);
    
    const userAnswer = parseInt(inputElement.value);
    const questionData = mysteryBoxQuestions.find(q => q.id === activeBoxId);
    const correctAnswer = questionData.answer;
    
    if (isNaN(userAnswer)) {
        answerColElement.style.animation = 'shake 0.3s';
        setTimeout(() => answerColElement.style.animation = 'none', 300);
        return;
    }
    
    // Blokir semua input setelah jawaban pertama dikirim (untuk menghindari spam)
    teamRacers.forEach(t => {
        document.getElementById(`mystery-answer-input-${t.id}`).disabled = true;
        document.querySelector(`#mystery-col-${t.id} button`).disabled = true;
    });

    if (userAnswer === correctAnswer) {
        // JAWABAN BENAR
        isBoxOpen = false; 
        
        document.getElementById('mystery-character-feedback').innerHTML = '🥳'; 
        answerColElement.style.backgroundColor = '#b9f6ca'; 
        alert(`🎉 TIM ${team.name} TERCEPAT! Berhak mengambil kotak!`);
        
        const boxElement = document.querySelector(`[data-box-id="${activeBoxId}"]`);
        boxElement.classList.add('opened');
        boxElement.innerHTML = team.char; // Tampilkan karakter pemecah
        mysteryBoxQuestions.find(q => q.id === activeBoxId).opened = true;
        mysteryBoxSolvedCount++;
        
        teamScores[teamId] += 1;
        document.querySelector(`#mystery-score-${teamId} .score-value`).textContent = teamScores[teamId];
        
        if (mysteryBoxSolvedCount === BOX_COUNT) {
            setTimeout(showMysteryWinnerPopUp, 2000); 
        } else {
            setTimeout(resetMysteryBoxGame, 2000);
        }
        
    } else {
        // JAWABAN SALAH: BUKA KEMBALI KESEMPATAN UNTUK SEMUA TIM
        answerColElement.style.backgroundColor = '#ffcdd2'; 
        document.getElementById('mystery-character-feedback').innerHTML = '😥'; 
        alert(`❌ TIM ${team.name} SALAH! Rebutan dibuka lagi!`);
        
        inputElement.value = '';
        
        teamRacers.forEach(t => {
            const currentTeamCol = document.getElementById(`mystery-col-${t.id}`);
            if (t.id !== teamId) {
                document.getElementById(`mystery-answer-input-${t.id}`).disabled = false;
                document.querySelector(`#mystery-col-${t.id} button`).disabled = false;
            } else {
                currentTeamCol.style.backgroundColor = '#f1f1f1';
            }
        });
        
        isBoxOpen = true; 
    }
}

function resetMysteryBoxGame() {
    document.getElementById('mystery-question-box').style.display = 'none';
    document.getElementById('mystery-turn-indicator').textContent = "Pilih Kotak!";
    document.getElementById('mystery-character-feedback').innerHTML = '😁'; 
    
    document.querySelectorAll('.mystery-box-button').forEach(btn => {
        btn.classList.remove('pop-up-box'); 
        if (!btn.classList.contains('opened')) {
            btn.disabled = false;
        }
    });
    
    isBoxOpen = false;
}

function showMysteryWinnerPopUp() {
    let winnerId = teamRacers[0].id;
    let maxScore = teamScores[winnerId];
    
    teamRacers.forEach(team => {
        if (teamScores[team.id] > maxScore) {
            maxScore = teamScores[team.id];
            winnerId = team.id;
        }
    });
    
    const winnerTeam = teamRacers.find(t => t.id === winnerId);
    
    const popup = document.getElementById('winner-popup');
    const title = document.getElementById('winner-title');
    const message = document.getElementById('winner-message');
    
    document.getElementById('game-area').style.display = 'none';

    title.textContent = `JUARA KOTAK: TIM ${winnerTeam.name}!`;
    message.textContent = `${winnerTeam.char} Memenangkan ${maxScore} Kotak Misteri!`;
    
    popup.style.display = 'flex';
}

// ====================================================================
// LOGIKA GAME 4: WHEEL OF MATH
// ====================================================================

function renderWheelOfMathGame() {
    const totalSegments = currentGameData.wheelSegments.length;
    
    let segmentsHTML = currentGameData.wheelSegments.map((seg, index) => {
        const angle = 360 / totalSegments;
        const skew = 90 - angle;
        const color = seg.color;
        const rotate = index * angle;
        
        return `
            <li style="--color: ${color}; transform: rotate(${rotate}deg) skewY(${skew}deg);">
                <span style="color: ${color}; transform: skewY(-${skew}deg) rotate(${angle / 2}deg);">
                    ${seg.label}
                </span>
            </li>
        `;
    }).join('');

    return `
        <div class="wheel-container">
             <div class="score-and-turn-indicator">
                <div id="wheel-turn-indicator" class="turn-indicator">Tekan Putar Roda!</div>
                <div id="wheel-score-board" class="score-board">
                    ${teamRacers.map(t => `<div id="wheel-score-${t.id}" class="team-score-card team-${t.id}">${t.char} <span class="score-value">0</span></div>`).join('')}
                </div>
            </div>
            
            <div class="wheel-wrapper">
                <div class="wheel-pin"></div>
                <ul class="wheel" id="wheel">
                    ${segmentsHTML}
                </ul>
                <button class="spin-button" id="spin-button" onclick="spinWheel()">PUTAR RODA!</button>
            </div>
            
            <div class="question-box wheel-question-box" id="wheel-question-box" style="display:none;">
                <div class="character-feedback-container">
                    <span id="wheel-character-feedback" class="character-feedback-emoji"></span>
                    <h3 id="wheel-current-question" style="color:#D50000;"></h3>
                </div>
                <div class="group-answer-section wheel-rebutan-answer-section">
                    ${teamRacers.map(t => `
                        <div class="answer-col" id="wheel-col-${t.id}">
                            <h4>Tim ${t.name}</h4>
                            <input type="number" id="wheel-answer-input-${t.id}" placeholder="Jawab!" onkeydown="if(event.key === 'Enter') checkWheelAnswer(${t.id});" disabled>
                            <button class="team-submit" onclick="checkWheelAnswer(${t.id})" disabled>Kirim!</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function updateWheelScoreboard() {
    teamRacers.forEach(team => {
        document.querySelector(`#wheel-score-${team.id} .score-value`).textContent = teamScores[team.id];
    });
}

function spinWheel() {
    if (wheelIsSpinning) return;
    wheelIsSpinning = true;
    document.getElementById('spin-button').disabled = true;
    document.getElementById('wheel-question-box').style.display = 'none'; 

    const wheel = document.getElementById('wheel');
    const totalSegments = currentGameData.wheelSegments.length;
    const segmentAngle = 360 / totalSegments;
    
    const winningSegmentIndex = Math.floor(Math.random() * totalSegments);
    const winningSegment = currentGameData.wheelSegments[winningSegmentIndex];
    
    const extraTurns = 5; 
    const targetRotation = (extraTurns * 360) + (360 - (winningSegmentIndex * segmentAngle) - (segmentAngle / 2));
    
    wheel.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)'; 
    wheel.style.transform = `rotate(${targetRotation}deg)`;
    
    document.getElementById('wheel-turn-indicator').textContent = 'Roda Berputar!';
    document.getElementById('wheel-character-feedback').innerHTML = '🤞'; 

    setTimeout(() => {
        wheel.style.transition = 'none'; 
        wheel.style.transform = `rotate(${targetRotation % 360}deg)`; 
        handleWheelResult(winningSegment);
    }, 5000); 
}

function handleWheelResult(segment) {
    wheelIsSpinning = false;
    document.getElementById('spin-button').disabled = false;
    document.getElementById('wheel-turn-indicator').textContent = segment.label.toUpperCase() + "!";
    
    document.getElementById('wheel-character-feedback').innerHTML = '🥳'; 
    
    if (segment.difficulty === 'BONUS') {
        const bonusPoints = segment.value + 1; 
        alert(`🎉 BONUS POIN! Semua tim mendapat +${bonusPoints} poin!`); 
        teamRacers.forEach(team => {
            teamScores[team.id] += bonusPoints;
        });
        updateWheelScoreboard();
        setTimeout(resetWheelQuestion, 2000);

    } else {
        displayWheelQuestion(segment);
    }
}

function displayWheelQuestion(segment) {
    let maxResult = 20; 
    if (segment.difficulty === 'HARD') maxResult = 40;
    
    const [questionText, answer] = generateUniqueQuestions(1, maxResult, 20)[0]; 
    wheelQuestion = { question: questionText, answer: answer, points: segment.value };
    
    const questionBox = document.getElementById('wheel-question-box');
    questionBox.style.display = 'block';
    
    document.getElementById('wheel-current-question').textContent = `[${segment.label}] Berapakah ${questionText}? (Nilai: ${wheelQuestion.points} pts)`;
    document.getElementById('wheel-turn-indicator').textContent = 'REBUT JAWABANNYA!';
    document.getElementById('wheel-character-feedback').innerHTML = '🧐'; 
    
    teamRacers.forEach(team => {
        document.getElementById(`wheel-answer-input-${team.id}`).value = '';
        document.getElementById(`wheel-answer-input-${team.id}`).disabled = false;
        document.querySelector(`#wheel-col-${team.id} button`).disabled = false;
        document.getElementById(`wheel-col-${team.id}`).style.backgroundColor = '#ffe0b2';
    });
    isQuestionActive = true;
    document.getElementById(`wheel-answer-input-${teamRacers[0].id}`).focus();
}

function checkWheelAnswer(teamId) {
    if (!isQuestionActive || !wheelQuestion) return; 

    const inputElement = document.getElementById(`wheel-answer-input-${teamId}`);
    const answerColElement = document.getElementById(`wheel-col-${teamId}`);
    const team = teamRacers.find(t => t.id === teamId);

    const userAnswer = parseInt(inputElement.value);
    const correctAnswer = wheelQuestion.answer;
    
    if (isNaN(userAnswer)) {
        answerColElement.style.animation = 'shake 0.3s';
        setTimeout(() => answerColElement.style.animation = 'none', 300);
        return;
    }
    
    // Blokir semua input setelah jawaban pertama dikirim
    teamRacers.forEach(t => {
        document.getElementById(`wheel-answer-input-${t.id}`).disabled = true;
        document.querySelector(`#wheel-col-${t.id} button`).disabled = true;
    });

    if (userAnswer === correctAnswer) {
        // JAWABAN BENAR
        isQuestionActive = false;
        
        document.getElementById('wheel-character-feedback').innerHTML = '🏆'; 
        answerColElement.style.backgroundColor = '#b9f6ca'; 
        
        teamScores[teamId] += wheelQuestion.points;
        updateWheelScoreboard();
        
        alert(`🎉 TIM ${team.name} BENAR! Mendapat +${wheelQuestion.points} poin!`);
        
        // Cek Pemenang (misalnya yang mencapai 20 poin duluan)
        if (teamScores[teamId] >= 20) {
            setTimeout(() => showEndGamePopUp(team), 500);
            return;
        }

        setTimeout(resetWheelQuestion, 2000);
        
    } else {
        // JAWABAN SALAH: BUKA KEMBALI KESEMPATAN UNTUK SEMUA TIM
        answerColElement.style.backgroundColor = '#ffcdd2'; 
        document.getElementById('wheel-character-feedback').innerHTML = '😭'; 
        alert(`❌ TIM ${team.name} SALAH! Coba lagi!`);
        
        inputElement.value = '';
        
        teamRacers.forEach(t => {
            const currentTeamCol = document.getElementById(`wheel-col-${t.id}`);
            if (t.id !== teamId) {
                document.getElementById(`wheel-answer-input-${t.id}`).disabled = false;
                document.querySelector(`#wheel-col-${t.id} button`).disabled = false;
            } else {
                currentTeamCol.style.backgroundColor = '#f1f1f1';
            }
        });
    }
}

function resetWheelQuestion() {
    isQuestionActive = false;
    wheelQuestion = null;
    document.getElementById('wheel-question-box').style.display = 'none';
    document.getElementById('wheel-turn-indicator').textContent = 'Tekan Putar Roda!';
    document.getElementById('wheel-character-feedback').innerHTML = '👇'; 
}

// ====================================================================
// LOGIKA GAME 3: MEMORY CARD (PERBAIKAN LOGIKA)
// ====================================================================

function renderMemoryCardGame() {
    return `
        <div class="memory-container">
            <div class="score-and-turn-indicator">
                <div id="turn-indicator" class="turn-indicator"></div>
                <div id="score-board" class="score-board">
                    ${teamRacers.map(t => `<div id="score-${t.id}" class="team-score-card team-${t.id}">${t.char} <span class="score-value">0</span></div>`).join('')}
                </div>
            </div>
            <div class="memory-grid" id="memory-grid">
                </div>
        </div>
    `;
}

function initializeMemoryCardGame() {
    // GENERATE PASANGAN KARTU UNIK
    const questions = generateUniqueQuestions(MEMORY_PAIR_COUNT, 25, 12);
    let cards = [];
    questions.forEach((q, index) => {
        cards.push({ value: q[0], pairId: index }); // Soal
        cards.push({ value: String(q[1]), pairId: index }); // Jawaban (dibuat string agar berbeda tipe dengan soal)
    });
    
    shuffledCards = cards.sort(() => 0.5 - Math.random());
    
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    shuffledCards.forEach((item, index) => {
        const cardHTML = `
            <div class="memory-card" data-card-id="${index}" data-pair-id="${item.pairId}" data-value="${item.value}" onclick="flipCard(${index})">
                <div class="card-face card-back">❓</div>
                <div class="card-face card-front">${item.value}</div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
    
    cardsFlipped = [];
    lockBoard = false;
    matchedPairsCount = 0;
    activeTeamIndex = 0;
    Object.keys(teamScores).forEach(key => teamScores[key] = 0); 
    updateTurnIndicator();
}

function updateTurnIndicator() {
    const activeTeam = teamRacers[activeTeamIndex];
    const indicator = document.getElementById('turn-indicator');
    indicator.innerHTML = `Giliran Tim <span style="font-size:1.5em">${activeTeam.char} ${activeTeam.name}</span>`;
    
    document.querySelectorAll('.team-score-card').forEach(card => card.classList.remove('active-turn'));
    document.getElementById(`score-${activeTeam.id}`).classList.add('active-turn');
}

function flipCard(cardId) {
    if (lockBoard) return;
    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    
    if (cardElement.classList.contains('flip') || cardsFlipped.length === 2) return; 
    
    cardElement.classList.add('flip');
    cardsFlipped.push(cardElement);

    if (cardsFlipped.length === 2) {
        lockBoard = true;
        checkForMatch();
    }
}

function checkForMatch() {
    const [card1, card2] = cardsFlipped;
    
    const isSamePairId = card1.dataset.pairId === card2.dataset.pairId;
    const isDifferentValue = card1.dataset.value !== card2.dataset.value; 
    
    const isMatch = isSamePairId && isDifferentValue;
    
    if (isMatch) {
        disableCards(card1, card2);
        
        const activeTeamId = teamRacers[activeTeamIndex].id;
        teamScores[activeTeamId] += 1;
        document.querySelector(`#score-${activeTeamId} .score-value`).textContent = teamScores[activeTeamId];
        
        matchedPairsCount++;
        if (matchedPairsCount === MEMORY_PAIR_COUNT) {
            setTimeout(() => {
                showMemoryWinnerPopUp();
            }, 1000);
        }
        
    } else {
        unflipCards(card1, card2);
        activeTeamIndex = (activeTeamIndex + 1) % teamRacers.length;
        setTimeout(updateTurnIndicator, 1200);
    }
}

function disableCards(card1, card2) {
    card1.classList.add('matched');
    card2.classList.add('matched');
    
    card1.onclick = null;
    card2.onclick = null;
    resetBoard();
}

function unflipCards(card1, card2) {
    setTimeout(() => {
        card1.classList.remove('flip');
        card2.classList.remove('flip');
        resetBoard();
    }, 1200); 
}

function resetBoard() {
    [cardsFlipped, lockBoard] = [[], false];
}

function showMemoryWinnerPopUp() {
    let winnerId = teamRacers[0].id;
    let maxScore = teamScores[winnerId];
    
    teamRacers.forEach(team => {
        if (teamScores[team.id] > maxScore) {
            maxScore = teamScores[team.id];
            winnerId = team.id;
        }
    });
    
    const winnerTeam = teamRacers.find(t => t.id === winnerId);
    
    const popup = document.getElementById('winner-popup');
    const title = document.getElementById('winner-title');
    const message = document.getElementById('winner-message');
    
    document.getElementById('game-area').style.display = 'none';

    title.textContent = `JUARA MEMORI: TIM ${winnerTeam.name}!`;
    message.textContent = `${winnerTeam.char} Memenangkan ${maxScore} Pasang! Kalian HEBAT!`;
    
    popup.style.display = 'flex';
}


// ====================================================================
// LOGIKA POP-UP KEMENANGAN & INISIALISASI
// ====================================================================

function showEndGamePopUp(winnerTeam) {
    const popup = document.getElementById('winner-popup');
    const title = document.getElementById('winner-title');
    const message = document.getElementById('winner-message');
    
    document.getElementById('game-area').style.display = 'none';

    if (winnerTeam) {
        title.textContent = `SELAMAT, TIM ${winnerTeam.name}!`;
        message.textContent = `Karakter ${winnerTeam.char} mencapai garis finish. Kalian adalah Math Hero!`;
    } else {
        title.textContent = `WAKTU HABIS!`;
        message.textContent = `Cek poin akhir di papan skor!`;
    }

    popup.style.display = 'flex';
}

function closeWinnerPopUp() {
    document.getElementById('winner-popup').style.display = 'none';
    goBackToSelection();
}

document.addEventListener('DOMContentLoaded', renderGameCards);
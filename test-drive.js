// لعبة اختبار القيادة - SolarShift
// مع السيارات البوتات الذكية
// ============================================

// الحصول على حالة السيارة من الصفحة الرئيسية
const urlParams = new URLSearchParams(window.location.search);
const isElectric = urlParams.get('electric') === 'true';

// إعداد Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// تعيين حجم Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// متغيرات اللعبة
let gameState = {
    carX: canvas.width / 2,
    carY: canvas.height / 2 + 100,
    carSpeed: 0,
    maxSpeed: isElectric ? 180 : 220,
    acceleration: isElectric ? 0.8 : 1.0,
    deceleration: 0.3,
    roadSpeed: 0,
    roadOffset: 0,
    fuel: 1000,
    fuelConsumption: isElectric ? 0.0015 : 0.005,
    distance: 0,
    pollution: 0,
    pollutionRate: isElectric ? 0.002 : 0.08,
    maxSpeedReached: 0,
    isAccelerating: false,
    isMovingLeft: false,
    isMovingRight: false,
    gameOver: false,
    lanes: [canvas.width / 2 - 150, canvas.width / 2, canvas.width / 2 + 150],
    currentLane: 1,
    obstacles: [],
    botCars: [],
    collisions: 0,
    overtakes: 0
};

// صورة السيارة
const carImage = new Image();
carImage.src = isElectric ? 'images/bmw-car-electric.png' : 'images/bmw-car.png';

// التحكم بالأزرار
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const acceleratorBtn = document.getElementById('acceleratorBtn');

// إخفاء أزرار التحكم اليدوي بالتلوث والوقود والسرعة
const pollutionUpBtn = document.getElementById('pollutionUpBtn');
const pollutionDownBtn = document.getElementById('pollutionDownBtn');
const fuelUpBtn = document.getElementById('fuelUpBtn');
const fuelDownBtn = document.getElementById('fuelDownBtn');
const speedUpBtn = document.getElementById('speedUpBtn');
const speedDownBtn = document.getElementById('speedDownBtn');

if (pollutionUpBtn) pollutionUpBtn.style.display = 'none';
if (pollutionDownBtn) pollutionDownBtn.style.display = 'none';
if (fuelUpBtn) fuelUpBtn.style.display = 'none';
if (fuelDownBtn) fuelDownBtn.style.display = 'none';
if (speedUpBtn) speedUpBtn.style.display = 'none';
if (speedDownBtn) speedDownBtn.style.display = 'none';

// جعل السيارة تتسارع باستمرار بدون الحاجة للضغط على الزر
gameState.isAccelerating = true;


leftBtn.addEventListener('click', () => {
    if (gameState.currentLane > 0) {
        gameState.currentLane--;
    }
});

rightBtn.addEventListener('click', () => {
    if (gameState.currentLane < gameState.lanes.length - 1) {
        gameState.currentLane++;
    }
});

// التحكم بلوحة المفاتيح
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && gameState.currentLane > 0) {
        gameState.currentLane--;
    } else if (e.key === 'ArrowRight' && gameState.currentLane < gameState.lanes.length - 1) {
        gameState.currentLane++;
    } else if (e.key === 'ArrowUp' || e.key === ' ') {
        gameState.isAccelerating = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === ' ') {
        gameState.isAccelerating = false;
    }
});

// فئة السيارة البوتة
class BotCar {
    constructor(lane, speed) {
        this.lane = lane;
        this.x = gameState.lanes[lane];
        this.y = -100;
        this.speed = speed;
        this.width = 70;
        this.height = 110;
        this.color = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 5)];
        this.overtaken = false;
    }

    update() {
        this.y += gameState.roadSpeed + this.speed;
        
        // محاولة تجنب السيارات الأخرى بشكل أفضل
        for (let otherCar of gameState.botCars) {
            if (otherCar === this) continue;
            
            const distance = Math.abs(this.y - otherCar.y);
            const sameLane = this.lane === otherCar.lane;
            const minSafeDistance = 180; // مسافة آمنة أكبر
            
            // إذا كانت السيارة الأخرى قريبة جداً في نفس المسار
            if (sameLane && distance < minSafeDistance && distance > 0) {
                // محاولة الانتقال إلى مسار آخر بأولوية
                let moved = false;
                
                // محاولة الانتقال لليسار أولاً
                if (this.lane > 0 && this.canChangeLane(this.lane - 1)) {
                    this.lane--;
                    this.x = gameState.lanes[this.lane];
                    moved = true;
                }
                // إذا لم ينجح، حاول اليمين
                else if (this.lane < 2 && this.canChangeLane(this.lane + 1)) {
                    this.lane++;
                    this.x = gameState.lanes[this.lane];
                    moved = true;
                }
                // إذا لم ينجح، قلل السرعة
                if (!moved) {
                    this.speed = Math.max(0.1, this.speed - 0.3);
                }
            }
            
            // تجنب السيارات في المسارات المجاورة
            const adjacentDistance = Math.abs(this.y - otherCar.y);
            if (Math.abs(this.lane - otherCar.lane) === 1 && adjacentDistance < minSafeDistance + 50) {
                // إذا كانت سيارة أخرى قريبة في مسار مجاور، قلل السرعة قليلاً
                this.speed = Math.max(0.2, this.speed - 0.1);
            }
        }
    }

    canChangeLane(newLane) {
        for (let car of gameState.botCars) {
            if (car === this) continue;
            // تحقق من مسافة أكبر لضمان عدم التصادم
            if (car.lane === newLane && Math.abs(car.y - this.y) < 250) {
                return false;
            }
        }
        return true;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // رسم نوافذ السيارة
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - this.width / 2 + 5, this.y - this.height / 2 + 5, this.width - 10, 20);
        ctx.fillRect(this.x - this.width / 2 + 5, this.y - this.height / 2 + 35, this.width - 10, 20);
        
        // رسم مصابيح السيارة
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(this.x - this.width / 2 + 10, this.y - this.height / 2 - 3, 8, 3);
        ctx.fillRect(this.x + this.width / 2 - 18, this.y - this.height / 2 - 3, 8, 3);
    }

    isOutOfScreen() {
        return this.y > canvas.height + 100;
    }
}

// رسم الطريق
function drawRoad() {
    // خلفية السماء
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98D8E8');
    gradient.addColorStop(1, '#808080');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // الطريق
    ctx.fillStyle = '#333';
    const roadWidth = 500;
    const roadX = canvas.width / 2 - roadWidth / 2;
    ctx.fillRect(roadX, 0, roadWidth, canvas.height);

    // خطوط الطريق
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 30]);
    ctx.lineDashOffset = -gameState.roadOffset;

    // خط أيسر
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 100, 0);
    ctx.lineTo(canvas.width / 2 - 100, canvas.height);
    ctx.stroke();

    // خط أيمن
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + 100, 0);
    ctx.lineTo(canvas.width / 2 + 100, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);

    // حواف الطريق
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(roadX, 0);
    ctx.lineTo(roadX, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(roadX + roadWidth, 0);
    ctx.lineTo(roadX + roadWidth, canvas.height);
    ctx.stroke();
}

// رسم السيارة الرئيسية
function drawCar() {
    const targetX = gameState.lanes[gameState.currentLane];
    gameState.carX += (targetX - gameState.carX) * 0.15;

    const carWidth = 120;
    const carHeight = 160;

    if (carImage.complete) {
        ctx.save();
        ctx.translate(gameState.carX, gameState.carY);
        ctx.drawImage(carImage, -carWidth / 2, -carHeight / 2, carWidth, carHeight);
        ctx.restore();
    } else {
        ctx.fillStyle = isElectric ? '#00ff88' : '#ff4444';
        ctx.fillRect(gameState.carX - carWidth / 2, gameState.carY - carHeight / 2, carWidth, carHeight);
    }
    
    // رسم الكربون من السيارة البنزين
    if (!isElectric && gameState.carSpeed > 10) {
        const smokeIntensity = Math.min(gameState.carSpeed / gameState.maxSpeed, 1);
        const smokeOpacity = smokeIntensity * 0.6;
        
        ctx.fillStyle = 'rgba(100, 100, 100, ' + smokeOpacity + ')';
        
        // سحابة أولى
        ctx.beginPath();
        ctx.arc(gameState.carX - 20, gameState.carY + 70, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // سحابة ثانية
        ctx.beginPath();
        ctx.arc(gameState.carX + 20, gameState.carY + 70, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // سحابة ثالثة
        ctx.fillStyle = 'rgba(150, 150, 150, ' + (smokeOpacity * 0.5) + ')';
        ctx.beginPath();
        ctx.arc(gameState.carX, gameState.carY + 80, 18, 0, Math.PI * 2);
        ctx.fill();
    }
}

// رسم السيارات البوتة
function drawBotCars() {
    gameState.botCars.forEach(car => {
        car.draw();
    });
}

// رسم العوائق
function drawObstacles() {
    gameState.obstacles.forEach(obstacle => {
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(obstacle.x - 30, obstacle.y - 40, 60, 80);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠', obstacle.x, obstacle.y);
    });
}

// التحقق من التصادمات
function checkCollisions() {
    const carWidth = 80;
    const carHeight = 120;
    
    // التصادم مع السيارات البوتة
    for (let botCar of gameState.botCars) {
        const dx = gameState.carX - botCar.x;
        const dy = gameState.carY - botCar.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (carWidth / 2 + botCar.width / 2)) {
            gameState.collisions++;
            gameState.fuel -= 5; // خسارة وقود عند التصادم
            
            // دفع السيارة البوتة بعيداً
            const angle = Math.atan2(dy, dx);
            botCar.x += Math.cos(angle) * 30;
            botCar.y += Math.sin(angle) * 30;
        }
    }
    
    // التصادم مع العوائق
    for (let obstacle of gameState.obstacles) {
        const dx = gameState.carX - obstacle.x;
        const dy = gameState.carY - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 60) {
            gameState.collisions++;
            gameState.fuel -= 10;
        }
    }
}

// التحقق من التجاوز
function checkOvertakes() {
    for (let botCar of gameState.botCars) {
        if (!botCar.overtaken && gameState.carY < botCar.y && gameState.carY > botCar.y - 200) {
            if (gameState.currentLane !== botCar.lane) {
                botCar.overtaken = true;
                gameState.overtakes++;
            }
        }
    }
}

// تحديث حالة اللعبة
function updateGame() {
    if (gameState.gameOver) return;

    // التسارع والتباطؤ
    if (gameState.isAccelerating && gameState.fuel > 0) {
        gameState.carSpeed = Math.min(gameState.carSpeed + gameState.acceleration, gameState.maxSpeed);
    } else {
        gameState.carSpeed = Math.max(gameState.carSpeed - gameState.deceleration, 0);
    }

    // تحديث سرعة الطريق
    gameState.roadSpeed = gameState.carSpeed * 0.5;
    gameState.roadOffset += gameState.roadSpeed;

    // تحديث المسافة
    gameState.distance += gameState.carSpeed * 0.1;

    // استهلاك الوقود/الكهرباء
    if (gameState.carSpeed > 0) {
        gameState.fuel -= gameState.fuelConsumption * (gameState.carSpeed / 100);
        gameState.fuel = Math.max(gameState.fuel, 0);
    }

    // زيادة التلوث
    if (gameState.carSpeed > 0) {
        gameState.pollution += gameState.pollutionRate * (gameState.carSpeed / 100);
        gameState.pollution = Math.min(gameState.pollution, 100);
    }

    // تحديث أقصى سرعة
    gameState.maxSpeedReached = Math.max(gameState.maxSpeedReached, gameState.carSpeed);

    // تحديث السيارات البوتة
    gameState.botCars.forEach(car => car.update());
    gameState.botCars = gameState.botCars.filter(car => !car.isOutOfScreen());

    // تحديث العوائق
    gameState.obstacles.forEach(obstacle => {
        obstacle.y += gameState.roadSpeed;
    });
    gameState.obstacles = gameState.obstacles.filter(obstacle => obstacle.y < canvas.height + 100);

    // إضافة سيارات بوتة جديدة بمعدل أقل - سيارتان فقط
    if (Math.random() < 0.008 && gameState.botCars.length < 2) {
        const lane = Math.floor(Math.random() * 3);
        const speed = Math.random() * 1.8 + 1.2;
        
        // تحقق من عدم وجود سيارة قريبة في نفس المسار
        let canSpawn = true;
        for (let car of gameState.botCars) {
            if (car.lane === lane && car.y < 100) {
                canSpawn = false;
                break;
            }
        }
        
        if (canSpawn) {
            gameState.botCars.push(new BotCar(lane, speed));
        }
    }

    // إضافة عوائق جديدة
    if (Math.random() < 0.008 && gameState.carSpeed > 50) {
        const lane = Math.floor(Math.random() * 3);
        gameState.obstacles.push({
            x: gameState.lanes[lane],
            y: -100
        });
    }

    // التحقق من التصادمات والتجاوز
    checkCollisions();
    checkOvertakes();

    // التحقق من نفاد الوقود
    if (gameState.fuel <= 0) {
        endGame();
    }

    // تحديث واجهة المستخدم
    updateHUD();
}

// تحديث واجهة المستخدم
function updateHUD() {
    document.getElementById('speedDisplay').textContent = Math.round(gameState.carSpeed);
    const fuelPercentage = Math.min(Math.round((gameState.fuel / 1000) * 100), 100);
    document.getElementById('fuelDisplay').textContent = fuelPercentage + '%';
    document.getElementById('distanceDisplay').textContent = Math.round(gameState.distance);
    document.getElementById('pollutionDisplay').textContent = Math.round(gameState.pollution) + '%';

    // تحديث شريط التلوث
    const pollutionFill = document.getElementById('pollutionFill');
    pollutionFill.style.height = gameState.pollution + '%';

    // تحديث لون لوحة الوقود
    const fuelPanel = document.getElementById('fuelPanel');
    if (gameState.fuel < 20) {
        fuelPanel.classList.add('hud-warning');
    } else {
        fuelPanel.classList.remove('hud-warning');
    }

    // تحديث تسمية الوقود
    document.getElementById('fuelLabel').textContent = isElectric ? 'الكهرباء' : 'الوقود';
}

// إنهاء اللعبة
function endGame() {
    gameState.gameOver = true;
    
    // عرض شاشة النتائج
    document.getElementById('finalDistance').textContent = Math.round(gameState.distance);
    document.getElementById('finalMaxSpeed').textContent = Math.round(gameState.maxSpeedReached);
    document.getElementById('finalPollution').textContent = Math.round(gameState.pollution) + '%';
    const finalFuelPercentage = Math.min(Math.round((gameState.fuel / 1000) * 100), 100);
    document.getElementById('finalFuel').textContent = finalFuelPercentage + '%';
    document.getElementById('finalFuelLabel').textContent = isElectric ? 'الكهرباء المتبقية' : 'الوقود المتبقي';
    
    // إضافة إحصائيات إضافية
    const statsGrid = document.querySelector('.stats-grid');
    const overtakesCard = document.createElement('div');
    overtakesCard.className = 'stat-card';
    overtakesCard.innerHTML = `
        <div class="stat-card-value">${gameState.overtakes}</div>
        <div class="stat-card-label">عدد التجاوزات</div>
    `;
    statsGrid.appendChild(overtakesCard);
    
    const collisionsCard = document.createElement('div');
    collisionsCard.className = 'stat-card';
    collisionsCard.innerHTML = `
        <div class="stat-card-value">${gameState.collisions}</div>
        <div class="stat-card-label">عدد التصادمات</div>
    `;
    statsGrid.appendChild(collisionsCard);
    
    document.getElementById('gameOverScreen').classList.add('active');
}

// إعادة تشغيل اللعبة
function restartGame() {
    gameState = {
        carX: canvas.width / 2,
        carY: canvas.height - 150,
        carSpeed: 0,
        maxSpeed: isElectric ? 180 : 220,
        acceleration: isElectric ? 0.8 : 1.0,
        deceleration: 0.3,
        roadSpeed: 0,
        roadOffset: 0,
        fuel: 100,
        fuelConsumption: isElectric ? 0.015 : 0.05,
        distance: 0,
        pollution: 0,
        pollutionRate: isElectric ? 0.002 : 0.08,
        maxSpeedReached: 0,
        isAccelerating: false,
        isMovingLeft: false,
        isMovingRight: false,
        gameOver: false,
        lanes: [canvas.width / 2 - 150, canvas.width / 2, canvas.width / 2 + 150],
        currentLane: 1,
        obstacles: [],
        botCars: [],
        collisions: 0,
        overtakes: 0
    };
    
    // إزالة البطاقات الإضافية
    const extraCards = document.querySelectorAll('.stats-grid .stat-card:nth-child(n+5)');
    extraCards.forEach(card => card.remove());
    
    document.getElementById('gameOverScreen').classList.remove('active');
}

// معالجات الأزرار معطلة - الإحصائيات تزيد تلقائياً

// العودة للصفحة الرئيسية
function goBack() {
    window.location.href = 'index.html';
}

// حلقة اللعبة الرئيسية
function gameLoop() {
    updateGame();
    drawRoad();
    drawBotCars();
    drawObstacles();
    drawCar();
    requestAnimationFrame(gameLoop);
}

// بدء اللعبة
gameLoop();

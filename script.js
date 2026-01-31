// ============================================
// محاكي السيارات الشمسية - لوحة التحكم المتقدمة v2.2
// النظام الصوتي والتفاعل المتقدم
// ============================================

let carState = {
    hasBattery: false,
    hasSolar: false,
    hasMotor: false,
    parts: [],
    isMoving: false,
    isPowerOn: false,
    carbonLevel: 100,
    replacedParts: [],
    speed: 0,
    charge: 74,
    solarProduction: 0,
    driveMode: 'eco',
    ecoSave: false,
    ecoEfficiency: 1.0,
    schedule: { start: '00:00', end: '06:00' }
};

// إعداد النظام الصوتي
const sounds = {
    battery: new Audio('sounds/battery-install.wav'),
    motor: new Audio('sounds/motor-install.wav'),
    solar: new Audio('sounds/solar-install.wav'),
    powerOn: new Audio('sounds/motor-install.wav'), // استخدام صوت المحرك للتشغيل مؤقتاً
    click: new Audio('sounds/battery-install.wav') // صوت نقرة خفيفة
};

// وظيفة تشغيل الصوت مع معالجة أخطاء المتصفح (Autoplay policy)
function playSound(soundKey) {
    const sound = sounds[soundKey];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play prevented: Need user interaction first'));
    }
}

// البيانات المرجعية
const baseGasoline = {
    monthlyFuel: 255,
    fuelPrice: 2.33,
    monthlyCarbon: 7.5,
    pollution: 100
};

const electricPartsEffect = {
    battery: { capacity: 75, range: 400, chargingCost: 45, pollutionReduction: 40 },
    motor: { efficiencyBoost: 60, pollutionReduction: 40 },
    solar: { rangeBoost: 100, chargingCostReduction: 45, pollutionReduction: 20 }
};

const replacedPartsData = {
    gasoline_engine: { name: 'محرك البنزين V6', desc: 'تم استبداله بمحرك كهربائي صامت وعالي الكفاءة', image: 'images/gas_engine_replaced.png' },
    fuel_tank: { name: 'خزان وقود 70L', desc: 'تم استبداله ببطارية ليثيوم متطورة وآمنة', image: 'images/fuel_tank_replaced.png' },
    exhaust_system: { name: 'نظام العادم', desc: 'تمت إزالته بالكامل - صفر انبعاثات كربونية', image: 'images/exhaust_replaced.png' }
};

// وظائف السحب والإفلات والنقر
document.querySelectorAll('.part-card').forEach(part => {
    part.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', part.dataset.part);
    });

    part.addEventListener('dblclick', () => addPartToCar(part.dataset.part));

    // دعم اللمس والنقر المزدوج للجوال
    let lastTap = 0;
    part.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            addPartToCar(part.dataset.part);
            e.preventDefault();
        }
        lastTap = currentTime;
    });
});

const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e) => e.preventDefault());
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const partType = e.dataTransfer.getData('text/plain');
    if (partType) addPartToCar(partType);
});

function addPartToCar(partType) {
    if (partType === 'battery' && !carState.hasBattery) {
        carState.hasBattery = true;
        carState.replacedParts.push('fuel_tank');
        showPartOnCar('battery');
        playSound('battery');
    } else if (partType === 'motor' && !carState.hasMotor) {
        carState.hasMotor = true;
        carState.replacedParts.push('gasoline_engine');
        showPartOnCar('motor');
        playSound('motor');
    } else if (partType === 'solar' && !carState.hasSolar) {
        carState.hasSolar = true;
        carState.replacedParts.push('exhaust_system');
        showPartOnCar('solar');
        playSound('solar');
    }
    updateDashboard();
}

function showPartOnCar(partType) {
    const el = { battery: 'batteryPack', motor: 'electricMotor', solar: 'solarRoof' }[partType];
    if (el) document.getElementById(el).style.display = 'block';
}

function updateDashboard() {
    let currentBattery = 0, currentRange = 0, currentChargingCost = 0;
    let currentPollution = baseGasoline.pollution;
    let currentMonthlyCost = baseGasoline.monthlyFuel * baseGasoline.fuelPrice;

    if (carState.hasBattery) {
        currentBattery = electricPartsEffect.battery.capacity;
        currentRange = electricPartsEffect.battery.range;
        currentChargingCost = electricPartsEffect.battery.chargingCost;
        currentPollution -= electricPartsEffect.battery.pollutionReduction;
        currentMonthlyCost = currentChargingCost;
    }
    if (carState.hasMotor) {
        currentPollution -= electricPartsEffect.motor.pollutionReduction;
        if (carState.hasBattery) currentRange += 50;
    }
    if (carState.hasSolar) {
        currentPollution -= electricPartsEffect.solar.pollutionReduction;
        if (carState.hasBattery) {
            currentRange += electricPartsEffect.solar.rangeBoost;
            currentMonthlyCost = 0;
        }
    }

    // تطبيق الأوضاع والخصائص
    if (carState.driveMode === 'sport') currentRange *= 0.7;
    else if (carState.driveMode === 'eco') currentRange *= 1.2;
    currentRange *= carState.ecoEfficiency;

    currentPollution = Math.max(0, currentPollution);
    
    // تحديث الواجهة
    document.getElementById('elec-battery-cap').textContent = currentBattery + ' kWh';
    document.getElementById('elec-monthly-cost').textContent = Math.round(currentMonthlyCost) + ' SAR';
    document.getElementById('elec-range').textContent = Math.round(currentRange) + ' KM';
    document.getElementById('elec-pollution').textContent = currentPollution + '%';
    
    document.getElementById('main-range').textContent = Math.round(currentRange) + ' KM';
    document.getElementById('main-charge').textContent = carState.charge + '%';
    document.getElementById('main-solar').textContent = (carState.hasSolar ? 150 : 0) + ' W';

    const gasCost = baseGasoline.monthlyFuel * baseGasoline.fuelPrice;
    document.getElementById('annualSaving').textContent = Math.round((gasCost - currentMonthlyCost) * 12).toLocaleString();
    document.getElementById('reductionPercent').textContent = (100 - currentPollution) + '%';
    document.getElementById('airPurity').textContent = (100 - currentPollution) + '%';

    updateReplacedPartsUI();
    updateEnvironment(currentPollution);
}

function updateReplacedPartsUI() {
    const container = document.getElementById('replacedPartsContainer');
    if (!container) return;
    if (carState.replacedParts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>لم تستبدل أي قطع حتى الآن</p></div>';
        return;
    }
    container.innerHTML = '';
    carState.replacedParts.forEach(key => {
        const p = replacedPartsData[key];
        const card = document.createElement('div');
        card.className = 'replaced-part-card';
        card.innerHTML = `<img src="${p.image}" class="replaced-part-image"><div class="part-name">${p.name}</div><div class="part-desc">${p.desc}</div>`;
        container.appendChild(card);
    });
}

function updateEnvironment(pollution) {
    const container = document.querySelector('.container');
    const ecoStatus = document.getElementById('ecoStatus');
    const gasCar = document.getElementById('gasolineCar');
    const elecCar = document.getElementById('electricCar');

    if (pollution < 100) gasCar.classList.add('clean');
    else gasCar.classList.remove('clean');

    if (carState.hasBattery && carState.hasMotor && carState.hasSolar) {
        gasCar.style.opacity = '0';
        setTimeout(() => {
            gasCar.style.display = 'none';
            elecCar.style.display = 'block';
            setTimeout(() => elecCar.style.opacity = '1', 50);
            document.getElementById('batteryPack').style.display = 'none';
            document.getElementById('electricMotor').style.display = 'none';
            document.getElementById('solarRoof').style.display = 'none';
        }, 1000);
        container.classList.add('eco-mode');
        ecoStatus.textContent = 'بيئة نظيفة ونقية - سيارة كهربائية بالكامل';
    } else if (pollution <= 20) {
        container.classList.add('eco-mode');
        ecoStatus.textContent = 'بيئة نظيفة ونقية';
    } else {
        container.classList.remove('eco-mode');
        ecoStatus.textContent = pollution <= 60 ? 'بيئة تتحسن تدريجياً' : 'بيئة ملوثة';
    }
}

// وظائف التحكم
function toggleCarPower() {
    carState.isPowerOn = !carState.isPowerOn;
    const btn = document.getElementById('carPowerBtn');
    btn.textContent = carState.isPowerOn ? 'ON' : 'OFF';
    btn.classList.toggle('on', carState.isPowerOn);
    
    if (carState.isPowerOn) {
        playSound('powerOn');
        startSpeedSimulation();
    } else {
        stopSpeedSimulation();
    }
}

let speedInterval;
function startSpeedSimulation() {
    speedInterval = setInterval(() => {
        if (!carState.isPowerOn) return;
        let target = { sport: 120, normal: 80, eco: 60 }[carState.driveMode];
        if (carState.speed < target) carState.speed += 2;
        else carState.speed = target + Math.floor(Math.random() * 5 - 2);
        document.getElementById('main-speed').textContent = carState.speed;
    }, 100);
}

function stopSpeedSimulation() {
    clearInterval(speedInterval);
    let stopInt = setInterval(() => {
        if (carState.speed > 0) {
            carState.speed -= 5;
            document.getElementById('main-speed').textContent = Math.max(0, carState.speed);
        } else clearInterval(stopInt);
    }, 50);
}

function switchTab(tab) {
    playSound('click');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');
}

function locateCar() { 
    playSound('click');
    alert('موقع السيارة: الرياض، المملكة العربية السعودية'); 
}

function openChargingScheduler() { 
    playSound('click');
    const m = document.getElementById('charging-scheduler');
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
}

function saveSchedule() { 
    playSound('click');
    alert('تم حفظ جدول الشحن'); 
    document.getElementById('charging-scheduler').style.display = 'none'; 
}

function setDriveMode(mode) {
    playSound('click');
    carState.driveMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    updateDashboard();
}

function toggleEcoSave() {
    playSound('click');
    carState.ecoSave = document.getElementById('eco-save-toggle').checked;
    carState.ecoEfficiency = carState.ecoSave ? 1.25 : 1.0;
    alert(carState.ecoSave ? 'تفعيل توفير الطاقة: زيادة المدى 25%' : 'إيقاف توفير الطاقة');
    updateDashboard();
}

function resetCar() { 
    playSound('click');
    location.reload(); 
}

function toggleMenu() { 
    playSound('click');
    alert('SolarShift v2.2\nنظام إدارة الطاقة الذكي'); 
}

// نظام الألواح الشمسية الأربعة
const solarPanels = [
    { id: 1, name: 'اللوح الأول', efficiency: 95, charge: 100, maxCharge: 100 },
    { id: 2, name: 'اللوح الثاني', efficiency: 88, charge: 100, maxCharge: 100 },
    { id: 3, name: 'اللوح الثالث', efficiency: 72, charge: 100, maxCharge: 100 },
    { id: 4, name: 'اللوح الرابع', efficiency: 65, charge: 100, maxCharge: 100 }
];

let activePanelIndex = 0;
let batteryMode = false;
let simulationRunning = false;

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
    schedule: { start: '00:00', end: '06:00' },
    batteryCharge: 100,
    batteryMaxCharge: 100
};

// إعداد النظام الصوتي
const sounds = {
    battery: new Audio('sounds/battery-install.wav'),
    motor: new Audio('sounds/motor-install.wav'),
    solar: new Audio('sounds/solar-install.wav'),
    powerOn: new Audio('sounds/motor-install.wav'),
    click: new Audio('sounds/battery-install.wav')
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

// ========================================
// وظائف نظام الألواح الشمسية
// ========================================

function updateSolarPanelsUI() {
    const panelsContainer = document.getElementById('solar-panels-container');
    if (!panelsContainer) return;
    
    panelsContainer.innerHTML = '';
    
    solarPanels.forEach((panel, index) => {
        const panelCard = document.createElement('div');
        panelCard.className = `solar-panel-card ${index === activePanelIndex ? 'active' : ''} ${panel.charge === 0 ? 'depleted' : ''}`;
        
        const efficiencyColor = panel.efficiency >= 80 ? '#10b981' : panel.efficiency >= 60 ? '#3b82f6' : panel.efficiency >= 40 ? '#f59e0b' : '#ef4444';
        
        panelCard.innerHTML = `
            <div class="panel-header">
                <div class="panel-name">${panel.name}</div>
                ${index === activePanelIndex ? '<span class="active-badge">نشط</span>' : ''}
            </div>
            <div class="panel-charge-circle">
                <svg viewBox="0 0 120 120" class="charge-svg">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#333" stroke-width="8"/>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="${efficiencyColor}" stroke-width="8" 
                            stroke-dasharray="${(panel.charge / 100) * 314} 314" stroke-linecap="round" class="charge-progress"/>
                </svg>
                <div class="charge-text">
                    <div class="charge-value">${panel.charge}%</div>
                    <div class="charge-label">الشحن</div>
                </div>
            </div>
            <div class="panel-efficiency">
                <div class="efficiency-label">الكفاءة</div>
                <div class="efficiency-bar">
                    <div class="efficiency-fill" style="width: ${panel.efficiency}%; background-color: ${efficiencyColor};"></div>
                </div>
                <div class="efficiency-value">${panel.efficiency}%</div>
            </div>
            <div class="panel-status">
                ${panel.charge === 0 ? '<span class="status-depleted">✓ تم استنزاف الشحن</span>' : '<span class="status-active">يعمل بكفاءة</span>'}
            </div>
        `;
        
        panelsContainer.appendChild(panelCard);
    });
}

function updateBatteryUI() {
    const batteryContainer = document.getElementById('battery-container');
    if (!batteryContainer) return;
    
    const batteryColor = carState.batteryCharge >= 70 ? '#10b981' : carState.batteryCharge >= 40 ? '#3b82f6' : carState.batteryCharge >= 20 ? '#f59e0b' : '#ef4444';
    
    batteryContainer.innerHTML = `
        <div class="battery-card ${batteryMode ? 'active' : ''}">
            <div class="battery-header">
                <div class="battery-name">البطارية الاحتياطية</div>
                ${batteryMode ? '<span class="active-badge">نشطة</span>' : ''}
            </div>
            <div class="battery-charge-circle">
                <svg viewBox="0 0 120 120" class="charge-svg">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#333" stroke-width="8"/>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="${batteryColor}" stroke-width="8" 
                            stroke-dasharray="${(carState.batteryCharge / 100) * 314} 314" stroke-linecap="round" class="charge-progress"/>
                </svg>
                <div class="charge-text">
                    <div class="charge-value">${carState.batteryCharge}%</div>
                    <div class="charge-label">الشحن</div>
                </div>
            </div>
            <div class="battery-status">
                ${batteryMode ? '<span class="status-active">البطارية توفر الطاقة الآن</span>' : '<span class="status-standby">في وضع الانتظار</span>'}
            </div>
        </div>
    `;
}

function switchToNextPanel() {
    if (activePanelIndex < solarPanels.length - 1) {
        activePanelIndex++;
        console.log(`تم التبديل إلى ${solarPanels[activePanelIndex].name}`);
        updateSolarPanelsUI();
    } else {
        // جميع الألواح انتهت، انتقل للبطارية
        batteryMode = true;
        console.log('تم تفعيل البطارية الاحتياطية');
        updateBatteryUI();
    }
}

function startPanelSimulation() {
    if (simulationRunning) return;
    simulationRunning = true;
    
    const simulationInterval = setInterval(() => {
        if (!simulationRunning) {
            clearInterval(simulationInterval);
            return;
        }
        
        if (!batteryMode) {
            // تقليل شحن اللوح الحالي
            solarPanels[activePanelIndex].charge -= 2;
            
            if (solarPanels[activePanelIndex].charge <= 0) {
                solarPanels[activePanelIndex].charge = 0;
                switchToNextPanel();
            }
        } else {
            // تقليل شحن البطارية
            carState.batteryCharge -= 1;
            if (carState.batteryCharge <= 0) {
                carState.batteryCharge = 0;
                stopPanelSimulation();
                alert('⚠️ تم استنزاف جميع مصادر الطاقة!');
            }
        }
        
        updateSolarPanelsUI();
        updateBatteryUI();
    }, 500);
}

function stopPanelSimulation() {
    simulationRunning = false;
}

function resetPanelSystem() {
    solarPanels.forEach(panel => {
        panel.charge = 100;
    });
    activePanelIndex = 0;
    batteryMode = false;
    carState.batteryCharge = 100;
    simulationRunning = false;
    updateSolarPanelsUI();
    updateBatteryUI();
}

// ========================================
// وظائف السحب والإفلات والنقر
// ========================================

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
if (dropZone) {
    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const partType = e.dataTransfer.getData('text/plain');
        if (partType) addPartToCar(partType);
    });
}

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
    
    if (!carState.hasMotor) {
        currentPollution = 100; 
    } else {
        currentPollution = 100 - electricPartsEffect.motor.pollutionReduction;
        
        if (carState.hasBattery) {
            currentPollution -= electricPartsEffect.battery.pollutionReduction;
        }
        
        if (carState.hasSolar) {
            currentPollution -= electricPartsEffect.solar.pollutionReduction;
        }
    }

    if (carState.hasSolar) {
        if (carState.hasBattery) {
            currentRange += electricPartsEffect.solar.rangeBoost;
            currentMonthlyCost = 0;
        }
    }

    if (carState.driveMode === 'sport') currentRange *= 0.7;
    else if (carState.driveMode === 'eco') currentRange *= 1.2;
    currentRange *= carState.ecoEfficiency;

    currentPollution = Math.max(0, currentPollution);
    
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

    const carContainer = document.querySelector('.car-container');
    if (carContainer) {
        if (!carState.hasBattery && !carState.hasMotor && !carState.hasSolar) {
            carContainer.classList.add('gas-mode');
        } else {
            carContainer.classList.remove('gas-mode');
        }
    }

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

function startTestDrive() {
    playSound('click');
    const isElectric = carState.hasBattery && carState.hasMotor && carState.hasSolar;
    window.location.href = `test-drive.html?electric=${isElectric}`;
}

function createCarbonParticles() {
    if (carState.carbonLevel === 0 || (carState.hasBattery && carState.hasMotor && carState.hasSolar)) return;
    
    const carImage = document.querySelector('.car-image:not([style*="display: none"])');
    if (!carImage) return;
    
    const rect = carImage.getBoundingClientRect();
    const particleCount = Math.ceil(carState.carbonLevel / 40);

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'carbon-particle';
        const dot = document.createElement('div');
        dot.className = 'particle-dot';
        
        const exhaustX = rect.right - (rect.width * 0.85); 
        const exhaustY = rect.bottom - (rect.height * 0.35); 
        
        particle.style.left = exhaustX + 'px';
        particle.style.top = exhaustY + 'px';
        dot.style.setProperty('--drift', ((Math.random() - 0.5) * 60) + 'px');
        
        particle.appendChild(dot);
        document.body.appendChild(particle);
        setTimeout(() => { if (particle.parentNode) particle.remove(); }, 4000);
    }
}

setInterval(createCarbonParticles, 200);

function hideAllParts() {
    document.getElementById('batteryPack').style.display = 'none';
    document.getElementById('electricMotor').style.display = 'none';
    document.getElementById('solarRoof').style.display = 'none';
}

function startTest() {
    const state = {
        isElectric: carState.hasBattery && carState.hasMotor && carState.hasSolar,
        pollution: carState.carbonLevel
    };
    localStorage.setItem('solarshift_car_state', JSON.stringify(state));
    window.open('test-drive.html', '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    updateSolarPanelsUI();
    updateBatteryUI();
});

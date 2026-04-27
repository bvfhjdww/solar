// نظام الألواح الشمسية الأربعة مع البيانات المتقدمة
const solarPanels = [
    { 
        id: 1, 
        name: 'اللوح الأول', 
        efficiency: 95, 
        charge: 100, 
        maxCharge: 100,
        lifespan: 25,
        remainingLife: 24,
        distanceCovered: 1250,
        temperature: 45,
        healthStatus: 'ممتاز',
        installationDate: '2024-01-15',
        powerOutput: 450
    },
    { 
        id: 2, 
        name: 'اللوح الثاني', 
        efficiency: 88, 
        charge: 100, 
        maxCharge: 100,
        lifespan: 25,
        remainingLife: 23,
        distanceCovered: 980,
        temperature: 52,
        healthStatus: 'جيد جداً',
        installationDate: '2024-02-10',
        powerOutput: 380
    },
    { 
        id: 3, 
        name: 'اللوح الثالث', 
        efficiency: 72, 
        charge: 100, 
        maxCharge: 100,
        lifespan: 25,
        remainingLife: 22,
        distanceCovered: 650,
        temperature: 58,
        healthStatus: 'جيد',
        installationDate: '2024-03-05',
        powerOutput: 320
    },
    { 
        id: 4, 
        name: 'اللوح الرابع', 
        efficiency: 65, 
        charge: 100, 
        maxCharge: 100,
        lifespan: 25,
        remainingLife: 20,
        distanceCovered: 420,
        temperature: 65,
        healthStatus: 'مقبول',
        installationDate: '2024-04-12',
        powerOutput: 280
    }
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
// وظائف نظام الألواح الشمسية المحدثة
// ========================================

function updateSolarPanelsUI() {
    const panelsContainer = document.getElementById('solar-panels-container');
    if (!panelsContainer) return;
    
    panelsContainer.innerHTML = '';
    
    solarPanels.forEach((panel, index) => {
        const panelCard = document.createElement('div');
        panelCard.className = `solar-panel-card ${index === activePanelIndex ? 'active' : ''} ${panel.charge === 0 ? 'depleted' : ''}`;
        
        const efficiencyColor = panel.efficiency >= 80 ? '#10b981' : panel.efficiency >= 60 ? '#3b82f6' : panel.efficiency >= 40 ? '#f59e0b' : '#ef4444';
        const healthColor = panel.healthStatus === 'ممتاز' ? '#10b981' : panel.healthStatus === 'جيد جداً' ? '#3b82f6' : panel.healthStatus === 'جيد' ? '#f59e0b' : '#ef4444';
        const tempColor = panel.temperature <= 50 ? '#10b981' : panel.temperature <= 60 ? '#3b82f6' : '#f59e0b';
        
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
            <div class="panel-data-grid">
                <div class="panel-data-item">
                    <div class="data-label">العمر المتبقي</div>
                    <div class="data-value">${panel.remainingLife} سنة</div>
                </div>
                <div class="panel-data-item">
                    <div class="data-label">المسافة</div>
                    <div class="data-value">${panel.distanceCovered} كم</div>
                </div>
                <div class="panel-data-item">
                    <div class="data-label">الحرارة</div>
                    <div class="data-value" style="color: ${tempColor};">${panel.temperature}°C</div>
                </div>
                <div class="panel-data-item">
                    <div class="data-label">الحالة</div>
                    <div class="data-value" style="color: ${healthColor};">${panel.healthStatus}</div>
                </div>
                <div class="panel-data-item">
                    <div class="data-label">الإنتاج</div>
                    <div class="data-value">${panel.powerOutput} W</div>
                </div>
                <div class="panel-data-item">
                    <div class="data-label">التركيب</div>
                    <div class="data-value">${panel.installationDate}</div>
                </div>
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
        currentMonthlyCost -= electricPartsEffect.battery.chargingCost;
    }

    if (carState.hasMotor) {
        currentPollution -= electricPartsEffect.motor.pollutionReduction;
    }

    if (carState.hasSolar) {
        currentRange += electricPartsEffect.solar.rangeBoost;
        currentMonthlyCost -= electricPartsEffect.solar.chargingCostReduction;
        currentPollution -= electricPartsEffect.solar.pollutionReduction;
    }

    currentPollution = Math.max(0, currentPollution);

    // تحديث عرض البيانات
    document.getElementById('gas-monthly-fuel').textContent = baseGasoline.monthlyFuel + ' L';
    document.getElementById('gas-monthly-cost').textContent = (baseGasoline.monthlyFuel * baseGasoline.fuelPrice).toFixed(0) + ' SAR';
    document.getElementById('gas-monthly-carbon').textContent = baseGasoline.monthlyCarbon + ' Tons';

    document.getElementById('elec-battery-cap').textContent = currentBattery + '%';
    document.getElementById('elec-monthly-cost').textContent = Math.max(0, currentMonthlyCost).toFixed(0) + ' SAR';
    document.getElementById('elec-range').textContent = currentRange + ' KM';
    document.getElementById('elec-pollution').textContent = currentPollution + '%';

    carState.carbonLevel = currentPollution;

    if (carState.hasBattery && carState.hasMotor && carState.hasSolar) {
        document.querySelector('.container').classList.add('eco-mode');
        document.getElementById('ecoStatus').textContent = 'بيئة نظيفة ✓';
        document.getElementById('electricCar').style.display = 'block';
        document.getElementById('gasolineCar').style.opacity = '0';
        document.getElementById('electricCar').style.opacity = '1';
    } else {
        document.querySelector('.container').classList.remove('eco-mode');
        document.getElementById('ecoStatus').textContent = 'بيئة ملوثة';
        document.getElementById('electricCar').style.opacity = '0';
        document.getElementById('gasolineCar').style.opacity = '1';
    }

    updateReplacedParts();
}

function updateReplacedParts() {
    const container = document.getElementById('replacedPartsContainer');
    if (!container) return;

    if (carState.replacedParts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p class="empty-text">لم يتم استبدال أي قطع بعد</p></div>';
        return;
    }

    container.innerHTML = '';
    carState.replacedParts.forEach(partKey => {
        const partData = replacedPartsData[partKey];
        if (partData) {
            const card = document.createElement('div');
            card.className = 'replaced-part-card';
            card.innerHTML = `
                <img src="${partData.image}" alt="${partData.name}" class="replaced-part-image">
                <div class="replaced-part-name">${partData.name}</div>
                <div class="replaced-part-desc">${partData.desc}</div>
            `;
            container.appendChild(card);
        }
    });
}

function toggleCarPower() {
    carState.isPowerOn = !carState.isPowerOn;
    const btn = document.getElementById('carPowerBtn');
    btn.textContent = carState.isPowerOn ? 'ON' : 'OFF';
    btn.style.background = carState.isPowerOn ? 'rgba(0, 255, 136, 0.2)' : 'transparent';
}

function resetCar() {
    carState = {
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
    
    document.getElementById('solarRoof').style.display = 'none';
    document.getElementById('batteryPack').style.display = 'none';
    document.getElementById('electricMotor').style.display = 'none';
    document.getElementById('carPowerBtn').textContent = 'OFF';
    document.getElementById('carPowerBtn').style.background = 'transparent';
    document.querySelector('.container').classList.remove('eco-mode');
    
    updateDashboard();
}

function startTestDrive() {
    if (!carState.hasBattery || !carState.hasMotor || !carState.hasSolar) {
        alert('⚠️ يجب تركيب جميع القطع أولاً: البطارية، المحرك الكهربائي، والألواح الشمسية');
        return;
    }
    window.location.href = 'test-drive.html';
}

function locateCar() {
    alert('📍 تم تحديد موقع السيارة على الخريطة');
}

function openChargingScheduler() {
    const scheduler = document.getElementById('charging-scheduler');
    scheduler.style.display = scheduler.style.display === 'none' ? 'block' : 'none';
}

function saveSchedule() {
    const startTime = document.getElementById('charge-start-time').value;
    const endTime = document.getElementById('charge-end-time').value;
    carState.schedule = { start: startTime, end: endTime };
    alert(`✓ تم حفظ جدول الشحن: من ${startTime} إلى ${endTime}`);
    document.getElementById('charging-scheduler').style.display = 'none';
}

function toggleMenu() {
    alert('قائمة التطبيق');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

function setDriveMode(mode) {
    carState.driveMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function toggleEcoSave() {
    carState.ecoSave = document.getElementById('eco-save-toggle').checked;
}

// تهيئة الواجهة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateSolarPanelsUI();
    updateBatteryUI();
    updateDashboard();
});

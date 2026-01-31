// ============================================
// محاكي السيارات الشمسية - لوحة التحكم المتقدمة
// ============================================

let carState = {
    hasBattery: false,
    hasSolar: false,
    hasMotor: false,
    parts: [],
    isMoving: true,
    carbonLevel: 100,
    replacedParts: []
};

// البيانات المرجعية للبنزين (الحالة الأولية)
const baseGasoline = {
    monthlyFuel: 255, // لتر
    fuelPrice: 2.33, // ريال لكل لتر
    monthlyCarbon: 7.5, // طن
    pollution: 100 // %
};

// البيانات المرجعية للقطع الكهربائية
const electricPartsEffect = {
    battery: {
        capacity: 75, // kWh
        range: 400, // KM
        chargingCost: 45, // ريال شهرياً
        pollutionReduction: 40 // %
    },
    motor: {
        efficiencyBoost: 60, // %
        pollutionReduction: 40 // %
    },
    solar: {
        rangeBoost: 100, // KM
        chargingCostReduction: 45, // ريال (يصبح مجاني)
        pollutionReduction: 20 // %
    }
};

// بيانات القطع المستبدلة
const replacedPartsData = {
    gasoline_engine: { name: 'محرك البنزين V6', desc: 'استهلاك عالي وانبعاثات سامة', image: 'images/motor.jpg' },
    fuel_tank: { name: 'خزان وقود 70L', desc: 'خطر الاشتعال وتكلفة تعبئة عالية', image: 'images/battery.jpg' },
    exhaust_system: { name: 'نظام العادم', desc: 'المصدر الرئيسي لثاني أكسيد الكربون', image: 'images/motor.jpg' }
};

// ============================================
// وظائف السحب والإفلات
// ============================================

document.querySelectorAll('.part-card').forEach(part => {
    part.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', part.dataset.part);
    });
});

const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('drag-over'); });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const partType = e.dataTransfer.getData('text/plain');
    addPartToCar(partType);
});

// ============================================
// إضافة القطع وتحديث اللوحة
// ============================================

function addPartToCar(partType) {
    if (carState.parts.includes(partType)) return;

    carState.parts.push(partType);
    
    if (partType === 'battery') {
        carState.hasBattery = true;
        carState.replacedParts.push('fuel_tank');
        playSound('sounds/battery-install.wav');
        showPartOnCar('battery');
    } else if (partType === 'motor') {
        carState.hasMotor = true;
        carState.replacedParts.push('gasoline_engine');
        playSound('sounds/motor-install.wav');
        showPartOnCar('motor');
    } else if (partType === 'solar') {
        carState.hasSolar = true;
        carState.replacedParts.push('exhaust_system');
        playSound('sounds/solar-install.wav');
        showPartOnCar('solar');
    }

    updateDashboard();
}

function showPartOnCar(partType) {
    if (partType === 'battery') {
        document.getElementById('batteryPack').style.display = 'block';
    } else if (partType === 'motor') {
        document.getElementById('electricMotor').style.display = 'block';
    } else if (partType === 'solar') {
        document.getElementById('solarRoof').style.display = 'block';
    }
}

function hideAllParts() {
    document.getElementById('batteryPack').style.display = 'none';
    document.getElementById('electricMotor').style.display = 'none';
    document.getElementById('solarRoof').style.display = 'none';
}

function updateDashboard() {
    // 1. حساب إحصائيات الكهرباء
    let currentBattery = 0;
    let currentRange = 0;
    let currentChargingCost = 0;
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
        if (carState.hasBattery) currentRange += 50; // كفاءة المحرك تزيد المدى
    }

    if (carState.hasSolar) {
        currentPollution -= electricPartsEffect.solar.pollutionReduction;
        if (carState.hasBattery) {
            currentRange += electricPartsEffect.solar.rangeBoost;
            currentChargingCost = 0; // الشحن يصبح مجاني
            currentMonthlyCost = 0;
        }
    }

    // ضمان عدم نزول التلوث عن الصفر
    currentPollution = Math.max(0, currentPollution);
    carState.carbonLevel = currentPollution;

    // 2. تحديث واجهة عالم الكهرباء
    document.getElementById('elec-battery-cap').textContent = currentBattery + ' kWh';
    document.getElementById('elec-monthly-cost').textContent = Math.round(currentMonthlyCost) + ' SAR';
    document.getElementById('elec-range').textContent = currentRange + ' KM';
    document.getElementById('elec-pollution').textContent = currentPollution + '%';

    // 3. تحديث لوحة التوفير
    const gasMonthlyCost = baseGasoline.monthlyFuel * baseGasoline.fuelPrice;
    const monthlySaving = gasMonthlyCost - currentMonthlyCost;
    const annualSaving = monthlySaving * 12;
    const reductionPercent = 100 - currentPollution;
    const airPurity = reductionPercent;

    document.getElementById('annualSaving').textContent = Math.round(annualSaving).toLocaleString();
    document.getElementById('reductionPercent').textContent = reductionPercent + '%';
    document.getElementById('airPurity').textContent = airPurity + '%';

    // 4. تحديث القطع المستبدلة
    updateReplacedPartsUI();

    // 5. تحديث البيئة والسيارة
    const container = document.querySelector('.container');
    const ecoStatus = document.getElementById('ecoStatus');
    const gasolineCar = document.getElementById('gasolineCar');
    const electricCar = document.getElementById('electricCar');
    
    // تحديث لمعان السيارة بناءً على التلوث
    if (currentPollution < 100) {
        gasolineCar.classList.add('clean');
    } else {
        gasolineCar.classList.remove('clean');
    }

    // التبديل للنسخة الكهربائية الكاملة عند تركيب كل القطع
    if (carState.hasBattery && carState.hasMotor && carState.hasSolar) {
        gasolineCar.style.opacity = '0';
        setTimeout(() => {
            gasolineCar.style.display = 'none';
            electricCar.style.display = 'block';
            setTimeout(() => electricCar.style.opacity = '1', 50);
            hideAllParts(); // إخفاء القطع المنفصلة لأنها أصبحت جزءاً من صورة السيارة الجديدة
        }, 1000);
        
        container.classList.add('eco-mode');
        ecoStatus.textContent = 'بيئة نظيفة ونقية - سيارة كهربائية بالكامل';
    } else {
        container.classList.add('eco-mode');
        if (currentPollution <= 20) {
            container.classList.add('eco-mode');
            ecoStatus.textContent = 'بيئة نظيفة ونقية';
        } else {
            container.classList.remove('eco-mode');
            ecoStatus.textContent = 'بيئة ملوثة';
        }
    }
}

function updateReplacedPartsUI() {
    const container = document.getElementById('replacedPartsContainer');
    if (carState.replacedParts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p class="empty-text">لم تستبدل أي قطع حتى الآن</p></div>';
        return;
    }
    container.innerHTML = '';
    carState.replacedParts.forEach(key => {
        const data = replacedPartsData[key];
        const card = document.createElement('div');
        card.className = 'replaced-part-card';
        card.innerHTML = `
            <img src="${data.image}" class="replaced-part-image">
            <div class="part-name">${data.name}</div>
            <div class="part-desc">${data.desc}</div>
        `;
        container.appendChild(card);
    });
}

// ============================================
// جزيئات الكربون (تتبع السيارة)
// ============================================

function createCarbonParticles() {
    if (carState.carbonLevel === 0) return;
    const carImage = document.querySelector('.car-image');
    if (!carImage) return;
    const rect = carImage.getBoundingClientRect();
    const particleCount = Math.ceil(carState.carbonLevel / 40);

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'carbon-particle';
        const dot = document.createElement('div');
        dot.className = 'particle-dot';
        
        // موقع العادم (يسار الصورة خلف السيارة)
        const exhaustX = rect.left + (rect.width * 0.15); 
        const exhaustY = rect.top + (rect.height * 0.75); 
        
        particle.style.left = exhaustX + 'px';
        particle.style.top = exhaustY + 'px';
        dot.style.setProperty('--drift', ((Math.random() - 0.5) * 60) + 'px');
        
        particle.appendChild(dot);
        document.body.appendChild(particle);
        setTimeout(() => { if (particle.parentNode) particle.remove(); }, 4000);
    }
}

setInterval(createCarbonParticles, 200);

// ============================================
// وظائف إضافية
// ============================================

function playSound(path) {
    const audio = new Audio(path);
    audio.volume = 0.4;
    audio.play().catch(() => {});
}

function resetCar() {
    carState = { hasBattery: false, hasSolar: false, hasMotor: false, parts: [], isMoving: true, carbonLevel: 100, replacedParts: [] };
    
    const gasolineCar = document.getElementById('gasolineCar');
    const electricCar = document.getElementById('electricCar');
    
    electricCar.style.opacity = '0';
    setTimeout(() => {
        electricCar.style.display = 'none';
        gasolineCar.style.display = 'block';
        setTimeout(() => gasolineCar.style.opacity = '1', 50);
    }, 500);

    hideAllParts();
    updateDashboard();
}

function toggleInfo() {
    alert('محاكي التحول للكهرباء:\n\n1. قارن بين تكاليف البنزين والكهرباء شهرياً.\n2. اسحب القطع لتحويل السيارة.\n3. شاهد كيف تتحول البيئة من ملوثة إلى نقية.\n4. لاحظ التوفير المالي السنوي الضخم!');
}

document.addEventListener('DOMContentLoaded', updateDashboard);

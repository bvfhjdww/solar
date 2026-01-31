// ============================================
// محاكي السيارات الشمسية - نظام التحكم
// ============================================

// حالة السيارة
let carState = {
    hasBattery: false,
    hasSolar: false,
    hasMotor: false,
    parts: [],
    isMoving: true,
    carbonLevel: 100,
    replacedParts: [] // تتبع القطع المستبدلة
};

// الحالة الأولية للمقارنة
const initialState = {
    emissions: 250
};

// البيانات الإحصائية
const stats = {
    gasoline: {
        emissions: 250,
        consumption: 8.5,
        efficiency: 30,
        carbonLevel: 100,
        carType: 'GASOLINE'
    },
    hybrid: {
        emissions: 150,
        consumption: 5.2,
        efficiency: 55,
        carbonLevel: 60,
        carType: 'HYBRID'
    },
    electric: {
        emissions: 50,
        consumption: 0,
        efficiency: 85,
        carbonLevel: 20,
        carType: 'ELECTRIC'
    },
    solar: {
        emissions: 0,
        consumption: 0,
        efficiency: 100,
        carbonLevel: 0,
        carType: 'SOLAR POWERED'
    }
};

// بيانات القطع المستبدلة
const replacedPartsData = {
    gasoline_engine: {
        name: 'محرك البنزين',
        desc: 'محرك ملوث',
        image: 'images/motor.jpg'
    },
    fuel_tank: {
        name: 'خزان الوقود',
        desc: 'خزان بنزين',
        image: 'images/battery.jpg'
    },
    exhaust_system: {
        name: 'نظام العادم',
        desc: 'عادم ملوث',
        image: 'images/motor.jpg'
    }
};

// ============================================
// وظائف السحب والإفلات
// ============================================

let draggedElement = null;

document.querySelectorAll('.part-card').forEach(part => {
    part.addEventListener('dragstart', (e) => {
        draggedElement = part;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', part.dataset.part);
    });
});

const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const partType = e.dataTransfer.getData('text/plain');
    addPartToCar(partType);
});

// ============================================
// تشغيل الأصوات
// ============================================

function playSound(soundPath) {
    var audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch(function(error) {
        console.log('Audio playback failed:', error);
    });
}

// ============================================
// إضافة القطع إلى السيارة
// ============================================

function addPartToCar(partType) {
    if (carState.parts.includes(partType)) {
        return;
    }

    carState.parts.push(partType);

    // تسجيل القطع المستبدلة
    if (partType === 'battery') {
        carState.hasBattery = true;
        carState.replacedParts.push('fuel_tank');
        playSound('sounds/battery-install.wav');
    } else if (partType === 'solar') {
        carState.hasSolar = true;
        carState.replacedParts.push('exhaust_system');
        playSound('sounds/solar-install.wav');
    } else if (partType === 'motor') {
        carState.hasMotor = true;
        carState.replacedParts.push('gasoline_engine');
        playSound('sounds/motor-install.wav');
    }

    updateStats();
    updateReplacedParts();
    updateComparison();
    checkEcoMode();
}

// ============================================
// تحديث منطقة القطع المستبدلة
// ============================================

function updateReplacedParts() {
    const container = document.getElementById('replacedPartsContainer');
    
    if (carState.replacedParts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p class="empty-text">لم تستبدل أي قطع حتى الآن</p></div>';
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

// ============================================
// تحديث لوحة المقارنة
// ============================================

function updateComparison() {
    const currentStats = getCurrentStats();
    const reductionPercent = Math.round(((initialState.emissions - currentStats.emissions) / initialState.emissions) * 100);
    
    document.getElementById('initialEmissions').textContent = initialState.emissions;
    document.getElementById('currentEmissions').textContent = currentStats.emissions;
    document.getElementById('reductionPercent').textContent = reductionPercent + '%';
}

// ============================================
// التحقق من وضع Eco
// ============================================

function checkEcoMode() {
    const container = document.querySelector('.container');
    const currentStats = getCurrentStats();
    
    // تفعيل الوضع البيئي عند الوصول للكهرباء الكاملة
    if (currentStats.carType === 'SOLAR POWERED' || currentStats.carType === 'ELECTRIC') {
        container.classList.add('eco-mode');
    } else {
        container.classList.remove('eco-mode');
    }
}

// ============================================
// الحصول على الإحصائيات الحالية
// ============================================

function getCurrentStats() {
    let currentStats = stats.gasoline;

    if (carState.hasMotor && carState.hasSolar && carState.hasBattery) {
        currentStats = stats.solar;
    } else if (carState.hasMotor && carState.hasBattery) {
        currentStats = stats.electric;
    } else if (carState.hasBattery || carState.hasMotor) {
        currentStats = stats.hybrid;
    }

    return currentStats;
}

// ============================================
// تحديث الإحصائيات
// ============================================

function updateStats() {
    const currentStats = getCurrentStats();

    // تحديث القيم
    document.getElementById('carType').textContent = currentStats.carType;
    document.getElementById('emissions').textContent = currentStats.emissions + ' g/km';
    document.getElementById('carEfficiency').textContent = currentStats.efficiency + '%';
    document.getElementById('emissionsValue').textContent = currentStats.emissions;
    document.getElementById('consumptionValue').textContent = currentStats.consumption;
    document.getElementById('efficiencyValue').textContent = currentStats.efficiency;

    // تحديث الأشرطة
    const emissionsPercent = (currentStats.emissions / 250) * 100;
    const consumptionPercent = (currentStats.consumption / 8.5) * 100;
    const efficiencyPercent = currentStats.efficiency;

    document.getElementById('emissionsBar').style.width = (100 - emissionsPercent) + '%';
    document.getElementById('consumptionBar').style.width = (100 - consumptionPercent) + '%';
    document.getElementById('efficiencyValueBar').style.width = efficiencyPercent + '%';

    // تحديث ألوان الأشرطة
    updateBarColors(currentStats);

    // تخزين مستوى الكربون
    carState.carbonLevel = currentStats.carbonLevel;
}

function updateBarColors(currentStats) {
    const emissionsBar = document.getElementById('emissionsBar');
    const consumptionBar = document.getElementById('consumptionBar');
    const efficiencyBar = document.getElementById('efficiencyValueBar');

    emissionsBar.classList.remove('green', 'yellow');
    consumptionBar.classList.remove('green', 'yellow');
    efficiencyBar.classList.remove('green', 'yellow');

    if (currentStats.emissions === 0) {
        emissionsBar.classList.add('green');
    } else if (currentStats.emissions < 150) {
        emissionsBar.classList.add('yellow');
    }

    if (currentStats.consumption === 0) {
        consumptionBar.classList.add('green');
    } else if (currentStats.consumption < 5.2) {
        consumptionBar.classList.add('yellow');
    }

    if (currentStats.efficiency > 90) {
        efficiencyBar.classList.add('green');
    } else if (currentStats.efficiency > 50) {
        efficiencyBar.classList.add('yellow');
    }
}

// ============================================
// إنشاء جزيئات الكربون من الشكمان
// ============================================

function createCarbonParticles() {
    if (carState.carbonLevel === 0) return;

    // الحصول على حاوية السيارة لمعرفة موقعها الحالي بدقة
    const carImage = document.querySelector('.car-image');
    if (!carImage) return;

    const rect = carImage.getBoundingClientRect();
    
    // عدد الجزيئات بناءً على مستوى الكربون
    const particleCount = Math.ceil((carState.carbonLevel / 100) * 2);

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'carbon-particle';
        
        const dot = document.createElement('div');
        dot.className = 'particle-dot';
        
        // موقع الشكمان: الجانب الأيسر من السيارة (خلفها)
        // في الصورة، السيارة تتجه لليمين، لذا العادم في الخلف (يسار الصورة)
        const exhaustX = rect.left + (rect.width * 0.15); 
        const exhaustY = rect.top + (rect.height * 0.55); 
        
        particle.style.left = exhaustX + 'px';
        particle.style.top = exhaustY + 'px';
        
        // انجراف عشوائي بسيط لتنويع شكل الدخان
        const drift = (Math.random() - 0.5) * 60;
        dot.style.setProperty('--drift', drift + 'px');
        
        // حجم عشوائي بسيط للجزيئات
        const sizeScale = 0.8 + Math.random() * 0.5;
        dot.style.transform = `scale(${sizeScale})`;
        
        particle.appendChild(dot);
        document.body.appendChild(particle);
        
        // إزالة الجزيء بعد انتهاء الأنيميشن
        setTimeout(function() { 
            if (particle.parentNode) {
                particle.remove(); 
            }
        }, 4000);
    }
}

// ============================================
// حلقة الحركة والرسوم المتحركة
// ============================================

let lastParticleTime = 0;
const particleInterval = 150; // توليد جزيئات كل 150 مللي ثانية لسلاسة الدخان

function animationLoop(timestamp) {
    if (carState.isMoving) {
        if (timestamp - lastParticleTime > particleInterval) {
            createCarbonParticles();
            lastParticleTime = timestamp;
        }
    }
    
    requestAnimationFrame(animationLoop);
}

// بدء حلقة الرسوم المتحركة
requestAnimationFrame(animationLoop);

// ============================================
// إعادة التعيين
// ============================================

function resetCar() {
    carState = {
        hasBattery: false,
        hasSolar: false,
        hasMotor: false,
        parts: [],
        isMoving: true,
        carbonLevel: 100,
        replacedParts: []
    };

    // حذف الألواح الشمسية
    const solarPanelsContainer = document.getElementById('solarPanels');
    if (solarPanelsContainer) {
        solarPanelsContainer.innerHTML = '';
    }

    // إعادة تعيين الواجهة
    updateStats();
    updateReplacedParts();
    updateComparison();
    checkEcoMode();
}

// ============================================
// معلومات إضافية
// ============================================

function toggleInfo() {
    const infoText = 'محاكي السيارات الشمسية\n\nاسحب القطع التالية لتحسين السيارة:\n\n- البطارية: تحول السيارة إلى هايبرد\n- اللوح الشمسي: يقلل الانبعاثات\n- المحرك الكهربائي: تحويل كامل للكهرباء\n\nعندما تضيف القطع:\n- الكربون يختفي تدريجياً من الشكمان\n- الجو يبقى ملوث لكن الدخان يقل\n- الكفاءة تزداد\n- الانبعاثات تنخفض\n\nعند الوصول للطاقة الشمسية:\n- تتحول الخلفية لطبيعة خضراء\n- الانبعاثات تصبح صفر\n- السيارة تصبح صديقة للبيئة تماماً';
    
    alert(infoText);
}

// ============================================
// التهيئة
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    updateReplacedParts();
    updateComparison();
    console.log('تم تحميل محاكي السيارات الشمسية!');
});

// Storage Keys
const STORAGE_KEYS = {
    memories: 'japan_memories',
    photos: 'japan_photos',
    bloopers: 'japan_bloopers',
    places: 'japan_places',
    quizStats: 'japan_quiz_stats',
    potd: 'japan_photo_of_day'
};

// Tab Navigation
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Change background based on tab
            changeBackground(tabId);

            // Update archive when switching to archive tab
            if (tabId === 'archive') {
                loadArchiveContent('all');
            }
            
            // Update highlights when switching to highlights tab
            if (tabId === 'highlights') {
                generateHighlights();
            }
        });
    });
}

// Change background based on current section
function changeBackground(section) {
    const body = document.body;
    // Remove all background classes
    body.className = body.className.split(' ').filter(c => !c.startsWith('bg-')).join(' ');
    
    // Add appropriate background class
    const backgrounds = {
        'memories': 'bg-cherry',
        'travel': 'bg-tokyo',
        'routes': 'bg-fuji',
        'quiz': 'bg-neon',
        'photoftheday': 'bg-cherry',
        'highlights': 'bg-tokyo',
        'facts': 'bg-temple',
        'didyouknow': 'bg-kyoto',
        'bloopers': 'bg-neon',
        'archive': 'bg-bamboo'
    };
    
    if (backgrounds[section]) {
        body.classList.add(backgrounds[section]);
    }
}

// Initialize with default background
changeBackground('memories');

// Initialize with default background
document.addEventListener('DOMContentLoaded', function() {
    changeBackground('memories');
    initializeTabs();
    initializeUpload();
    initializeMemoryForm();
    initializeBlooperForm();
    initializeArchive();
    initializePlaces();
    initializeRouteInteraction();
    loadRecentMemories();
    updateArchiveStats();
    loadBloopers();
    loadSavedPlaces();
});

// Photo Upload
function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const photoInput = document.getElementById('photoInput');
    const photoGallery = document.getElementById('photoGallery');

    uploadArea.addEventListener('click', () => photoInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    photoInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    loadPhotos();
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                savePhoto(e.target.result);
                displayPhoto(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

function savePhoto(photoData) {
    const photos = getFromStorage(STORAGE_KEYS.photos) || [];
    photos.push({
        id: Date.now(),
        data: photoData,
        date: new Date().toISOString()
    });
    saveToStorage(STORAGE_KEYS.photos, photos);
    updateArchiveStats();
}

function loadPhotos() {
    const photos = getFromStorage(STORAGE_KEYS.photos) || [];
    const photoGallery = document.getElementById('photoGallery');
    photoGallery.innerHTML = '';
    photos.forEach(photo => displayPhoto(photo.data, photo.id));
}

function displayPhoto(photoData, photoId) {
    const photoGallery = document.getElementById('photoGallery');
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
        <img src="${photoData}" alt="Japan memory">
        <button class="photo-delete" onclick="deletePhoto(${photoId})">×</button>
    `;
    photoGallery.appendChild(photoItem);
}

function deletePhoto(photoId) {
    if (confirm('Delete this photo?')) {
        let photos = getFromStorage(STORAGE_KEYS.photos) || [];
        photos = photos.filter(p => p.id !== photoId);
        saveToStorage(STORAGE_KEYS.photos, photos);
        loadPhotos();
        updateArchiveStats();
    }
}

// Memory Form
function initializeMemoryForm() {
    const form = document.getElementById('memoryForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const memory = {
            id: Date.now(),
            title: document.getElementById('memoryTitle').value,
            type: document.getElementById('memoryType').value,
            text: document.getElementById('memoryText').value,
            date: document.getElementById('memoryDate').value,
            created: new Date().toISOString()
        };

        saveMemory(memory);
        form.reset();
        loadRecentMemories();
        updateArchiveStats();
        
        // Show success feedback
        alert('✨ Memory saved successfully!');
    });
}

function saveMemory(memory) {
    const memories = getFromStorage(STORAGE_KEYS.memories) || [];
    memories.unshift(memory);
    saveToStorage(STORAGE_KEYS.memories, memories);
}

function loadRecentMemories() {
    const memories = getFromStorage(STORAGE_KEYS.memories) || [];
    const recentMemories = document.getElementById('recentMemories');
    
    if (memories.length === 0) {
        recentMemories.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>No memories yet. Start capturing your Japan adventure!</p>
            </div>
        `;
        return;
    }

    recentMemories.innerHTML = memories.slice(0, 5).map(memory => `
        <div class="memory-card">
            <div class="memory-card-header">
                <h3>${memory.title}</h3>
                <span class="memory-type">${getMemoryTypeLabel(memory.type)}</span>
            </div>
            <p>${memory.text}</p>
            <p class="memory-date">📅 ${formatDate(memory.date)}</p>
            <div class="memory-actions">
                <button class="memory-delete" onclick="deleteMemory(${memory.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function deleteMemory(memoryId) {
    if (confirm('Delete this memory?')) {
        let memories = getFromStorage(STORAGE_KEYS.memories) || [];
        memories = memories.filter(m => m.id !== memoryId);
        saveToStorage(STORAGE_KEYS.memories, memories);
        loadRecentMemories();
        updateArchiveStats();
    }
}

function getMemoryTypeLabel(type) {
    const labels = {
        'best': '✨ Best Moment',
        'funny': '😄 Funny',
        'food': '🍜 Food',
        'culture': '⛩️ Culture',
        'adventure': '🎌 Adventure'
    };
    return labels[type] || type;
}

// Blooper Form
function initializeBlooperForm() {
    const form = document.getElementById('blooperForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const blooper = {
            id: Date.now(),
            title: document.getElementById('blooperTitle').value,
            text: document.getElementById('blooperText').value,
            date: new Date().toISOString()
        };

        saveBlooper(blooper);
        form.reset();
        loadBloopers();
        updateArchiveStats();
        
        alert('😂 Blooper added!');
    });
}

function saveBlooper(blooper) {
    const bloopers = getFromStorage(STORAGE_KEYS.bloopers) || [];
    bloopers.unshift(blooper);
    saveToStorage(STORAGE_KEYS.bloopers, bloopers);
}

function loadBloopers() {
    const bloopers = getFromStorage(STORAGE_KEYS.bloopers) || [];
    const bloopersList = document.getElementById('bloopersList');
    
    // Get existing example bloopers
    const examples = bloopersList.querySelectorAll('.example');
    
    const userBloopers = bloopers.map(blooper => `
        <div class="blooper-card">
            <button class="blooper-delete" onclick="deleteBlooper(${blooper.id})">×</button>
            <h3>${blooper.title}</h3>
            <p>${blooper.text}</p>
            <span class="blooper-date">${formatDate(blooper.date)}</span>
        </div>
    `).join('');
    
    // Keep examples and add user bloopers
    const examplesHTML = Array.from(examples).map(ex => ex.outerHTML).join('');
    bloopersList.innerHTML = userBloopers + examplesHTML;
}

function deleteBlooper(blooperId) {
    if (confirm('Delete this blooper?')) {
        let bloopers = getFromStorage(STORAGE_KEYS.bloopers) || [];
        bloopers = bloopers.filter(b => b.id !== blooperId);
        saveToStorage(STORAGE_KEYS.bloopers, bloopers);
        loadBloopers();
        updateArchiveStats();
    }
}

// Places Management
function initializePlaces() {
    // Save place buttons
    const savePlaceBtns = document.querySelectorAll('.save-place-btn');
    savePlaceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const placeCard = e.target.closest('.place-card');
            const place = {
                id: Date.now(),
                name: placeCard.querySelector('h3').textContent,
                category: placeCard.dataset.category,
                description: placeCard.querySelector('.place-description').textContent,
                link: placeCard.querySelector('.place-link')?.href || '',
                saved: new Date().toISOString()
            };
            savePlace(place);
            e.target.textContent = '✅ Saved';
            e.target.disabled = true;
            setTimeout(() => {
                e.target.textContent = '💾 Save';
                e.target.disabled = false;
            }, 2000);
        });
    });

    // View map buttons
    const viewMapBtns = document.querySelectorAll('.view-map-btn');
    viewMapBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const placeCard = e.target.closest('.place-card');
            const coords = placeCard.dataset.coords;
            const name = placeCard.querySelector('h3').textContent;
            if (coords) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${coords}`, '_blank');
            }
        });
    });
}

function savePlace(place) {
    const places = getFromStorage(STORAGE_KEYS.places) || [];
    places.unshift(place);
    saveToStorage(STORAGE_KEYS.places, places);
    loadSavedPlaces();
}

function loadSavedPlaces() {
    const places = getFromStorage(STORAGE_KEYS.places) || [];
    const savedPlacesList = document.getElementById('savedPlacesList');
    
    if (!savedPlacesList) return;
    
    if (places.length === 0) {
        savedPlacesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📍</div>
                <p>No saved places yet. Browse the travel guide and save your favorites!</p>
            </div>
        `;
        return;
    }

    savedPlacesList.innerHTML = places.map(place => `
        <div class="saved-place-card">
            <h4>${place.name}</h4>
            <span class="place-category-badge">${place.category}</span>
            <p>${place.description}</p>
            ${place.link ? `<a href="${place.link}" target="_blank" class="place-link">🔗 Visit Website</a>` : ''}
            <button class="place-delete-btn" onclick="deletePlace(${place.id})">🗑️ Remove</button>
        </div>
    `).join('');
}

function deletePlace(placeId) {
    if (confirm('Remove this place from saved?')) {
        let places = getFromStorage(STORAGE_KEYS.places) || [];
        places = places.filter(p => p.id !== placeId);
        saveToStorage(STORAGE_KEYS.places, places);
        loadSavedPlaces();
    }
}

// Archive
function initializeArchive() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadArchiveContent(btn.dataset.filter);
        });
    });

    document.getElementById('exportData').addEventListener('click', exportAllData);
    document.getElementById('clearData').addEventListener('click', clearAllData);
}

function updateArchiveStats() {
    const memories = getFromStorage(STORAGE_KEYS.memories) || [];
    const photos = getFromStorage(STORAGE_KEYS.photos) || [];
    const bloopers = getFromStorage(STORAGE_KEYS.bloopers) || [];

    document.getElementById('totalMemories').textContent = memories.length;
    document.getElementById('totalPhotos').textContent = photos.length;
    document.getElementById('totalBloopers').textContent = bloopers.length;
}

function loadArchiveContent(filter) {
    const memories = getFromStorage(STORAGE_KEYS.memories) || [];
    const archiveContent = document.getElementById('archiveContent');
    
    let filteredMemories = filter === 'all' 
        ? memories 
        : memories.filter(m => m.type === filter);

    if (filteredMemories.length === 0) {
        archiveContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>No memories found for this filter.</p>
            </div>
        `;
        return;
    }

    archiveContent.innerHTML = filteredMemories.map(memory => `
        <div class="memory-card">
            <div class="memory-card-header">
                <h3>${memory.title}</h3>
                <span class="memory-type">${getMemoryTypeLabel(memory.type)}</span>
            </div>
            <p>${memory.text}</p>
            <p class="memory-date">📅 ${formatDate(memory.date)}</p>
        </div>
    `).join('');
}

function exportAllData() {
    const data = {
        memories: getFromStorage(STORAGE_KEYS.memories) || [],
        photos: getFromStorage(STORAGE_KEYS.photos) || [],
        bloopers: getFromStorage(STORAGE_KEYS.bloopers) || [],
        places: getFromStorage(STORAGE_KEYS.places) || [],
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `japan-memories-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    alert('📥 Data exported successfully!');
}

function clearAllData() {
    if (confirm('⚠️ This will delete ALL your memories, photos, and bloopers. Are you sure?')) {
        if (confirm('This action cannot be undone. Continue?')) {
            localStorage.removeItem(STORAGE_KEYS.memories);
            localStorage.removeItem(STORAGE_KEYS.photos);
            localStorage.removeItem(STORAGE_KEYS.bloopers);
            localStorage.removeItem(STORAGE_KEYS.places);
            
            loadRecentMemories();
            loadPhotos();
            loadBloopers();
            loadSavedPlaces();
            updateArchiveStats();
            loadArchiveContent('all');
            
            alert('🗑️ All data cleared!');
        }
    }
}

// Utility Functions
function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error reading from storage:', e);
        return null;
    }
}

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to storage:', e);
        alert('Storage error. Your data might not be saved.');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Generate QR Code (simple text-based for demo)
function generateQRCode(text) {
    // Using Google Charts API for QR code generation
    return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(text)}`;
}

// Make functions globally available
window.deletePhoto = deletePhoto;
window.deleteMemory = deleteMemory;
window.deleteBlooper = deleteBlooper;
window.deletePlace = deletePlace;

// ===== MUSIC PLAYER =====
let musicPlaying = false;

function initializeMusic() {
    const bgMusic = document.getElementById('bgMusic');
    const volumeControl = document.getElementById('volumeControl');
    
    // Set initial volume (30%)
    if (bgMusic) {
        bgMusic.volume = 0.3;
        
        if (volumeControl) {
            volumeControl.addEventListener('input', (e) => {
                bgMusic.volume = e.target.value / 100;
            });
        }
    }
}

function toggleMusic() {
    const bgMusic = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    const musicControls = document.getElementById('musicControls');
    const musicStatus = musicToggle.querySelector('.music-status');
    
    if (!bgMusic) return;
    
    if (musicPlaying) {
        bgMusic.pause();
        musicToggle.classList.remove('playing');
        musicStatus.textContent = 'Play Music';
        musicControls.style.display = 'none';
        musicPlaying = false;
    } else {
        bgMusic.play().catch(e => {
            console.log('Audio playback failed:', e);
            alert('Unable to play music. Please check your browser settings.');
        });
        musicToggle.classList.add('playing');
        musicStatus.textContent = 'Pause Music';
        musicControls.style.display = 'flex';
        musicPlaying = true;
    }
}

window.toggleMusic = toggleMusic;

// ===== QUIZ SYSTEM =====
const quizData = {
    tokyo: {
        title: "Tokyo Quiz 🗼",
        questions: [
            {
                question: "What is the name of Tokyo's famous scramble crossing?",
                options: ["Shinjuku Crossing", "Shibuya Crossing", "Harajuku Crossing", "Akihabara Crossing"],
                correct: 1,
                explanation: "Shibuya Crossing is one of the world's busiest pedestrian crossings, with up to 3,000 people crossing at once!"
            },
            {
                question: "Which Tokyo district is known as 'Electric Town' for its electronics shops?",
                options: ["Akihabara", "Ginza", "Roppongi", "Odaiba"],
                correct: 0,
                explanation: "Akihabara is famous for electronics, anime, and manga shops, attracting tech enthusiasts worldwide."
            },
            {
                question: "What is the tallest structure in Tokyo?",
                options: ["Tokyo Tower", "Tokyo Skytree", "Mode Gakuen Cocoon Tower", "Tokyo Metropolitan Government Building"],
                correct: 1,
                explanation: "Tokyo Skytree stands at 634 meters, making it the tallest structure in Japan and the world's tallest tower."
            },
            {
                question: "Which famous fish market relocated from Tsukiji in 2018?",
                options: ["Ameya-Yokocho", "Toyosu Market", "Nishiki Market", "Kuromon Market"],
                correct: 1,
                explanation: "The famous Tsukiji fish market relocated to Toyosu in 2018, though the outer market remains at Tsukiji."
            },
            {
                question: "How many train stations does Tokyo have?",
                options: ["Around 50", "Around 150", "Around 300", "Over 900"],
                correct: 3,
                explanation: "Tokyo has over 900 train stations across its various rail networks!"
            }
        ]
    },
    kyoto: {
        title: "Kyoto Quiz ⛩️",
        questions: [
            {
                question: "How many UNESCO World Heritage Sites does Kyoto have?",
                options: ["5", "10", "17", "25"],
                correct: 2,
                explanation: "Kyoto has 17 UNESCO World Heritage Sites, including temples, shrines, and castles!"
            },
            {
                question: "What is the name of Kyoto's famous bamboo grove?",
                options: ["Arashiyama", "Fushimi", "Gion", "Kinkaku"],
                correct: 0,
                explanation: "The Arashiyama Bamboo Grove is one of Kyoto's most photographed locations."
            },
            {
                question: "Which Kyoto temple is covered in gold leaf?",
                options: ["Kiyomizu-dera", "Kinkaku-ji", "Ryoan-ji", "Ginkaku-ji"],
                correct: 1,
                explanation: "Kinkaku-ji, the Golden Pavilion, is covered in gold leaf and reflects beautifully in the surrounding pond."
            },
            {
                question: "How many torii gates are at Fushimi Inari Shrine?",
                options: ["100", "1,000", "10,000", "Over 10,000"],
                correct: 3,
                explanation: "Fushimi Inari has over 10,000 vermillion torii gates donated by individuals and businesses."
            },
            {
                question: "What is the traditional entertainment district in Kyoto called?",
                options: ["Gion", "Pontocho", "Kiyamachi", "Sanjo"],
                correct: 0,
                explanation: "Gion is Kyoto's most famous geisha district, where you might spot geiko and maiko."
            }
        ]
    },
    food: {
        title: "Japanese Food Quiz 🍜",
        questions: [
            {
                question: "What does 'ramen' literally mean in Japanese?",
                options: ["Pulled noodles", "Soup noodles", "Long noodles", "Fast noodles"],
                correct: 0,
                explanation: "Ramen (拉麺) literally means 'pulled noodles,' referring to the hand-pulling technique."
            },
            {
                question: "Which of these is NOT a type of sushi?",
                options: ["Nigiri", "Maki", "Tempura", "Sashimi"],
                correct: 2,
                explanation: "Tempura is battered and deep-fried seafood or vegetables, not a type of sushi."
            },
            {
                question: "What is the traditional Japanese rice wine called?",
                options: ["Soju", "Sake", "Shochu", "Mirin"],
                correct: 1,
                explanation: "Sake (日本酒) is traditional Japanese rice wine, brewed through fermentation."
            },
            {
                question: "What type of noodles are used in yakisoba?",
                options: ["Udon", "Soba", "Ramen", "Somen"],
                correct: 2,
                explanation: "Despite its name, yakisoba is made with wheat ramen noodles, not buckwheat soba!"
            },
            {
                question: "What is the name of the pufferfish delicacy that must be prepared by licensed chefs?",
                options: ["Fugu", "Unagi", "Tai", "Maguro"],
                correct: 0,
                explanation: "Fugu (pufferfish) contains lethal toxins and must be prepared by specially licensed chefs."
            }
        ]
    },
    culture: {
        title: "Japanese Culture Quiz 🎌",
        questions: [
            {
                question: "What do you say before eating in Japan?",
                options: ["Arigato", "Itadakimasu", "Konnichiwa", "Sumimasen"],
                correct: 1,
                explanation: "Itadakimasu (いただきます) expresses gratitude before eating."
            },
            {
                question: "What is the traditional Japanese art of flower arrangement called?",
                options: ["Ikebana", "Origami", "Bonsai", "Sumi-e"],
                correct: 0,
                explanation: "Ikebana is the Japanese art of flower arrangement, emphasizing harmony and balance."
            },
            {
                question: "What do people do at shrines to purify themselves?",
                options: ["Ring a bell", "Wash hands and mouth", "Bow twice", "Clap hands"],
                correct: 1,
                explanation: "Visitors purify themselves at the temizuya by washing hands and rinsing their mouth."
            },
            {
                question: "What is the Japanese tea ceremony called?",
                options: ["Chanoyu", "Sencha", "Matcha", "Hojicha"],
                correct: 0,
                explanation: "Chanoyu (茶の湯) or 'the way of tea' is a ritualized ceremony."
            },
            {
                question: "How many times should you bow when visiting a shrine?",
                options: ["Once", "Twice", "Three times", "Four times"],
                correct: 1,
                explanation: "The standard shrine etiquette is: bow twice, clap twice, bow once more."
            }
        ]
    },
    general: {
        title: "General Japan Quiz 🇯🇵",
        questions: [
            {
                question: "What is Japan's national flower?",
                options: ["Rose", "Cherry Blossom", "Chrysanthemum", "Lotus"],
                correct: 2,
                explanation: "While cherry blossoms are iconic, the chrysanthemum is Japan's official national flower."
            },
            {
                question: "Which is Japan's oldest company, founded in 578 AD?",
                options: ["Nintendo", "Mitsubishi", "Kongo Gumi", "Tanaka"],
                correct: 2,
                explanation: "Kongo Gumi, a construction company, was founded in 578 AD and operated for over 1,400 years!"
            },
            {
                question: "What percentage of Japan is covered by forests?",
                options: ["33%", "50%", "67%", "80%"],
                correct: 2,
                explanation: "About 67% of Japan is covered by forests, one of the most forested developed countries."
            },
            {
                question: "What is the name of Japan's imperial family residence in Tokyo?",
                options: ["Imperial Palace", "Edo Castle", "Tokyo Castle", "Royal Palace"],
                correct: 0,
                explanation: "The Imperial Palace in Tokyo serves as the primary residence of the Emperor."
            },
            {
                question: "How many active volcanoes does Japan have?",
                options: ["25", "50", "110", "200"],
                correct: 2,
                explanation: "Japan has about 110 active volcanoes, sitting on the Pacific 'Ring of Fire.'"
            }
        ]
    }
};

let currentQuiz = null;
let currentQuestionIndex = 0;
let quizScore = 0;
let quizAnswers = [];

function initializeQuiz() {
    loadQuizStats();
}

function startQuiz(quizType) {
    currentQuiz = quizData[quizType];
    currentQuestionIndex = 0;
    quizScore = 0;
    quizAnswers = [];
    
    document.getElementById('quizIntro').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'block';
    document.getElementById('quizResults').style.display = 'none';
    
    document.getElementById('quizTitle').textContent = currentQuiz.title;
    document.getElementById('totalQuestions').textContent = currentQuiz.questions.length;
    
    showQuestion();
}

function showQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    
    document.getElementById('questionNumber').textContent = `Question ${currentQuestionIndex + 1}`;
    document.getElementById('questionText').textContent = question.question;
    
    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = question.options.map((option, index) => `
        <button class="option-btn" onclick="selectAnswer(${index})">${option}</button>
    `).join('');
    
    document.getElementById('quizFeedback').style.display = 'none';
    document.getElementById('nextQuestionBtn').style.display = 'none';
    document.getElementById('finishQuizBtn').style.display = 'none';
}

function selectAnswer(selectedIndex) {
    const question = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;
    
    if (isCorrect) {
        quizScore++;
    }
    
    quizAnswers.push({
        question: question.question,
        selected: selectedIndex,
        correct: question.correct,
        isCorrect: isCorrect
    });
    
    // Disable all options
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correct) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Show feedback
    const feedbackEl = document.getElementById('quizFeedback');
    const feedbackText = document.getElementById('feedbackText');
    feedbackText.textContent = question.explanation;
    feedbackEl.style.display = 'block';
    
    // Show appropriate button
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        document.getElementById('nextQuestionBtn').style.display = 'inline-block';
    } else {
        document.getElementById('finishQuizBtn').style.display = 'inline-block';
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    showQuestion();
}

function finishQuiz() {
    const totalQuestions = currentQuiz.questions.length;
    const percentage = Math.round((quizScore / totalQuestions) * 100);
    
    // Update quiz stats
    saveQuizResult(percentage);
    
    // Show results
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('quizResults').style.display = 'block';
    
    document.getElementById('finalScore').textContent = `${percentage}%`;
    document.getElementById('correctAnswers').textContent = quizScore;
    document.getElementById('incorrectAnswers').textContent = totalQuestions - quizScore;
    
    let message = '';
    if (percentage === 100) {
        message = '🎉 Perfect score! You\'re a Japan expert!';
    } else if (percentage >= 80) {
        message = '🌟 Excellent work! You know your Japan!';
    } else if (percentage >= 60) {
        message = '👍 Good job! Keep learning!';
    } else {
        message = '📚 Keep exploring and learning about Japan!';
    }
    
    document.getElementById('resultsMessage').textContent = message;
    loadQuizStats();
}

function resetQuiz() {
    currentQuiz = null;
    showQuizIntro();
}

function showQuizIntro() {
    document.getElementById('quizIntro').style.display = 'block';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('quizResults').style.display = 'none';
}

function saveQuizResult(percentage) {
    const stats = getFromStorage(STORAGE_KEYS.quizStats) || {
        totalQuizzes: 0,
        totalScore: 0,
        bestScore: 0,
        results: []
    };
    
    stats.totalQuizzes++;
    stats.totalScore += percentage;
    stats.bestScore = Math.max(stats.bestScore, percentage);
    stats.results.push({
        quiz: currentQuiz.title,
        score: percentage,
        date: new Date().toISOString()
    });
    
    saveToStorage(STORAGE_KEYS.quizStats, stats);
}

function loadQuizStats() {
    const stats = getFromStorage(STORAGE_KEYS.quizStats) || {
        totalQuizzes: 0,
        totalScore: 0,
        bestScore: 0
    };
    
    document.getElementById('totalQuizzes').textContent = stats.totalQuizzes;
    document.getElementById('avgScore').textContent = stats.totalQuizzes > 0 
        ? `${Math.round(stats.totalScore / stats.totalQuizzes)}%` 
        : '0%';
    document.getElementById('bestScore').textContent = `${stats.bestScore}%`;
}

window.startQuiz = startQuiz;
window.selectAnswer = selectAnswer;
window.nextQuestion = nextQuestion;
window.finishQuiz = finishQuiz;
window.resetQuiz = resetQuiz;
window.showQuizIntro = showQuizIntro;

// ===== PHOTO OF THE DAY =====
function initializePOTD() {
    const potdForm = document.getElementById('potdForm');
    const potdUploadArea = document.getElementById('potdUploadArea');
    const potdPhotoInput = document.getElementById('potdPhotoInput');
    const potdDate = document.getElementById('potdDate');
    
    // Set today's date as default
    if (potdDate) {
        potdDate.valueAsDate = new Date();
    }
    
    if (potdUploadArea && potdPhotoInput) {
        potdUploadArea.addEventListener('click', () => potdPhotoInput.click());
        
        potdPhotoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('potdPreviewImg').src = event.target.result;
                    document.getElementById('potdPreview').style.display = 'block';
                    potdUploadArea.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (potdForm) {
        potdForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePOTD();
        });
    }
    
    loadPOTDGallery();
}

function changePotdPhoto() {
    document.getElementById('potdUploadArea').style.display = 'block';
    document.getElementById('potdPreview').style.display = 'none';
    document.getElementById('potdPhotoInput').value = '';
}

function savePOTD() {
    const photoSrc = document.getElementById('potdPreviewImg').src;
    if (!photoSrc || photoSrc === '') {
        alert('Please select a photo!');
        return;
    }
    
    const potd = {
        id: Date.now(),
        date: document.getElementById('potdDate').value,
        location: document.getElementById('potdLocation').value,
        photo: photoSrc,
        caption: document.getElementById('potdCaption').value,
        tags: document.getElementById('potdTags').value.split(',').map(t => t.trim()).filter(t => t),
        created: new Date().toISOString()
    };
    
    const potds = getFromStorage(STORAGE_KEYS.potd) || [];
    potds.unshift(potd);
    saveToStorage(STORAGE_KEYS.potd, potds);
    
    // Reset form
    document.getElementById('potdForm').reset();
    document.getElementById('potdUploadArea').style.display = 'block';
    document.getElementById('potdPreview').style.display = 'none';
    document.getElementById('potdDate').valueAsDate = new Date();
    
    loadPOTDGallery();
    alert('📸 Photo of the day saved!');
}

function loadPOTDGallery() {
    const potds = getFromStorage(STORAGE_KEYS.potd) || [];
    const gallery = document.getElementById('potdGallery');
    
    if (!gallery) return;
    
    if (potds.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📸</div>
                <p>No photos of the day yet. Upload your first favorite!</p>
            </div>
        `;
        return;
    }
    
    gallery.innerHTML = potds.map((potd, index) => `
        <div class="potd-card ${index === 0 ? 'featured' : ''}">
            ${index === 0 ? '<div class="potd-badge">⭐ Latest</div>' : ''}
            <img src="${potd.photo}" alt="${potd.location}" class="potd-image">
            <div class="potd-content">
                <div class="potd-location">📍 ${potd.location}</div>
                <p class="potd-caption">${potd.caption}</p>
                ${potd.tags.length > 0 ? `
                    <div class="potd-tags">
                        ${potd.tags.map(tag => `<span class="potd-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <p class="potd-date">📅 ${formatDate(potd.date)}</p>
                <button class="potd-delete" onclick="deletePOTD(${potd.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function deletePOTD(potdId) {
    if (confirm('Delete this photo of the day?')) {
        let potds = getFromStorage(STORAGE_KEYS.potd) || [];
        potds = potds.filter(p => p.id !== potdId);
        saveToStorage(STORAGE_KEYS.potd, potds);
        loadPOTDGallery();
    }
}

window.changePotdPhoto = changePotdPhoto;
window.deletePOTD = deletePOTD;

// ===== HIGHLIGHTS PAGE =====
function generateHighlights() {
    const memories = getFromStorage(STORAGE_KEYS.memories) || [];
    const photos = getFromStorage(STORAGE_KEYS.photos) || [];
    const potds = getFromStorage(STORAGE_KEYS.potd) || [];
    const bloopers = getFromStorage(STORAGE_KEYS.bloopers) || [];
    
    const highlightsContent = document.getElementById('highlightsContent');
    if (!highlightsContent) return;
    
    if (memories.length === 0 && photos.length === 0 && potds.length === 0) {
        highlightsContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✨</div>
                <p>Start capturing memories to see your trip highlights!</p>
            </div>
        `;
        return;
    }
    
    // Group memories by date
    const memoriesByDate = groupByDate(memories);
    const potdsByDate = groupByDate(potds);
    
    let highlightsHTML = '<div class="highlights-timeline">';
    
    // Get all unique dates
    const allDates = [...new Set([
        ...Object.keys(memoriesByDate),
        ...Object.keys(potdsByDate)
    ])].sort().reverse();
    
    allDates.forEach(date => {
        const dayMemories = memoriesByDate[date] || [];
        const dayPotd = potdsByDate[date] ? potdsByDate[date][0] : null;
        
        highlightsHTML += `
            <div class="highlight-day">
                <div class="day-header">
                    <h3>📅 ${formatDate(date)}</h3>
                </div>
                
                ${dayPotd ? `
                    <div class="highlight-potd">
                        <h4>⭐ Photo of the Day</h4>
                        <div class="highlight-potd-card">
                            <img src="${dayPotd.photo}" alt="${dayPotd.location}">
                            <div class="highlight-potd-info">
                                <p class="highlight-location">📍 ${dayPotd.location}</p>
                                <p class="highlight-caption">${dayPotd.caption}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${dayMemories.length > 0 ? `
                    <div class="highlight-memories">
                        <h4>✨ Memories from this day</h4>
                        <div class="highlight-memories-grid">
                            ${dayMemories.map(memory => `
                                <div class="highlight-memory-card">
                                    <span class="memory-type-badge">${getMemoryTypeLabel(memory.type)}</span>
                                    <h5>${memory.title}</h5>
                                    <p>${memory.text}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="highlight-stats">
                    ${dayMemories.length > 0 ? `<span class="stat-badge">📝 ${dayMemories.length} memories</span>` : ''}
                    ${dayPotd ? `<span class="stat-badge">📸 1 photo of the day</span>` : ''}
                </div>
            </div>
        `;
    });
    
    highlightsHTML += '</div>';
    
    // Add overall stats
    const bestMemories = memories.filter(m => m.type === 'best');
    const funnyMemories = memories.filter(m => m.type === 'funny');
    const foodMemories = memories.filter(m => m.type === 'food');
    
    highlightsHTML += `
        <div class="highlights-summary">
            <h3>🎊 Trip Summary</h3>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-icon">📝</div>
                    <div class="summary-value">${memories.length}</div>
                    <div class="summary-label">Total Memories</div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">📸</div>
                    <div class="summary-value">${photos.length + potds.length}</div>
                    <div class="summary-label">Photos Captured</div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">✨</div>
                    <div class="summary-value">${bestMemories.length}</div>
                    <div class="summary-label">Best Moments</div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">😂</div>
                    <div class="summary-value">${bloopers.length + funnyMemories.length}</div>
                    <div class="summary-label">Funny Moments</div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">🍜</div>
                    <div class="summary-value">${foodMemories.length}</div>
                    <div class="summary-label">Food Experiences</div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">📅</div>
                    <div class="summary-value">${allDates.length}</div>
                    <div class="summary-label">Days Documented</div>
                </div>
            </div>
        </div>
    `;
    
    highlightsContent.innerHTML = highlightsHTML;
}

function groupByDate(items) {
    const grouped = {};
    items.forEach(item => {
        const date = item.date || new Date(item.created).toISOString().split('T')[0];
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(item);
    });
    return grouped;
}

// Initialize route interaction
function initializeRouteInteraction() {
    // This function can be expanded for more route interactions
    console.log('Routes initialized');
}

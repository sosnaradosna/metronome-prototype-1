class Metronome {
    constructor() {
        // Pobieranie elementów UI
        this.tempoDisplay = document.querySelector('.tempo');
        this.tempoDial = document.querySelector('.tempo-dial');
        this.dialMarker = document.querySelector('.dial-marker');
        this.playStopBtn = document.querySelector('.play-stop');
        
        // Nowe elementy UI dla kontroli taktów
        this.playBarsCount = document.querySelector('.play-bars-count');
        this.playBarsIncreaseBtn = document.querySelector('.play-bars-increase');
        this.playBarsDecreaseBtn = document.querySelector('.play-bars-decrease');
        this.silentBarsCount = document.querySelector('.silent-bars-count');
        this.silentBarsIncreaseBtn = document.querySelector('.silent-bars-increase');
        this.silentBarsDecreaseBtn = document.querySelector('.silent-bars-decrease');
        
        // Nowe elementy UI dla automatycznej zmiany tempa
        this.tempoChangeBarsCount = document.querySelector('.tempo-change-bars-count');
        this.tempoChangeBarsIncreaseBtn = document.querySelector('.tempo-change-bars-increase');
        this.tempoChangeBarsDecreaseBtn = document.querySelector('.tempo-change-bars-decrease');
        this.tempoChangeValue = document.querySelector('.tempo-change-value');
        this.tempoChangeValueIncreaseBtn = document.querySelector('.tempo-change-value-increase');
        this.tempoChangeValueDecreaseBtn = document.querySelector('.tempo-change-value-decrease');
        
        // Nowe elementy UI dla akcentów
        this.beatsCount = document.querySelector('.beats-count');
        this.beatsCountIncreaseBtn = document.querySelector('.beats-count-increase');
        this.beatsCountDecreaseBtn = document.querySelector('.beats-count-decrease');
        this.accentBeats = document.querySelector('.accent-beats');
        
        // Ustawienia metronomu
        this.tempo = 100;
        this.isPlaying = false;
        this.intervalId = null;
        this.audioContext = null;
        
        // Dane dla obrotowego pokrętła
        this.isDragging = false;
        this.lastAngle = 0;
        this.currentRotation = 0;
        this.minTempo = 30;
        this.maxTempo = 240;
        this.tempoRange = this.maxTempo - this.minTempo;
        this.rotationFactor = 1.5; // Ile stopni rotacji = 1 BPM
        
        // Nowe ustawienia dla taktów
        this.playBars = 4;          // Ilość taktów grania
        this.silentBars = 0;        // Ilość taktów ciszy
        this.currentBar = 0;        // Licznik bieżącego taktu
        this.currentBeat = 0;       // Licznik bieżącego uderzenia w takcie
        this.beatsPerBar = 4;       // Liczba uderzeń na takt (domyślnie 4/4)
        this.isSilentMode = false;  // Czy jesteśmy w fazie ciszy
        
        // Nowe ustawienia dla automatycznej zmiany tempa
        this.tempoChangeBars = 0;    // Co ile taktów zmieniać tempo (0 = wyłączone)
        this.tempoChangeAmount = 5;  // O ile BPM zmieniać tempo
        this.tempoChangeCounter = 0; // Licznik taktów do następnej zmiany tempa
        this.initialTempo = this.tempo; // Zapamiętujemy początkowe tempo
        
        // Ustawienia dla akcentów
        this.accentLevels = [2, 1, 1, 1]; // Poziomy akcentów dla każdego uderzenia (0=cicho, 1=normalnie, 2=głośno)
        
        // Inicjalizacja event listenerów
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Inicjalizacja pokrętła - obsługa myszki
        if (this.tempoDial) {
            // Obsługa myszy
            this.tempoDial.addEventListener('mousedown', this.startDrag.bind(this));
            document.addEventListener('mousemove', this.drag.bind(this));
            document.addEventListener('mouseup', this.stopDrag.bind(this));
            
            // Obsługa dotyku
            this.tempoDial.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
            document.addEventListener('touchmove', this.drag.bind(this), { passive: false });
            document.addEventListener('touchend', this.stopDrag.bind(this));
            
            // Obsługa kółka myszy na pokrętle
            this.tempoDial.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        }
        
        // Nowe kontrolki dla taktów grania
        this.playBarsIncreaseBtn.addEventListener('click', () => {
            this.updatePlayBars(this.playBars + 1);
        });
        
        this.playBarsDecreaseBtn.addEventListener('click', () => {
            this.updatePlayBars(Math.max(this.playBars - 1, 1));
        });
        
        // Nowe kontrolki dla taktów ciszy
        this.silentBarsIncreaseBtn.addEventListener('click', () => {
            this.updateSilentBars(this.silentBars + 1);
        });
        
        this.silentBarsDecreaseBtn.addEventListener('click', () => {
            this.updateSilentBars(Math.max(this.silentBars - 1, 0));
        });
        
        // Nowe kontrolki dla automatycznej zmiany tempa
        this.tempoChangeBarsIncreaseBtn.addEventListener('click', () => {
            this.updateTempoChangeBars(this.tempoChangeBars + 1);
        });
        
        this.tempoChangeBarsDecreaseBtn.addEventListener('click', () => {
            this.updateTempoChangeBars(Math.max(this.tempoChangeBars - 1, 0));
        });
        
        this.tempoChangeValueIncreaseBtn.addEventListener('click', () => {
            this.updateTempoChangeAmount(this.tempoChangeAmount + 1);
        });
        
        this.tempoChangeValueDecreaseBtn.addEventListener('click', () => {
            this.updateTempoChangeAmount(Math.max(this.tempoChangeAmount - 1, -20));
        });
        
        // Obsługa przycisku play/stop
        this.playStopBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stop();
            } else {
                this.play();
            }
        });
        
        // Nowe kontrolki dla akcentów
        if (this.beatsCountIncreaseBtn) {
            this.beatsCountIncreaseBtn.addEventListener('click', () => {
                this.updateBeatsPerBar(Math.min(this.beatsPerBar + 1, 12));
            });
        }
        
        if (this.beatsCountDecreaseBtn) {
            this.beatsCountDecreaseBtn.addEventListener('click', () => {
                this.updateBeatsPerBar(Math.max(this.beatsPerBar - 1, 2));
            });
        }
        
        // Obsługa klikania w kółka akcentów
        if (this.accentBeats) {
            const accentLevels = this.accentBeats.querySelectorAll('.accent-level');
            accentLevels.forEach(level => {
                level.addEventListener('click', () => {
                    const beatIndex = parseInt(level.parentElement.getAttribute('data-beat'));
                    this.toggleAccentLevel(beatIndex, level);
                });
            });
        }
    }
    
    // Nowe metody dla obrotowego pokrętła
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.tempoDial.style.cursor = 'grabbing';
        
        const pointer = e.touches ? e.touches[0] : e;
        const rect = this.tempoDial.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        this.lastAngle = this.getAngle(centerX, centerY, pointer.clientX, pointer.clientY);
    }
    
    drag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        const pointer = e.touches ? e.touches[0] : e;
        const rect = this.tempoDial.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const angle = this.getAngle(centerX, centerY, pointer.clientX, pointer.clientY);
        const deltaAngle = angle - this.lastAngle;
        
        // Obsługa przeskoku między 0 a 360 stopni
        let adjustedDelta = deltaAngle;
        if (deltaAngle > 180) adjustedDelta -= 360;
        if (deltaAngle < -180) adjustedDelta += 360;
        
        // Aktualizacja rotacji i wartości tempa
        this.currentRotation += adjustedDelta;
        this.updateTempoFromRotation();
        
        // Aktualizacja pozycji wskaźnika
        this.updateDialMarker();
        
        this.lastAngle = angle;
    }
    
    stopDrag() {
        this.isDragging = false;
        if (this.tempoDial) {
            this.tempoDial.style.cursor = 'grab';
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        // Kierunek kółka myszy: ujemny = w górę (zwiększ), dodatni = w dół (zmniejsz)
        const direction = Math.sign(e.deltaY);
        const change = direction * -1; // Odwracamy kierunek
        
        // Aktualizacja tempa o 1 BPM
        this.updateTempo(Math.max(this.minTempo, Math.min(this.maxTempo, this.tempo + change)));
        
        // Aktualizacja rotacji pokrętła
        this.currentRotation = (this.tempo - this.minTempo) * this.rotationFactor;
        this.updateDialMarker();
    }
    
    getAngle(cx, cy, px, py) {
        const x = px - cx;
        const y = py - cy;
        // Obliczamy kąt w stopniach (0-360)
        let angle = Math.atan2(y, x) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        return angle;
    }
    
    updateTempoFromRotation() {
        // Konwersja rotacji na wartość tempa
        const tempoChange = Math.round(this.currentRotation / this.rotationFactor);
        let newTempo = this.minTempo + tempoChange;
        
        // Ograniczenie tempa do zakresu min-max
        newTempo = Math.max(this.minTempo, Math.min(this.maxTempo, newTempo));
        
        this.updateTempo(newTempo);
    }
    
    updateDialMarker() {
        if (!this.dialMarker) return;
        
        // Obliczanie pozycji wskaźnika na podstawie aktualnego tempa
        const percentage = (this.tempo - this.minTempo) / this.tempoRange;
        const angle = percentage * 330 - 75; // -75 do 255 stopni (330 stopni zakresu)
        
        // Obracanie wskaźnika wokół środka pokrętła
        const dialCenter = this.tempoDial.getBoundingClientRect().width / 2;
        const markerRadius = dialCenter - 18; // Promień ruchu wskaźnika (mniejszy niż promień pokrętła)
        
        // Obliczanie pozycji wskaźnika
        const radian = angle * Math.PI / 180;
        const x = Math.cos(radian) * markerRadius + dialCenter;
        const y = Math.sin(radian) * markerRadius + dialCenter;
        
        this.dialMarker.style.left = `${x}px`;
        this.dialMarker.style.top = `${y}px`;
        this.dialMarker.style.transform = 'translate(-50%, -50%)';
    }
    
    updateTempo(newTempo) {
        this.tempo = newTempo;
        this.tempoDisplay.textContent = this.tempo;
        
        // Jeśli metronom jest uruchomiony, zaktualizuj prędkość
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }
    
    updatePlayBars(count) {
        this.playBars = count;
        this.playBarsCount.textContent = count;
        
        // Resetujemy liczniki, jeśli jesteśmy w trakcie odtwarzania
        if (this.isPlaying) {
            this.currentBar = 0;
            this.currentBeat = 0;
            this.isSilentMode = false;
        }
    }
    
    updateSilentBars(count) {
        this.silentBars = count;
        this.silentBarsCount.textContent = count;
        
        // Resetujemy liczniki, jeśli jesteśmy w trakcie odtwarzania
        if (this.isPlaying) {
            this.currentBar = 0;
            this.currentBeat = 0;
            this.isSilentMode = false;
        }
    }
    
    // Nowe metody dla automatycznej zmiany tempa
    updateTempoChangeBars(count) {
        this.tempoChangeBars = count;
        this.tempoChangeBarsCount.textContent = count;
        
        // Resetujemy licznik zmiany tempa
        this.tempoChangeCounter = 0;
        
        // Jeśli włączamy automatyczną zmianę tempa, zapamiętujemy początkowe tempo
        if (count > 0) {
            this.initialTempo = this.tempo;
        }
    }
    
    updateTempoChangeAmount(amount) {
        this.tempoChangeAmount = amount;
        // Formatujemy wyświetlaną wartość, dodając znak + dla wartości dodatnich
        this.tempoChangeValue.textContent = amount > 0 ? `+${amount}` : `${amount}`;
        
        // Resetujemy licznik zmiany tempa
        if (this.tempoChangeBars > 0) {
            this.tempoChangeCounter = 0;
        }
    }
    
    // Nowa metoda do aktualizacji liczby uderzeń w takcie
    updateBeatsPerBar(count) {
        // Zabezpieczenie przed nieistniejącymi elementami DOM
        if (!this.beatsCount) return;
        
        this.beatsPerBar = count;
        this.beatsCount.textContent = count;
        
        // Aktualizacja tablicy akcentów do nowej długości
        while (this.accentLevels.length < count) {
            this.accentLevels.push(1); // Dodaj nowe uderzenia z domyślnym poziomem 1 (normalne)
        }
        this.accentLevels = this.accentLevels.slice(0, count); // Przytnij do nowej długości
        
        // Resetujemy liczniki, jeśli jesteśmy w trakcie odtwarzania
        if (this.isPlaying) {
            this.currentBeat = 0;
        }
        
        // Aktualizacja interfejsu użytkownika
        this.updateAccentBeatsUI();
    }
    
    // Metoda do przełączania poziomu akcentu dla danego uderzenia
    toggleAccentLevel(beatIndex, levelElement) {
        if (beatIndex < 0 || beatIndex >= this.accentLevels.length) return;
        
        // Pobierz aktualny poziom
        let currentLevel = parseInt(levelElement.getAttribute('data-level'));
        
        // Przełącz na następny poziom (0 -> 1 -> 2 -> 0)
        currentLevel = (currentLevel + 1) % 3;
        
        // Zaktualizuj wizualny wskaźnik
        levelElement.setAttribute('data-level', currentLevel);
        
        // Zapisz poziom akcentu
        this.accentLevels[beatIndex] = currentLevel;
    }
    
    // Metoda do aktualizacji interfejsu akcentów
    updateAccentBeatsUI() {
        // Zabezpieczenie przed nieistniejącym elementem DOM
        if (!this.accentBeats) return;
        
        // Wyczyść obecne elementy
        this.accentBeats.innerHTML = '';
        
        // Stwórz nowe elementy dla każdego uderzenia
        for (let i = 0; i < this.beatsPerBar; i++) {
            const beatDiv = document.createElement('div');
            beatDiv.className = 'accent-beat';
            beatDiv.setAttribute('data-beat', i);
            
            const beatNumber = document.createElement('span');
            beatNumber.className = 'beat-number';
            beatNumber.textContent = i + 1;
            
            const accentLevel = document.createElement('div');
            accentLevel.className = 'accent-level';
            accentLevel.setAttribute('data-level', this.accentLevels[i] || 1);
            
            const accentIndicator = document.createElement('div');
            accentIndicator.className = 'accent-indicator';
            
            accentLevel.appendChild(accentIndicator);
            beatDiv.appendChild(beatNumber);
            beatDiv.appendChild(accentLevel);
            this.accentBeats.appendChild(beatDiv);
            
            // Dodaj event listener do nowego elementu
            accentLevel.addEventListener('click', () => {
                this.toggleAccentLevel(i, accentLevel);
            });
        }
    }
    
    play() {
        // Utworzenie AudioContext, jeśli jeszcze nie istnieje
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        this.isPlaying = true;
        this.playStopBtn.textContent = 'Stop';
        this.playStopBtn.classList.add('active');
        
        // Resetujemy liczniki
        this.currentBar = 0;
        this.currentBeat = 0;
        this.isSilentMode = false;
        
        // Resetujemy licznik zmiany tempa
        this.tempoChangeCounter = 0;
        
        // Jeśli włączona jest automatyczna zmiana tempa, zapamiętujemy początkowe tempo
        if (this.tempoChangeBars > 0) {
            this.initialTempo = this.tempo;
        }
        
        // Obliczanie interwału między "tyknięciami" w ms
        const interval = 60000 / this.tempo;
        
        // Przechowujemy czas ostatniego tyknięcia dla dokładniejszego timingu
        let lastClick = Date.now();
        
        // Ustawienie interwału z korektą dryfu
        this.intervalId = setInterval(() => {
            const now = Date.now();
            const diff = now - lastClick;
            
            // Odtwarzamy dźwięk tylko jeśli nie jesteśmy w trybie cichym
            if (!this.isSilentMode) {
                this.playClick();
            }
            
            // Aktualizacja czasu ostatniego tyknięcia
            lastClick = now;
            
            // Inkrementacja liczników uderzeń i taktów
            this.currentBeat++;
            
            // Jeśli osiągnęliśmy koniec taktu
            if (this.currentBeat >= this.beatsPerBar) {
                this.currentBeat = 0;
                this.currentBar++;
                
                // Sprawdzanie czy należy przełączyć tryb
                this.checkModeSwitch();
                
                // Sprawdzanie czy należy zmienić tempo
                this.checkTempoChange();
            }
            
            // Korekta dryfu
            const drift = diff - interval;
            if (drift > 10 || drift < -10) {
                clearInterval(this.intervalId);
                this.intervalId = setInterval(() => {
                    // Odtwarzamy dźwięk tylko jeśli nie jesteśmy w trybie cichym
                    if (!this.isSilentMode) {
                        this.playClick();
                    }
                    
                    // Inkrementacja liczników
                    this.currentBeat++;
                    if (this.currentBeat >= this.beatsPerBar) {
                        this.currentBeat = 0;
                        this.currentBar++;
                        this.checkModeSwitch();
                        this.checkTempoChange();
                    }
                }, 60000 / this.tempo);
            }
        }, interval);
    }
    
    checkModeSwitch() {
        // Jeśli cichy tryb jest wyłączony (metronom gra)
        if (!this.isSilentMode) {
            // Jeśli zagraliśmy wszystkie takty grania i mamy jakieś takty ciszy
            if (this.currentBar >= this.playBars && this.silentBars > 0) {
                this.isSilentMode = true;
                this.currentBar = 0; // Resetujemy licznik taktów
            }
        } 
        // Jeśli cichy tryb jest włączony (metronom milczy)
        else {
            // Jeśli przeszliśmy wszystkie takty ciszy
            if (this.currentBar >= this.silentBars) {
                this.isSilentMode = false;
                this.currentBar = 0; // Resetujemy licznik taktów
            }
        }
    }
    
    // Nowa metoda do sprawdzania czy należy zmienić tempo
    checkTempoChange() {
        // Jeśli automatyczna zmiana tempa jest włączona (tempoChangeBars > 0)
        if (this.tempoChangeBars > 0) {
            this.tempoChangeCounter++;
            
            // Jeśli osiągnęliśmy liczbę taktów do zmiany tempa
            if (this.tempoChangeCounter >= this.tempoChangeBars) {
                // Oblicz nowe tempo
                let newTempo = this.tempo + this.tempoChangeAmount;
                
                // Ogranicz tempo do zakresu 30-240 BPM
                newTempo = Math.max(30, Math.min(240, newTempo));
                
                // Aktualizuj tempo bez resetowania odtwarzania
                this.tempo = newTempo;
                this.tempoDisplay.textContent = this.tempo;
                
                // Resetuj licznik zmiany tempa
                this.tempoChangeCounter = 0;
                
                // Aktualizuj interwał bez zatrzymywania odtwarzania
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    const interval = 60000 / this.tempo;
                    
                    this.intervalId = setInterval(() => {
                        // Odtwarzamy dźwięk tylko jeśli nie jesteśmy w trybie cichym
                        if (!this.isSilentMode) {
                            this.playClick();
                        }
                        
                        // Inkrementacja liczników
                        this.currentBeat++;
                        if (this.currentBeat >= this.beatsPerBar) {
                            this.currentBeat = 0;
                            this.currentBar++;
                            this.checkModeSwitch();
                            this.checkTempoChange();
                        }
                    }, interval);
                }
            }
        }
    }
    
    stop() {
        this.isPlaying = false;
        this.playStopBtn.textContent = 'Play';
        this.playStopBtn.classList.remove('active');
        clearInterval(this.intervalId);
        
        // Resetujemy liczniki, ale zachowujemy tempo
        this.currentBar = 0;
        this.currentBeat = 0;
        this.isSilentMode = false;
        this.tempoChangeCounter = 0;
    }
    
    playClick() {
        // Tworzenie dźwięku za pomocą Web Audio API
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Ustalamy częstotliwość i głośność w zależności od akcentu
        const accentLevel = this.accentLevels[this.currentBeat] || 1;
        
        // Dla różnych poziomów akcentu
        if (accentLevel === 0) {
            // Cicho - ekstremalnie cichy dźwięk, prawie niesłyszalny
            oscillator.type = 'sine';
            oscillator.frequency.value = 700;
            gainNode.gain.value = 0.05; // Zmniejszono z 0.2 na 0.05 - znacznie ciszej
        } else if (accentLevel === 2) {
            // Akcent - znacznie głośniejszy i wyższy dźwięk, inny typ oscylatora
            oscillator.type = 'triangle'; // Ostrzejszy dźwięk dla akcentu
            oscillator.frequency.value = 1000; // Wyższa częstotliwość
            gainNode.gain.value = 1.5; // Znacznie głośniej
        } else {
            // Normalny - standardowy dźwięk
            oscillator.type = 'sine';
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.7; // Normalnie
        }
        
        const now = this.audioContext.currentTime;
        
        // Dłuższy dźwięk dla akcentu
        const duration = accentLevel === 2 ? 0.08 : 0.05;
        
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        // Szybkie wyciszenie dźwięku, aby uniknąć trzasków
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }
}

// Inicjalizacja metronomu po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    const metronome = new Metronome();
    
    // Inicjalizacja pozycji wskaźnika pokrętła
    if (metronome.tempoDial && metronome.dialMarker) {
        metronome.updateDialMarker();
    }
    
    // Inicjalizacja interfejsu akcentów, jeśli elementy istnieją
    if (metronome.accentBeats) {
        metronome.updateAccentBeatsUI();
    }
});
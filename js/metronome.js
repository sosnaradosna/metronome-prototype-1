class Metronome {
    constructor() {
        // Pobieranie elementów UI
        this.tempoDisplay = document.querySelector('.tempo');
        this.tempoSlider = document.querySelector('.tempo-slider');
        this.tempoIncreaseBtn = document.querySelector('.tempo-increase');
        this.tempoDecreaseBtn = document.querySelector('.tempo-decrease');
        this.playPauseBtn = document.querySelector('.play-pause');
        this.stopBtn = document.querySelector('.stop');
        
        // Nowe elementy UI dla kontroli taktów
        this.playBarsCount = document.querySelector('.play-bars-count');
        this.playBarsIncreaseBtn = document.querySelector('.play-bars-increase');
        this.playBarsDecreaseBtn = document.querySelector('.play-bars-decrease');
        this.silentBarsCount = document.querySelector('.silent-bars-count');
        this.silentBarsIncreaseBtn = document.querySelector('.silent-bars-increase');
        this.silentBarsDecreaseBtn = document.querySelector('.silent-bars-decrease');
        
        // Ustawienia metronomu
        this.tempo = 100;
        this.isPlaying = false;
        this.intervalId = null;
        this.audioContext = null;
        
        // Nowe ustawienia dla taktów
        this.playBars = 4;          // Ilość taktów grania
        this.silentBars = 0;        // Ilość taktów ciszy
        this.currentBar = 0;        // Licznik bieżącego taktu
        this.currentBeat = 0;       // Licznik bieżącego uderzenia w takcie
        this.beatsPerBar = 4;       // Liczba uderzeń na takt (stała 4/4)
        this.isSilentMode = false;  // Czy jesteśmy w fazie ciszy
        
        // Inicjalizacja event listenerów
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Obsługa suwaka tempa
        this.tempoSlider.addEventListener('input', () => {
            this.updateTempo(parseInt(this.tempoSlider.value));
        });
        
        // Przycisk zwiększania tempa
        this.tempoIncreaseBtn.addEventListener('click', () => {
            this.updateTempo(Math.min(this.tempo + 1, 240));
        });
        
        // Przycisk zmniejszania tempa
        this.tempoDecreaseBtn.addEventListener('click', () => {
            this.updateTempo(Math.max(this.tempo - 1, 30));
        });
        
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
        
        // Obsługa przycisku play/pause
        this.playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        });
        
        // Obsługa przycisku stop
        this.stopBtn.addEventListener('click', () => {
            this.stop();
        });
    }
    
    updateTempo(newTempo) {
        this.tempo = newTempo;
        this.tempoDisplay.textContent = this.tempo;
        this.tempoSlider.value = this.tempo;
        
        // Jeśli metronom jest uruchomiony, zaktualizuj prędkość
        if (this.isPlaying) {
            this.pause();
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
    
    play() {
        // Utworzenie AudioContext, jeśli jeszcze nie istnieje
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        this.isPlaying = true;
        this.playPauseBtn.textContent = 'Pause';
        this.playPauseBtn.classList.add('active');
        
        // Resetujemy liczniki
        this.currentBar = 0;
        this.currentBeat = 0;
        this.isSilentMode = false;
        
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
                    }
                }, interval);
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
    
    pause() {
        this.isPlaying = false;
        this.playPauseBtn.textContent = 'Play';
        this.playPauseBtn.classList.remove('active');
        clearInterval(this.intervalId);
    }
    
    stop() {
        this.pause();
        this.updateTempo(100); // Reset to default tempo
        this.currentBar = 0;
        this.currentBeat = 0;
        this.isSilentMode = false;
    }
    
    playClick() {
        // Tworzenie dźwięku za pomocą Web Audio API
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Pierwszy dźwięk w takcie ma wyższy ton dla lepszego rozróżnienia
        if (this.currentBeat === 0) {
            oscillator.type = 'sine';
            oscillator.frequency.value = 880; // Wyższy ton dla pierwszego uderzenia
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.value = 800;
        }
        
        gainNode.gain.value = 1;
        
        const now = this.audioContext.currentTime;
        
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        
        // Szybkie wyciszenie dźwięku, aby uniknąć trzasków
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    }
}

// Inicjalizacja metronomu po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    const metronome = new Metronome();
});
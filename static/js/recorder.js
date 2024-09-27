let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let isPaused = false;

const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');
const resetButton = document.getElementById('resetButton');
const submitButton = document.getElementById('submitButton');
const recordingStatus = document.getElementById('recordingStatus');
const audioPlayer = document.getElementById('audioPlayer');
const fileUrl = document.getElementById('fileUrl');

startButton.addEventListener('click', startRecording);
pauseButton.addEventListener('click', pauseRecording);
stopButton.addEventListener('click', stopRecording);
resetButton.addEventListener('click', resetRecording);
submitButton.addEventListener('click', submitRecording);

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
                console.log('Audio chunk added. Total chunks:', audioChunks.length);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioPlayer.src = URL.createObjectURL(audioBlob);
            console.log('MediaRecorder stopped. Total audio chunks:', audioChunks.length);
        };

        mediaRecorder.start(100); // Collect data every 100ms
        isRecording = true;
        isPaused = false;
        updateUI();
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Error accessing microphone. Please check your browser settings.');
    }
}

function pauseRecording() {
    if (isRecording) {
        if (isPaused) {
            mediaRecorder.resume();
            isPaused = false;
        } else {
            mediaRecorder.pause();
            isPaused = true;
        }
        updateUI();
    }
}

function stopRecording() {
    if (isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        isPaused = false;
        console.log('Recording stopped. Audio chunks:', audioChunks.length);
        updateUI();
    }
}

function resetRecording() {
    audioChunks = [];
    audioPlayer.src = '';
    fileUrl.textContent = '';
    isRecording = false;
    isPaused = false;
    updateUI();
}

async function submitRecording() {
    if (audioChunks.length === 0) {
        alert('No recording to submit.');
        return;
    }

    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            fileUrl.textContent = `File URL: ${data.url}`;
            fileUrl.href = data.url;
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file. Please try again.');
    }
}

function updateUI() {
    startButton.disabled = isRecording;
    pauseButton.disabled = !isRecording;
    stopButton.disabled = !isRecording;
    resetButton.disabled = isRecording;
    submitButton.disabled = isRecording || audioChunks.length === 0;

    console.log('UI updated. isRecording:', isRecording, 'audioChunks:', audioChunks.length, 'submitButton disabled:', submitButton.disabled);

    if (isRecording) {
        recordingStatus.textContent = isPaused ? 'Recording paused' : 'Recording...';
        recordingStatus.classList.add('recording');
    } else {
        recordingStatus.textContent = audioChunks.length > 0 ? 'Recording complete' : 'Not recording';
        recordingStatus.classList.remove('recording');
    }
}

// Initialize UI
updateUI();

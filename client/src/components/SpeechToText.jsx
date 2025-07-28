import { useEffect, useState } from 'react';


const SpeechToText = () => {
    const [transcription, setTranscription] = useState("");
    const [sentences, setSentences] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false); // New state for pause
    const [recognition, setRecognition] = useState(null);
    let isRecognitionActive = false;

    useEffect(() => {
        const speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        speechRecognition.lang = "en-US";
        speechRecognition.interimResults = true;
        speechRecognition.continuous = true;

        let updateTimer;

        speechRecognition.onresult = (event) => {
            setIsSpeaking(true); // User is speaking when a result is detected
            const transcript = Array.from(event.results)
                .map((result) => result[0].transcript)
                .join(" ");

            // Debounce updates to improve performance
            if (updateTimer) clearTimeout(updateTimer);

            updateTimer = setTimeout(() => {
                setTranscription((prev) => prev + " " + transcript);

                // Split transcription into sentences
                const sentenceArray = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];
                setSentences((prev) => [...prev, ...sentenceArray]);

                if (event.results[event.results.length - 1].isFinal) {
                    setIsSpeaking(false);
                }
            }, 300); // Debounce delay
        };

        speechRecognition.onstart = () => {
            isRecognitionActive = true;
            console.log("Speech recognition started.");
        };

        speechRecognition.onend = () => {
            isRecognitionActive = false;
            setIsSpeaking(false);
            if (isListening && !isPaused) {
                setTimeout(() => speechRecognition.start(), 500);
            }
        };

        speechRecognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            isRecognitionActive = false;
            setIsListening(false);
            setIsSpeaking(false);
            setTimeout(() => speechRecognition.start(), 500);
            
        };

        setRecognition(speechRecognition);

        return () => {
            if (speechRecognition) {
                speechRecognition.abort();
            }
        };
    }, []);

    const startListening = () => {
        if (recognition && !isRecognitionActive) {
            recognition.start();
            setIsListening(true);
            setIsPaused(false);
            setIsSpeaking(false);
        }
    };

    const stopListening = () => {
        if (recognition) {
            recognition.stop();
            setIsListening(false);
            setIsSpeaking(false);
            setIsPaused(false);
            setSentences([]);
            setTranscription('');
        }
    };

    const pauseListening = () => {
        if (recognition && isListening) {
            recognition.stop();
            setIsPaused(true);
            setSentences([]);
            setTranscription('');
        }
    };

    const resumeListening = () => {
        if (recognition && isPaused) {
            recognition.start();
            setIsPaused(false);
            setSentences([]);
            setTranscription('');
        }
    };

    return {
        transcription,
        sentences,
        isListening,
        isSpeaking,
        isPaused,
        startListening,
        stopListening,
        pauseListening,
        resumeListening,
        setSentences,
        setTranscription,
    };
};

export default SpeechToText;



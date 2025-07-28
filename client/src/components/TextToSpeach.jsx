import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";

const TextToSpeech = forwardRef(({ text, voice, setIsHRSpeaking }, ref) => {
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [isVoicesLoaded, setIsVoicesLoaded] = useState(false);

    const loadVoices = (retryCount = 0) => {
        const availableVoices = window.speechSynthesis.getVoices();

        if (availableVoices.length > 0) {
            const maleVoiceName = "Microsoft David - English (United States)";
            const femaleVoiceName = "Microsoft Zira - English (United States)";
            let selectedVoice =
                voice === 0
                    ? availableVoices.find((v) => v.name === femaleVoiceName)
                    : availableVoices.find((v) => v.name === maleVoiceName);

            if (!selectedVoice) {
                selectedVoice = availableVoices[0]; // Fallback to first available voice
            }

            setSelectedVoice(selectedVoice);
            setIsVoicesLoaded(true);
        } else if (retryCount < 10) {
            setTimeout(() => loadVoices(retryCount + 1), 200); // Retry after 200ms
        } else {
            console.error("Failed to load voices after multiple attempts.");
        }
    };

    useEffect(() => {
        loadVoices();

        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [voice]);

    const startSpeaking = () => {
        if ("speechSynthesis" in window && text && selectedVoice) {
            window.speechSynthesis.cancel(); // Stop ongoing speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = selectedVoice;

            utterance.onstart = () => setIsHRSpeaking?.(true);
            utterance.onend = () => setIsHRSpeaking?.(false);

            window.speechSynthesis.speak(utterance);
        } else {
            console.log("Speech synthesis is not available or voices are not loaded.");
        }
    };

    useImperativeHandle(ref, () => ({
        startSpeaking,
    }));

    return <></>; // No UI required
});

export default TextToSpeech;

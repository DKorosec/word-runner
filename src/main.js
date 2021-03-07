function rawTextToWords(text) {
    return text.split(/\s+/g).map(word => word.trim()).filter(word => word.length > 0);
}

function isStopWord(word) {
    return ['.', ',', ';', '?', '!']
        .findIndex((stopper) => word.endsWith(stopper)) !== -1

}



function main() {
    let currentSpeedMs = null;
    let onSpeedChangeResolver = null;
    let words = null;
    input_speed.oninput = () => {
        currentSpeedMs = Number(input_speed.value);
        const wpm = Math.round(60e3 / currentSpeedMs);
        p_wpm.innerText = `${wpm} wpm`;
        if (onSpeedChangeResolver) {
            onSpeedChangeResolver();
            onSpeedChangeResolver = null;
        }
    }
    input_speed.oninput();
    
    const cancellableSleepMs = (ms) => {
        const sleepPromise = new Promise(resolve => setTimeout(resolve, ms));
        let cancelResolver = null;
        const cancelPromise = new Promise(resolve => { cancelResolver = resolve; });
        return {
            awaiter: Promise.race([sleepPromise, cancelPromise]),
            cancelResolver: () => cancelResolver(true)
        };
    };
    const renderNextWord = async () => {
        const word = words.shift();
        p_currentWord.innerText = word;
        const stopTime = currentSpeedMs;
        const doubleStopTime = input_useBreak.checked && isStopWord(word);
        const stopForMs = doubleStopTime ? stopTime * 2 : stopTime;

        let wasCanceled;
        do {
            const optSleep = cancellableSleepMs(stopForMs);
            onSpeedChangeResolver = optSleep.cancelResolver;
            wasCanceled = await optSleep.awaiter;
        } while (wasCanceled);

        if (words.length) {
            renderNextWord();
        } else {
            p_currentWord.innerText = 'YOUR READING IS COMPLETE.'
        }
    };

    input_start.onclick = async () => {
        div_textarea.style.display = 'none';
        p_currentWord.style.display = 'block';
        await cancellableSleepMs(1000).awaiter;
        words = rawTextToWords(textarea_text.value);
        renderNextWord();
    }
}

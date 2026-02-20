// read-wav.js
const fs = require('fs');
const wav = require('node-wav');
const math = require('mathjs');
const { computeSpectrogram, save_to_png } = require('./spectrogram');

const filePath = "./input/test.wav";

try {
    const buffer = fs.readFileSync(filePath);
    const result = wav.decode(buffer);

    const windowSize = 2048
    const hopSize = 125
    const maxFreq = 32000
    const minFreq = 0

    
    // Check raw audio data
    console.log('Raw samples stats:');
    console.log('First 10:', result);

    // Test audio parameters
    const samples = result.channelData[0];
    const energy = samples.slice(0, 10000).reduce((sum, x) => sum + x * x, 0);
    console.log('Audio energy:', energy);
    console.log('Sample rate:', result.sampleRate);
    console.log('Number of channels:', result.channelData.length);
    console.log('Number of samples (per channel):', result.channelData[0]?.length || 'NO DATA');


    if (!result.channelData || !result.channelData[0]) {
        console.error('No audio data found in WAV file');
        process.exit(1);
    }

    if (result.channelData[0].length === 0) {
        console.error('WAV file is empty');
        process.exit(1);
    };

    const spectrogram = computeSpectrogram(result.channelData[0], result.sampleRate,{windowSize, hopSize});

    console.log('\n=== SPECTROGRAM RESULTS ===');
    console.log(`Shape: ${spectrogram.freqBins} freq bins × ${spectrogram.timeFrames} time frames`);
    console.log(`Freq resolution: ${spectrogram.freqResolution.toFixed(1)} Hz`);
    console.log(`Time resolution: ${(spectrogram.timeResolution * 1000).toFixed(1)} ms`);

    console.log('DC bin (0 Hz) first 5 frames:', spectrogram.data[0].slice(0, 5).map(x => x.toFixed(2)));
    console.log('Nyquist bin first 5 frames:', spectrogram.data[spectrogram.freqBins - 1].slice(0, 5).map(x => x.toFixed(2)));

    console.log('\nFirst 10 time samples:', result.channelData[0].slice(0, 10));

    save_to_png(spectrogram,result.sampleRate, `./output/spectrogram-${Date.now()}.png`, minFreq, maxFreq);

} catch (err) {
    console.error('Failed to read WAV file:', err);
}

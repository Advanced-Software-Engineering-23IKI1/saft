import { griffinLimFromImage } from './png_to_spectogram.js';

function generateTestSpectrogram() {
    const frames = 256;
    const freqBins = 513; // 1024/2 + 1
    const mag = Array.from({ length: frames }, () => new Float32Array(freqBins));
    
    // Create chirp: frequency sweeps 50-450Hz
    for (let t = 0; t < frames; t++) {
        const freq = 50 + (t / frames) * 400;
        const bin = Math.floor((freq / 44100) * 1024);
        if (bin < freqBins) {
            mag[t][bin] = 1.0; // Full magnitude at this frequency
        }
    }
    
    console.log(`Synthetic spectrogram: ${frames}x${freqBins}`);
    return mag;
}

async function main() {
    console.log('=== GRIFFIN-LIM CORE TEST ===');
    
    // Generate test spectrogram data
    const mag = generateTestSpectrogram();
    
    // Run Griffin-Lim (your algorithm!)
    console.log('\n--- Running Griffin-Lim ---');
    const audio = griffinLimFromImage(mag, 1024, 256, 20);
    
    console.log(`Audio generated: ${audio.length} samples`);
    console.log(`Duration: ~${(audio.length/44100).toFixed(2)}s`);
    
    // Save raw audio (Audacity can read this)
    const fs = await import('fs/promises');
    await fs.writeFile('test-output.raw', audio);
    
    console.log('\n🎵 SAVED: test-output.raw');
    console.log('📁 Audacity → File → Import → Raw Data →');
    console.log('   Encoding: 32-bit float (little-endian)');
    console.log('   Sample rate: 44100 Hz');
    console.log('   Channels: 1 (mono)');
    console.log('Expected: rising chirp sound (50→450Hz)!');
}

main().catch(console.error);

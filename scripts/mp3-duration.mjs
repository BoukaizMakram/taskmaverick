// Count MPEG Layer III frames, including encoder padding. This deliberately
// leaves a conservative margin instead of estimating duration from file size.
export function mp3Duration(buffer) {
  let offset = 0, seconds = 0, frames = 0;
  if (buffer.toString('ascii', 0, 3) === 'ID3') {
    offset = 10 + ((buffer[6] & 127) * 2097152 + (buffer[7] & 127) * 16384 + (buffer[8] & 127) * 128 + (buffer[9] & 127));
    if (buffer[5] & 16) offset += 10;
  }
  while (offset + 4 <= buffer.length) {
    const h = buffer.readUInt32BE(offset);
    const version = (h >>> 19) & 3, layer = (h >>> 17) & 3;
    const rateIndex = (h >>> 10) & 3, bitrateIndex = (h >>> 12) & 15;
    if ((h >>> 21) !== 2047 || version === 1 || layer !== 1 || rateIndex === 3 || bitrateIndex === 0 || bitrateIndex === 15) { offset++; continue; }
    const rates = version === 3 ? [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320] : [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
    const sampleRate = [44100,48000,32000][rateIndex] / (version === 3 ? 1 : version === 2 ? 2 : 4);
    const length = Math.floor((version === 3 ? 144000 : 72000) * rates[bitrateIndex] / sampleRate) + ((h >>> 9) & 1);
    if (offset + length > buffer.length) break;
    seconds += (version === 3 ? 1152 : 576) / sampleRate;
    frames++;
    offset += length;
  }
  if (!frames) throw new Error('Audio response contained no valid MP3 frames');
  return Math.ceil(seconds * 1000) / 1000;
}

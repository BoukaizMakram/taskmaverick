import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS, eventOf, encoderOf, ffmpegArgs, frameCount, namesOf, optionsOf, sizeOf, slugOf, timeOf, wanted} from './storyboardExport.mjs';

test('the options: defaults, limits, a width that is a multiple of 32', () => {
  assert.deepEqual(optionsOf(), {fps: 30, width: 1920, crf: 18, format: 'jpeg'});
  assert.deepEqual(optionsOf({fps: '60', width: '1000', crf: '99', format: 'png'}), {fps: 60, width: 992, crf: 51, format: 'png'});
  assert.equal(optionsOf({fps: 500}).fps, 60);
  assert.equal(optionsOf({fps: 'x', width: ''}).fps, DEFAULTS.fps);
  assert.equal(optionsOf({width: 10}).width, 320);
});

test('the size keeps the 16:9 shape and says how much bigger than the screen it is', () => {
  assert.deepEqual(sizeOf(1920), {w: 1920, h: 1080, scale: 1.2});
  assert.deepEqual(sizeOf(1600), {w: 1600, h: 900, scale: 1});
  assert.equal(sizeOf(3840).h, 2160);
  assert.ok(Number.isInteger(sizeOf(1234).h) && sizeOf(1234).h % 2 === 0);
});

test('the pictures: one at 0, one every 1/fps, the last on the very end', () => {
  assert.equal(frameCount(10, 30), 301);
  assert.equal(frameCount(0, 30), 1);
  assert.equal(frameCount(10.016, 30), 301);
  assert.equal(timeOf(0, 10, 30), 0);
  assert.equal(timeOf(300, 10, 30), 10);
  assert.equal(timeOf(301, 10, 30), 10, 'never past the end');
  assert.ok(Math.abs(timeOf(15, 10, 30) - 0.5) < 1e-9);
});

test('the names of the files', () => {
  assert.equal(slugOf('The tablet and its Knowledge Base'), 'the-tablet-and-its-knowledge-base');
  assert.equal(slugOf('  Café — "Fade in" / scale!  '), 'cafe-fade-in-scale');
  assert.equal(slugOf('???'), 'video');
  const names = namesOf(['A video', 'a-video', 'Other', 'A Video']);
  assert.deepEqual([...names.values()], ['a-video', 'a-video-2', 'other', 'a-video-3']);
});

test('which videos a request is for: the exact title, else the ones with the words in them, else all', () => {
  const titles = ['Pop up', 'Pop up in detail', 'Zoom in', 'Pop up'];
  assert.deepEqual(wanted(titles), ['Pop up', 'Pop up in detail', 'Zoom in']);
  assert.deepEqual(wanted(titles, 'pop up'), ['Pop up'], 'the exact title does not take its longer twin');
  assert.deepEqual(wanted(titles, 'detail'), ['Pop up in detail']);
  assert.deepEqual(wanted(titles, 'nothing like it'), []);
  assert.deepEqual(wanted(titles, 'detail', true), [], 'exact only: words that are not a whole title find nothing');
  assert.deepEqual(wanted(titles, 'ZOOM IN', true), ['Zoom in']);
});

test('the encoder is read from ffmpeg\'s list', () => {
  const listing = ' V....D libx264              libx264 H.264 / AVC\n V....D h264_mf              H264 via MediaFoundation\n V..... libopenh264           (codec h264)\n';
  assert.equal(encoderOf(listing), 'libx264');
  assert.equal(encoderOf(' V..... libopenh264           (codec h264)\n V....D h264_mf              H264 via MediaFoundation'), 'libopenh264');
  assert.equal(encoderOf(' V....D h264_mf              H264 via MediaFoundation'), 'h264_mf');
  assert.equal(encoderOf(' V....D mpeg4              MPEG-4 part 2'), null);
  assert.equal(encoderOf(''), null);
});

test('ffmpeg is told the pictures are JPEG or PNG, the file is H.264 yuv420p', () => {
  const jpeg = ffmpegArgs({fps: 30, out: 'a.mp4'}), png = ffmpegArgs({fps: 24, format: 'png', crf: 12, out: 'b.mp4'});
  assert.deepEqual(jpeg.slice(jpeg.indexOf('-f'), jpeg.indexOf('-f') + 8), ['-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-']);
  assert.ok(png.includes('png') && png.includes('12') && png.at(-1) === 'b.mp4');
  assert.ok(jpeg.join(' ').includes('format=yuv420p') && jpeg.includes('libx264') && jpeg.includes('-crf'));
  assert.ok(ffmpegArgs({fps: 30, encoder: 'h264_mf', out: 'c.mp4'}).includes('-b:v'));
});

test('a line of the script is an event or nothing', () => {
  assert.deepEqual(eventOf('{"event":"progress","done":3,"total":9}'), {event: 'progress', done: 3, total: 9});
  assert.equal(eventOf('Compiled in 2s'), null);
  assert.equal(eventOf('{"done":1}'), null);
  assert.equal(eventOf(''), null);
});

// Tập trung tất cả polyfills ở một nơi
import 'process/browser';
import { Buffer } from 'buffer';

window.Buffer = Buffer;
window.process = process;
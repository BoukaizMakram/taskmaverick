import { task, checklist } from './openedMissions';

// Reference-board fixtures kept separate so animations can reuse this layout.
const mission = (id, title, overrides = {}) => ({
  ...task, id, title, status: 'open', date: '09-17-26', time: '03:59 PM',
  points: null, age: 660, ...overrides,
});
export const REFERENCE_MISSIONS = [
  mission('trash', 'Dean Test', { points: 50, age: 981, time: '03:54 PM' }),
  mission('sink', 'Kitchen Sink Check', { ...checklist, id: 'sink', title: 'Kitchen Sink Check', status: 'open', points: 10, reference: 'Temperature', date: '09-17-26', time: '03:59 PM' }),
  mission('temperature', 'Kitchen Temp', { type: 'Survey', reference: 'Temperature' }),
  mission('break', '30-Min Break', { status: 'claimed', reference: 'Guillermo', performer: 'Guillermo H', age: 6043, started: -317, time: '02:29 PM', highlighted: true }),
  mission('break-md', '10-Min Break MD', { status: 'closed', reference: 'Guillermo', performer: 'Guillermo H', age: 5665, started: -740, stopped: 0, time: '04:04 PM' }),
  mission('break-pm', '10-Min Break PM', { status: 'closed', reference: 'Angel', performer: 'Angel R', age: 17191, started: -622, stopped: 0, time: '03:46 PM' }),
  mission('touchscreens', 'Touchscreens', { status: 'closed', performer: 'Guillermo H', points: 10, age: 2007, started: -115, stopped: 0, time: '03:42 PM' }),
  mission('sanitizer', 'Sanitizer Bucket', { status: 'closed', performer: 'Guillermo H', points: 10, age: 3069, started: -1266, stopped: 0, time: '03:40 PM' }),
  mission('salad', 'Salad Station Quality Check', { type: 'Checklist', status: 'closed', performer: 'Guillermo H', reference: 'Temperature', age: 4122, started: -2997, stopped: 0, time: '03:35 PM' }),
];

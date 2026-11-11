// Automated Certification (website Narration (October 14, 2026).docx, section "Automated Certification", group Training): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/CertificationStage.jsx, the product's own screens only (the user, 2026-10-20: nothing invented): the certificate is a paper DOCUMENT (drawn on its own, no
// product round it), the missions are the product's mission cards, the courses are Certifications (tm/31, tm/33: Certificate › Courses › missions with their Validity), the person's
// assignments are the phone's Personal Board, the upload is a mission's Mission Details holding the document as a proof, the live dashboard is People › People Certifications (tm/39).
// The diagram (view 'cert') is one layer drawn at a `scene` (cert, renew, assignC: Course A reassigned, assignL: one lesson reassigned): the video moves it from one scene to the next;
// Certifications is view 'certs' (`level` 0 the certificate, 1 its courses, 2 their missions; `openB` Course B open).
const D = (scene, extra = {}) => ({view: 'cert', scene, date: 0, phone: 'empty', certBadge: null, courseBadge: null, missed: false, ...extra});
const POSTED = {date: 1, phone: 'posted'};
export default {
  id: 'automated-certification',
  board: 'automated-certification-v2',
  name: 'Automated Certification',
  group: 'Training',
  stage: 'automated-certification',
  view: 'flow',
  base: {view: 'cert', scene: 'cert', date: 0, phone: 'empty', certBadge: null, courseBadge: null, missed: false, doc: 'ask', scrollTo: 'top', expand: 1, level: 0, openB: true},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Certificate Issuance & Expiration / Can be Automated In Taskmaverick'},
    {id: 'given', name: 'A certificate and its expiration', words: 'A Certificate Is Given / An Expiration Date', art: D('cert'), marks: [{target: 'cert-expires'}]},
    {id: 'renew', name: 'Tasked to renew it', words: 'Prior To Its Expiration / People Are Tasked To Renew It', point: ['renew', 'cert'], art: D('cert'),
      end: [{name: 'the renewal mission', state: D('renew')}], marksAfter: true, marks: [{target: 'renew'}]},
    {id: 'upload', name: 'Third-party certificates', words: 'Third-Party Certificates / Can Be Uploaded', view: 'mission', art: {view: 'phone', doc: 'ask', scrollTo: 'top', expand: 0},
      before: [{name: 'the mission expands', state: {expand: 1}}],
      acts: [{target: 'add-document', name: 'Add document', state: {doc: 'done', scrollTo: 'cp-license'}}], marks: [{target: 'pdf-license'}]},
    {id: 'courses', name: 'Courses with their expirations', words: 'A Certificate Can Include / Courses With Varying Expirations', view: 'web', point: ['name-cert'], art: {view: 'certs', level: 0, openB: true},
      end: [{name: 'its two courses', state: {level: 1}}, {name: 'their missions', state: {level: 2}}], marksAfter: true, marks: [{target: 'val-course-a'}, {target: 'val-course-b'}]},
    {id: 'reassign', name: 'A course reassigned', words: 'A Course Can Be Reassigned / Prior To Its Expiration', point: ['when', 'course'], art: D('assignC'),
      end: [{name: 'the date', state: D('assignC', {date: 1})}, {name: 'the course on the phone', state: D('assignC', POSTED)}], marksAfter: true, marks: [{target: 'when'}]},
    {id: 'courseKept', name: 'The course done on time', words: 'Completing The Course On Time / Maintains The Certification', point: ['phone', 'cert'], art: D('assignC', POSTED),
      end: [{name: 'the course is done', state: D('assignC', {date: 1, phone: 'done'})}, {name: 'the certificate is kept', state: D('assignC', {date: 1, phone: 'done', certBadge: 'ok'})}], marksAfter: true, marks: [{target: 'cert'}]},
    {id: 'courseMissed', name: 'The course deadline missed', words: 'Missing The Deadline / Expires The Certification', point: ['due', 'cert'], art: D('assignC', POSTED),
      end: [{name: 'the deadline is missed', state: D('assignC', {date: 1, phone: 'late', missed: true})}, {name: 'the certificate expires', state: D('assignC', {date: 1, phone: 'late', missed: true, certBadge: 'x'})}], marksAfter: true, marks: [{target: 'cert'}]},
    {id: 'lessons', name: 'Lessons with their expirations', words: 'A Course Can Include / Lessons With Varying Expirations', view: 'web', point: ['name-course-a'], art: {view: 'certs', level: 2, openB: true},
      end: [{name: 'Course A by itself', state: {openB: false}}], marksAfter: true, marksSequence: true, marks: [{target: 'val-a1'}, {target: 'val-a2'}, {target: 'val-a3'}]},
    {id: 'lessonReassign', name: 'A lesson reassigned', words: 'A Lesson Can Be Reassigned / Prior To Its Expiration', point: ['when', 'a2'], art: D('assignL'),
      end: [{name: 'the date', state: D('assignL', {date: 1})}, {name: 'the lesson on the phone', state: D('assignL', POSTED)}], marksAfter: true, marks: [{target: 'when'}]},
    {id: 'lessonKept', name: 'The lesson done', words: 'Completing The Lesson / Maintains The Certification', point: ['phone', 'cert'], art: D('assignL', POSTED),
      end: [{name: 'the lesson is done', state: D('assignL', {date: 1, phone: 'done'})}, {name: 'the certificate is kept', state: D('assignL', {date: 1, phone: 'done', certBadge: 'ok'})}], marksAfter: true, marks: [{target: 'cert'}]},
    {id: 'lessonMissed', name: 'The lesson deadline missed', words: 'Missing The Deadline / Expires The Course / And The Certification', point: ['due', 'course'], art: D('assignL', POSTED),
      end: [{name: 'the deadline is missed', state: D('assignL', {date: 1, phone: 'late', missed: true})}, {name: 'the course expires', state: D('assignL', {date: 1, phone: 'late', missed: true, courseBadge: 'x'})},
        {name: 'the certificate expires', state: D('assignL', {date: 1, phone: 'late', missed: true, courseBadge: 'x', certBadge: 'x'})}], marksAfter: true, marksSequence: true, marks: [{target: 'course'}, {target: 'cert'}]},
    {id: 'dashboards', name: 'Live dashboards', words: 'Live Dashboards Track / Everyone’s Qualification & Certification', view: 'web', point: ['col-status'], art: {view: 'web', scrollTo: 'top'},
      end: [{name: 'the list scrolls', state: {scrollTo: 'person-5'}}], marksAfter: true, marks: [{target: 'col-days'}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Automating Certification / Ensures Compliance / Without Burdening Managers'},
  ],
  details: {
    certificates: {scenes: {
      given: ['Anna F holds a certificate.', 'It expires on 09-23-2027.'],
      renew: ['A month before it expires...', 'Anna gets a mission: Renew Certificate.'],
      upload: ['Leo T opens his mission.', 'He taps Add document.', 'His driver’s license is attached as a PDF.', 'Its expiration date is kept.'],
    }, each: ['renew']},
    courses: {scenes: {
      courses: ['The certificate opens to two courses.', 'Each course opens to its missions.', 'Each course has its own validity.'],
      reassign: ['Course A is due again on 09-23-2027.', 'It is reassigned on 08-24-2027.', 'Its missions land on Anna’s phone.'],
      courseKept: ['Anna completes the course on time.', 'The certificate stays active.'],
      courseMissed: ['The due date passes.', 'The certificate expires.'],
    }, each: ['courses', 'reassign', 'courseKept', 'courseMissed']},
    lessons: {scenes: {
      lessons: ['Course A is opened.', 'Each of its lessons has its own validity.'],
      lessonReassign: ['One lesson is due again on 12-22-2026.', 'It is reassigned on 12-08-2026.', 'It lands on Anna’s phone.'],
      lessonKept: ['Anna completes the lesson.', 'The certificate stays active.'],
      lessonMissed: ['The due date passes.', 'The course expires.', 'So does the certificate.'],
      dashboards: ['Every certificate of every person is listed.', 'Days to expire count down. Expired ones are red.'],
    }, each: ['lessons', 'lessonReassign', 'lessonKept', 'lessonMissed', 'dashboards']},
  },
  chunks: [
    {id: 'certificates', title: 'Certificates, renewals and uploads', lines: ['intro', 'given', 'renew', 'upload']},
    {id: 'courses', title: 'Courses and their deadlines', lines: ['courses', 'reassign', 'courseKept', 'courseMissed']},
    {id: 'lessons', title: 'Lessons and live dashboards', lines: ['lessons', 'lessonReassign', 'lessonKept', 'lessonMissed', 'dashboards', 'conclusion']},
  ],
};

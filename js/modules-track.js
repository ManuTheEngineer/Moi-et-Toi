// ========================================
// ===== FITNESS MODULE =====
// ========================================
let fitnessData = {},
  fitPRs = {},
  activeWorkout = null,
  wsTimer = null,
  restInterval = null;

// ===== WORKOUT PAGE TEMPLATE SYSTEM =====
var WORKOUT_PAGES = {
  w1: {
    name: 'Foundation', icon: '\u2726', color: 'g', title: 'Your Sculpt Guide',
    subtitle: 'Strength \u00b7 Shape \u00b7 Confidence', logType: 'Foundation',
    intro: 'This plan is designed for <strong class="sg">beginners</strong>. Every move has clear timing and built-in rest. Go at your own pace. <strong class="sg">Showing up is what matters.</strong>',
    sections: [
      { label: 'Phase 1', title: 'Core Strengthening', exercises: [
        { n: '01', name: 'Lying Leg Raises', desc: 'Lie flat. Raise straight legs to ceiling, lower without touching floor. Go slow. The slower, the better.', timing: ['10 reps', '3 sets', '45s rest'] },
        { n: '02', name: 'Flutter Kicks', desc: 'Hands under hips, legs a few inches off ground. Small alternating kicks. Lower back pressed down.', timing: ['20 sec', '3 sets', '40s rest'] },
        { n: '03', name: 'Reverse Crunches', desc: 'Knees bent, curl hips off floor bringing knees to chest. Hold 2 sec at top, lower gently.', timing: ['12 reps', '3 sets', '45s rest'] },
        { n: '04', name: 'Mountain Climbers', desc: 'Push-up position. Drive knees to chest alternating. Like running on the floor. Keep hips level.', timing: ['25 sec', '3 sets', '50s rest'] },
        { n: '05', name: 'Dead Bugs', desc: 'On back, arms up, knees 90 degrees. Extend opposite arm and leg slowly. Return, switch sides.', timing: ['8 each side', '3 sets', '40s rest'] }
      ]},
      { label: 'Phase 2', title: 'Waist Sculpting', exercises: [
        { n: '06', name: 'Russian Twists', desc: 'Seated, lean back, feet off ground. Rotate torso side to side. Controlled. No rushing.', timing: ['16 reps (8/side)', '3 sets', '40s rest'] },
        { n: '07', name: 'Side Plank Hip Dips', desc: 'Side plank on forearm. Dip hips down and back up. Feel it along the waistline.', timing: ['10 each side', '3 sets', '45s rest'] },
        { n: '08', name: 'Standing Side Crunches', desc: 'Hand behind head. Lift knee to meet same-side elbow. Squeeze at top. No equipment needed.', timing: ['12 each side', '3 sets', '40s rest'] },
        { n: '09', name: 'Woodchoppers', desc: 'Feet apart. Diagonal chopping motion from shoulder to opposite hip. Tightens the waist beautifully.', timing: ['10 each side', '3 sets', '45s rest'] }
      ]},
      { label: 'Every Day', title: 'Your Daily Practice', daily: {
        tag: '\u2726 Do This Every Day', name: 'Stomach Vacuums',
        desc: 'Breathe out completely. Pull belly button toward spine. Hold 15 to 20 seconds. Repeat. Trains your deepest core muscle. Like an internal corset.',
        timing: ['15-20s hold', '5 rounds', '15s rest']
      }},
      { label: 'Phase 3', title: 'Shape & Silhouette', exercises: [
        { n: '10', name: 'Hip Thrusts', desc: 'Back against couch. Feet flat, knees bent. Drive hips up, squeeze 2 seconds at top.', timing: ['15 reps', '3 sets', '50s rest'] },
        { n: '11', name: 'Sumo Squats', desc: 'Wide stance, toes out. Squat deep, chest up. Press through heels to stand.', timing: ['15 reps', '3 sets', '50s rest'] },
        { n: '12', name: 'Lateral Shoulder Raises', desc: 'Light weights at sides. Raise arms to shoulder height. Lower with control. Shapes the silhouette.', timing: ['12 reps', '3 sets', '40s rest'] }
      ]}
    ],
    next: { id: 'w2', label: 'The Elevated Program', desc: 'Harder moves. Shorter rest. Deeper definition.', colorCls: 'nxr', colorVar: 'c-red' },
    footer: { quote: "You're already becoming who you want to be.", caption: 'One day at a time', color: 'var(--gold-l)' }
  },
  w2: {
    name: 'Elevated', icon: '\u25c6', color: 'r', title: 'Elevated Sculpt',
    subtitle: 'Power \u00b7 Definition \u00b7 Shape', logType: 'Elevated',
    intro: 'You made it here because you put in the work. <strong class="sr">Higher reps, shorter rest, more intense combinations.</strong> Trust the process. You\u2019ve already proven you can do this.',
    sections: [
      { label: 'Phase 1', title: 'Deep Core Sculpt', exercises: [
        { n: '01', name: 'Hanging Leg Raises', desc: 'Hang from bar. Raise straight legs to 90 degrees. Lower with full control.', timing: ['12 reps', '4 sets', '30s rest'] },
        { n: '02', name: 'Scissor Kicks', desc: 'Legs hovering, cross over each other in X pattern. Core tight. Lower legs = harder.', timing: ['40 sec', '4 sets', '25s rest'] },
        { n: '03', name: 'Plank to Pike', desc: 'Plank position. Walk feet to hands, hips into inverted V. Walk back out. One fluid motion.', timing: ['12 reps', '4 sets', '30s rest'] },
        { n: '04', name: 'V-Ups', desc: 'Lie flat. Lift legs and upper body simultaneously, reach for toes. Lower with control.', timing: ['15 reps', '4 sets', '30s rest'] },
        { n: '05', name: 'Mountain Climber Sprints', desc: 'As fast as you can. Explosive knee drives. Full intensity cardio + core.', timing: ['45 sec', '4 sets', '25s rest'] }
      ]},
      { label: 'Phase 2', title: 'Waist Definition', exercises: [
        { n: '06', name: 'Weighted Russian Twists', desc: 'Hold a dumbbell or heavy water bottle. Added resistance sculpts deeper waist definition.', timing: ['24 reps (12/side)', '4 sets', '25s rest'] },
        { n: '07', name: 'Side Plank Reach Through', desc: 'Side plank. Thread top arm underneath body, rotating torso. Return. Sharpens the waistline.', timing: ['12 each side', '4 sets', '25s rest'] },
        { n: '08', name: 'Band Woodchoppers', desc: 'Resistance band at head height. Pull diagonally across body. Controlled rotation.', timing: ['14 each side', '4 sets', '30s rest'] },
        { n: '09', name: 'Slow Bicycle Crunches', desc: 'Elbow to opposite knee. Hold each twist 1 second. Slow is where results live.', timing: ['20 reps (10/side)', '4 sets', '25s rest'] }
      ]},
      { label: 'Phase 3', title: 'Power Sculpt', exercises: [
        { n: '10', name: 'Weighted Hip Thrusts', desc: 'Weight across hips. Press up, squeeze 3 seconds at top. Number one curve builder.', timing: ['15 reps', '4 sets', '35s rest'] },
        { n: '11', name: 'Bulgarian Split Squats', desc: 'One foot on couch behind you. Lower until front thigh is parallel. Press back up.', timing: ['12 each leg', '4 sets', '35s rest'] },
        { n: '12', name: 'Arnold Press', desc: 'Dumbbells at chest, palms facing you. Press up rotating palms outward. Full shoulder sculpt.', timing: ['12 reps', '4 sets', '30s rest'] }
      ]}
    ],
    next: { id: 'w3', label: 'Full Body Sculpt', desc: 'Every muscle group. One session. Total transformation.', colorCls: 'nxv', colorVar: 'c-vio' },
    footer: { quote: "You didn't just dream it. You built it.", caption: 'Every rep counts', color: 'var(--red-tag)' }
  },
  w3: {
    name: 'Full Body', icon: '\u2b21', color: 'v', title: 'Full Body Sculpt',
    subtitle: 'Head to Toe \u00b7 One Session', logType: 'Full Body',
    intro: '<strong class="sv">Every major muscle group in one workout.</strong> Upper body, core, waist, glutes, legs. Allow 60 to 75 minutes. Warm up 5 minutes first. You\u2019ve got this.',
    sections: [
      { label: 'Block A', title: 'Upper Body', exercises: [
        { n: '01', name: 'Push-Ups', desc: 'Shoulder-width hands. Lower chest to floor, push back up. Drop to knees if needed.', timing: ['10 reps', '3 sets', '40s rest'] },
        { n: '02', name: 'Lateral Raises', desc: 'Light weights. Raise arms to shoulder height. Lower slowly. Builds shoulder caps.', timing: ['15 reps', '3 sets', '35s rest'] },
        { n: '03', name: 'Bent Over Rows', desc: 'Hinge forward. Pull weights to ribs, squeeze shoulder blades. Strengthens the back.', timing: ['12 reps', '3 sets', '40s rest'] },
        { n: '04', name: 'Tricep Dips', desc: 'Edge of chair. Lower by bending elbows. Push back up. Tones back of arms.', timing: ['12 reps', '3 sets', '40s rest'] }
      ]},
      { label: 'Block B', title: 'Core + Waist', exercises: [
        { n: '05', name: 'Leg Raises', desc: 'Raise straight legs, lower without touching floor. Lower back pressed down.', timing: ['12 reps', '3 sets', '35s rest'] },
        { n: '06', name: 'Bicycle Crunches', desc: 'Elbow to opposite knee. Go slow. Hold each twist 1 second.', timing: ['20 reps', '3 sets', '35s rest'] },
        { n: '07', name: 'Russian Twists', desc: 'Seated, lean back, feet off ground. Rotate side to side. Controlled and steady.', timing: ['20 reps', '3 sets', '35s rest'] },
        { n: '08', name: 'Plank Hold', desc: "Forearms on ground, body straight. Hold. Breathe. Don't let hips sag.", timing: ['30-45 sec', '3 sets', '30s rest'] }
      ]},
      { label: 'Block C', title: 'Lower Body + Glutes', exercises: [
        { n: '09', name: 'Sumo Squats', desc: 'Wide stance, toes out. Squat deep. Hold weight at center for extra challenge.', timing: ['15 reps', '3 sets', '40s rest'] },
        { n: '10', name: 'Hip Thrusts', desc: 'Back against couch. Drive hips up, squeeze at top 2 to 3 seconds.', timing: ['15 reps', '3 sets', '40s rest'] },
        { n: '11', name: 'Reverse Lunges', desc: 'Step back, lower knee toward ground. Push through front heel. Alternate legs.', timing: ['12 each leg', '3 sets', '40s rest'] },
        { n: '12', name: 'Glute Bridges', desc: 'On back, knees bent. Lift hips, squeeze glutes at top. Hold 2 seconds.', timing: ['15 reps', '3 sets', '35s rest'] },
        { n: '13', name: 'Calf Raises', desc: 'Rise onto toes, hold 1 second, lower slowly. Completes the leg sculpt.', timing: ['20 reps', '3 sets', '30s rest'] }
      ]}
    ],
    next: null,
    footer: { quote: 'The whole body. The whole vision. The whole her.', caption: 'Complete', color: 'var(--vio-tag)' }
  }
};

function renderWorkoutPage(id) {
  var w = WORKOUT_PAGES[id];
  if (!w) return;
  var ctn = document.getElementById(id + '-content');
  if (!ctn) return;
  if (ctn.dataset.rendered === id) return; // already rendered
  var c = w.color;
  var html = '<div class="who"><div class="wic w' + c + '">' + w.icon + '</div>' +
    '<span class="wbdg wb' + c + '">' + w.name + '</span>' +
    '<h1>' + w.title + '</h1><p>' + w.subtitle + '</p></div>' +
    '<div class="wnt wn' + c + '">' + w.intro + '</div>';
  w.sections.forEach(function(sec) {
    html += '<div class="wsc"><div class="wsl l' + c + '">' + sec.label + '</div>' +
      '<div class="wst">' + sec.title + '</div>';
    if (sec.daily) {
      var d = sec.daily;
      html += '<div class="dc d' + c + '"><div class="dtg dg' + c + '">' + d.tag + '</div>' +
        '<h3>' + d.name + '</h3><p>' + d.desc + '</p>' +
        '<div class="tr" style="margin-top:9px;padding-top:9px;border-top:1px solid var(--bdr-s)">' +
        '<span class="tb t' + c + '">\u23f1 ' + d.timing[0] + '</span>' +
        '<span class="tb t' + c + '">\u21bb ' + d.timing[1] + '</span>' +
        '<span class="tb t' + c + 'r">\u2601 ' + d.timing[2] + '</span></div></div>';
    }
    if (sec.exercises) {
      sec.exercises.forEach(function(ex) {
        html += '<div class="ec ec' + c + '"><div class="et">' +
          '<div class="en n' + c + '">' + ex.n + '</div>' +
          '<div class="ei"><h3>' + ex.name + '</h3><p>' + ex.desc + '</p></div></div>' +
          '<div class="tr"><span class="tb t' + c + '">\u23f1 ' + ex.timing[0] + '</span>' +
          '<span class="tb t' + c + '">\u21bb ' + ex.timing[1] + '</span>' +
          '<span class="tb t' + c + 'r">\u2601 ' + ex.timing[2] + '</span></div></div>';
      });
    }
    html += '</div>';
  });
  var btnCls = c !== 'g' ? ' lb' + c : '';
  html += '<button class="lbtn' + btnCls + '" onclick="openLog(\'' + w.logType + '\')">Log workout</button>';
  if (w.next) {
    html += '<div class="nxt ' + w.next.colorCls + '" onclick="go(\'' + w.next.id + '\')">' +
      '<div class="nxe ' + w.next.colorVar + '">When You\u2019re Ready</div>' +
      '<div class="nxt-t">' + w.next.label + '</div>' +
      '<div class="nxd">' + w.next.desc + '</div>' +
      '<div class="nxa ' + w.next.colorVar + '">Enter \u279e</div></div>';
  }
  html += '<div class="wft"><div class="wfq" style="color:' + w.footer.color + '">' + w.footer.quote + '</div>' +
    '<div class="wfs">' + w.footer.caption + '</div></div>';
  ctn.innerHTML = html;
  ctn.dataset.rendered = id;
}

// ===== EXERCISE DATABASE (60+ exercises) =====
const MUSCLE_ICONS = { chest: '🫁', back: '🔙', shoulders: '🏔', legs: '🦵', arms: '💪', core: '🎯' };
const MUSCLE_COLORS = {
  chest: 'var(--rose)',
  back: 'var(--teal)',
  shoulders: 'var(--gold)',
  legs: 'var(--emerald)',
  arms: 'var(--lavender)',
  core: 'var(--amber)'
};
const EXERCISE_DB = [
  // Chest
  { name: 'Bench Press', category: 'chest', equipment: 'barbell', type: 'compound', difficulty: 2 },
  { name: 'Incline Bench Press', category: 'chest', equipment: 'barbell', type: 'compound', difficulty: 2 },
  { name: 'Dumbbell Press', category: 'chest', equipment: 'dumbbell', type: 'compound', difficulty: 1 },
  { name: 'Incline Dumbbell Press', category: 'chest', equipment: 'dumbbell', type: 'compound', difficulty: 2 },
  { name: 'Cable Fly', category: 'chest', equipment: 'cable', type: 'isolation', difficulty: 1 },
  { name: 'Dumbbell Fly', category: 'chest', equipment: 'dumbbell', type: 'isolation', difficulty: 1 },
  { name: 'Push-ups', category: 'chest', equipment: 'bodyweight', type: 'compound', difficulty: 1 },
  { name: 'Chest Dips', category: 'chest', equipment: 'bodyweight', type: 'compound', difficulty: 2 },
  { name: 'Machine Chest Press', category: 'chest', equipment: 'machine', type: 'compound', difficulty: 1 },
  { name: 'Pec Deck', category: 'chest', equipment: 'machine', type: 'isolation', difficulty: 1 },
  // Back
  { name: 'Deadlift', category: 'back', equipment: 'barbell', type: 'compound', difficulty: 3 },
  { name: 'Pull-ups', category: 'back', equipment: 'bodyweight', type: 'compound', difficulty: 2 },
  { name: 'Chin-ups', category: 'back', equipment: 'bodyweight', type: 'compound', difficulty: 2 },
  { name: 'Barbell Row', category: 'back', equipment: 'barbell', type: 'compound', difficulty: 2 },
  { name: 'Dumbbell Row', category: 'back', equipment: 'dumbbell', type: 'compound', difficulty: 1 },
  { name: 'Lat Pulldown', category: 'back', equipment: 'cable', type: 'compound', difficulty: 1 },
  { name: 'Seated Cable Row', category: 'back', equipment: 'cable', type: 'compound', difficulty: 1 },
  { name: 'T-Bar Row', category: 'back', equipment: 'barbell', type: 'compound', difficulty: 2 },
  { name: 'Face Pull', category: 'back', equipment: 'cable', type: 'isolation', difficulty: 1 },
  { name: 'Straight Arm Pulldown', category: 'back', equipment: 'cable', type: 'isolation', difficulty: 1 },
  // Shoulders
  { name: 'Overhead Press', category: 'shoulders', equipment: 'barbell', type: 'compound', difficulty: 2 },
  { name: 'Dumbbell Shoulder Press', category: 'shoulders', equipment: 'dumbbell', type: 'compound', difficulty: 2 },
  { name: 'Arnold Press', category: 'shoulders', equipment: 'dumbbell', type: 'compound', difficulty: 2 },
  { name: 'Lateral Raise', category: 'shoulders', equipment: 'dumbbell', type: 'isolation', difficulty: 1 },
  { name: 'Front Raise', category: 'shoulders', equipment: 'dumbbell', type: 'isolation', difficulty: 1 },
  { name: 'Reverse Fly', category: 'shoulders', equipment: 'dumbbell', type: 'isolation', difficulty: 1 },
  { name: 'Cable Lateral Raise', category: 'shoulders', equipment: 'cable', type: 'isolation', difficulty: 1 },
  { name: 'Upright Row', category: 'shoulders', equipment: 'barbell', type: 'compound', difficulty: 2 },
  { name: 'Shrugs', category: 'shoulders', equipment: 'dumbbell', type: 'isolation', difficulty: 1 },
  // Legs
  { name: 'Barbell Squat', category: 'legs', equipment: 'barbell', type: 'compound', difficulty: 2 },
  { name: 'Goblet Squat', category: 'legs', equipment: 'dumbbell', type: 'compound', difficulty: 1 },
  { name: 'Front Squat', category: 'legs', equipment: 'barbell', type: 'compound', difficulty: 3 },
  { name: 'Leg Press', category: 'legs', equipment: 'machine', type: 'compound', difficulty: 1 },
  { name: 'Romanian Deadlift', category: 'legs', equipment: 'barbell', type: 'compound', difficulty: 2 },
  { name: 'Lunges', category: 'legs', equipment: 'dumbbell', type: 'compound', difficulty: 1 },
  { name: 'Bulgarian Split Squat', category: 'legs', equipment: 'dumbbell', type: 'compound', difficulty: 2 },
  { name: 'Leg Extension', category: 'legs', equipment: 'machine', type: 'isolation', difficulty: 1 },
  { name: 'Leg Curl', category: 'legs', equipment: 'machine', type: 'isolation', difficulty: 1 },
  { name: 'Calf Raises', category: 'legs', equipment: 'machine', type: 'isolation', difficulty: 1 },
  { name: 'Hip Thrust', category: 'legs', equipment: 'barbell', type: 'compound', difficulty: 2 },
  { name: 'Step Ups', category: 'legs', equipment: 'dumbbell', type: 'compound', difficulty: 1 },
  // Arms
  { name: 'Barbell Curl', category: 'arms', equipment: 'barbell', type: 'isolation', difficulty: 1 },
  { name: 'Dumbbell Curl', category: 'arms', equipment: 'dumbbell', type: 'isolation', difficulty: 1 },
  { name: 'Hammer Curl', category: 'arms', equipment: 'dumbbell', type: 'isolation', difficulty: 1 },
  { name: 'Preacher Curl', category: 'arms', equipment: 'barbell', type: 'isolation', difficulty: 1 },
  { name: 'Cable Curl', category: 'arms', equipment: 'cable', type: 'isolation', difficulty: 1 },
  { name: 'Tricep Pushdown', category: 'arms', equipment: 'cable', type: 'isolation', difficulty: 1 },
  { name: 'Skull Crushers', category: 'arms', equipment: 'barbell', type: 'isolation', difficulty: 2 },
  { name: 'Overhead Tricep Extension', category: 'arms', equipment: 'dumbbell', type: 'isolation', difficulty: 1 },
  { name: 'Tricep Dips', category: 'arms', equipment: 'bodyweight', type: 'compound', difficulty: 2 },
  { name: 'Close-Grip Bench Press', category: 'arms', equipment: 'barbell', type: 'compound', difficulty: 2 },
  // Core
  { name: 'Plank', category: 'core', equipment: 'bodyweight', type: 'isolation', difficulty: 1, unit: 'sec' },
  { name: 'Hanging Leg Raise', category: 'core', equipment: 'bodyweight', type: 'isolation', difficulty: 2 },
  { name: 'Cable Crunch', category: 'core', equipment: 'cable', type: 'isolation', difficulty: 1 },
  { name: 'Ab Rollout', category: 'core', equipment: 'bodyweight', type: 'compound', difficulty: 2 },
  { name: 'Russian Twist', category: 'core', equipment: 'bodyweight', type: 'isolation', difficulty: 1 },
  { name: 'Leg Raises', category: 'core', equipment: 'bodyweight', type: 'isolation', difficulty: 1 },
  { name: 'Mountain Climbers', category: 'core', equipment: 'bodyweight', type: 'compound', difficulty: 1 },
  { name: 'Dead Bug', category: 'core', equipment: 'bodyweight', type: 'isolation', difficulty: 1 },
  { name: 'Bicycle Crunch', category: 'core', equipment: 'bodyweight', type: 'isolation', difficulty: 1 },
  { name: 'Side Plank', category: 'core', equipment: 'bodyweight', type: 'isolation', difficulty: 1, unit: 'sec' }
];

const WORKOUT_PROGRAMS = {
  foundation: {
    name: 'Foundation',
    exercises: [
      { name: 'Goblet Squat', sets: 3, reps: 12, category: 'legs' },
      { name: 'Push-ups', sets: 3, reps: 10, category: 'chest' },
      { name: 'Dumbbell Row', sets: 3, reps: 12, category: 'back' },
      { name: 'Lunges', sets: 3, reps: 10, category: 'legs' },
      { name: 'Plank', sets: 3, reps: 30, category: 'core', unit: 'sec' },
      { name: 'Shoulder Press', sets: 3, reps: 10, category: 'shoulders' }
    ]
  },
  elevated: {
    name: 'Elevated',
    exercises: [
      { name: 'Barbell Squat', sets: 4, reps: 8, category: 'legs' },
      { name: 'Bench Press', sets: 4, reps: 8, category: 'chest' },
      { name: 'Deadlift', sets: 3, reps: 6, category: 'back' },
      { name: 'Pull-ups', sets: 3, reps: 8, category: 'back' },
      { name: 'Overhead Press', sets: 3, reps: 10, category: 'shoulders' },
      { name: 'Barbell Row', sets: 3, reps: 10, category: 'back' },
      { name: 'Leg Press', sets: 3, reps: 12, category: 'legs' },
      { name: 'Tricep Dips', sets: 3, reps: 12, category: 'arms' }
    ]
  },
  fullbody: {
    name: 'Full Body',
    exercises: [
      { name: 'Barbell Squat', sets: 4, reps: 10, category: 'legs' },
      { name: 'Bench Press', sets: 4, reps: 10, category: 'chest' },
      { name: 'Bent Over Row', sets: 4, reps: 10, category: 'back' },
      { name: 'Overhead Press', sets: 3, reps: 10, category: 'shoulders' },
      { name: 'Romanian Deadlift', sets: 3, reps: 10, category: 'legs' },
      { name: 'Barbell Curl', sets: 3, reps: 12, category: 'arms' },
      { name: 'Tricep Pushdown', sets: 3, reps: 12, category: 'arms' },
      { name: 'Leg Raises', sets: 3, reps: 15, category: 'core' },
      { name: 'Face Pull', sets: 3, reps: 15, category: 'shoulders' }
    ]
  }
};

let fitRestDuration = parseInt(localStorage.getItem('met_rest_duration') || '60');
let builderExercises = [];
let fitBodyData = {};

var fitBaseline = null;
function listenFitnessData() {
  if (!db) return;
  // Load onboarding baseline
  db.ref('baselines/' + user + '/fitness').once('value', snap => {
    fitBaseline = snap.val();
    renderFitnessBaseline();
  });
  db.ref('fitness/' + user + '/workouts')
    .orderByChild('date')
    .limitToLast(60)
    .on('value', snap => {
      fitnessData = snap.val() || {};
      renderFitnessHub();
    });
  db.ref('fitness/' + user + '/prs').on('value', snap => {
    fitPRs = snap.val() || {};
  });
  db.ref('fitness/' + user + '/body')
    .orderByChild('timestamp')
    .limitToLast(10)
    .on('value', snap => {
      fitBodyData = snap.val() || {};
    });
  db.ref('fitness/' + user + '/programs').on('value', snap => {
    renderSavedPrograms(snap.val() || {});
  });
  db.ref('fitness/' + user + '/photos')
    .orderByChild('timestamp')
    .limitToLast(12)
    .on('value', snap => {
      renderProgressPhotos(snap.val() || {});
    });
  // Populate exercise datalist for quick log
  const dl = document.getElementById('fit-ex-datalist');
  if (dl) dl.innerHTML = EXERCISE_DB.map(e => '<option value="' + esc(e.name) + '">').join('');
}

function renderFitnessBaseline() {
  if (!fitBaseline) return;
  var el = document.getElementById('fit-baseline-info');
  if (!el) return;
  var parts = [];
  if (fitBaseline.heightFt) parts.push(fitBaseline.heightFt + "'" + (fitBaseline.heightIn || 0) + '"');
  if (fitBaseline.weight) parts.push(fitBaseline.weight + ' lbs');
  if (fitBaseline.activityLevel) {
    var labels = ['', 'Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];
    parts.push(labels[fitBaseline.activityLevel] || '');
  }
  if (fitBaseline.fitnessGoal) {
    var goals = ['', 'Lose Weight', 'Build Muscle', 'Stay Fit', 'Get Stronger'];
    parts.push('Goal: ' + (goals[fitBaseline.fitnessGoal] || ''));
  }
  el.textContent = parts.join(' · ');
  el.style.display = parts.length ? '' : 'none';
}

function renderFitnessHub() {
  const workouts = Object.values(fitnessData);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const thisWeek = workouts.filter(w => new Date(w.date) >= weekAgo);
  const el = id => document.getElementById(id);
  if (el('fit-sessions')) el('fit-sessions').textContent = thisWeek.length;
  if (el('fit-volume')) {
    const vol = thisWeek.reduce((s, w) => s + (w.totalVolume || 0), 0);
    el('fit-volume').textContent = vol > 1000 ? (vol / 1000).toFixed(1) + 'k' : vol;
  }
  if (el('fit-prs')) el('fit-prs').textContent = Object.keys(fitPRs).length;
  // Streak
  let streak = 0;
  const dates = workouts
    .map(w => w.date)
    .sort()
    .reverse();
  const today = localDate();
  let check = today;
  for (let i = 0; i < 60; i++) {
    if (dates.includes(check)) {
      streak++;
    } else if (i > 0) break;
    const d = new Date(check);
    d.setDate(d.getDate() - 1);
    check = localDate(d);
  }
  if (el('fit-streak')) el('fit-streak').textContent = streak;

  // Muscle map
  renderMuscleMap(thisWeek);

  // Analytics
  renderFitnessCharts(workouts);

  // Recent workouts (enhanced)
  const hist = el('fit-history');
  if (hist) {
    if (!workouts.length) {
      hist.innerHTML = '<div class="empty">Start your first workout to see history</div>';
      return;
    }
    const sorted = workouts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 12);
    hist.innerHTML = sorted
      .map((w, idx) => {
        const muscles = [...new Set((w.exercises || []).map(e => e.category || guessCategory(e.name)).filter(Boolean))];
        const muscleTags = muscles
          .map(m => '<span class="fit-muscle-tag mt-' + m + '">' + (MUSCLE_ICONS[m] || '') + ' ' + m + '</span>')
          .join('');
        return `<div class="card-data" style="margin-bottom:8px;cursor:pointer" onclick="toggleHistDetail('fhd-${idx}')">
        <div class="cd-accent" style="background:var(--emerald)"></div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="cd-label">${esc(w.program || 'Workout')}</div>
            <div style="font-size:10px;color:var(--t3)">${w.date}</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:2px;align-items:center">
            <span style="font-size:11px;color:var(--t3)">${w.exercises ? w.exercises.length : 0} exercises</span>
            <span style="font-size:11px;color:var(--t3)">${w.duration || '--'}min</span>
            <span style="font-size:11px;color:var(--emerald);font-weight:600">${(w.totalVolume || 0) > 1000 ? ((w.totalVolume || 0) / 1000).toFixed(1) + 'k' : w.totalVolume || 0} vol</span>
          </div>
          <div style="margin-top:4px">${muscleTags}</div>
          <div class="fit-hist-detail" id="fhd-${idx}" style="display:none">${(w.exercises || [])
            .map(
              e =>
                '<div class="fit-hist-ex"><span style="flex:1">' +
                esc(e.name) +
                '</span><span class="fhe-sets">' +
                (e.sets || 0) +
                'x' +
                (e.reps || 0) +
                (e.weight ? ' @ ' + e.weight + 'lbs' : '') +
                '</span></div>'
            )
            .join('')}</div>
        </div>
      </div>`;
      })
      .join('');
  }

  // PRs
  const prsList = el('fit-prs-list');
  if (prsList) {
    const prs = Object.entries(fitPRs);
    if (!prs.length) {
      prsList.innerHTML = '<div class="empty">Set some PRs by logging workouts</div>';
      return;
    }
    prsList.innerHTML = prs
      .map(
        ([name, pr]) => `
      <div class="card-data" style="margin-bottom:8px">
        <div class="cd-accent" style="background:var(--gold)"></div>
        <div class="cd-number" style="color:var(--gold)">${pr.weight || pr.reps}${pr.weight ? 'lbs' : 'r'}</div>
        <div class="cd-info"><div class="cd-label">${esc(name)}</div><div class="cd-sub">${pr.sets}x${pr.reps}${pr.weight ? ' @ ' + pr.weight + 'lbs' : ''} &bull; ${pr.date}</div></div>
        <div class="pr-badge">PR</div>
      </div>`
      )
      .join('');
  }
}

function toggleHistDetail(id) {
  toggleEl(id);
}

function guessCategory(name) {
  if (!name) return '';
  const n = name.toLowerCase();
  if (/bench|push|chest|fly|pec/i.test(n)) return 'chest';
  if (/dead|pull|row|lat|back/i.test(n)) return 'back';
  if (/press|shoulder|raise|shrug|arnold/i.test(n)) return 'shoulders';
  if (/squat|lunge|leg|calf|hip|step/i.test(n)) return 'legs';
  if (/curl|tricep|bicep|arm|dip|skull/i.test(n)) return 'arms';
  if (/plank|crunch|ab|core|twist|bug/i.test(n)) return 'core';
  return '';
}

// ===== MUSCLE MAP =====
function renderMuscleMap(weekWorkouts) {
  const el = document.getElementById('fit-body-map');
  if (!el) return;
  const today = localDate();
  const todayMuscles = new Set();
  const weekMuscles = new Set();
  (weekWorkouts || []).forEach(w => {
    (w.exercises || []).forEach(e => {
      const cat = e.category || guessCategory(e.name);
      if (cat) {
        weekMuscles.add(cat);
        if (w.date === today) todayMuscles.add(cat);
      }
    });
  });
  const color = group =>
    todayMuscles.has(group)
      ? MUSCLE_COLORS[group] || 'var(--emerald)'
      : weekMuscles.has(group)
        ? 'rgba(176,138,80,0.6)'
        : 'var(--bg3)';
  el.innerHTML = `<div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap">
    ${['chest', 'back', 'shoulders', 'legs', 'arms', 'core']
      .map(
        g =>
          `<div style="text-align:center;cursor:pointer" onclick="filterExercises('${g}');openWorkoutBuilder()">
        <div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:${color(g).replace('var(', '').replace(')', '') ? color(g) : 'var(--bg3)'};margin:0 auto 4px;opacity:${todayMuscles.has(g) ? 1 : weekMuscles.has(g) ? 0.7 : 0.3};transition:all .3s">${MUSCLE_ICONS[g]}</div>
        <div style="font-size:9px;color:${todayMuscles.has(g) ? 'var(--emerald)' : weekMuscles.has(g) ? 'var(--gold)' : 'var(--t3)'};font-weight:500;text-transform:capitalize">${g}</div>
      </div>`
      )
      .join('')}
  </div>
  <div style="display:flex;justify-content:center;gap:12px;margin-top:8px;font-size:9px;color:var(--t3)">
    <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--emerald);margin-right:3px"></span>Today</span>
    <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:rgba(176,138,80,0.6);margin-right:3px"></span>This week</span>
    <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--bg3);margin-right:3px"></span>Needs work</span>
  </div>`;
}

// ===== ANALYTICS =====
function renderFitnessCharts(workouts) {
  // Weekly volume bar chart (last 8 weeks)
  const volChart = document.getElementById('fit-vol-chart');
  if (volChart) {
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 + now.getDay()) * 86400000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const vol = workouts
        .filter(w => {
          const d = new Date(w.date);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((s, w) => s + (w.totalVolume || 0), 0);
      weeks.push({ vol, label: 'W' + (8 - i) });
    }
    const maxVol = Math.max(...weeks.map(w => w.vol), 1);
    volChart.innerHTML = weeks
      .map(
        w =>
          `<div class="fit-bar" style="height:${Math.max((w.vol / maxVol) * 100, 2)}%;opacity:${w.vol ? 1 : 0.3}"><div class="fit-bar-label">${w.vol > 1000 ? (w.vol / 1000).toFixed(0) + 'k' : w.vol}</div></div>`
      )
      .join('');
  }

  // Workout heatmap (last 28 days)
  const heatmap = document.getElementById('fit-heatmap');
  if (heatmap) {
    const dates = workouts.map(w => w.date);
    const cells = [];
    const today = new Date();
    // Find the Monday 4 weeks ago
    const start = new Date(today);
    start.setDate(start.getDate() - 27 - ((start.getDay() + 6) % 7));
    for (let i = 0; i < 28; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const ds = localDate(d);
      const count = dates.filter(dd => dd === ds).length;
      const level = count >= 2 ? 'l3' : count === 1 ? 'l2' : '';
      cells.push(`<div class="fit-heat-cell ${level}" title="${ds}: ${count} workout${count !== 1 ? 's' : ''}"></div>`);
    }
    heatmap.innerHTML = cells.join('');
  }

  // Muscle balance
  const mb = document.getElementById('fit-muscle-balance');
  if (mb) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
    const counts = {};
    weekWorkouts.forEach(w =>
      (w.exercises || []).forEach(e => {
        const cat = e.category || guessCategory(e.name);
        if (cat) counts[cat] = (counts[cat] || 0) + 1;
      })
    );
    const max = Math.max(...Object.values(counts), 1);
    const groups = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];
    mb.innerHTML = groups
      .map(g => {
        const count = counts[g] || 0;
        const pct = Math.round((count / max) * 100);
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:14px;width:22px;text-align:center">${MUSCLE_ICONS[g]}</span>
        <span style="font-size:11px;color:var(--cream);width:70px;text-transform:capitalize">${g}</span>
        <div style="flex:1;height:6px;border-radius:3px;background:var(--bg3);overflow:hidden"><div style="height:100%;width:${pct}%;background:${MUSCLE_COLORS[g]};border-radius:3px;transition:width .4s"></div></div>
        <span style="font-size:10px;color:var(--t3);width:24px;text-align:right">${count}</span>
      </div>`;
      })
      .join('');
  }
}

// ===== WORKOUT BUILDER =====
function openWorkoutBuilder() {
  var builder = document.getElementById('fit-builder');
  if (builder) builder.classList.add('on');
  builderExercises = [];
  renderExerciseList('all');
  renderBuilderSelected();
}
function closeWorkoutBuilder() {
  var builder = document.getElementById('fit-builder');
  if (builder) builder.classList.remove('on');
  builderExercises = [];
}
function filterExercises(group) {
  document
    .querySelectorAll('.fit-mg-tab')
    .forEach(t =>
      t.classList.toggle(
        'active',
        t.textContent.toLowerCase() === group || (group === 'all' && t.textContent === 'All')
      )
    );
  renderExerciseList(group);
}
function renderExerciseList(group) {
  const container = document.getElementById('fit-ex-list');
  if (!container) return;
  const q = (document.getElementById('fit-builder-search') || {}).value || '';
  let exs = group === 'all' ? EXERCISE_DB : EXERCISE_DB.filter(e => e.category === group);
  if (q) exs = exs.filter(e => e.name.toLowerCase().includes(q.toLowerCase()));
  container.innerHTML = exs
    .map(e => {
      const added = builderExercises.some(b => b.name === e.name);
      return `<div class="fit-ex-card${added ? ' added' : ''}" onclick="${added ? '' : "addExerciseToBuilder('" + esc(e.name) + "','" + e.category + "')"}" style="${added ? 'opacity:0.5' : ''}">
      <div class="fec-muscle" style="background:${MUSCLE_COLORS[e.category] + '20' || 'var(--bg3)'}">${MUSCLE_ICONS[e.category] || ''}</div>
      <div style="flex:1"><div class="fec-name">${esc(e.name)}</div><div class="fec-meta">${e.equipment} &bull; ${e.type} &bull; ${'★'.repeat(e.difficulty)}</div></div>
      ${added ? '<span style="font-size:10px;color:var(--emerald)">Added</span>' : '<span style="font-size:16px;color:var(--emerald)">+</span>'}
    </div>`;
    })
    .join('');
}
function searchExercises(val) {
  renderExerciseList(document.querySelector('.fit-mg-tab.active')?.textContent?.toLowerCase() || 'all');
}
function addExerciseToBuilder(name, category) {
  const lastWeight = getLastWeight(name);
  builderExercises.push({ name, category, sets: 3, reps: 10, weight: lastWeight });
  renderExerciseList(document.querySelector('.fit-mg-tab.active')?.textContent?.toLowerCase() || 'all');
  renderBuilderSelected();
}
function removeFromBuilder(idx) {
  builderExercises.splice(idx, 1);
  renderExerciseList(document.querySelector('.fit-mg-tab.active')?.textContent?.toLowerCase() || 'all');
  renderBuilderSelected();
}
function renderBuilderSelected() {
  const count = document.getElementById('fit-sel-count');
  if (count) count.textContent = builderExercises.length;
  const list = document.getElementById('fit-sel-list');
  if (!list) return;
  if (!builderExercises.length) {
    list.innerHTML = '<div style="font-size:11px;color:var(--t3);padding:8px 0">Tap exercises above to add them</div>';
    return;
  }
  list.innerHTML = builderExercises
    .map(
      (e, i) => `
    <div class="fit-sel-item">
      <div class="fsi-num">${i + 1}</div>
      <div class="fsi-name">${esc(e.name)}</div>
      <div class="fsi-config">
        <input type="number" value="${e.sets}" onchange="builderExercises[${i}].sets=parseInt(this.value)||3" placeholder="S">
        <span style="font-size:10px;color:var(--t3)">x</span>
        <input type="number" value="${e.reps}" onchange="builderExercises[${i}].reps=parseInt(this.value)||10" placeholder="R">
      </div>
      <button class="fsi-remove" onclick="removeFromBuilder(${i})">&times;</button>
    </div>`
    )
    .join('');
}
async function saveCustomProgram() {
  if (!builderExercises.length) {
    toast('Add exercises first');
    return;
  }
  const name = (document.getElementById('fit-builder-name') || {}).value?.trim() || 'Custom Workout';
  await db.ref('fitness/' + user + '/programs').push({
    name,
    exercises: builderExercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, category: e.category })),
    created: Date.now()
  });
  toast('Program "' + name + '" saved!');
  closeWorkoutBuilder();
}
function renderSavedPrograms(programs) {
  const el = document.getElementById('fit-saved-progs');
  if (!el) return;
  const entries = Object.entries(programs);
  if (!entries.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML =
    '<div class="sec-head" style="margin-top:4px"><div class="sec-dot sd-emerald"></div><div class="sec-title">My Programs</div></div>' +
    entries
      .map(
        ([
          k,
          p
        ]) => `<div class="card-action" style="display:flex;align-items:center;gap:10px;padding:12px 14px;margin-bottom:6px;cursor:pointer" onclick="startSavedProgram('${k}')">
      <div class="icon-badge ib-emerald" style="width:30px;height:30px;font-size:13px">&#x1F3CB;</div>
      <div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--cream)">${esc(p.name)}</div>
      <div style="font-size:10px;color:var(--t3)">${p.exercises?.length || 0} exercises</div></div>
      <button class="fsi-remove" onclick="event.stopPropagation();deleteSavedProgram('${k}')" style="font-size:10px">&times;</button>
    </div>`
      )
      .join('');
}
async function startSavedProgram(key) {
  const snap = await db.ref('fitness/' + user + '/programs/' + key).once('value');
  const prog = snap.val();
  if (!prog) return;
  activeWorkout = {
    program: prog.name,
    programKey: 'saved_' + key,
    exercises: prog.exercises.map(e => ({
      ...e,
      completed: false,
      sets_data: Array.from({ length: e.sets }, () => ({ weight: getLastWeight(e.name), reps: e.reps, done: false }))
    })),
    startTime: Date.now()
  };
  renderWorkoutSession();
  showEl('ws-active');
  document.getElementById('ws-title').textContent = prog.name;
  startWorkoutTimer();
}
async function deleteSavedProgram(key) {
  await db.ref('fitness/' + user + '/programs/' + key).remove();
  toast('Program deleted');
}
function startBuilderWorkout() {
  if (!builderExercises.length) {
    toast('Add exercises first');
    return;
  }
  const name = (document.getElementById('fit-builder-name') || {}).value?.trim() || 'Custom Workout';
  activeWorkout = {
    program: name,
    programKey: 'custom',
    exercises: builderExercises.map(e => ({
      ...e,
      completed: false,
      sets_data: Array.from({ length: e.sets }, () => ({
        weight: e.weight || getLastWeight(e.name),
        reps: e.reps,
        done: false
      }))
    })),
    startTime: Date.now()
  };
  closeWorkoutBuilder();
  renderWorkoutSession();
  showEl('ws-active');
  document.getElementById('ws-title').textContent = name;
  startWorkoutTimer();
}

// ===== ACTIVE WORKOUT (enhanced set-by-set) =====
function getLastWeight(exerciseName) {
  const workouts = Object.values(fitnessData);
  for (let i = workouts.length - 1; i >= 0; i--) {
    const w = workouts[i];
    if (w.exercises) {
      const ex = w.exercises.find(e => e.name === exerciseName);
      if (ex && ex.weight) return ex.weight;
    }
  }
  return 0;
}

function startWorkout(program) {
  const prog = WORKOUT_PROGRAMS[program];
  if (!prog) return;
  activeWorkout = {
    program: prog.name,
    programKey: program,
    exercises: prog.exercises.map(e => ({
      ...e,
      completed: false,
      sets_data: Array.from({ length: e.sets }, () => ({ weight: getLastWeight(e.name), reps: e.reps, done: false }))
    })),
    startTime: Date.now()
  };
  renderWorkoutSession();
  showEl('ws-active');
  document.getElementById('ws-title').textContent = prog.name + ' Workout';
  startWorkoutTimer();
}

function startWorkoutTimer() {
  if (wsTimer) clearInterval(wsTimer);
  wsTimer = setInterval(() => {
    if (!activeWorkout) return;
    const elapsed = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
    const m = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    const el = document.getElementById('ws-timer');
    if (el) el.textContent = m + ':' + s;
    // Live volume
    const vol = calcLiveVolume();
    const ve = document.getElementById('ws-volume-live');
    if (ve) ve.textContent = vol > 1000 ? (vol / 1000).toFixed(1) + 'k' : vol;
  }, 1000);
}

function calcLiveVolume() {
  if (!activeWorkout) return 0;
  let total = 0;
  activeWorkout.exercises.forEach(ex => {
    (ex.sets_data || []).forEach(s => {
      if (s.done) total += (s.weight || 1) * (s.reps || 0);
    });
  });
  return total;
}

function renderWorkoutSession() {
  if (!activeWorkout) return;
  const container = document.getElementById('ws-exercises');
  if (!container) return;
  const totalSets = activeWorkout.exercises.reduce((s, e) => s + (e.sets_data?.length || 0), 0);
  const doneSets = activeWorkout.exercises.reduce((s, e) => s + (e.sets_data?.filter(sd => sd.done).length || 0), 0);
  const bar = document.getElementById('ws-bar');
  if (bar) bar.style.width = (totalSets ? (doneSets / totalSets) * 100 : 0) + '%';

  container.innerHTML = activeWorkout.exercises
    .map((ex, i) => {
      const allDone = ex.sets_data?.every(s => s.done);
      const exVol = (ex.sets_data || []).filter(s => s.done).reduce((t, s) => t + (s.weight || 1) * (s.reps || 0), 0);
      return `<div class="ws-ex-block" id="ws-ex-${i}">
      <div class="ws-ex-header" onclick="toggleWsEx(${i})">
        <div class="ws-ex-muscle" style="background:${(MUSCLE_COLORS[ex.category] || 'var(--emerald)') + '20'}">${MUSCLE_ICONS[ex.category] || '💪'}</div>
        <div class="ws-ex-info">
          <div class="ws-ex-name">${esc(ex.name)}</div>
          <div class="ws-ex-target">${ex.sets_data?.length || ex.sets}x${ex.reps}${ex.unit === 'sec' ? 's' : ''} &bull; ${exVol > 0 ? exVol + ' vol' : 'tap to log'}</div>
        </div>
        ${allDone ? '<div class="ws-ex-done-badge">Done</div>' : ''}
      </div>
      <div class="ws-sets" id="ws-sets-${i}">
        ${(ex.sets_data || [])
          .map(
            (s, si) => `
          <div class="ws-set-row">
            <div class="ws-set-num">S${si + 1}</div>
            <input class="ws-set-input" type="number" value="${s.weight || ''}" placeholder="lbs" onchange="updateSet(${i},${si},'weight',this.value)">
            <div class="ws-set-x">x</div>
            <input class="ws-set-input" type="number" value="${s.reps || ''}" placeholder="reps" onchange="updateSet(${i},${si},'reps',this.value)">
            <button class="ws-set-check ${s.done ? 'done' : ''}" onclick="completeSet(${i},${si})">${s.done ? '✓' : ''}</button>
            <div class="ws-set-vol">${s.done ? (s.weight || 1) * (s.reps || 0) : ''}</div>
          </div>
        `
          )
          .join('')}
        <div class="ws-add-set" onclick="addSet(${i})">+ Add Set</div>
      </div>
    </div>`;
    })
    .join('');
}

function toggleWsEx(i) {
  toggleEl('ws-sets-' + i);
}

function updateSet(exIdx, setIdx, field, val) {
  if (!activeWorkout?.exercises[exIdx]?.sets_data?.[setIdx]) return;
  activeWorkout.exercises[exIdx].sets_data[setIdx][field] = parseInt(val) || 0;
}

function completeSet(exIdx, setIdx) {
  if (!activeWorkout?.exercises[exIdx]?.sets_data?.[setIdx]) return;
  const set = activeWorkout.exercises[exIdx].sets_data[setIdx];
  set.done = !set.done;
  if (set.done) startRest(fitRestDuration);
  // Check if all sets for this exercise are done
  const ex = activeWorkout.exercises[exIdx];
  ex.completed = ex.sets_data.every(s => s.done);
  renderWorkoutSession();
}

function addSet(exIdx) {
  if (!activeWorkout?.exercises[exIdx]) return;
  const ex = activeWorkout.exercises[exIdx];
  const lastSet = ex.sets_data[ex.sets_data.length - 1] || { weight: 0, reps: ex.reps };
  ex.sets_data.push({ weight: lastSet.weight, reps: lastSet.reps, done: false });
  renderWorkoutSession();
}

function setRestDuration(sec) {
  fitRestDuration = sec;
  localStorage.setItem('met_rest_duration', sec);
  document
    .querySelectorAll('.rest-opt')
    .forEach(b =>
      b.classList.toggle(
        'active',
        parseInt(b.textContent) === sec || b.textContent === sec + 's' || (sec === 120 && b.textContent === '2m')
      )
    );
}

function startRest(seconds) {
  if (restInterval) clearInterval(restInterval);
  let remaining = seconds;
  const timer = document.getElementById('rest-timer');
  const countdown = document.getElementById('rest-countdown');
  showEl(timer);
  const update = () => {
    if (countdown) countdown.textContent = remaining;
    if (remaining <= 0) {
      skipRest();
      return;
    }
    remaining--;
  };
  update();
  restInterval = setInterval(update, 1000);
}

function skipRest() {
  if (restInterval) clearInterval(restInterval);
  hideEl('rest-timer');
}

function searchAddExercise() {
  const q = (document.getElementById('ws-add-ex-search') || {}).value?.trim();
  if (!q) return;
  const results = EXERCISE_DB.filter(e => e.name.toLowerCase().includes(q.toLowerCase())).slice(0, 4);
  const container = document.getElementById('ws-add-results');
  if (!container) return;
  container.innerHTML =
    results
      .map(
        e =>
          `<div class="fit-ex-card" style="padding:6px 10px;margin-bottom:2px" onclick="addExerciseMidWorkout('${esc(e.name)}','${e.category}')">
      <span style="font-size:12px">${MUSCLE_ICONS[e.category] || ''}</span>
      <span style="font-size:11px;color:var(--cream)">${esc(e.name)}</span>
      <span style="font-size:14px;color:var(--emerald);margin-left:auto">+</span>
    </div>`
      )
      .join('') || '<div style="font-size:11px;color:var(--t3);padding:4px">No matches</div>';
}

function addExerciseMidWorkout(name, category) {
  if (!activeWorkout) return;
  activeWorkout.exercises.push({
    name,
    category,
    sets: 3,
    reps: 10,
    completed: false,
    sets_data: [
      { weight: getLastWeight(name), reps: 10, done: false },
      { weight: getLastWeight(name), reps: 10, done: false },
      { weight: getLastWeight(name), reps: 10, done: false }
    ]
  });
  document.getElementById('ws-add-ex-search').value = '';
  document.getElementById('ws-add-results').innerHTML = '';
  renderWorkoutSession();
  toast(name + ' added!');
}

async function finishWorkout() {
  if (!activeWorkout) return;
  const duration = Math.floor((Date.now() - activeWorkout.startTime) / 60000);
  const exercises = activeWorkout.exercises.filter(e => e.sets_data?.some(s => s.done));
  const totalVolume = calcLiveVolume();
  const entry = {
    program: activeWorkout.program,
    date: localDate(),
    timestamp: Date.now(),
    duration,
    totalVolume,
    exercises: exercises.map(e => {
      const doneSets = e.sets_data.filter(s => s.done);
      const maxWeight = Math.max(...doneSets.map(s => s.weight || 0));
      const totalReps = doneSets.reduce((t, s) => t + (s.reps || 0), 0);
      return {
        name: e.name,
        category: e.category,
        sets: doneSets.length,
        reps: Math.round(totalReps / doneSets.length),
        weight: maxWeight,
        allSets: doneSets
      };
    }),
    user
  };
  await db.ref('fitness/' + user + '/workouts').push(entry);
  // Check PRs
  for (const ex of entry.exercises) {
    const key = ex.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const current = fitPRs[key];
    if (!current || ex.weight > (current.weight || 0)) {
      await db.ref('fitness/' + user + '/prs/' + key).set({
        weight: ex.weight,
        sets: ex.sets,
        reps: ex.reps,
        date: entry.date
      });
    }
  }
  if (wsTimer) clearInterval(wsTimer);
  skipRest();
  activeWorkout = null;
  hideEl('ws-active');
  const musclesTrained = [...new Set(exercises.map(e => e.category).filter(Boolean))];
  toast('Workout done! ' + exercises.length + ' exercises, ' + duration + 'min, ' + musclesTrained.join('/'));
  awardXP(50);
}

function cancelWorkout() {
  if (wsTimer) clearInterval(wsTimer);
  skipRest();
  activeWorkout = null;
  hideEl('ws-active');
}

async function quickLogExercise() {
  const name = document.getElementById('fit-ex-name').value.trim();
  const sets = parseInt(document.getElementById('fit-ex-sets').value) || 0;
  const reps = parseInt(document.getElementById('fit-ex-reps').value) || 0;
  const weight = parseInt(document.getElementById('fit-ex-weight').value) || 0;
  if (!name) {
    toast('Enter exercise name');
    return;
  }
  const today = localDate();
  const cat = guessCategory(name);
  await db.ref('fitness/' + user + '/workouts').push({
    program: 'Quick Log',
    date: today,
    timestamp: Date.now(),
    duration: 0,
    totalVolume: sets * reps * (weight || 1),
    exercises: [{ name, category: cat, sets, reps, weight }],
    user
  });
  const key = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const current = fitPRs[key];
  if (!current || weight > (current.weight || 0)) {
    await db.ref('fitness/' + user + '/prs/' + key).set({ weight, sets, reps, date: today });
  }
  document.getElementById('fit-ex-name').value = '';
  document.getElementById('fit-ex-sets').value = '';
  document.getElementById('fit-ex-reps').value = '';
  document.getElementById('fit-ex-weight').value = '';
  toast('Exercise logged');
  awardXP(10);
}

// Scroll helpers for quick action sheet context
function scrollToQuickLog() {
  document.getElementById('fit-quick-log-section')?.scrollIntoView({ behavior: 'smooth' });
}
function scrollToAnalytics() {
  document.getElementById('fit-analytics-anchor')?.scrollIntoView({ behavior: 'smooth' });
}
function scrollToMetrics() {
  document.getElementById('fit-metrics-anchor')?.scrollIntoView({ behavior: 'smooth' });
}

// ===== BODY METRICS (enhanced) =====
async function logBodyMetrics() {
  const fields = {
    weight: 'fit-weight',
    bodyfat: 'fit-bodyfat',
    chest: 'fit-chest',
    waist: 'fit-waist',
    arms: 'fit-arms',
    thighs: 'fit-thighs'
  };
  const data = {};
  let hasAny = false;
  Object.entries(fields).forEach(([key, id]) => {
    const v = parseFloat((document.getElementById(id) || {}).value);
    if (v) {
      data[key] = v;
      hasAny = true;
    }
  });
  if (!hasAny) {
    toast('Enter at least one measurement');
    return;
  }
  data.timestamp = Date.now();
  // Calculate BMI if weight is present (assume 5'10" / 70 inches if height not stored)
  if (data.weight) {
    const heightIn = 70;
    data.bmi = Math.round((data.weight / (heightIn * heightIn)) * 703 * 10) / 10;
  }
  const today = localDate();
  await db.ref('fitness/' + user + '/body/' + today).set(data);
  // Update trends
  Object.keys(fields).forEach(k => {
    const el = document.getElementById(fields[k]);
    if (el) el.value = '';
  });
  toast('Metrics saved!');
  renderBodyTrends();
}

function renderBodyTrends() {
  const entries = Object.values(fitBodyData).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  if (entries.length < 1) return;
  const latest = entries[entries.length - 1];
  const prev = entries.length > 1 ? entries[entries.length - 2] : null;
  const trend = (field, elId) => {
    const el = document.getElementById(elId);
    if (!el || !prev || !latest[field] || !prev[field]) return;
    const diff = latest[field] - prev[field];
    el.textContent = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    el.style.color = diff > 0 ? 'var(--rose)' : diff < 0 ? 'var(--emerald)' : 'var(--t3)';
  };
  trend('weight', 'fit-weight-trend-arrow');
  trend('bodyfat', 'fit-bf-trend');
  trend('chest', 'fit-chest-trend');
  trend('waist', 'fit-waist-trend');
  trend('arms', 'fit-arms-trend');
  trend('thighs', 'fit-thighs-trend');
  const bmi = document.getElementById('fit-bmi');
  if (bmi && latest.bmi) bmi.textContent = latest.bmi;
  // Weight sparkline
  const trendEl = document.getElementById('fit-weight-trend');
  if (trendEl && entries.length > 1) {
    const weights = entries.filter(e => e.weight).map(e => e.weight);
    if (weights.length > 1) {
      const min = Math.min(...weights);
      const max = Math.max(...weights);
      const range = max - min || 1;
      const pts = weights.map((w, i) => `${(i / (weights.length - 1)) * 100},${100 - ((w - min) / range) * 80}`);
      trendEl.innerHTML = `<div style="margin-top:4px">Last ${weights.length} entries: ${weights[0]}lbs → ${weights[weights.length - 1]}lbs</div>
        <svg width="100%" height="40" viewBox="0 0 100 100" preserveAspectRatio="none" style="margin-top:4px">
          <polyline points="${pts.join(' ')}" fill="none" stroke="var(--emerald)" stroke-width="2" vector-effect="non-scaling-stroke"/>
        </svg>`;
    }
  }
}

// ===== PROGRESS PHOTOS =====
function handleProgressPhoto(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) {
    toast('Photo too large (max 5MB)');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    compressImage(e.target.result, 600, 0.6).then(dataUrl => {
      saveProgressPhoto(dataUrl);
    });
  };
  reader.readAsDataURL(file);
}

function compressImage(dataUrl, maxDim, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      let w = img.width,
        h = img.height;
      if (w > h) {
        if (w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        }
      } else {
        if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

async function saveProgressPhoto(dataUrl) {
  if (!db || !user) return;
  const type = (document.getElementById('prog-photo-type') || {}).value || 'front';
  const note = (document.getElementById('prog-photo-note') || {}).value || '';
  const key = db.ref('fitness/' + user + '/photos').push().key;
  await db.ref('fitness/' + user + '/photos/' + key).set({
    data: dataUrl,
    type: type,
    note: note,
    timestamp: Date.now(),
    date: localDate()
  });
  const noteEl = document.getElementById('prog-photo-note');
  if (noteEl) noteEl.value = '';
  const inputEl = document.getElementById('prog-photo-input');
  if (inputEl) inputEl.value = '';
  toast('Progress photo saved!');
}

function renderProgressPhotos(photos) {
  const el = document.getElementById('prog-photos-gallery');
  if (!el) return;
  if (!photos || Object.keys(photos).length === 0) {
    el.innerHTML = '<div class="empty">No progress photos yet</div>';
    return;
  }
  const arr = Object.entries(photos)
    .map(([k, v]) => ({ ...v, _key: k }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const typeLabels = { front: 'Front', side: 'Side', back: 'Back', flex: 'Flex' };
  el.innerHTML =
    '<div class="prog-grid">' +
    arr
      .slice(0, 12)
      .map(
        p => `
    <div class="prog-thumb" onclick="viewProgressPhoto('${p._key}')">
      <img src="${p.data}" alt="Progress" loading="lazy">
      <div class="prog-label">${typeLabels[p.type] || p.type}</div>
      <div class="prog-date">${new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
    </div>
  `
      )
      .join('') +
    '</div>';
  // Compare button
  if (arr.length >= 2) {
    el.innerHTML += `<button class="dq-submit" onclick="compareProgressPhotos()" style="margin-top:10px;background:var(--grad-fitness);width:100%">Compare First & Latest</button>`;
  }
}

function viewProgressPhoto(key) {
  if (!db || !user) return;
  db.ref('fitness/' + user + '/photos/' + key).once('value', snap => {
    const p = snap.val();
    if (!p) return;
    const typeLabels = { front: 'Front', side: 'Side', back: 'Back', flex: 'Flex' };
    openModal(`
      <div style="text-align:center">
        <img src="${p.data}" style="max-width:100%;border-radius:16px;margin-bottom:12px">
        <div style="font-size:13px;color:var(--cream);font-weight:600">${typeLabels[p.type] || p.type} · ${new Date(p.timestamp).toLocaleDateString()}</div>
        ${p.note ? `<div style="font-size:12px;color:var(--t3);margin-top:6px">${esc(p.note)}</div>` : ''}
        <button class="btn-sm" onclick="deleteProgressPhoto('${key}')" style="margin-top:16px;color:var(--red)">Delete Photo</button>
      </div>
    `);
  });
}

function deleteProgressPhoto(key) {
  if (!db || !user) return;
  openModal(`<div style="text-align:center">
    <p style="font-size:15px;color:var(--t1);margin:0 0 6px;font-weight:600">Delete Photo?</p>
    <p style="font-size:13px;color:var(--t3);margin:0 0 16px">This cannot be undone.</p>
    <div style="display:flex;gap:8px">
      <button class="btn-sm" onclick="closeModal()" style="flex:1;background:var(--card-bg);color:var(--t2)">Cancel</button>
      <button class="btn-sm" onclick="confirmDeletePhoto('${key}')" style="flex:1;background:var(--red);color:#fff">Delete</button>
    </div>
  </div>`);
}
async function confirmDeletePhoto(key) {
  await db.ref('fitness/' + user + '/photos/' + key).remove();
  closeModal();
  toast('Photo removed');
}

function compareProgressPhotos() {
  if (!db || !user) return;
  db.ref('fitness/' + user + '/photos')
    .orderByChild('timestamp')
    .once('value', snap => {
      const arr = [];
      snap.forEach(c => {
        arr.push(c.val());
      });
      if (arr.length < 2) return;
      const first = arr[0],
        latest = arr[arr.length - 1];
      openModal(`
      <div style="font-size:14px;font-weight:600;color:var(--cream);text-align:center;margin-bottom:12px">Your Progress</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">First</div>
          <img src="${first.data}" style="width:100%;border-radius:12px">
          <div style="font-size:10px;color:var(--t3);margin-top:4px">${new Date(first.timestamp).toLocaleDateString()}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Latest</div>
          <img src="${latest.data}" style="width:100%;border-radius:12px">
          <div style="font-size:10px;color:var(--t3);margin-top:4px">${new Date(latest.timestamp).toLocaleDateString()}</div>
        </div>
      </div>
    `);
    });
}

// ========================================
// ===== GROW TOGETHER MODULE =====
// ========================================
let growPath = 'her';
let growCompleted = {};
let growReflections = {};
let growOpenModule = null;
let growCurrentLesson = null; // {path, moduleId, lessonIdx}

const GROW_MODULES = {
  her: [
    {
      id: 'respect',
      title: 'The Art of Respect',
      icon: '👑',
      color: 'var(--rose)',
      lessons: [
        {
          title: 'Why Respect Is His Love Language',
          intro:
            'For most men, feeling respected ranks equally with - or even above - feeling loved. When a man feels genuinely respected by his partner, he opens up emotionally, becomes more giving, and feels empowered to lead with confidence.',
          traditional:
            "Traditionally, wives were taught to honor their husband's role as head of the household. This meant speaking well of him publicly, deferring to his judgment on major decisions, and never belittling him in front of others. The home was considered her domain, and his leadership outside it was supported unconditionally.",
          modern:
            "Today, respect doesn't mean blind obedience - it means genuinely valuing his perspective. It looks like: asking his opinion before making big decisions together, speaking positively about him to friends and family, acknowledging his efforts even when the outcome isn't perfect, and choosing to address disagreements privately rather than publicly correcting him.",
          reflection:
            'Think of a recent time you may have unintentionally dismissed his opinion or effort. How might you have handled it differently?',
          action:
            'This week, verbally acknowledge one decision he made that you appreciate. Be specific about why it mattered.'
        },
        {
          title: 'Building Him Up in Public',
          intro:
            'How you speak about your partner when others are listening shapes how the world sees your relationship - and how he sees himself through your eyes.',
          traditional:
            "Wives were taught never to air dirty laundry. A man's reputation was partly built by how his wife spoke of him. She was his biggest advocate in every room.",
          modern:
            "You don't have to pretend everything is perfect. But there's a difference between venting to a trusted friend and habitually complaining about him. Choose to highlight his strengths in conversations. When he does something thoughtful, tell someone else about it - he'll feel it even if he doesn't hear it directly.",
          reflection: "When you talk about him with friends or family, what's the ratio of praise to complaints?",
          action:
            "Next time you're in a social setting, share one specific thing he did recently that made you proud or grateful."
        },
        {
          title: 'Disagreeing Without Diminishing',
          intro:
            'Conflict is inevitable in any relationship. But how you disagree determines whether the relationship grows stronger or erodes over time.',
          traditional:
            "Traditional values emphasized a woman's gentleness - the idea that a soft answer turns away wrath. Women were encouraged to state their case calmly and then trust their husband to weigh it fairly.",
          modern:
            'You absolutely have the right to disagree - passionately, even. The modern twist is doing so without attacking his character. Use "I feel..." instead of "You always..." Focus on the issue, not the person. And when the argument is over, let it be over. Don\'t store ammunition for the next disagreement.',
          reflection:
            "What's your go-to pattern when you disagree with him? Do you attack, withdraw, or try to discuss?",
          action:
            'Next time a disagreement arises, pause for 5 seconds before responding. Start your response with "I feel..." or "I think..."'
        },
        {
          title: 'The Power of Admiration',
          intro:
            "Admiration is respect expressed through emotion. It's not just thinking he's capable - it's showing him you genuinely look up to certain qualities in him.",
          traditional:
            'Wives were expected to admire their husbands - his work ethic, his strength, his provision. This admiration gave him purpose and fuel to keep striving.',
          modern:
            'Admiration today means noticing the things he does well and telling him. Not because he needs your validation to feel worthy, but because your words carry unique weight. "I love how you handled that" or "You\'re so good at figuring things out" can completely change his day.',
          reflection: "What are three things you genuinely admire about him that you haven't told him recently?",
          action: 'Tell him one thing you admire about him - something specific, not generic. Watch how he responds.'
        }
      ]
    },
    {
      id: 'home',
      title: 'Creating a Peaceful Home',
      icon: '🏡',
      color: 'var(--amber)',
      lessons: [
        {
          title: 'Home as Sanctuary',
          intro:
            'A man who feels at peace in his own home becomes a better partner, father, and person. The atmosphere you cultivate matters more than the decor.',
          traditional:
            "The home was considered the woman's kingdom. She set the tone - the warmth, the calm, the order. A peaceful home was seen as her greatest achievement.",
          modern:
            'You don\'t have to be a 1950s housewife. But being intentional about the energy in your shared space matters. It means: keeping chaos manageable (not perfect), greeting him warmly when he arrives, creating rituals that signal "home is safe" - a meal together, a calm evening routine, music that sets a mood.',
          reflection: 'When he walks through the door, what does he walk into? Chaos, indifference, or warmth?',
          action:
            "Create one small ritual this week: a specific greeting, a shared evening tea, or 10 minutes of phone-free conversation when you're both home."
        },
        {
          title: 'Order Without Obsession',
          intro:
            "There's a difference between a home that feels organized and inviting versus one that feels sterile and stressful. The goal is functional warmth.",
          traditional:
            'Homemaking was an art form - meals planned, spaces tidy, comfort prioritized. It communicated care without words.',
          modern:
            "You don't need to be Martha Stewart. But small things matter: a made bed, a stocked fridge, clean shared spaces. These aren't about servitude - they're about creating an environment where both of you can relax and recharge. And yes, he should contribute too.",
          reflection:
            'Is there one area of your shared space that consistently causes tension? What small change could improve it?',
          action: 'Pick one area of your home and spend 15 minutes making it more inviting. Not perfect - inviting.'
        },
        {
          title: 'Feeding the Relationship',
          intro:
            'Sharing meals is one of the oldest forms of connection. The act of preparing and eating food together is deeply bonding.',
          traditional:
            'Preparing meals for your family was considered an act of love. Women took pride in nourishing their households - it was creative, generous, and central to daily life.',
          modern:
            "This isn't about you doing all the cooking. It's about making shared meals intentional. Cook together, try new recipes, sit down without screens. Even ordering takeout can be an act of love if you chose his favorite. The point is: food is connection.",
          reflection:
            'How often do you share a meal together without distractions? Could you increase it by one meal this week?',
          action: "Plan and prepare (or order) one special meal this week specifically because you know he'd love it."
        }
      ]
    },
    {
      id: 'nurture',
      title: 'Nurturing Your Partner',
      icon: '💗',
      color: 'var(--rose)',
      lessons: [
        {
          title: "Attentiveness - Seeing What He Doesn't Say",
          intro:
            "Men often don't verbalize their needs as directly as women do. Learning to read his signals is a form of deep love.",
          traditional:
            'A good wife was said to "know her husband" - his moods, his stresses, his unspoken needs. She didn\'t wait to be asked; she anticipated.',
          modern:
            "This isn't about mind-reading or losing yourself in his needs. It's about paying attention. When he's quiet, asking gently. When he's stressed, offering comfort without trying to fix it immediately. Noticing when he needs space versus when he needs closeness.",
          reflection: "What does he look like when he's stressed but not saying it? How do you usually respond?",
          action:
            'This week, notice one moment when he seems off. Instead of asking "what\'s wrong," try "I\'m here if you want to talk, and I\'m here if you don\'t."'
        },
        {
          title: 'Physical Comfort',
          intro:
            'Touch, warmth, and physical care are powerful nurturing tools that many modern couples neglect in the busyness of life.',
          traditional:
            "Wives were encouraged to create physical comfort - warm meals, a welcoming bed, affectionate touch. These weren't seen as chores but as expressions of devotion.",
          modern:
            "Physical nurturing today means: a hand on his back when he's stressed, making sure the bed is a place you both love, initiating affection without it always leading somewhere. It's also about his health - encouraging good sleep, good food, and rest.",
          reflection:
            'When was the last time you initiated physical affection purely for comfort - not out of obligation or desire?',
          action:
            'Initiate one act of physical comfort this week: a massage, running your hands through his hair, or simply sitting close enough to touch.'
        },
        {
          title: 'Emotional Presence',
          intro:
            'Being emotionally present means being fully there - not distracted, not planning your response, not on your phone.',
          traditional:
            'Women were taught to be emotionally available - to listen without always needing to advise, to be a safe landing place after a hard day.',
          modern:
            "Emotional presence is rarer than ever in the age of constant distraction. It means: putting the phone face-down during conversation, making eye contact, asking follow-up questions, and sometimes just sitting with him in silence. Being present doesn't mean solving - it means witnessing.",
          reflection: "Are you truly present when he's talking, or are you already formulating your response?",
          action:
            'During your next conversation with him, practice listening without planning your reply. After he finishes, pause for 3 seconds before responding.'
        },
        {
          title: 'Knowing When to Advise vs. Listen',
          intro:
            'One of the most common relationship frustrations: he shares a problem and you immediately try to help. Sometimes he just needs to be heard.',
          traditional:
            'Wisdom traditions taught women the art of patient listening - letting the man process out loud before offering a gentle perspective.',
          modern:
            'The modern version: ask "Do you want me to listen or help solve this?" It\'s simple, respectful, and prevents the classic miscommunication. Most of the time, he just needs to vent. When he asks for your input, give it honestly but kindly.',
          reflection: 'Think about your default: do you jump to solutions or do you listen first?',
          action: 'Next time he shares a frustration, simply say "That sounds really tough" and wait. See what happens.'
        }
      ]
    },
    {
      id: 'softness',
      title: 'Strength in Softness',
      icon: '🌺',
      color: 'var(--lavender)',
      lessons: [
        {
          title: 'Femininity as Power',
          intro:
            'Softness is not weakness. Femininity has a unique power that complements masculinity - not competes with it.',
          traditional:
            'Traditionally, femininity was celebrated: grace, gentleness, beauty, emotional depth. These qualities were seen as the heart of the family.',
          modern:
            "Being feminine doesn't mean being passive. It means embracing your natural strengths - intuition, empathy, warmth, creativity - while also being strong, capable, and independent. The goal isn't to be less; it's to be fully you.",
          reflection: "Are there parts of your femininity you've suppressed because the world told you they were weak?",
          action:
            "Embrace one traditionally feminine quality this week - whether it's dressing up for yourself, nurturing someone, or allowing yourself to be vulnerable."
        },
        {
          title: 'Vulnerability as Courage',
          intro:
            'Letting someone see the real you - the unguarded, imperfect you - is one of the bravest things you can do in a relationship.',
          traditional:
            'Wives were encouraged to share their hearts with their husbands, to let him be their protector not just physically but emotionally.',
          modern:
            'Vulnerability today means: admitting when you\'re scared, saying "I need you" without shame, crying in front of him without feeling weak. It also means receiving his vulnerability with the same grace - never using his openness against him later.',
          reflection:
            "What's one thing you've been afraid to share with him? What's the worst that could happen if you did?",
          action:
            'Share one small vulnerability this week - something you haven\'t told him. Start with "I want to share something with you..."'
        },
        {
          title: 'Gentle Influence',
          intro: "The most effective influence in a relationship isn't loud - it's consistent, kind, and patient.",
          traditional:
            'The "Proverbs 31" woman was described as speaking with wisdom and faithful instruction on her tongue. Her influence was through example, not force.',
          modern:
            "You can't change him - and shouldn't try to. But you can inspire growth through your own example. When you lead with kindness, he notices. When you improve yourself, it motivates him. Gentle doesn't mean permissive - you can hold boundaries with grace.",
          reflection: 'Have you been trying to change him through criticism or through example?',
          action:
            "Identify one area where you've been critical. This week, model the change you want to see instead of pointing it out."
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication with Grace',
      icon: '💬',
      color: 'var(--teal)',
      lessons: [
        {
          title: 'Timing Is Everything',
          intro:
            'What you say matters, but when you say it matters just as much. Bad timing turns good feedback into a fight.',
          traditional:
            'Wise women were taught to choose their moments - never to bring up problems when he walked in the door, never to criticize in front of others, never to push a conversation when emotions were high.',
          modern:
            'Same principle, modern application: don\'t start a serious conversation when he\'s hungry, tired, or distracted. Ask "Is this a good time to talk about something?" Save the big conversations for calm, private moments. The issue will still be there tomorrow - but the way you raise it determines if it gets resolved.',
          reflection: 'Think about your last argument. Was the timing right, or did bad timing make it worse?',
          action: 'Before raising a concern this week, ask yourself: is he in a good headspace for this? If not, wait.'
        },
        {
          title: 'Appreciation Before Criticism',
          intro:
            'The way you frame feedback determines whether he hears it as love or as attack. Leading with gratitude opens the door.',
          traditional:
            'The "compliment sandwich" has roots in traditional wisdom: speak what\'s good, then what needs work, then reaffirm your love. It was seen as graceful communication.',
          modern:
            'Don\'t manipulate with fake praise. But genuinely acknowledging what\'s working before raising what isn\'t creates safety. "I love that you always help with bedtime. Could you also help with morning lunches?" lands very differently than "You never help in the mornings."',
          reflection: 'How do you typically deliver criticism? Is it wrapped in care, or does it come out sharp?',
          action:
            'This week, before raising any issue, lead with a genuine appreciation. Not as manipulation - as context.'
        },
        {
          title: 'The I-Feel Framework',
          intro:
            'The simplest communication upgrade: replace "you" statements with "I feel" statements. It changes everything.',
          traditional:
            'Traditional communication values emphasized avoiding blame. The focus was on expressing needs, not cataloguing faults.',
          modern:
            '"You never listen to me" becomes "I feel unheard when I\'m talking and you\'re on your phone." "You\'re always late" becomes "I feel unimportant when plans change without notice." This isn\'t just semantics - it removes the accusation and invites empathy instead of defense.',
          reflection: 'What\'s a recurring complaint you have? Rewrite it as an "I feel" statement right now.',
          action:
            'Use the "I feel __ when __" framework at least once this week in a real conversation. Notice how differently it lands.'
        }
      ]
    }
  ],
  him: [
    {
      id: 'leading',
      title: 'Leading with Love',
      icon: '🦁',
      color: 'var(--gold)',
      lessons: [
        {
          title: 'What Leadership Actually Means',
          intro:
            "Leadership in a relationship isn't about power or control. It's about initiative, responsibility, and putting the relationship's needs above your ego.",
          traditional:
            'Traditionally, the man was the head of the household - the final decision-maker, the one who set the direction. His word carried weight because he bore the responsibility for outcomes.',
          modern:
            'Modern leadership means: making decisions WITH her input, not over her. Taking initiative on things that need to get done without being asked. Being the one who says "let\'s talk about this" when tension is building. Leading by example - if you want respect, be respectable. If you want loyalty, be trustworthy.',
          reflection: 'In what areas have you been passive where she might need you to step up and lead?',
          action:
            "Identify one area you've been avoiding taking the lead on (finances, plans, a hard conversation) and handle it this week."
        },
        {
          title: 'Servant Leadership',
          intro:
            'The strongest leaders serve. In a relationship, this means your leadership exists for her benefit, not yours.',
          traditional:
            'Great kings were measured not by their power but by how their people thrived. The best husbands were those whose wives flourished under their care.',
          modern:
            'Servant leadership in 2024 means: asking "what do you need?" and meaning it. Putting your phone down when she\'s talking. Handling logistics so she doesn\'t have to carry the mental load alone. Making her life easier, not harder. Your strength is measured by how safe and supported she feels.',
          reflection:
            'When was the last time you did something for her benefit with zero expectation of anything in return?',
          action: 'This week, take one task completely off her plate - without announcing it or expecting praise.'
        },
        {
          title: 'Decisions Under Pressure',
          intro:
            'She needs to know that when things get hard, you can handle the pressure. Not perfectly - but steadily.',
          traditional:
            'Men were expected to stay calm in crisis - to think clearly when emotions ran high, to be the steady hand when everything felt uncertain.',
          modern:
            "This doesn't mean suppressing your emotions. It means processing them productively. When a crisis hits, take a breath before reacting. Gather information. Communicate a plan. She doesn't need you to have all the answers - she needs to know you won't crumble and you won't shut down.",
          reflection: 'How do you handle pressure? Do you shut down, explode, or stay steady?',
          action:
            'Next time stress hits, verbalize your process: "This is stressful, here\'s what I think we should do..." Let her see your thought process.'
        },
        {
          title: 'Leading by Example',
          intro:
            'The most powerful form of leadership is modeling the behavior you want to see. Actions always outweigh words.',
          traditional:
            'A man who wanted his household to have integrity had to embody it first. His consistency was his authority.',
          modern:
            "Want her to be more affectionate? Be more affectionate first. Want better communication? Start communicating better first. Want her to trust you? Be consistently trustworthy. Don't demand what you won't demonstrate. Your example sets the ceiling for your relationship.",
          reflection: 'What quality do you wish she had more of? Are you modeling that quality yourself?',
          action:
            'Pick one value you want more of in your relationship and embody it yourself this week without asking her to match it.'
        }
      ]
    },
    {
      id: 'provider',
      title: 'Provider & Protector',
      icon: '🛡',
      color: 'var(--emerald)',
      lessons: [
        {
          title: 'Financial Responsibility',
          intro:
            "Provision isn't about out-earning her or being the sole breadwinner. It's about taking ownership of your financial future together.",
          traditional:
            'A man was measured by his ability to provide - shelter, food, stability. Financial irresponsibility was considered a character flaw, not just a practical problem.',
          modern:
            "Today, provision means: having a financial plan, being honest about money, building savings, eliminating reckless spending, and planning for the future. Even if she earns more, taking active responsibility for your shared financial health is essential. She needs to know you're building, not just spending.",
          reflection: 'Do you have a clear financial plan for the next year? Do you know where every dollar goes?',
          action: 'Sit down and review your finances this week. Create or update a budget. Share it with her.'
        },
        {
          title: 'Emotional Safety',
          intro:
            'Protection extends far beyond physical safety. She needs to feel emotionally safe with you - safe to be vulnerable, to make mistakes, to be herself.',
          traditional:
            "A husband was his wife's shield - not just from external threats but from emotional harm. He created a space where she could let her guard down completely.",
          modern:
            "Emotional safety means: never using her vulnerabilities against her in arguments. Never mocking her feelings. Never weaponizing silence. When she cries, you hold her - you don't roll your eyes. When she's afraid, you reassure - you don't dismiss. She should feel safer with you than anywhere else in the world.",
          reflection:
            'Has she ever been afraid to tell you something? If so, what might you be doing that creates that fear?',
          action:
            'When she shares something vulnerable this week, respond with empathy first. No fixing, no deflecting.'
        },
        {
          title: 'Planning for the Future',
          intro:
            "A provider thinks ahead. He doesn't just handle today - he's building tomorrow. She needs to see that you're thinking long-term.",
          traditional:
            "Men were expected to plan: where they'd live, how they'd retire, what legacy they'd leave. This forward-thinking provided security and confidence.",
          modern:
            "Future planning today means: life insurance, retirement contributions, career development, health investments, and having conversations about where you both want to be in 5, 10, 20 years. She doesn't need you to have it all figured out - she needs to know you're thinking about it.",
          reflection: 'If she asked you "What\'s our plan for the next 5 years?" - could you answer confidently?',
          action: 'Write down 3 goals for your shared future and discuss them with her this week.'
        }
      ]
    },
    {
      id: 'eq',
      title: 'Emotional Intelligence',
      icon: '🧠',
      color: 'var(--lavender)',
      lessons: [
        {
          title: 'Reading Her Without Words',
          intro:
            'Women communicate a lot through tone, body language, and energy. Learning to read these signals makes you a vastly better partner.',
          traditional:
            "Wise men were encouraged to study their wives - to know her moods, her rhythms, her tells. This wasn't surveillance; it was devotion expressed through attention.",
          modern:
            "When she says \"I'm fine\" but her voice is flat, she's not fine. When she goes quiet, she might be processing. When she's short with you, something might be bothering her that has nothing to do with you. The skill is noticing and responding with curiosity, not defensiveness.",
          reflection: "What are her tells? How does she look when she's stressed vs. sad vs. overwhelmed?",
          action:
            "This week, when you sense she's off, say \"I can tell something's on your mind. I'm here whenever you're ready.\""
        },
        {
          title: 'Expressing Your Own Emotions',
          intro:
            "Being strong doesn't mean being silent. She needs to see your inner world - your fears, your joys, your struggles. That's how intimacy deepens.",
          traditional:
            'While tradition often discouraged male emotional expression, the wisest traditions valued a man who could share his heart with his trusted partner - she was his confidante.',
          modern:
            'You don\'t have to cry at every movie. But telling her "I\'m stressed about work" or "That really hurt my feelings" or "I\'m proud of what we\'re building" - these moments of honesty create the deepest bonds. Vulnerability from a strong man is incredibly attractive and trust-building.',
          reflection:
            'When was the last time you told her how you actually felt about something - not just the surface level?',
          action: "Share one genuine emotion with her this week that you'd normally keep to yourself."
        },
        {
          title: 'Validating Before Fixing',
          intro:
            'Your instinct to fix her problems is well-intentioned. But often, what she needs first is to feel heard and understood.',
          traditional:
            'Ancient wisdom taught: "Be quick to listen, slow to speak." Listening was considered a form of honor.',
          modern:
            '"That sounds really frustrating" goes further than "Well, you should just..." Validate her experience before jumping to solutions. Once she feels heard, she\'ll be much more open to your perspective. Sometimes she\'ll solve it herself just by talking it through.',
          reflection: 'Do you tend to listen or immediately try to solve? How does she react to each?',
          action:
            'Next time she shares a problem, resist the urge to fix it for the first 2 minutes. Just listen and validate.'
        },
        {
          title: 'Moving Beyond "Fix It" Mode',
          intro: 'Sometimes the strongest thing you can do is simply be present without trying to change anything.',
          traditional:
            'The protector role sometimes means protecting her space to feel - shielding her from the pressure to "get over it" or "move on."',
          modern:
            'When she\'s having a hard day, sometimes the best thing is: sit next to her, put your arm around her, and say nothing. Or ask "What do you need from me right now?" The answer might surprise you - often it\'s just "be here."',
          reflection: 'Can you sit with discomfort without trying to make it go away?',
          action:
            "Next time she's upset, try sitting with her in silence for 5 minutes. No advice, no phone, just presence."
        }
      ]
    },
    {
      id: 'consistency',
      title: 'Consistency & Reliability',
      icon: '🪨',
      color: 'var(--amber)',
      lessons: [
        {
          title: 'Keeping Promises',
          intro:
            'Trust is built on kept promises - especially the small ones. Every promise you keep deposits into the trust account. Every broken one withdraws.',
          traditional:
            "A man was as good as his word. Broken promises weren't just disappointments - they were character failures. Reliability was the bedrock of respect.",
          modern:
            "Don't promise what you can't deliver. \"I'll try to make it\" is more honest than \"I'll be there\" when you're not sure. And when you do promise something - follow through completely. She's counting on you even when she doesn't say it.",
          reflection: 'Think of the last promise you broke - even a small one. How did it affect her trust?',
          action:
            'Make one specific promise this week and keep it perfectly. Even something small like "I\'ll call you at lunch."'
        },
        {
          title: 'Showing Up Daily',
          intro:
            'Grand gestures are nice, but what builds a lasting relationship is showing up consistently in the mundane, everyday moments.',
          traditional:
            "A husband's daily presence - at meals, at bedtime, in the morning - was the rhythm of family life. Consistency communicated commitment.",
          modern:
            'Show up by: texting her during the day just to check in, being present at dinner (phone away), asking about her day and actually listening, being consistent in your affection - not just when you want something. Small, daily acts of showing up accumulate into something unshakable.',
          reflection: 'If she rated your daily "showing up" from 1-10 this past month, what would she say?',
          action:
            'For the next 7 days, send her one thoughtful message by noon. Not "hey" - something that shows you\'re thinking of her.'
        },
        {
          title: 'Being the Rock',
          intro:
            "She needs to know that you're steady. Not unfeeling - steady. The calm in the storm, the constant in the chaos.",
          traditional:
            'A man was the anchor. When the world was unpredictable, she could count on him to be unmoved by external pressure.',
          modern:
            "Being steady doesn't mean never struggling. It means being honest about your struggles while still moving forward. \"This is hard, but we'll figure it out\" is steadier than pretending nothing's wrong. She needs to see your resolve, not your facade.",
          reflection: 'When life gets chaotic, do you become more steady or more erratic?',
          action:
            'Next time something stressful happens, take 60 seconds to breathe before responding. Let her see you process calmly.'
        }
      ]
    },
    {
      id: 'understanding',
      title: 'Understanding Her World',
      icon: '🌹',
      color: 'var(--rose)',
      lessons: [
        {
          title: 'Her Emotional Needs Are Real',
          intro:
            'Women process the world through a rich emotional landscape. Understanding this - not dismissing it - is one of the greatest gifts you can give her.',
          traditional:
            'Wise husbands were counseled to dwell with their wives "according to knowledge" - meaning: study her, learn her, understand what makes her unique.',
          modern:
            "When she says she needs to talk, she means it. When she's emotional about something that seems small to you, it's not small to her. Her feelings aren't problems to solve - they're experiences to share. \"I understand why that would upset you\" goes further than \"I don't see the big deal.\"",
          reflection: "Is there an area of her emotional life you've been dismissing or minimizing?",
          action:
            'When she shares an emotion this week, respond with "Tell me more about that" instead of explaining it away.'
        },
        {
          title: 'Cycles and Seasons',
          intro:
            'Women experience physical and emotional cycles that genuinely affect their mood, energy, and needs. Understanding this makes you a dramatically better partner.',
          traditional:
            "In many cultures, men were taught to be aware of and sensitive to their wife's physical rhythms, adjusting their expectations and care accordingly.",
          modern:
            "This means being patient when her energy is low, being extra supportive during hormonal shifts, not taking moodiness personally, and even tracking her cycle so you can anticipate her needs before she asks. It's not about walking on eggshells - it's about understanding the whole person you love.",
          reflection: 'How aware are you of her physical and emotional cycles? How does it affect your patience?',
          action:
            'Ask her to help you understand her cycle better. Not as a joke - genuinely. "I want to be more supportive."'
        },
        {
          title: 'What Support Actually Looks Like to Her',
          intro:
            'Support might mean something completely different to her than it does to you. The only way to know is to ask and listen.',
          traditional:
            "Good husbands were attentive - they learned their wife's unique language of love and spoke it fluently.",
          modern:
            'To you, support might mean giving advice. To her, it might mean: watching the kids so she can have an hour alone, cleaning the kitchen without being asked, sitting next to her while she cries, or simply saying "I believe in you." Ask her: "What does support look like for you right now?"',
          reflection:
            'When you try to support her, does she usually feel supported? If not, what might she actually need?',
          action:
            'Ask her directly this week: "When you\'re overwhelmed, what\'s the most helpful thing I can do?" Write down her answer.'
        }
      ]
    }
  ],
  us: [
    {
      id: 'trust',
      title: 'Building Trust',
      icon: '🔐',
      color: 'var(--gold)',
      lessons: [
        {
          title: 'Trust as Daily Practice',
          intro:
            "Trust isn't built in one dramatic moment. It's built through hundreds of small, consistent actions over time.",
          traditional:
            'Marriage vows were sacred commitments. Trust was the foundation - not something to be earned and re-earned, but a covenant to be honored daily.',
          modern:
            "Daily trust-building looks like: being where you say you'll be, being honest even about small things, keeping each other's secrets, not checking each other's phones (but being willing to share if asked), following through on plans, and being transparent about friendships and finances.",
          reflection:
            'Is there any area where trust has been strained between you? What would rebuilding it look like?',
          action:
            'Together, discuss one trust-building practice you both commit to this week. Example: sharing your daily schedules openly.'
        },
        {
          title: 'Transparency Not Surveillance',
          intro:
            "Healthy relationships have openness, not monitoring. There's a crucial difference between trust and control.",
          traditional:
            'Traditional values emphasized loyalty and faithfulness - the commitment to being an open book to your partner by choice, not by force.',
          modern:
            "Transparency means voluntarily sharing: who you're spending time with, how you're feeling, what you're struggling with. It doesn't mean: demanding passwords, reading private journals without permission, or interrogating each other about every interaction. Trust is given generously and protected carefully.",
          reflection: 'Are there areas where one of you is more closed off? Why might that be?',
          action:
            "Share something with each other this week that you'd normally keep to yourself - not because you have to, but because you want to."
        },
        {
          title: 'Repair After Rupture',
          intro: 'Every relationship will have trust ruptures - both small and large. What matters is how you repair.',
          traditional:
            'The concept of forgiveness was central to every wisdom tradition. True repair required: genuine remorse, changed behavior, and patient restoration.',
          modern:
            'Modern repair means: owning what you did without deflecting ("I was wrong, full stop"), understanding the impact on your partner, creating a plan to prevent repeating it, being patient while trust rebuilds (you don\'t get to set the timeline), and not bringing up forgiven offenses in future arguments.',
          reflection: 'Is there an unresolved rupture between you? What would genuine repair look like?',
          action:
            'If there\'s something unresolved, initiate the repair this week with: "I know I hurt you when... I\'m sorry. What do you need from me?"'
        }
      ]
    },
    {
      id: 'conflict',
      title: 'Fighting Fair',
      icon: '🤝',
      color: 'var(--teal)',
      lessons: [
        {
          title: 'Rules of Engagement',
          intro:
            'Every couple fights. The couples who last are the ones who fight with rules - boundaries that protect the relationship even when emotions are high.',
          traditional:
            'Many cultures had explicit rules for marital conflict: never yell, never insult, never threaten to leave, never involve outsiders, always resolve before sleep.',
          modern:
            "Create your own rules. Some suggestions: No name-calling (ever). No bringing up past resolved issues. No walking out without saying when you'll be back. No silent treatment longer than an hour. No involving parents or friends in the middle of a fight. These rules protect you both when you're not at your best.",
          reflection:
            'What "rules" would make your fights fairer? Discuss this when you\'re both calm, not during a fight.',
          action: 'Together, write down 3-5 "fight rules" you both agree to. Post them somewhere you can reference.'
        },
        {
          title: 'The 20-Minute Rule',
          intro:
            "When emotions are flooding, your brain literally cannot process rationally. Taking a break isn't avoidance - it's wisdom.",
          traditional:
            'Cooling-off periods were a common practice. Walking away to pray, reflect, or simply breathe was encouraged before engaging in conflict resolution.',
          modern:
            'When things get heated, either person can call a 20-minute break. The rules: you must say "I need 20 minutes" (not just storm off), you must come back at the agreed time, and you must actually cool down (not rehearse your argument). After the break, start with "Here\'s what I was feeling..."',
          reflection: 'Do your arguments escalate because neither of you takes a break? What would change if you did?',
          action: 'Agree on a "pause word" that either of you can use to call a 20-minute cooling break.'
        },
        {
          title: 'Growth Through Disagreement',
          intro:
            "The goal of conflict isn't to win - it's to understand each other better and grow closer through the process.",
          traditional:
            'Iron sharpens iron. Disagreement between partners was seen as an opportunity for refinement - not destruction.',
          modern:
            "After every disagreement, ask yourselves: what did we learn? Was there truth in what they said that I need to sit with? Great couples don't avoid conflict - they metabolize it. Every resolved fight builds deeper trust, better communication, and stronger intimacy.",
          reflection: 'Think of your last argument. What was the underlying need that neither of you fully expressed?',
          action:
            'After your next disagreement (no matter how small), do a 5-minute debrief: "What were we really fighting about? What did we learn?"'
        }
      ]
    },
    {
      id: 'spark',
      title: 'Keeping the Spark',
      icon: '🔥',
      color: 'var(--rose)',
      lessons: [
        {
          title: 'Intentional Romance',
          intro:
            "The spark doesn't die because of time - it dies because of neglect. Romance requires the same intentionality as any other important goal.",
          traditional:
            "Courtship didn't end at marriage. The best relationships maintained the spirit of pursuit throughout the years - love letters, surprises, dedicated time together.",
          modern:
            'Schedule date nights and protect them like important meetings. Leave unexpected notes. Send a random "I was just thinking about how much I love you" text. Plan surprises - not always big ones. Buy the flowers on a Tuesday, not just Valentine\'s Day. Romance is a muscle: use it or lose it.',
          reflection: 'When was the last time you did something romantic that surprised your partner?',
          action:
            "Plan one romantic gesture this week that your partner doesn't expect. Keep it simple but intentional."
        },
        {
          title: 'Dating Your Partner',
          intro:
            "You started by dating each other. Don't stop. The person you're with today isn't the same person you met - keep learning who they are.",
          traditional:
            'Marriage was seen as an ongoing discovery - a lifetime of learning about and delighting in your partner.',
          modern:
            "Go on actual dates - not just dinner-and-movie autopilot. Try new things together: a cooking class, a hike, a bookstore date, a road trip with no plan. Ask each other unexpected questions: \"What's something you've never told anyone?\" Keep the curiosity alive. You'll never fully know another person - that's the adventure.",
          reflection:
            'When was your last real date - not just being in the same place, but intentionally enjoying each other?',
          action: "Plan a date this week that involves something you've never done together before."
        },
        {
          title: 'Intimacy Beyond the Physical',
          intro:
            'Physical intimacy is important, but lasting connection is built on emotional, intellectual, and spiritual intimacy too.',
          traditional:
            'The deepest marital bonds were described as "becoming one" - not just physically, but in purpose, understanding, and soul.',
          modern:
            'Build intimacy in multiple dimensions: share your dreams and fears (emotional), discuss ideas and learn together (intellectual), pray or meditate together (spiritual), and yes - prioritize physical connection with presence and generosity. When all four dimensions are active, the relationship feels unbreakable.',
          reflection: 'Which dimension of intimacy is strongest in your relationship? Which needs the most attention?',
          action: 'Choose the intimacy dimension that needs work and do one intentional thing in that area this week.'
        }
      ]
    }
  ]
};

function setGrowPath(path) {
  growPath = path;
  document
    .querySelectorAll('#grow-toggle .vt-option')
    .forEach(o => o.classList.toggle('active', o.dataset.path === path));
  // Move slider
  const opts = document.querySelectorAll('#grow-toggle .vt-option');
  const slider = document.getElementById('grow-slider');
  if (slider && opts.length) {
    const idx = path === 'her' ? 0 : path === 'his' ? 1 : 2;
    slider.style.transform = 'translateX(' + idx * 100 + '%)';
    slider.style.width = 100 / opts.length + '%';
  }
  renderGrowModules();
}

function listenGrowData() {
  if (!db) return;
  db.ref('grow/' + user + '/completed').on('value', snap => {
    growCompleted = snap.val() || {};
    renderGrowModules();
  });
  db.ref('grow/' + user + '/reflections').on('value', snap => {
    growReflections = snap.val() || {};
  });
}

function renderGrowModules() {
  const container = document.getElementById('grow-modules');
  if (!container) return;
  const modules = GROW_MODULES[growPath] || [];
  let totalLessons = 0,
    completedLessons = 0;

  const html = modules
    .map((mod, mi) => {
      const lessonCount = mod.lessons.length;
      totalLessons += lessonCount;
      const completed = mod.lessons.filter((_, li) => growCompleted[growPath + '_' + mod.id + '_' + li]).length;
      completedLessons += completed;
      const pct = Math.round((completed / lessonCount) * 100);
      const isOpen = growOpenModule === mod.id;

      return `<div class="grow-module" onclick="toggleGrowModule('${mod.id}')">
      <div class="gm-header">
        <div class="gm-icon" style="background:${mod.color}20">${mod.icon}</div>
        <div style="flex:1">
          <div class="gm-title">${mod.title}</div>
          <div class="gm-subtitle">${lessonCount} lessons ${completed === lessonCount ? '&bull; Complete!' : ''}</div>
        </div>
        ${completed === lessonCount ? '<span style="font-size:16px">✅</span>' : ''}
      </div>
      <div class="gm-progress">
        <div class="gm-bar"><div class="gm-bar-fill" style="width:${pct}%;background:${mod.color}"></div></div>
        <div class="gm-bar-text"><span>${completed}/${lessonCount}</span><span>${pct}%</span></div>
      </div>
    </div>
    ${
      isOpen
        ? `<div class="grow-lessons">
      ${mod.lessons
        .map((lesson, li) => {
          const key = growPath + '_' + mod.id + '_' + li;
          const isDone = growCompleted[key];
          return `<div class="grow-lesson-item ${isDone ? 'completed' : ''}" onclick="event.stopPropagation();openGrowLesson('${growPath}','${mod.id}',${li})">
          <div class="gli-num">${isDone ? '✓' : li + 1}</div>
          <div class="gli-title">${lesson.title}</div>
          <span style="font-size:14px;color:var(--t3)">›</span>
        </div>`;
        })
        .join('')}
    </div>`
        : ''
    }`;
    })
    .join('');

  container.innerHTML = html;

  // Update progress
  const pctEl = document.getElementById('grow-progress-pct');
  const countEl = document.getElementById('grow-progress-count');
  if (pctEl) pctEl.textContent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) + '%' : '0%';
  if (countEl) countEl.textContent = completedLessons + ' / ' + totalLessons;
}

function toggleGrowModule(id) {
  growOpenModule = growOpenModule === id ? null : id;
  renderGrowModules();
}

function openGrowLesson(path, moduleId, lessonIdx) {
  growCurrentLesson = { path, moduleId, lessonIdx };
  const modules = GROW_MODULES[path] || [];
  const mod = modules.find(m => m.id === moduleId);
  if (!mod || !mod.lessons[lessonIdx]) return;
  const lesson = mod.lessons[lessonIdx];
  const key = path + '_' + moduleId + '_' + lessonIdx;

  document.getElementById('grow-lesson-title').textContent = lesson.title;
  document.getElementById('grow-lesson-intro').textContent = lesson.intro;
  document.getElementById('grow-lesson-traditional').textContent = lesson.traditional;
  document.getElementById('grow-lesson-modern').textContent = lesson.modern;
  document.getElementById('grow-lesson-reflection-q').textContent = lesson.reflection;
  document.getElementById('grow-lesson-action').textContent = lesson.action;
  document.getElementById('grow-lesson-progress').textContent =
    'Lesson ' + (lessonIdx + 1) + ' of ' + mod.lessons.length;
  document.getElementById('grow-lesson-bar').style.width = ((lessonIdx + 1) / mod.lessons.length) * 100 + '%';
  document.getElementById('grow-lesson-reflection').value = growReflections[key] || '';
  document.getElementById('grow-prev-btn').disabled = lessonIdx === 0;
  document.getElementById('grow-next-btn').style.display = lessonIdx < mod.lessons.length - 1 ? '' : 'none';
  document.getElementById('grow-complete-btn').textContent = growCompleted[key] ? '✓ Completed' : 'Mark Complete';
  document.getElementById('grow-complete-btn').style.background = growCompleted[key] ? 'var(--emerald)' : 'var(--gold)';

  document.getElementById('grow-lesson-modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeGrowLesson() {
  // Save reflection if any text
  if (growCurrentLesson) {
    const key = growCurrentLesson.path + '_' + growCurrentLesson.moduleId + '_' + growCurrentLesson.lessonIdx;
    const text = document.getElementById('grow-lesson-reflection').value.trim();
    if (text && db) db.ref('grow/' + user + '/reflections/' + key).set(text);
  }
  document.getElementById('grow-lesson-modal').classList.remove('on');
  document.body.style.overflow = '';
  growCurrentLesson = null;
}

async function completeGrowLesson() {
  if (!growCurrentLesson || !db) return;
  const key = growCurrentLesson.path + '_' + growCurrentLesson.moduleId + '_' + growCurrentLesson.lessonIdx;
  const text = document.getElementById('grow-lesson-reflection').value.trim();
  await db.ref('grow/' + user + '/completed/' + key).set(true);
  if (text) await db.ref('grow/' + user + '/reflections/' + key).set(text);
  toast('Lesson completed!');
  awardXP(25);
  document.getElementById('grow-complete-btn').textContent = '✓ Completed';
  document.getElementById('grow-complete-btn').style.background = 'var(--emerald)';
}

function nextGrowLesson() {
  if (!growCurrentLesson) return;
  const { path, moduleId, lessonIdx } = growCurrentLesson;
  // Save current reflection
  const key = path + '_' + moduleId + '_' + lessonIdx;
  const text = document.getElementById('grow-lesson-reflection').value.trim();
  if (text && db) db.ref('grow/' + user + '/reflections/' + key).set(text);
  openGrowLesson(path, moduleId, lessonIdx + 1);
}

function prevGrowLesson() {
  if (!growCurrentLesson || growCurrentLesson.lessonIdx === 0) return;
  const { path, moduleId, lessonIdx } = growCurrentLesson;
  openGrowLesson(path, moduleId, lessonIdx - 1);
}

async function saveGrowReflection() {
  const text = document.getElementById('grow-reflection-input').value.trim();
  if (!text) {
    toast('Write something first');
    return;
  }
  const today = localDate();
  await db.ref('grow/' + user + '/dailyReflections/' + today).set({ text, path: growPath, timestamp: Date.now() });
  document.getElementById('grow-reflection-input').value = '';
  toast('Reflection saved!');
  awardXP(10);
}

// ========================================
// ===== NUTRITION MODULE =====
// ========================================
let nutritionData = {},
  recipeData = {};

var _nutrListenDate = null;
function listenNutritionData() {
  if (!db) return;
  var today = localDate();
  // If date changed (e.g., past midnight), detach old listener and re-attach
  if (_nutrListenDate && _nutrListenDate !== today) {
    db.ref('nutrition/' + user + '/meals/' + _nutrListenDate).off();
  }
  _nutrListenDate = today;
  db.ref('nutrition/' + user + '/meals/' + today).on('value', snap => {
    nutritionData = snap.val() || {};
    renderNutritionDay();
  });
  db.ref('nutrition/recipes').on('value', snap => {
    recipeData = snap.val() || {};
    renderRecipeList();
  });
  // Meal planning consolidated into pg-homelife
}

function renderNutritionDay() {
  const meals = nutritionData;
  let totalCals = 0,
    mealCount = 0,
    totalP = 0,
    totalC = 0,
    totalF = 0;
  ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(type => {
    const items = meals[type] ? Object.values(meals[type]) : [];
    mealCount += items.length;
    totalCals += items.reduce((s, i) => s + (i.calories || 0), 0);
    totalP += items.reduce((s, i) => s + (i.protein || 0), 0);
    totalC += items.reduce((s, i) => s + (i.carbs || 0), 0);
    totalF += items.reduce((s, i) => s + (i.fats || 0), 0);
    const ct = document.getElementById('meal-' + type + '-ct');
    if (ct) ct.textContent = items.length;
    const container = document.getElementById('meal-' + type);
    if (container) {
      container.innerHTML = items.length
        ? items
            .map(i => {
              const macroStr = [
                i.protein ? i.protein + 'p' : '',
                i.carbs ? i.carbs + 'c' : '',
                i.fats ? i.fats + 'f' : ''
              ]
                .filter(Boolean)
                .join('/');
              return `<div class="nh-food-item"><span class="nh-food-name">${esc(i.name)}</span><span class="nh-food-meta">${i.calories ? i.calories + ' cal' : ''}${macroStr ? ' · ' + macroStr : ''}</span></div>`;
            })
            .join('')
        : '';
    }
  });
  const el = id => document.getElementById(id);
  if (el('nutr-meals')) el('nutr-meals').textContent = mealCount;
  if (el('nutr-cals')) el('nutr-cals').textContent = totalCals;
  // Macros - update ring SVGs (use baseline if available, else default 2000)
  let calTarget = 2000;
  if (fitBaseline) {
    const weight = parseFloat(fitBaseline.weight) || 150;
    const actMult = [0, 1.2, 1.375, 1.55, 1.725, 1.9][fitBaseline.activityLevel || 2];
    const bmr = weight * 10 + 800; // simplified estimate
    let tdee = Math.round(bmr * actMult);
    const goal = fitBaseline.fitnessGoal;
    if (goal === 1) tdee -= 400;       // Lose Weight
    else if (goal === 2) tdee += 300;  // Build Muscle
    calTarget = Math.max(1200, Math.min(4000, tdee));
  }
  if (el('nutr-protein')) el('nutr-protein').textContent = totalP + 'g';
  if (el('nutr-carbs')) el('nutr-carbs').textContent = totalC + 'g';
  if (el('nutr-fats')) el('nutr-fats').textContent = totalF + 'g';
  // SVG ring offsets (circumference - progress)
  const macroCirc = 113.1;
  const calCirc = 389.6;
  if (el('nutr-protein-ring'))
    el('nutr-protein-ring').style.strokeDashoffset = macroCirc - Math.min(totalP / 150, 1) * macroCirc;
  if (el('nutr-carbs-ring'))
    el('nutr-carbs-ring').style.strokeDashoffset = macroCirc - Math.min(totalC / 250, 1) * macroCirc;
  if (el('nutr-fats-ring'))
    el('nutr-fats-ring').style.strokeDashoffset = macroCirc - Math.min(totalF / 65, 1) * macroCirc;
  if (el('nutr-cal-ring'))
    el('nutr-cal-ring').style.strokeDashoffset = calCirc - Math.min(totalCals / calTarget, 1) * calCirc;
  if (el('nutr-cal-total')) el('nutr-cal-total').textContent = totalCals;
  if (el('nutr-cal-target')) el('nutr-cal-target').textContent = calTarget;
  // Water
  const waterData = meals.water || 0;
  if (el('water-count')) el('water-count').textContent = waterData;
  if (el('nutr-water')) el('nutr-water').textContent = waterData;
  document.querySelectorAll('.nh-water-drop').forEach((g, i) => {
    g.classList.toggle('filled', i < waterData);
  });
  // Score
  const score = mealCount >= 3 ? (waterData >= 6 ? 'A' : waterData >= 4 ? 'B' : 'C') : mealCount >= 1 ? 'C' : '--';
  if (el('nutr-score')) el('nutr-score').textContent = score;
}

async function addMealItem(type) {
  const input = document.getElementById('meal-' + type + '-input');
  const calInput = document.getElementById('meal-' + type + '-cal');
  const proteinInput = document.getElementById('meal-' + type + '-protein');
  const carbsInput = document.getElementById('meal-' + type + '-carbs');
  const fatsInput = document.getElementById('meal-' + type + '-fats');
  const name = input.value.trim();
  if (!name) {
    toast('Enter a food item');
    return;
  }
  const calories = parseInt(calInput.value) || 0;
  const protein = parseInt(proteinInput?.value) || 0;
  const carbs = parseInt(carbsInput?.value) || 0;
  const fats = parseInt(fatsInput?.value) || 0;
  const today = localDate();
  await db.ref('nutrition/' + user + '/meals/' + today + '/' + type).push({
    name,
    calories,
    protein,
    carbs,
    fats,
    timestamp: Date.now()
  });
  input.value = '';
  calInput.value = '';
  if (proteinInput) proteinInput.value = '';
  if (carbsInput) carbsInput.value = '';
  if (fatsInput) fatsInput.value = '';
  toast('Added to ' + type);
  awardXP(5);
}

async function quickAddFood(name, cal, protein, carbs, fats) {
  const today = localDate();
  // Determine meal type by time of day
  const hour = new Date().getHours();
  const type = hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 20 ? 'dinner' : 'snacks';
  await db.ref('nutrition/' + user + '/meals/' + today + '/' + type).push({
    name,
    calories: cal,
    protein,
    carbs,
    fats,
    timestamp: Date.now()
  });
  toast(name + ' added to ' + type);
  awardXP(5);
}

function toggleMealSection(type) {
  const body = document.getElementById('meal-' + type);
  if (body) body.classList.toggle('open');
}

async function logWater(count) {
  const today = localDate();
  await db.ref('nutrition/' + user + '/meals/' + today + '/water').set(count);
}

// Meal planning functions consolidated into pg-homelife (modules-life.js)

async function saveRecipe() {
  const name = document.getElementById('recipe-name').value.trim();
  const desc = document.getElementById('recipe-desc').value.trim();
  if (!name) {
    toast('Enter recipe name');
    return;
  }
  await db.ref('nutrition/recipes').push({ name, description: desc, user, timestamp: Date.now() });
  document.getElementById('recipe-name').value = '';
  document.getElementById('recipe-desc').value = '';
  toast('Recipe saved');
}

function renderRecipeList() {
  const container = document.getElementById('recipe-list');
  if (!container) return;
  const items = Object.entries(recipeData);
  if (!items.length) {
    container.innerHTML = '<div class="empty">Save your favorite recipes</div>';
    return;
  }
  container.innerHTML = items
    .map(
      ([k, r]) => `
    <div class="recipe-card card" style="margin-bottom:8px">
      <div style="font-size:14px;font-weight:600;color:var(--cream)">${esc(r.name)}</div>
      ${r.description ? `<div style="font-size:12px;color:var(--t3);margin-top:4px;white-space:pre-wrap">${esc(r.description)}</div>` : ''}
      <div style="font-size:10px;color:var(--t3);margin-top:6px">by ${NAMES[r.user] || 'Unknown'}</div>
    </div>`
    )
    .join('');
}

// ========================================
// ===== CALENDAR MODULE =====
// ========================================
let calendarEvents = {},
  calMonth = new Date().getMonth(),
  calYear = new Date().getFullYear(),
  calSelectedDate = localDate();

function listenCalendarEvents() {
  if (!db) return;
  db.ref('calendar').on('value', snap => {
    calendarEvents = snap.val() || {};
    renderCalendar();
  });
}

function renderCalendar() {
  const el = id => document.getElementById(id);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  if (el('cal-month-label')) el('cal-month-label').textContent = months[calMonth] + ' ' + calYear;

  const grid = el('cal-grid');
  if (!grid) return;
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = localDate();
  const events = Object.values(calendarEvents);

  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const isToday = dateStr === today;
    const isSelected = dateStr === calSelectedDate;
    const dayEvents = events.filter(e => e.date === dateStr);
    const dots = dayEvents
      .map(e => {
        const colors = {
          joint: 'var(--lavender)',
          her: 'var(--rose)',
          him: 'var(--teal)',
          recurring: 'var(--gold)',
          countdown: 'var(--gold)'
        };
        return `<div style="width:4px;height:4px;border-radius:50%;background:${colors[e.type] || 'var(--gold)'}"></div>`;
      })
      .join('');
    html += `<div class="cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}" onclick="selectCalDay('${dateStr}')">
      <span>${d}</span>${dots ? `<div style="display:flex;gap:2px;justify-content:center;margin-top:2px">${dots}</div>` : ''}
    </div>`;
  }
  grid.innerHTML = html;
  renderCalDayEvents();
  renderUpcoming();
}

function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) {
    calMonth = 0;
    calYear++;
  }
  if (calMonth < 0) {
    calMonth = 11;
    calYear--;
  }
  renderCalendar();
}

// Swipe to change month
(function initCalSwipe() {
  var startX = 0;
  document.addEventListener(
    'touchstart',
    function (e) {
      var grid = document.getElementById('cal-grid');
      if (grid && grid.contains(e.target)) startX = e.touches[0].clientX;
      else startX = 0;
    },
    { passive: true }
  );
  document.addEventListener(
    'touchend',
    function (e) {
      if (!startX) return;
      var diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 60) calNav(diff < 0 ? 1 : -1);
      startX = 0;
    },
    { passive: true }
  );
})();

function selectCalDay(dateStr) {
  calSelectedDate = dateStr;
  renderCalendar();
}

function renderCalDayEvents() {
  const container = document.getElementById('cal-events');
  const label = document.getElementById('cal-day-label');
  if (!container) return;
  if (label) label.textContent = calSelectedDate;
  const events = Object.entries(calendarEvents).filter(([k, e]) => e.date === calSelectedDate);
  if (!events.length) {
    container.innerHTML = '<div class="empty">No events for this day</div>';
    return;
  }
  const colors = {
    joint: 'var(--lavender)',
    her: 'var(--rose)',
    him: 'var(--teal)',
    recurring: 'var(--gold)',
    countdown: 'var(--gold)'
  };
  container.innerHTML = events
    .map(
      ([k, e]) => `
    <div class="cal-event" style="border-left:3px solid ${colors[e.type] || 'var(--gold)'};padding:10px 14px;background:var(--card-bg);border-radius:0 14px 14px 0;margin-bottom:8px">
      <div style="font-size:13px;font-weight:600;color:var(--cream)">${esc(e.title)}</div>
      ${e.time ? `<div style="font-size:11px;color:var(--t3)">${e.time}</div>` : ''}
      ${e.notes ? `<div style="font-size:11px;color:var(--t3);margin-top:4px">${esc(e.notes)}</div>` : ''}
      <button onclick="deleteCalEvent('${k}')" style="background:none;border:none;color:var(--red);font-size:11px;cursor:pointer;margin-top:4px">Remove</button>
    </div>`
    )
    .join('');
}

function renderUpcoming() {
  const container = document.getElementById('cal-upcoming');
  if (!container) return;
  const today = localDate();
  const upcoming = Object.entries(calendarEvents)
    .filter(([k, e]) => e.date >= today)
    .sort((a, b) => a[1].date.localeCompare(b[1].date))
    .slice(0, 5);
  if (!upcoming.length) {
    container.innerHTML = '<div class="empty">No upcoming events</div>';
    return;
  }
  container.innerHTML = upcoming
    .map(
      ([k, e]) => `
    <div class="card-data" style="margin-bottom:6px">
      <div class="cd-accent" style="background:var(--teal)"></div>
      <div class="cd-number" style="font-size:11px;color:var(--teal)">${e.date.slice(5)}</div>
      <div class="cd-info"><div class="cd-label">${esc(e.title)}</div><div class="cd-sub">${e.type}</div></div>
    </div>`
    )
    .join('');
}

async function addCalEvent() {
  const title = document.getElementById('cal-event-title').value.trim();
  const date = document.getElementById('cal-event-date').value;
  const time = document.getElementById('cal-event-time').value;
  const type = document.getElementById('cal-event-type').value;
  const notes = document.getElementById('cal-event-notes').value.trim();
  if (!title || !date) {
    toast('Enter title and date');
    return;
  }
  await db.ref('calendar').push({ title, date, time, type, notes, createdBy: user, timestamp: Date.now() });
  document.getElementById('cal-event-title').value = '';
  document.getElementById('cal-event-notes').value = '';
  toast('Event added');
  awardXP(5);
}

async function deleteCalEvent(key) {
  await db.ref('calendar/' + key).remove();
  toast('Event removed');
}

// ========================================
// ===== DREAM HOME MODULE =====
// ========================================
let dreamHomeData = {},
  dhWishlist = {},
  currentRoom = null,
  dhConfig = {};

function listenDreamHome() {
  if (!db) return;
  db.ref('dreamHome').on('value', snap => {
    const data = snap.val() || {};
    dreamHomeData = data.rooms || {};
    dhWishlist = data.wishlist || {};
    dhConfig = data.config || {};
    renderDreamHome();
    dhRenderFinance();
  });
}

// Phase tabs
function dhPhase(phase, el) {
  document.querySelectorAll('.dh-phase').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.dh-panel').forEach(p => p.classList.remove('dh-panel-on'));
  const panel = document.getElementById('dh-p-' + phase);
  if (panel) panel.classList.add('dh-panel-on');
}

// Load saved config into UI
function dhLoadAll() {
  if (!db) return;
  db.ref('dreamHome/config')
    .once('value')
    .then(snap => {
      const c = snap.val() || {};
      dhConfig = c;
      // Location
      if (c.location) {
        const el = document.getElementById('dh-location');
        if (el) el.value = c.location;
      }
      const locSaved = document.getElementById('dh-location-saved');
      if (locSaved && c.location) locSaved.textContent = c.location;
      // Plot size
      if (c.plotSize) {
        document.querySelectorAll('.dh-size-opt').forEach(o => {
          o.classList.toggle('sel', o.onclick.toString().includes("'" + c.plotSize + "'"));
        });
      }
      // Build type
      if (c.buildType) {
        document.querySelectorAll('.dh-build-opt').forEach(o => {
          o.classList.toggle('sel', o.onclick.toString().includes("'" + c.buildType + "'"));
        });
      }
      // Specs
      ['stories', 'beds', 'baths', 'garage'].forEach(k => {
        const el = document.getElementById('dh-val-' + k);
        if (el && c[k]) el.textContent = c[k];
      });
      if (c.sqft) {
        const el = document.getElementById('dh-sqft');
        if (el) el.value = c.sqft;
      }
      // Tags
      const tags = c.tags || {};
      Object.entries(tags).forEach(([group, vals]) => {
        if (!vals) return;
        const selected = typeof vals === 'string' ? [vals] : Object.values(vals);
        document.querySelectorAll('.dh-tag').forEach(t => {
          if (t.onclick && t.onclick.toString().includes("'" + group + "'") && selected.includes(t.textContent.trim()))
            t.classList.add('sel');
        });
      });
      // Colors
      const colors = c.colors || {};
      Object.values(colors).forEach(hex => {
        document.querySelectorAll('.dh-color').forEach(el => {
          if (el.onclick && el.onclick.toString().includes(hex)) el.classList.add('selected');
        });
      });
      // Arch style
      if (c.archStyle) {
        document.querySelectorAll('.dh-arch-card').forEach(el => {
          el.classList.toggle('sel', el.onclick.toString().includes("'" + c.archStyle + "'"));
        });
        const as = document.getElementById('dh-arch-saved');
        if (as) as.textContent = c.archStyle;
      }
      // Budget
      if (c.totalBudget) {
        const el = document.getElementById('dh-total-budget');
        if (el) el.value = c.totalBudget;
      }
      const bd = c.budgetBreakdown || {};
      ['land', 'construction', 'architect', 'interior', 'landscape', 'contingency'].forEach(k => {
        const el = document.getElementById('dh-b-' + k);
        if (el && bd[k]) el.value = bd[k];
      });
      if (c.savedAmount) {
        const el = document.getElementById('dh-saved-amount');
        if (el) el.value = c.savedAmount;
      }
      if (c.targetDate) {
        const el = document.getElementById('dh-target-date');
        if (el) el.value = c.targetDate;
      }
      const ts = document.getElementById('dh-target-saved');
      if (ts && c.targetDate) ts.textContent = 'Target: ' + c.targetDate;
      // Timeline phase
      if (c.timelinePhase) {
        const phases = ['research', 'land', 'design', 'permits', 'build', 'movein'];
        const idx = phases.indexOf(c.timelinePhase);
        document.querySelectorAll('.dh-tl-phase').forEach((el, i) => {
          el.classList.toggle('done', i <= idx);
        });
      }
      // Personalize location placeholder based on user preference
      dhPersonalize();
      // Design notes
      dhRenderNotes();
      dhRenderFinance();
      dhRenderSummary();
      dhLoadChecklist();
    });
}

// Personalize dream home hints based on user's environment preference
function dhPersonalize() {
  var locInput = document.getElementById('dh-location');
  if (locInput && !locInput.value) {
    if (typeof user !== 'undefined') {
      locInput.placeholder =
        user === 'her' ? 'e.g. Coastal town, beachside community...' : 'e.g. Mountain town, cabin community...';
    }
  }
  // Add "suggested" hint to preferred tags based on user's taste
  if (typeof user !== 'undefined') {
    var isHer = user === 'her';
    // Location: Coastal for her, Mountain for him
    var locPref = isHer ? 'Coastal' : 'Mountain';
    document.querySelectorAll('#dh-location-prefs .dh-tag').forEach(function (t) {
      if (t.textContent.trim() === locPref && !t.classList.contains('sel')) {
        t.setAttribute('data-hint', 'suggested');
      }
    });
    // Terrain: Waterfront for her, Wooded for him
    var terrainPref = isHer ? 'Waterfront' : 'Wooded';
    document.querySelectorAll('.dh-tag').forEach(function (t) {
      if (
        t.onclick &&
        t.onclick.toString().includes("'terrain'") &&
        t.textContent.trim() === terrainPref &&
        !t.classList.contains('sel')
      ) {
        t.setAttribute('data-hint', 'suggested');
      }
    });
  }
}

// Save a single config key
async function dhSave(key, val) {
  if (!db || !val) return;
  await db.ref('dreamHome/config/' + key).set(val);
  toast('Saved');
  dhConfig[key] = val;
  // Update displayed saved values
  if (key === 'location') {
    const el = document.getElementById('dh-location-saved');
    if (el) el.textContent = val;
  }
  if (key === 'targetDate') {
    const el = document.getElementById('dh-target-saved');
    if (el) el.textContent = 'Target: ' + val;
  }
  if (key === 'totalBudget' || key === 'savedAmount') dhRenderFinance();
  dhRenderSummary();
}

// Stepper controls
function dhStep(key, dir) {
  const el = document.getElementById('dh-val-' + key);
  if (!el) return;
  let v = parseInt(el.textContent) + dir;
  if (v < 0) v = 0;
  if (key === 'stories' && v > 4) v = 4;
  if (v > 20) v = 20;
  el.textContent = v;
  if (db) db.ref('dreamHome/config/' + key).set(v);
}

// Plot size
function dhSelectSize(el, size) {
  document.querySelectorAll('.dh-size-opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  if (db) db.ref('dreamHome/config/plotSize').set(size);
  toast('Plot size: ' + size);
}

// Build type
function dhSelectBuild(el, type) {
  document.querySelectorAll('.dh-build-opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  if (db) db.ref('dreamHome/config/buildType').set(type);
  toast('Build type saved');
}

// Arch style
function dhSelectArch(el, style) {
  document.querySelectorAll('.dh-arch-card').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  if (db) db.ref('dreamHome/config/archStyle').set(style);
  const saved = document.getElementById('dh-arch-saved');
  if (saved) saved.textContent = style;
  toast('Style: ' + style);
}

// Toggle tags (multi-select per group)
function dhToggleTag(el, group, val) {
  el.classList.toggle('sel');
  if (!db) return;
  const ref = db.ref('dreamHome/config/tags/' + group);
  // Collect all selected in this group
  const selected = [];
  document.querySelectorAll('.dh-tag.sel').forEach(t => {
    if (t.onclick && t.onclick.toString().includes("'" + group + "'")) selected.push(t.textContent.trim());
  });
  ref.set(selected.length ? selected : null);
}

// Toggle color palette
function dhToggleColor(el, hex) {
  el.classList.toggle('selected');
  if (!db) return;
  const selected = [];
  document.querySelectorAll('.dh-color.selected').forEach(c => {
    const match = c.onclick.toString().match(/'(#[A-Fa-f0-9]+)'/);
    if (match) selected.push(match[1]);
  });
  db.ref('dreamHome/config/colors').set(selected.length ? selected : null);
}

// Design notes
async function dhSaveNote() {
  const el = document.getElementById('dh-design-notes');
  if (!el || !el.value.trim() || !db) return;
  await db.ref('dreamHome/notes').push({ text: el.value.trim(), user, timestamp: Date.now() });
  el.value = '';
  toast('Note saved');
  dhRenderNotes();
}

function dhRenderNotes() {
  const container = document.getElementById('dh-notes-list');
  if (!container || !db) return;
  db.ref('dreamHome/notes')
    .orderByChild('timestamp')
    .limitToLast(20)
    .once('value')
    .then(snap => {
      const notes = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        notes.push(v);
      });
      notes.reverse();
      if (!notes.length) {
        container.innerHTML = '';
        return;
      }
      container.innerHTML = notes
        .map(
          n => `
      <div class="dh-note-item">
        <div class="dh-note-text">${esc(n.text)}</div>
        <div class="dh-note-meta"><span>${NAMES[n.user] || ''}</span><span>${timeAgo(n.timestamp)}</span></div>
        <button class="dh-note-del" onclick="dhDelNote('${n._key}')">&times;</button>
      </div>`
        )
        .join('');
    });
}

async function dhDelNote(key) {
  if (!db) return;
  await db.ref('dreamHome/notes/' + key).remove();
  dhRenderNotes();
  toast('Note removed');
}

// Budget breakdown save
async function dhSaveBudget(cat, val) {
  if (!db) return;
  await db.ref('dreamHome/config/budgetBreakdown/' + cat).set(parseInt(val) || 0);
  dhRenderFinance();
}

// Timeline phase
function dhSetTimeline(el, phase) {
  const phases = ['research', 'land', 'design', 'permits', 'build', 'movein'];
  const idx = phases.indexOf(phase);
  document.querySelectorAll('.dh-tl-phase').forEach((p, i) => {
    p.classList.toggle('done', i <= idx);
  });
  if (db) db.ref('dreamHome/config/timelinePhase').set(phase);
  toast('Phase: ' + phase);
  dhConfig.timelinePhase = phase;
  dhRenderSummary();
}

// Render finance section
function dhRenderFinance() {
  // Budget overview
  const totalBudget = parseInt(dhConfig.totalBudget) || 0;
  const bd = dhConfig.budgetBreakdown || {};
  const allocated = Object.values(bd).reduce((s, v) => s + (parseInt(v) || 0), 0);
  const wishTotal = Object.values(dhWishlist).reduce((s, i) => s + (i.price || 0), 0);
  let roomTotal = 0;
  Object.values(dreamHomeData).forEach(room => {
    Object.values(room).forEach(idea => {
      roomTotal += idea.budget || 0;
    });
  });

  const overviewEl = document.getElementById('dh-budget-overview');
  if (overviewEl && totalBudget > 0) {
    const spent = allocated + wishTotal + roomTotal;
    const pct = Math.min(100, Math.round((spent / totalBudget) * 100));
    const color = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--gold)' : 'var(--emerald)';
    overviewEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
        <span style="font-size:11px;color:var(--t3)">Allocated</span>
        <span style="font-size:18px;font-weight:700;color:var(--gold)">$${spent.toLocaleString()} <span style="font-size:11px;color:var(--t3);font-weight:400">/ $${totalBudget.toLocaleString()}</span></span>
      </div>
      <div class="dh-prog-bar"><div class="dh-prog-fill" style="width:${pct}%;background:${color}"></div></div>
      <div style="font-size:10px;color:var(--t3);text-align:right;margin-top:4px">${pct}% allocated</div>`;
  }

  // Budget bar breakdown
  const barWrap = document.getElementById('dh-budget-bar-wrap');
  if (barWrap && allocated > 0) {
    const cats = [
      { key: 'land', label: 'Land', color: 'var(--teal)' },
      { key: 'construction', label: 'Build', color: 'var(--gold)' },
      { key: 'architect', label: 'Design', color: 'var(--lavender)' },
      { key: 'interior', label: 'Interior', color: 'var(--rose)' },
      { key: 'landscape', label: 'Landscape', color: 'var(--emerald)' },
      { key: 'contingency', label: 'Buffer', color: 'var(--t3)' }
    ];
    const segs = cats
      .filter(c => bd[c.key] > 0)
      .map(c => {
        const pct = Math.round(((parseInt(bd[c.key]) || 0) / allocated) * 100);
        return `<div class="dh-bar-seg" style="width:${pct}%;background:${c.color}" title="${c.label}: $${(parseInt(bd[c.key]) || 0).toLocaleString()}"></div>`;
      })
      .join('');
    const legend = cats
      .filter(c => bd[c.key] > 0)
      .map(
        c =>
          `<span class="dh-bar-legend"><span class="dh-bar-dot" style="background:${c.color}"></span>${c.label} $${(parseInt(bd[c.key]) || 0).toLocaleString()}</span>`
      )
      .join('');
    barWrap.innerHTML = `<div class="dh-bar-track">${segs}</div><div class="dh-bar-legends">${legend}</div>`;
  }

  // Savings progress
  const savedAmt = parseInt(dhConfig.savedAmount) || 0;
  const savingsEl = document.getElementById('dh-savings-bar');
  if (savingsEl && totalBudget > 0) {
    const pct = Math.min(100, Math.round((savedAmt / totalBudget) * 100));
    savingsEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:11px;color:var(--t3)">Saved</span>
        <span style="font-size:14px;font-weight:600;color:var(--emerald)">$${savedAmt.toLocaleString()}</span>
      </div>
      <div class="dh-prog-bar"><div class="dh-prog-fill" style="width:${pct}%;background:var(--emerald)"></div></div>
      <div style="font-size:10px;color:var(--t3);text-align:right;margin-top:4px">${pct}% of goal</div>`;
  }
}

function renderDreamHome() {
  const rooms = [
    'living',
    'kitchen',
    'bedroom',
    'bathroom',
    'office',
    'outdoor',
    'nursery',
    'garage',
    'laundry',
    'entertainment'
  ];
  rooms.forEach(r => {
    const ct = document.getElementById('dh-' + r + '-ct');
    if (ct) {
      const ideas = dreamHomeData[r] ? Object.keys(dreamHomeData[r]).length : 0;
      ct.textContent = ideas + ' idea' + (ideas !== 1 ? 's' : '');
    }
  });

  // Wishlist
  const wlContainer = document.getElementById('dh-wishlist');
  if (wlContainer) {
    const items = Object.entries(dhWishlist);
    if (!items.length) {
      wlContainer.innerHTML = '<div class="empty">Add items to your home wishlist</div>';
      return;
    }
    wlContainer.innerHTML = items
      .map(
        ([k, i]) => `
      <div class="dh-wishlist-item">
        <span class="dwi-name">${esc(i.name)}</span>
        ${i.price ? `<span class="dwi-price">$${i.price.toLocaleString()}</span>` : ''}
        <button onclick="deleteHomeWish('${k}')" class="dh-note-del">&times;</button>
      </div>`
      )
      .join('');
  }
}

function openRoom(room) {
  currentRoom = room;
  const names = {
    living: 'Living Room',
    bedroom: 'Master Bedroom',
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    outdoor: 'Outdoor',
    office: 'Home Office',
    nursery: 'Nursery / Kids',
    garage: 'Garage',
    laundry: 'Laundry',
    entertainment: 'Entertainment'
  };
  document.getElementById('dh-room-title').textContent = names[room] || room;
  showEl('dh-room-detail');
  hideEl('dh-rooms');
  renderRoomIdeas();
}

function closeRoomDetail() {
  hideEl('dh-room-detail');
  showEl('dh-rooms');
  currentRoom = null;
}

function renderRoomIdeas() {
  const container = document.getElementById('dh-room-ideas');
  if (!container || !currentRoom) return;
  const ideas = dreamHomeData[currentRoom] ? Object.entries(dreamHomeData[currentRoom]) : [];
  if (!ideas.length) {
    container.innerHTML = '<div class="empty">Add ideas for this room</div>';
    return;
  }
  container.innerHTML = ideas
    .map(
      ([k, i]) => `
    <div class="card" style="margin-bottom:8px">
      <div style="font-size:13px;color:var(--cream);white-space:pre-wrap">${esc(i.notes || '')}</div>
      ${i.link ? `<a href="${esc(i.link)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--teal)">Inspiration link</a>` : ''}
      <div style="display:flex;gap:12px;margin-top:6px;font-size:11px;color:var(--t3)">
        ${i.budget ? `<span>$${i.budget.toLocaleString()}</span>` : ''}
        <span>${i.priority || 'nice'}</span>
        <span>${i.timeline || ''}</span>
        <span>${NAMES[i.user] || ''}</span>
      </div>
      <button onclick="deleteRoomIdea('${k}')" class="dh-note-del" style="margin-top:4px">Remove</button>
    </div>`
    )
    .join('');
}

async function addRoomIdea() {
  if (!currentRoom) return;
  const notes = document.getElementById('dh-room-notes').value.trim();
  const link = document.getElementById('dh-room-link').value.trim();
  const budget = parseInt(document.getElementById('dh-room-budget').value) || 0;
  const priority = document.getElementById('dh-room-priority').value;
  const timeline = document.getElementById('dh-room-timeline').value;
  if (!notes && !link) {
    toast('Add notes or a link');
    return;
  }
  await db
    .ref('dreamHome/rooms/' + currentRoom)
    .push({ notes, link, budget, priority, timeline, user, timestamp: Date.now() });
  document.getElementById('dh-room-notes').value = '';
  document.getElementById('dh-room-link').value = '';
  document.getElementById('dh-room-budget').value = '';
  toast('Idea added');
  awardXP(10);
}

async function deleteRoomIdea(key) {
  if (!currentRoom) return;
  await db.ref('dreamHome/rooms/' + currentRoom + '/' + key).remove();
}

async function addHomeWish() {
  const name = document.getElementById('dh-wish-name').value.trim();
  const price = parseInt(document.getElementById('dh-wish-price').value) || 0;
  if (!name) return;
  await db.ref('dreamHome/wishlist').push({ name, price, user, timestamp: Date.now() });
  document.getElementById('dh-wish-name').value = '';
  document.getElementById('dh-wish-price').value = '';
  toast('Added to wishlist');
}

async function deleteHomeWish(key) {
  await db.ref('dreamHome/wishlist/' + key).remove();
  toast('Removed from wishlist');
}

// Summary card renderer
function dhRenderSummary() {
  const c = dhConfig;
  const locEl = document.getElementById('dh-s-location');
  if (locEl) locEl.textContent = c.location || 'Not set';
  const styleEl = document.getElementById('dh-s-style');
  if (styleEl) styleEl.textContent = c.archStyle || 'Not set';
  const specEl = document.getElementById('dh-s-specs');
  if (specEl) {
    const beds = c.beds || 3,
      baths = c.baths || 2,
      sqft = c.sqft;
    specEl.textContent = `${beds} bed / ${baths} bath${sqft ? ' / ' + parseInt(sqft).toLocaleString() + ' sqft' : ''}`;
  }
  const budEl = document.getElementById('dh-s-budget');
  if (budEl) budEl.textContent = c.totalBudget ? '$' + parseInt(c.totalBudget).toLocaleString() : 'Not set';
  const savEl = document.getElementById('dh-s-saved');
  if (savEl) savEl.textContent = '$' + (parseInt(c.savedAmount) || 0).toLocaleString();
  const phaseEl = document.getElementById('dh-s-phase');
  const phaseNames = {
    research: 'Research',
    land: 'Land Search',
    design: 'Design',
    permits: 'Permits',
    build: 'Building',
    movein: 'Move In'
  };
  if (phaseEl) phaseEl.textContent = phaseNames[c.timelinePhase] || 'Research';

  // Planning progress - count how many config fields are filled
  let filled = 0,
    total = 10;
  if (c.location) filled++;
  if (c.plotSize) filled++;
  if (c.buildType) filled++;
  if (c.archStyle) filled++;
  if (c.sqft) filled++;
  if (c.totalBudget) filled++;
  if (c.tags && Object.keys(c.tags).length > 0) filled++;
  if (c.colors && c.colors.length > 0) filled++;
  if (c.timelinePhase && c.timelinePhase !== 'research') filled++;
  if (c.targetDate) filled++;
  const pct = Math.round((filled / total) * 100);
  const pctEl = document.getElementById('dh-sum-pct');
  if (pctEl) pctEl.textContent = pct + '%';
  const fillEl = document.getElementById('dh-sum-fill');
  if (fillEl) fillEl.style.width = pct + '%';
}

// Mortgage calculator
function dhCalcMortgage() {
  const price = parseFloat(document.getElementById('dh-mort-price').value) || 0;
  const downPct = parseFloat(document.getElementById('dh-mort-down').value) || 20;
  const rate = parseFloat(document.getElementById('dh-mort-rate').value) || 6.5;
  const years = parseInt(document.getElementById('dh-mort-term').value) || 30;
  const resultEl = document.getElementById('dh-mort-result');
  if (!resultEl || !price) {
    if (resultEl) resultEl.innerHTML = '';
    return;
  }

  const down = price * (downPct / 100);
  const loan = price - down;
  const monthlyRate = rate / 100 / 12;
  const numPayments = years * 12;
  let monthly = 0;
  if (monthlyRate > 0) {
    monthly =
      (loan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  } else {
    monthly = loan / numPayments;
  }
  const totalPaid = monthly * numPayments;
  const totalInterest = totalPaid - loan;

  resultEl.innerHTML = `
    <div class="dh-mort-row"><span>Down Payment</span><span>$${Math.round(down).toLocaleString()}</span></div>
    <div class="dh-mort-row"><span>Loan Amount</span><span>$${Math.round(loan).toLocaleString()}</span></div>
    <div class="dh-mort-row dh-mort-highlight"><span>Monthly Payment</span><span>$${Math.round(monthly).toLocaleString()}</span></div>
    <div class="dh-mort-row"><span>Total Interest</span><span>$${Math.round(totalInterest).toLocaleString()}</span></div>
    <div class="dh-mort-row"><span>Total Paid</span><span>$${Math.round(totalPaid).toLocaleString()}</span></div>`;
}

// Build checklist toggle
function dhToggleCheck(el) {
  el.classList.toggle('done');
  // Save checklist state
  if (!db) return;
  const items = document.querySelectorAll('#dh-checklist .dh-check-item');
  const state = {};
  items.forEach((item, i) => {
    state[i] = item.classList.contains('done');
  });
  db.ref('dreamHome/config/checklist').set(state);
}

function dhLoadChecklist() {
  if (!db) return;
  db.ref('dreamHome/config/checklist')
    .once('value')
    .then(snap => {
      const state = snap.val() || {};
      const items = document.querySelectorAll('#dh-checklist .dh-check-item');
      items.forEach((item, i) => {
        if (state[i]) item.classList.add('done');
      });
    });
}

// ===== SHARED GROCERY LIST =====
async function addGroceryItem(inputId) {
  if (!db || !user) return;
  const input = document.getElementById(inputId || 'grocery-input');
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;
  await db.ref('grocery').push({
    name,
    checked: false,
    addedBy: user,
    timestamp: Date.now()
  });
  input.value = '';
  toast('Added');
}

function listenGrocery() {
  if (!db) return;
  db.ref('grocery')
    .orderByChild('timestamp')
    .on('value', snap => {
      const items = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        items.push(v);
      });
      // Render grocery list
      ['grocery-list'].forEach(elId => {
        const el = document.getElementById(elId);
        if (!el) return;
        if (!items.length) {
          el.innerHTML = '<div class="empty">Your shared shopping list</div>';
          return;
        }
        const unchecked = items.filter(i => !i.checked);
        const checked = items.filter(i => i.checked);
        el.innerHTML = [...unchecked, ...checked]
          .map(i => {
            return `<div class="grocery-item ${i.checked ? 'done' : ''}">
          <div class="grocery-check" onclick="toggleGrocery('${i._key}',${!i.checked})">${i.checked ? '✓' : ''}</div>
          <span class="grocery-name">${esc(i.name)}</span>
          <button class="item-delete" aria-label="Delete" onclick="db.ref('grocery/${i._key}').remove();toast('Removed')">×</button>
        </div>`;
          })
          .join('');
      });
    });
}

async function toggleGrocery(key, checked) {
  if (!db) return;
  await db.ref('grocery/' + key + '/checked').set(checked);
}

async function clearCheckedGrocery() {
  if (!db) return;
  const snap = await db.ref('grocery').once('value');
  const updates = {};
  snap.forEach(c => {
    if (c.val().checked) updates[c.key] = null;
  });
  await db.ref('grocery').update(updates);
  toast('Cleared checked items');
}

// ===== SHARED TO-DO LIST =====
async function addSharedTodo() {
  if (!db || !user) return;
  const input = document.getElementById('todo-input');
  const title = input.value.trim();
  if (!title) return;
  await db.ref('sharedTodos').push({
    title,
    done: false,
    addedBy: user,
    timestamp: Date.now()
  });
  input.value = '';
  toast('Task added');
}

function listenSharedTodos() {
  if (!db) return;
  db.ref('sharedTodos')
    .orderByChild('timestamp')
    .on('value', snap => {
      const items = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        items.push(v);
      });
      items.reverse();
      const el = document.getElementById('shared-todo-list');
      if (!el) return;
      if (!items.length) {
        el.innerHTML = '<div class="empty">Tasks for both of you</div>';
        return;
      }
      el.innerHTML = items
        .map(i => {
          const who = i.addedBy === user ? 'You' : NAMES[i.addedBy] || '?';
          return `<div class="todo-item ${i.done ? 'done' : ''}">
        <div class="todo-check" onclick="toggleSharedTodo('${i._key}',${!i.done})">${i.done ? '✓' : ''}</div>
        <div class="todo-info">
          <span class="todo-title">${esc(i.title)}</span>
          <span class="todo-by">${who}</span>
        </div>
        <button class="item-delete" aria-label="Delete" onclick="db.ref('sharedTodos/${i._key}').remove();toast('Removed')">×</button>
      </div>`;
        })
        .join('');
    });
}

async function toggleSharedTodo(key, done) {
  if (!db) return;
  await db.ref('sharedTodos/' + key + '/done').set(done);
  if (done) toast('Done ✓');
}

// ===== DREAM HOME VISION BOARD =====
let dhSelectedColors = [];
let dhSelectedMusts = [];

function toggleDHColor(color, btn) {
  const idx = dhSelectedColors.indexOf(color);
  if (idx > -1) {
    dhSelectedColors.splice(idx, 1);
    btn.classList.remove('selected');
  } else if (dhSelectedColors.length < 5) {
    dhSelectedColors.push(color);
    btn.classList.add('selected');
  } else {
    toast('Select up to 5 colors');
  }
}

function toggleDHMust(item, btn) {
  const idx = dhSelectedMusts.indexOf(item);
  if (idx > -1) {
    dhSelectedMusts.splice(idx, 1);
    btn.classList.remove('selected');
  } else {
    dhSelectedMusts.push(item);
    btn.classList.add('selected');
  }
}

async function saveDHVision() {
  if (!db || !user) return;
  await db.ref('dreamHome/vision/' + user).set({
    colors: dhSelectedColors,
    mustHaves: dhSelectedMusts,
    updatedAt: Date.now()
  });
  toast('Vision saved!');
  loadDHVisions();
}

function loadDHVisions() {
  if (!db) return;
  db.ref('dreamHome/vision').on('value', snap => {
    const data = snap.val() || {};
    renderDHVisionCompare(data);
    // Restore selections
    const mine = data[user];
    if (mine) {
      dhSelectedColors = mine.colors || [];
      dhSelectedMusts = mine.mustHaves || [];
      document.querySelectorAll('.dh-color').forEach(el => {
        const bg = el.style.background || el.style.backgroundColor;
        el.classList.toggle(
          'selected',
          dhSelectedColors.some(c => c.toLowerCase() === bg.toLowerCase() || c === bg)
        );
      });
      document.querySelectorAll('.dh-mh-btn').forEach(el => {
        const item = el.getAttribute('onclick')?.match(/toggleDHMust\('(\w[\w-]*)'/)?.[1];
        if (item) el.classList.toggle('selected', dhSelectedMusts.includes(item));
      });
    }
  });
}

function renderDHVisionCompare(data) {
  const el = document.getElementById('dh-vision-compare');
  if (!el) return;
  const mine = data[user];
  const theirs = data[partner];
  if (!mine && !theirs) {
    el.innerHTML = '';
    return;
  }

  let html = '';
  // Show overlap
  if (mine && theirs) {
    const sharedColors = (mine.colors || []).filter(c => (theirs.colors || []).includes(c));
    const sharedMusts = (mine.mustHaves || []).filter(m => (theirs.mustHaves || []).includes(m));
    if (sharedColors.length || sharedMusts.length) {
      html += `<div class="card" style="margin-bottom:12px;border-left:3px solid var(--gold)">
        <div style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">You Both Want</div>`;
      if (sharedColors.length) {
        html += '<div style="display:flex;gap:4px;margin-bottom:8px">';
        sharedColors.forEach(c => {
          html += `<div style="width:28px;height:28px;border-radius:8px;background:${c};border:2px solid var(--gold)"></div>`;
        });
        html += '</div>';
      }
      if (sharedMusts.length) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
        sharedMusts.forEach(m => {
          html += `<span style="padding:3px 10px;border-radius:10px;font-size:11px;background:var(--tint);color:var(--gold)">${m}</span>`;
        });
        html += '</div>';
      }
      html += '</div>';
    }
  }

  [user, partner].forEach(p => {
    const v = data[p];
    if (!v) return;
    const name = NAMES[p];
    const bc = p === user ? 'var(--gold)' : 'var(--rose)';
    html += `<div class="card" style="margin-bottom:10px;border-left:3px solid ${bc}">
      <div style="font-size:12px;font-weight:600;color:var(--cream);margin-bottom:8px">${name}'s Vision</div>`;
    if (v.colors && v.colors.length) {
      html += '<div style="display:flex;gap:4px;margin-bottom:8px">';
      v.colors.forEach(c => {
        html += `<div style="width:24px;height:24px;border-radius:6px;background:${c};border:1px solid var(--bdr-s)"></div>`;
      });
      html += '</div>';
    }
    if (v.mustHaves && v.mustHaves.length) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
      v.mustHaves.forEach(m => {
        html += `<span style="padding:2px 8px;border-radius:8px;font-size:10px;background:var(--input-bg);color:var(--t2)">${m}</span>`;
      });
      html += '</div>';
    }
    html += '</div>';
  });
  el.innerHTML = html;
}

// ========================================
// ===== SIMPLIFIED FITNESS - COUPLE CHALLENGES & QUICK LOG =====
// ========================================
var FIT_CHALLENGES = [
  'Do 20 squats together today',
  'Take a 15-minute walk together',
  'Hold a plank for 30 seconds — both of you',
  'Do 10 push-ups and send a selfie after',
  'Stretch together for 10 minutes',
  'Dance to one full song together',
  'Race each other: 20 jumping jacks, who finishes first?',
  'Do wall sits for 45 seconds together',
  'Go for a run (even a short one)',
  'Try 10 burpees — cheer each other on',
  'Yoga together for 15 minutes (YouTube a flow)',
  'Take the stairs all day today',
  'Do 30 crunches — partner holds your feet',
  'Challenge: no sitting for 1 hour straight',
  'Workout in the morning before checking your phone'
];

function completeFitChallenge() {
  if (typeof db === 'undefined' || !db) return;
  var today = localDate();
  db.ref('fitness/' + user + '/challenges/' + today).set({
    challenge: document.getElementById('fit-challenge-text').textContent,
    completed: true,
    timestamp: Date.now()
  });
  toast('Challenge done!');
  if (typeof awardXP === 'function') awardXP(5);
  var el = document.getElementById('fit-challenge-status');
  if (el) el.textContent = 'Completed today!';
}

function skipFitChallenge() {
  var idx = Math.floor(Math.random() * FIT_CHALLENGES.length);
  var el = document.getElementById('fit-challenge-text');
  if (el) el.textContent = FIT_CHALLENGES[idx];
}

function quickLogWorkout() {
  if (typeof db === 'undefined' || !db) return;
  var type = document.getElementById('fit-log-type').value;
  var duration = parseInt(document.getElementById('fit-log-duration').value) || 0;
  var note = (document.getElementById('fit-log-note').value || '').trim();
  if (!duration) { toast('How many minutes?'); return; }
  var today = localDate();
  db.ref('fitness/' + user + '/workouts').push({
    type: type,
    duration: duration,
    note: note,
    date: today,
    user: user,
    timestamp: Date.now()
  });
  toast('Workout logged!');
  if (typeof awardXP === 'function') awardXP(10);
  document.getElementById('fit-log-duration').value = '';
  document.getElementById('fit-log-note').value = '';
}

// ========================================
// ===== SIMPLIFIED NUTRITION - MEAL PLANNING =====
// ========================================
function addMealPlan() {
  if (typeof db === 'undefined' || !db) return;
  var meal = (document.getElementById('meal-plan-input').value || '').trim();
  var slot = document.getElementById('meal-plan-slot').value;
  if (!meal) { toast('What are you eating?'); return; }
  var today = localDate();
  db.ref('nutrition/mealPlans/' + today).push({
    meal: meal,
    slot: slot,
    user: user,
    timestamp: Date.now()
  });
  toast('Meal planned!');
  document.getElementById('meal-plan-input').value = '';
}

// ========================================
// ===== GRATITUDE PARTNER PROMPTS =====
// ========================================
var GRAT_PARTNER_PROMPTS = [
  'What did <span class="pname"></span> do recently that made you smile?',
  'What quality in <span class="pname"></span> are you most grateful for?',
  'When did <span class="pname"></span> last make you feel truly loved?',
  'What sacrifice has <span class="pname"></span> made for you that you appreciate?',
  'What is something <span class="pname"></span> does that you never want them to stop?',
  'What is your favorite memory with <span class="pname"></span> this month?',
  'How has <span class="pname"></span> helped you grow as a person?',
  'What makes <span class="pname"></span> different from everyone else?',
  'When was the last time <span class="pname"></span> surprised you with kindness?',
  'What about <span class="pname"></span> makes you feel safe?'
];

function rotateGratPrompt() {
  var el = document.getElementById('grat-prompt-text');
  if (!el) return;
  var day = new Date().getDay();
  el.innerHTML = GRAT_PARTNER_PROMPTS[day % GRAT_PARTNER_PROMPTS.length];
  if (typeof fillPartnerNames === 'function') fillPartnerNames();
}

// ========================================
// ===== DATE NIGHT MEMORY =====
// ========================================
function saveDateMemory() {
  if (typeof db === 'undefined' || !db) return;
  var text = (document.getElementById('dn-memory-text').value || '').trim();
  if (!text) { toast('Write a quick memory first'); return; }
  db.ref('memories').push({
    caption: text,
    album: 'dates',
    date: localDate(),
    user: user,
    timestamp: Date.now()
  });
  toast('Memory saved!');
  document.getElementById('dn-memory-text').value = '';
  document.getElementById('dn-memory-prompt').classList.add('d-none');
}

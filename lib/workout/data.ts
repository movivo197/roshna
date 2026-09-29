import { WorkoutRoutine, WorkoutLevel, WorkoutProfile } from './types';

export const WORKOUT_ROUTINES: WorkoutRoutine[] = [
  // ── مبتدی (Beginner) ──
  {
    id: 'gentle-aerobic-flow',
    title: 'ایروبیک ریتمیک سبک و پرنشاط (Gentle Cardio Flow)',
    subtitle: 'شروع دلنشین تحرک روزانه، گرم کردن مفاصل و افزایش اکسیژن‌رسانی',
    level: 'beginner',
    targetHeartRateZone: '۱۰۰ تا ۱۲۰ ضربان در دقیقه (منطقه چربی‌سوزی سبک)',
    calorieBurnPer15Min: 95,
    themeColor: '#e11d48',
    gradient: 'linear-gradient(135deg, #9f1239 0%, #4c0519 100%)',
    benefits: [
      'روان‌سازی مفاصل و رهایی از خشکی عضلانی ناشی از نشستن طولانی',
      'ترشح ملایم اندورفین و افزایش فوری سطح انرژی و شادابی',
      'بهبود گردش خون بدون وارد کردن فشار سنگین به زانوها و مهره‌ها'
    ],
    scienceNote: 'تمرینات کم‌فشار (Low Impact) با فعال‌سازی پمپ‌های وریدی در ساق پا، بازگشت خون به قلب را تا ۳۵٪ تسهیل کرده و خستگی سلولی را بدون ترشح بیش از حد اسید لاکتیک برطرف می‌کنند.',
    warmupSeconds: 60,
    cooldownSeconds: 60,
    movements: [
      {
        name: 'Rhythmic Marching',
        persianName: 'گام‌برداری ریتمیک درجا',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'low',
        targetMuscles: ['چهارسر ران', 'ساق پا', 'عضلات قلبی'],
        instructions: [
          'صاف بایستید، قفسه سینه را باز نگه دارید و شکم را منقبض کنید.',
          'پاها را با ریتم موزون بالا بیاورید و دست‌ها را هماهنگ با پاها تاب دهید.',
          'نفس عمیق و پیوسته از بینی بکشید و از دهان خارج کنید.'
        ],
        tips: 'فرود پاها را نرم و روی پنجه انجام دهید تا ضربه‌ای به پاشنه نیاید.'
      },
      {
        name: 'Step Touch & Arm Swings',
        persianName: 'استپ تاچ به طرفین با تاب بازو',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'low',
        targetMuscles: ['سرینی', 'نزدیک‌کننده‌های ران', 'دلتاپشت'],
        instructions: [
          'یک قدم به سمت راست بردارید و پای چپ را در کنار آن به زمین لمس دهید.',
          'بلافاصله یک قدم به سمت چپ بردارید و پای راست را لمس دهید.',
          'همزمان بازوها را در ارتفاع سینه به آرامی باز و بسته کنید.'
        ],
        tips: 'زانوها در هر گام اندکی خم باشند تا مفاصل نرم عمل کنند.'
      },
      {
        name: 'Gentle High Knee Taps',
        persianName: 'لمس زانو بلند بدون پرش',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'low',
        targetMuscles: ['خم‌کننده‌های لگن', 'عضلات تحتانی شکم'],
        instructions: [
          'زانوی راست را تا ارتفاع لگن بالا بیاورید و با دست چپ آن را به آرامی لمس کنید.',
          'پا را پایین آورده و حرکت را با زانوی چپ و دست راست تکرار کنید.',
          'ریتم را آرام و هماهنگ حفظ کنید.'
        ],
        tips: 'کمر را صاف نگه دارید و هنگام بالا آوردن زانو به جلو خم نشوید.'
      },
      {
        name: 'Shadow Jab & Cross',
        persianName: 'ضربات مشت آرام درجا (شادوبوکسینگ سبک)',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'moderate',
        targetMuscles: ['سرشانه', 'پشت بازو', 'میان‌تنه'],
        instructions: [
          'یک پا کمی جلوتر، گارد دست‌ها را مقابل چانه نگه دارید.',
          'با مشت جلویی یک ضربه مستقیم (جب) و با مشت عقبی یک کراس بزنید.',
          'با هر پرتاب مشت، پای عقبی کمی روی پنجه چرخش کند.'
        ],
        tips: 'آرنج را در انتهای ضربه قفل نکنید؛ مشت را شل رها کنید و سریع برگردانید.'
      },
      {
        name: 'Side Reach & Tap',
        persianName: 'کشش جانبی به پهلو با پای مخالف',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'low',
        targetMuscles: ['مورب شکمی', 'لتیسیموس', 'لگن'],
        instructions: [
          'پای راست را به پهلو باز کرده و دست چپ را با زاویه بالا به سمت راست بکشید.',
          'به وضعیت اولیه بازگشته و همین کار را در جهت مخالف انجام دهید.',
          'کشش دلنشین پهلوها را با هر دم و بازدم لمس کنید.'
        ],
        tips: 'حرکت را پیوسته و روان انجام دهید و از حبس کردن نفس خودداری کنید.'
      }
    ]
  },
  {
    id: 'low-impact-heart-ignite',
    title: 'چربی‌سوزی کم‌فشار مفاصل (Low-Impact Heart Ignite)',
    subtitle: 'حداکثر کالری‌سوزی بدون ضربه و پرش، ویژه سلامت قلب و زانو',
    level: 'beginner',
    targetHeartRateZone: '۱۱۰ تا ۱۳۰ ضربان در دقیقه',
    calorieBurnPer15Min: 110,
    themeColor: '#dc2626',
    gradient: 'linear-gradient(135deg, #b91c1c 0%, #450a0a 100%)',
    benefits: [
      'تقویت عضلات قلبی و بهبود ظرفیت تنفسی بدون فشار بر ستون فقرات',
      'فعال‌سازی چربی‌سوزی از طریق انقباضات مداوم عضلات بزرگ پا',
      'ایده‌آل برای افرادی که مفاصل حساس دارند یا در آپارتمان تمرین می‌کنند'
    ],
    scienceNote: 'عضلات چهارسر و سرینی بزرگترین مصرف‌کنندگان گلیکوژن در بدن هستند. فعال کردن پیوسته آن‌ها حتی بدون حرکات پرشی، متابولیسم پایه‌ای بدن را تا چندین ساعت پس از تمرین بالا نگه می‌دارد.',
    warmupSeconds: 60,
    cooldownSeconds: 60,
    movements: [
      {
        name: 'Butt Kicks with Pull Downs',
        persianName: 'پاشنه به باسن با کشش دست از بالا',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'moderate',
        targetMuscles: ['همسترینگ', 'عضلات پشت', 'ساق'],
        instructions: [
          'پاشنه پای راست را به سمت باسن بالا بیاورید در حالی که دست‌ها را از بالا به پایین می‌کشید.',
          'پای راست را پایین آورده و با پای چپ تکرار کنید.',
          'سینه را بالا نگه دارید و عضلات بالای پشت را جمع کنید.'
        ],
        tips: 'در هر انقباض همسترینگ، نفس را تخلیه کنید.'
      },
      {
        name: 'Squat to Calf Raise',
        persianName: 'نیم‌اسکوات و بالا رفتن روی پنجه پا',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'moderate',
        targetMuscles: ['چهارسر', 'سرینی', 'دوقلوی ساق'],
        instructions: [
          'پاها به اندازه عرض شانه باز، تا نیمه در وضعیت اسکوات پایین بروید.',
          'هنگام بلند شدن، بدون توقف روی پنجه هر دو پا بلند شوید و دست‌ها را بالا ببرید.',
          'آهسته پاشنه‌ها را فرود آورده و حرکت بعد را آغاز کنید.'
        ],
        tips: 'وزن بدن را روی پاشنه حفظ کنید و هنگام نشستن زانو از نوک انگشتان جلوتر نرود.'
      },
      {
        name: 'Step Jacks (No Jump)',
        persianName: 'جک پروانه گامی بدون پرش',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'moderate',
        targetMuscles: ['دلتاپشت', 'چهارسر', 'ساق پا'],
        instructions: [
          'دست‌ها را بالای سر ببرید و همزمان پای راست را یک گام به پهلو باز کنید.',
          'دست‌ها را پایین بیاورید و پا را برگردانید؛ سپس با پای چپ تکرار کنید.',
          'سرعت گام‌ها را برای افزایش ضربان به تدریج بیشتر کنید.'
        ],
        tips: 'هماهنگی دست و پا را حفظ کنید و با هر بالا بردن دست‌ها بازدم داشته باشید.'
      },
      {
        name: 'Standing Torso Twist with Knee',
        persianName: 'چرخش بالاتنه با زانوی متقاطع ایستاده',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'moderate',
        targetMuscles: ['مورب‌های شکمی', 'راست شکمی', 'لگن'],
        instructions: [
          'دست‌ها پشت سر، زانوی راست را به سمت سینه بالا بیاورید.',
          'آرنج چپ را به سمت زانوی راست بچرخانید تا انقباض پهلو حس شود.',
          'به وضعیت اولیه برگشته و در جهت مخالف انجام دهید.'
        ],
        tips: 'حرکت از عضلات شکم و پهلو آغاز شود نه با کشیدن گردن.'
      }
    ]
  },

  // ── متوسط (Intermediate) ──
  {
    id: 'tabata-cardio-burn',
    title: 'تمرین ریتمیک تاباتا ۲۰/۱۰ (Classic Tabata Aerobic Burn)',
    subtitle: 'انفجار چربی‌سوزی با فواصل شدت و استراحت برای ارتقای استقامت',
    level: 'intermediate',
    targetHeartRateZone: '۱۳۰ تا ۱۵۰ ضربان در دقیقه (منطقه هوازی قدرتی)',
    calorieBurnPer15Min: 145,
    themeColor: '#b91c1c',
    gradient: 'linear-gradient(135deg, #881337 0%, #1c1917 100%)',
    benefits: [
      'افزایش قابل ملاحظه استقامت قلبی-تنفسی و اکسیژن‌گیری بهینه ریه‌ها',
      'اثر افتربرن (EPOC): تداوم سوزاندن کالری تا ۲۴ ساعت پس از پایان تمرین',
      'تخلیه انرژی منفی و تحریک ترشح شدید دوپامین و نشاط مغزی'
    ],
    scienceNote: 'سیستم تاباتا با دوره‌های ۲۰ ثانیه فعالیت پرانرژی و ۱۰ ثانیه استراحت فعال، هر دو مسیر بی‌هوازی و هوازی انرژی بدن را همزمان به چالش می‌کشد و بیشترین راندمان را در کمترین زمان ممکن خلق می‌کند.',
    warmupSeconds: 60,
    cooldownSeconds: 60,
    movements: [
      {
        name: 'High Knees Run',
        persianName: 'زانو بلند سرعتی درجا',
        durationSeconds: 40,
        restSeconds: 20,
        intensity: 'high',
        targetMuscles: ['چهارسر', 'خم‌کننده ران', 'ساق', 'سیستم قلبی'],
        instructions: [
          'با ریتم سریع درجا بدوید و زانوها را تا ارتفاع ناف بالا بیاورید.',
          'دست‌ها را مثل یک دونده المپیک با زاویه ۹۰ درجه در کنار بدن تاب دهید.',
          'فرود فقط روی سینه پا باشد تا کشش ارتجاعی تولید شود.'
        ],
        tips: 'بدن را به عقب تکیه ندهید؛ زاویه اندک به جلو به شتاب حرکت کمک می‌کند.'
      },
      {
        name: 'Jumping Jacks Rapid',
        persianName: 'پروانه ریتمیک سرعتی',
        durationSeconds: 40,
        restSeconds: 20,
        intensity: 'moderate',
        targetMuscles: ['تمام بدن', 'شانه', 'ساق', 'سرینی'],
        instructions: [
          'پاها به هم چسبیده، با یک جهش ملایم پاها را به اندازه دو برابر عرض شانه باز کنید.',
          'همزمان دست‌ها را از طرفین بالای سر به هم نزدیک کنید.',
          'با جهش بعدی به موقعیت شروع بازگردید و ریتم تند را حفظ کنید.'
        ],
        tips: 'سعی کنید در تمام طول حرکت تنفس عمیق و موزون داشته باشید.'
      },
      {
        name: 'Mountain Climbers Flow',
        persianName: 'کوهنوردی هوازی (Mountain Climbers)',
        durationSeconds: 40,
        restSeconds: 20,
        intensity: 'high',
        targetMuscles: ['هسته بدن (Core)', 'سرشانه', 'عضلات پا'],
        instructions: [
          'در وضعیت پلانک شنا روی دست‌ها قرار بگیرید؛ مچ دست زیر شانه باشد.',
          'به نوبت و با سرعت زانوها را به سمت داخل قفسه سینه بدوانید.',
          'لگن را هم‌سطح بدن نگه دارید و نگذارید به بالا پرتاب شود.'
        ],
        tips: 'وزن بدن را مساوی بین دست‌ها و پنجه پاها توزیع کنید.'
      },
      {
        name: 'Squat Pulses to Jump',
        persianName: 'پالس اسکوات و پرش آرام',
        durationSeconds: 40,
        restSeconds: 20,
        intensity: 'high',
        targetMuscles: ['چهارسر ران', 'سرینی', 'همسترینگ'],
        instructions: [
          'در وضعیت اسکوات پایین بروید، دو بار پالس کوتاه در انتهای دامنه بزنید.',
          'سپس با نیروی عضلات پا یک پرش ملایم و کنترل‌شده به بالا انجام دهید.',
          'با جذب ضربه روی پنجه‌ها فرود بیایید و بلافاصله به پالس بعدی بروید.'
        ],
        tips: 'فرود آرام و بی‌صدا نشانه مهارت بالا در کنترل عضلانی است.'
      },
      {
        name: 'Speed Skaters',
        persianName: 'اسکیت‌باز جانبی سرعتی (Speed Skaters)',
        durationSeconds: 40,
        restSeconds: 20,
        intensity: 'high',
        targetMuscles: ['عضلات دورکننده ران', 'سرینی میانی', 'تعادل'],
        instructions: [
          'به سمت راست جهش کنید و روی پای راست فرود آیید در حالی که پای چپ پشت آن رد می‌شود.',
          'بلافاصله با جهش به سمت چپ جابجا شوید و دست‌ها را هماهنگ تاب دهید.',
          'مثل یک اسکیت‌باز سرعتی روی یخ، تعادل و شتاب جانبی بسازید.'
        ],
        tips: 'در هر فرود زانو را کمی خم کنید تا اثر فنری حفظ شود.'
      }
    ]
  },
  {
    id: 'box-and-kick-cardio',
    title: 'کاردیو استقامتی بوکس و تحرک (Box & Cardio Fusion)',
    subtitle: 'ترکیب تکنیک‌های دفاعی، ضربات مشت و رقص پای بوکسورها',
    level: 'intermediate',
    targetHeartRateZone: '۱۲۵ تا ۱۴۵ ضربان در دقیقه',
    calorieBurnPer15Min: 135,
    themeColor: '#e11d48',
    gradient: 'linear-gradient(135deg, #be123c 0%, #4c0519 100%)',
    benefits: [
      'تخلیه هیجانات و استرس‌های انباشته از طریق ضربات پرقدرت کنترل‌شده',
      'افزایش سرعت عکس‌العمل، چابکی عصبی-عضلانی و هماهنگی دست و چشم',
      'شکل‌دهی به عضلات سرشانه، بازو و تقویت عضلات عمقی شکم'
    ],
    scienceNote: 'ضربات بوکس و چرخش‌های تند باسن، زنجیره حرکتی کینتیک را از مچ پا تا نوک انگشتان دست درگیر می‌کند و بیشترین کالری را از طریق انقباض همزمان بالاتنه و پایین‌تنه می‌سوزاند.',
    warmupSeconds: 60,
    cooldownSeconds: 60,
    movements: [
      {
        name: 'Jab-Cross-Hook Combo',
        persianName: 'ترکیب جب، کراس و هوک با رقص پا',
        durationSeconds: 40,
        restSeconds: 20,
        intensity: 'moderate',
        targetMuscles: ['سرشانه', 'سینه', 'مورب شکم'],
        instructions: [
          'در گارد بوکس بایستید؛ مشت چپ مستقیم، مشت راست با چرخش باسن، و سپس هوک چپ.',
          'با هر ضربه صدای تخلیه نفس کوتاه (شسس!) ایجاد کنید.',
          'پس از هر ترکیب، دو جهش کوتاه برای جابجایی انجام دهید.'
        ],
        tips: 'تمام قدرت ضربه از چرخش لگن و پاشنه پا تولید می‌شود.'
      },
      {
        name: 'Duck and Weave with Uppercuts',
        persianName: 'جاخالی اردکی (Duck) و آپرکات انفجاری',
        durationSeconds: 40,
        restSeconds: 20,
        intensity: 'high',
        targetMuscles: ['پاها', 'شکم', 'پشت بازو'],
        instructions: [
          'با خم کردن زانوها مثل یک نیم‌دایره از زیر ضربه فرضی رد شوید (جاخالی).',
          'هنگام بلند شدن، دو ضربه آپرکات کوبنده از پایین به بالا بزنید.',
          'بلافاصله به سمت دیگر جاخالی دهید و تکرار کنید.'
        ],
        tips: 'پشت را قوز نکنید؛ برای نشستن از زانوها استفاده کنید نه از کمر.'
      },
      {
        name: 'Front Kicks & Jump Rope Sim',
        persianName: 'لگد به جلو و طناب‌زنی درجا بدون طناب',
        durationSeconds: 40,
        restSeconds: 20,
        intensity: 'moderate',
        targetMuscles: ['چهارسر', 'ساق پا', 'هسته بدن'],
        instructions: [
          'چهار جهش طناب‌زنی فرضی روی پنجه‌ها انجام دهید.',
          'سپس یک لگد جلو با پای راست و بلافاصله یک لگد با پای چپ پرتاب کنید.',
          'دوباره به ریتم جهش طناب‌زنی برگردید.'
        ],
        tips: 'لگد را با کشش پرقدرت عضلات ران بزنید و پای تکیه‌گاه را محکم نگه دارید.'
      }
    ]
  },

  // ── پیشرفته (Advanced) ──
  {
    id: 'elite-hiit-inferno',
    title: 'تمرین تناوبی فوق‌شدید HIIT انفجاری (Elite Cardio Inferno)',
    subtitle: 'به چالش کشیدن مرزهای استقامت قلبی، توان انفجاری و شتاب متابولیک',
    level: 'advanced',
    targetHeartRateZone: '۱۵۰ تا ۱۷۵ ضربان در دقیقه (منطقه حداکثر توان بی‌هوازی)',
    calorieBurnPer15Min: 185,
    themeColor: '#991b1b',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #000000 100%)',
    benefits: [
      'ارتقای سقف توان قلبی و افزایش چشمگیر حداکثر اکسیژن مصرفی (VO2 Max)',
      'افزایش تراکم میتوکندری در سلول‌های عضلانی برای تولید انرژی پایدار',
      'ساخت سرسختی ذهنی و تاب‌آوری فوق‌العاده در مواجهه با فشارهای فیزیکی'
    ],
    scienceNote: 'تمرینات اینتروال پیشرفته با به حداکثر رساندن تقاضای اکسیژن و تولید لاکتات، سیگنال‌های نیرومند بیوژنز میتوکندریایی تولید می‌کنند که ساختار سلولی قلب و رگ‌ها را به سطحی برتر ارتقا می‌دهد.',
    warmupSeconds: 60,
    cooldownSeconds: 60,
    movements: [
      {
        name: 'Burpee Broad Jumps',
        persianName: 'برپی کامل همراه با پرش طولی به جلو',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'high',
        targetMuscles: ['کل عضلات بدن', 'قلب', 'سینه', 'چهارسر'],
        instructions: [
          'به وضعیت اسکوات بروید، دست‌ها را روی زمین بگذارید و پاها را به عقب پرتاب کنید.',
          'یک شنای سوئدی کامل بزنید و سینه را به زمین لمس دهید.',
          'پاها را جمع کرده و با قدرت یک پرش طولی انفجاری به سمت جلو انجام دهید.',
          'چرخش ۱۸۰ درجه انجام داده و بلافاصله حرکت را تکرار کنید.'
        ],
        tips: 'حرکت بدون وقفه انجام شود؛ ریتم تنفس را منظم و قدرتمند نگه دارید.'
      },
      {
        name: 'Tuck Jumps & Fast Feet',
        persianName: 'پرش تاک (زانو به سینه) و پای سرعتی متوالی',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'high',
        targetMuscles: ['عضلات خم‌کننده', 'ساق پا', 'توان انفجاری'],
        instructions: [
          'پنج ثانیه پاهای سرعتی (Fast Feet) درجا مانند فوتبالیست‌ها اجرا کنید.',
          'سپس با تمام توان به هوا بپرید و هر دو زانو را به سمت سینه جمع کنید.',
          'نرم روی پنجه فرود آمده و بی‌درنگ به گام‌های سرعتی برگردید.'
        ],
        tips: 'ضربه‌گیری هنگام فرود نقشی حیاتی در حفظ سلامت مفاصل دارد.'
      },
      {
        name: 'Cross Mountain Climbers with Push Up',
        persianName: 'کوهنوردی ضربدری سرعتی با شنای انفجاری',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'high',
        targetMuscles: ['میان‌تنه', 'عضلات دنده‌ای', 'سینه', 'سرشانه'],
        instructions: [
          'چهار بار زانوها را به صورت ضربدری به سمت آرنج مخالف بدوانید.',
          'سپس یک شنای سریع و انفجاری روی دست‌ها بزنید.',
          'ریتم را در طول ۴۵ ثانیه بدون افت شتاب حفظ کنید.'
        ],
        tips: 'عضلات باسن و شکم را سفت نگه دارید تا ستون فقرات در یک خط مستقیم بماند.'
      },
      {
        name: '180 Degree Squat Jump Burnout',
        persianName: 'اسکوات پرشی ۱۸۰ درجه با چرخش هوازی',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'high',
        targetMuscles: ['سرینی', 'چهارسر', 'تعادل فضایی'],
        instructions: [
          'در وضعیت اسکوات کامل بنشینید و فنر عضلات را شارژ کنید.',
          'با پرش انفجاری در هوا ۱۸۰ درجه بچرخید و در اسکوات فرود آیید.',
          'بلافاصله در جهت مخالف بچرخید و پرش کنید.'
        ],
        tips: 'نگاه را روی نقطه مقابل متمرکز کنید تا تعادل حفظ شود.'
      }
    ]
  },
  {
    id: 'warrior-cardio-circuit',
    title: 'مدار استقامت رزم‌آوران (Warrior Aerobic Circuit)',
    subtitle: 'حرکات سیال پرشتاب، تقویت توان استقامتی و تنفس پولادین',
    level: 'advanced',
    targetHeartRateZone: '۱۴۵ تا ۱۶۵ ضربان در دقیقه',
    calorieBurnPer15Min: 175,
    themeColor: '#b91c1c',
    gradient: 'linear-gradient(135deg, #991b1b 0%, #18181b 100%)',
    benefits: [
      'سازگاری عضلات با تخلیه سریع اسید لاکتیک در حین تمرین پرفشار',
      'ایجاد بدنی ورزیده، خشک و چابک با توانایی مانور حرکتی بی‌نقص',
      'تقویت عضلات قلبی به عنوان یک پمپ قوی و خستگی‌ناپذیر'
    ],
    scienceNote: 'تغییر سطوح بدن از ایستاده به افقی و برعکس در این مدار، سیستم عروقی را وادار می‌کند تا فشار خون و برون‌ده قلبی را در کسری از ثانیه تنظیم کند که این اوج سلامت عروقی است.',
    warmupSeconds: 60,
    cooldownSeconds: 60,
    movements: [
      {
        name: 'Sprawls with Shadow Combos',
        persianName: 'اسپراول کشتی با کمبوی ضربات ایستاده',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'high',
        targetMuscles: ['تمام بدن', 'سرینی', 'سینه', 'شانه'],
        instructions: [
          'دست‌ها روی زمین، با پرتاب پاها به عقب لگن را پایین آورده و سینه را مهار کنید.',
          'با جهش سریع روی پاها بایستید و چهار ضربه مشت مستقیم سرعتی بزنید.',
          'بدون اتلاف وقت، مجدداً به وضعیت اسپراول بروید.'
        ],
        tips: 'هنگام بلند شدن سر را بالا نگه دارید و با قدرت بازدم کنید.'
      },
      {
        name: 'Jumping Lunges Switch',
        persianName: 'لانج پرشی متناوب با تغییر وضعیت پا در هوا',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'high',
        targetMuscles: ['چهارسر', 'سرینی بزرگ', 'تعادل عضلانی'],
        instructions: [
          'در وضعیت لانج قرار بگیرید؛ زانوی عقب نزدیک به زمین باشد.',
          'با انفجار به هوا بپرید و جای پاها را در هوا عوض کنید.',
          'به نرمی در موقعیت لانج سمت مخالف فرود بیایید و ادامه دهید.'
        ],
        tips: 'زانوی جلویی از مچ پا بیرون نزند و تنه را کاملاً عمود حفظ کنید.'
      },
      {
        name: 'Plank Jacks & Punch Out',
        persianName: 'پلانک جک پروانه‌ای با مشت رو به جلو',
        durationSeconds: 45,
        restSeconds: 15,
        intensity: 'high',
        targetMuscles: ['هسته بدن', 'سرشانه', 'پاها'],
        instructions: [
          'در پلانک شنا، پاها را با پرش باز و بسته کنید.',
          'همزمان در هر باز و بسته شدن پا، یک مشت قدرتمند به جلو پرتاب کنید.',
          'ثبات کمر و عدم چرخش شدید لگن را زیر نظر داشته باشید.'
        ],
        tips: 'سر و گردن را در امتداد ستون مهره‌ها ثابت نگه دارید.'
      }
    ]
  }
];

export const defaultWorkoutProfile: WorkoutProfile = {
  totalMinutes: 0,
  estimatedCalories: 0,
  sessionsCompleted: 0,
  streak: 0,
  lastSessionDate: null,
  preferredLevel: 'beginner',
  preferredDuration: 15,
  soundEnabled: true,
  vibrationEnabled: true,
};

/**
 * Returns today's featured aerobic workout routine for a given level, rotating daily
 */
export function getDailyWorkout(level: WorkoutLevel, dateStr?: string): WorkoutRoutine {
  const d = dateStr ? new Date(dateStr) : new Date();
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  const matching = WORKOUT_ROUTINES.filter(w => w.level === level);
  const index = Math.abs(dayOfYear) % matching.length;
  return matching[index] || matching[0];
}

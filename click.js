const API_BASE = "https://berandil.ir/farakhan-api/";

const ATTENDANCE_API = API_BASE + "attendance.php";
const TEACHER_CALLS_API = API_BASE + "teacher-calls.php";
const CREATE_CALL_API = API_BASE + "calls.php";
const UPDATE_CALL_API = API_BASE + "update-call-status.php";
const DELETE_ALL_CALLS_API = API_BASE + "delete-all-calls.php";
 
const students=[
    {name:"شهراد اسماعیل‌زاده",className:"پیش-1"},
{name:"رادمهر ابراهیمی",className:"پیش-1"},
{name:"آرتا ایرانشاهی",className:"پیش-1"},
{name:"مهراد بهشتی مهر",className:"پیش-1"},
{name:"رایبد بیکی",className:"پیش-1"},
{name:"رایان حسنی",className:"پیش-1"},
{name:"رهام دانشی",className:"پیش-1"},
{name:"آرمان صفری",className:"پیش-1"},
{name:"علی فارسی",className:"پیش-1"},
{name:"کارن فرجی",className:"پیش-1"},
{name:"راهین قریب",className:"پیش-1"},
{name:"رادوین کلانتری",className:"پیش-1"},
{name:"شاهان محمدی زاده",className:"پیش-1"},
{name:"سام کبوتان",className:"پیش-1"},

{name:"آرتین اکبری",className:"پیش-2"},
{name:"بنیامین رنجبر",className:"پیش-2"},
{name:"اهورا حاجی‌عیسی‌زاده",className:"پیش-2"},
{name:"بنیامین حسین‌زاده",className:"پیش-2"},
{name:"آرشاویر رحمتی",className:"پیش-2"},
{name:"کارن رستم‌آبادی",className:"پیش-2"},
{name:"امیرعلی شاکری",className:"پیش-2"},
{name:"آرمان غفاری‌شیرازی",className:"پیش-2"},
{name:"سام فراهانی",className:"پیش-2"},
{name:"زانا قهرمانی",className:"پیش-2"},

{name:"آیهان محمدی",className:"پیش-2"},

{name:"محمدرامان هلالی",className:"پیش-2"},

    {name:"مهان احمدی",className:"ششم-1"},
    {name:"پارسا بکایی",className:"ششم-1"},
    {name:"مهدی حسین زاده سیف",className:"ششم-1"},
    {name:"آرین خلج زاده",className:"ششم-1"},
    {name:"محسن دمرچلی",className:"ششم-1"},
    {name:"آرتین رضایی",className:"ششم-1"},
    {name:"علیسان صفیاری",className:"ششم-1"},
    {name:"آرتین عابدی",className:"ششم-1"},
    {name:"آراد عبدالله کرمی",className:"ششم-1"},
    {name:"مهیار غلامی",className:"ششم-1"},
    {name:"امیرپارسا فخرآبادی",className:"ششم-1"},
    {name:"سپهر فرج نژاد",className:"ششم-1"},
    {name:"رایان فرهبد",className:"ششم-1"},
    {name:"مهراد فخری",className:"ششم-1"},
    {name:"امیرحسین قابضی",className:"ششم-1"},
    {name:"آراد قیاسی",className:"ششم-1"},
    {name:"آرشا کیاپاشا",className:"ششم-1"},
    {name:"مهربد کاهانی",className:"ششم-1"},
    {name:"عماد مظلومی نیا",className:"ششم-1"},
    {name:"آرتین محمدبیگی",className:"ششم-1"},
    {name:"میثم نگهداری",className:"ششم-1"},
    {name:"مازیار نگهداری",className:"ششم-1"},
    
    {name:"ساتیار امیری",className:"سوم-1"},
    {name:"پارسا تقی زاده",className:"سوم-1"},
    {name:"رایان جمشیدی",className:"سوم-1"},
    {name:"رادین جمشیدی",className:"سوم-1"},
    {name:"کارن جهانی",className:"سوم-1"},
    {name:"بهراد حسینی نژاد",className:"سوم-1"},
    {name:"نویان خدامرادی",className:"سوم-1"},
    {name:"فرداد خدایاری",className:"سوم-1"},
    {name:"آدرین سلاجقه",className:"سوم-1"},
    {name:"شهریار سلگی",className:"سوم-1"},
    {name:"آراد شریفی",className:"سوم-1"},
    {name:"آرین صفری",className:"سوم-1"},
    {name:"رایان عیسی زاده",className:"سوم-1"},
    {name:"آرشان عیوض نژاد",className:"سوم-1"},
    {name:"کارن کاردان",className:"سوم-1"},
    {name:"رادمان کامکار",className:"سوم-1"},
    {name:"آرمان کریمیان",className:"سوم-1"},
    {name:"رهام ماندگارمقدم",className:"سوم-1"},
    {name:"رادمان مرادیان نژاد",className:"سوم-1"},
    {name:"مهراد ناصری",className:"سوم-1"},
    {name:"آریا نصیرمحمدی",className:"سوم-1"},
    {name:"آریا نعمتی",className:"سوم-1"},
    {name:"پرهام دولتخواه",className:"سوم-1"},
    {name:"ابوالفضل یوسفی",className:"سوم-1"},
    
    {name:"مهرسام اسدرخت",className:"سوم-2"},
    {name:"آریا اسماعیلی",className:"سوم-2"},
    {name:"امیرعلی اکبرآبادی",className:"سوم-2"},
    {name:"دانیال اکبری مهر",className:"سوم-2"},
    {name:"سید محمدامیر انوری",className:"سوم-2"},
    {name:"جانیار ایرجی",className:"سوم-2"},
    {name:"ایلیا آغباشلو",className:"سوم-2"},
    {name:"پندار خوش طینتان",className:"سوم-2"},
    {name:"آروین سوری",className:"سوم-2"},
    {name:"آیهان شهرتی",className:"سوم-2"},
    {name:"رادین طلایی پناه",className:"سوم-2"},
    {name:"آرمان عبدی",className:"سوم-2"},
    {name:"سامیار عزیزی مقدم",className:"سوم-2"},
    {name:"رادین فرشچین",className:"سوم-2"},
    {name:"آریا فرج نژاد",className:"سوم-2"},
    {name:"ایلیا قاسمی",className:"سوم-2"},
    {name:"محمد مهدی کاظمی",className:"سوم-2"},
    {name:"پویا کرمی",className:"سوم-2"},
    {name:"کیان گنجه",className:"سوم-2"},
    {name:"حسین محمدی مهر",className:"سوم-2"},
    {name:"ویهان منصوری",className:"سوم-2"},
    {name:"میثم نظری",className:"سوم-2"},
    
    {name:"آرسام ابهری",className:"اول-1"},
    {name:"هومان باوی",className:"اول-1"},
    {name:"سامراد دمیرچلی",className:"اول-1"},
    {name:"آرش عبدی",className:"اول-1"},
    {name:"رادین عبدی",className:"اول-1"},
    {name:"میلان غلامی آبادانی",className:"اول-1"},
    {name:"آیهان قاسمی",className:"اول-1"},
    {name:"ویهان کاملی",className:"اول-1"},
    {name:"رایان محرابی",className:"اول-1"},
    {name:"آرشا محمودی",className:"اول-1"},
    {name:"رایان مقدم",className:"اول-1"},
    {name:"سید صدرا منصورزاده",className:"اول-1"},
    {name:"جاوید نصرالهی",className:"اول-1"},
    
    {name:"محمدطاها احمدی",className:"چهارم-1"},
    {name:"رادمهر بشیری",className:"چهارم-1"},
    {name:"مهراد بیاتی",className:"چهارم-1"},
    {name:"آران باروتی",className:"چهارم-1"},
    {name:"پوریا توکلیان",className:"چهارم-1"},
    {name:"رادین حسنی",className:"چهارم-1"},
    {name:"اوتانا درویشی",className:"چهارم-1"},
    {name:"امیرعباس دهقان",className:"چهارم-1"},
    {name:"سام زندمقدم",className:"چهارم-1"},
    {name:"مهراد سفارزاد",className:"چهارم-1"},
    {name:"نویان علیشاهی",className:"چهارم-1"},
    {name:"مهراد عموحسن",className:"چهارم-1"},
    {name:"کوروش قاسمی",className:"چهارم-1"},
    {name:"محمدحسین قرابیگلو",className:"چهارم-1"},
    {name:"محمدحسین کریمی",className:"چهارم-1"},
    {name:"رهام لطفی",className:"چهارم-1"},
    {name:"امیرعلی ناعمی",className:"چهارم-1"},
    {name:"رایان مقدسی",className:"چهارم-1"},
    {name:"یاشام درگاهی",className:"چهارم-1"},
    
    {name:"یونا ایازیان",className:"اول-2"},
    {name:"علی اینانلو گنجی",className:"اول-2"},
    {name:"محمدرضا الماسی",className:"اول-2"},
    {name:"رادوین برادری همپا",className:"اول-2"},
    {name:"امیرعلی صفاوردی",className:"اول-2"},
    {name:"آروین عباسی",className:"اول-2"},
    {name:"شاهان فراهانی",className:"اول-2"},
    {name:"حسین فخیمی شایسته",className:"اول-2"},
    {name:"صدرا قنبری",className:"اول-2"},
    {name:"رادمهر کارشناس",className:"اول-2"},
    {name:"رادمان نادمی",className:"اول-2"},
    {name:"کسری نعمت زاده",className:"اول-2"},
    {name:"نامی هاشمی",className:"اول-2"},
    
    {name:"آراد احمدیان",className:"پنجم-3"},
    {name:"رادین امیری",className:"پنجم-3"},
    {name:"آران جهانبانی",className:"پنجم-3"},
    {name:"آوش حسینبکی",className:"پنجم-3"},
    {name:"علی خادم",className:"پنجم-3"},
    {name:"ماهان دیلمقانی زاده",className:"پنجم-3"},
    {name:"سپهر رجاء",className:"پنجم-3"},
    {name:"آرسین رضایی",className:"پنجم-3"},
    {name:"آرسیس رضایی",className:"پنجم-3"},
    {name:"همایون رفیعی",className:"پنجم-3"},
    {name:"میعاد زمانی",className:"پنجم-3"},
    {name:"راستین زهدی",className:"پنجم-3"},
    {name:"مهبد شکری",className:"پنجم-3"},
    {name:"آرتا شیرازی",className:"پنجم-3"},
    {name:"محمدامین صیادنورد",className:"پنجم-3"},
    {name:"بردیا ضیایی",className:"پنجم-3"},
    {name:"سید آیین عظیمی",className:"پنجم-3"},
    {name:"مهرسام علیزاده",className:"پنجم-3"},
    {name:"بردیا قلعه گلاب",className:"پنجم-3"},
    {name:"رادمان مرسلی",className:"پنجم-3"},
    {name:"آریا میرزاده",className:"پنجم-3"},
    {name:"هومان نصرتی",className:"پنجم-3"},
    {name:"رادمان نوروزی",className:"پنجم-3"},
    {name:"محمدرضا یارلو",className:"پنجم-3"},
    
    {name:"آرسام حسینی",className:"چهارم-3"},
    {name:"شاهان ترکاشوند",className:"چهارم-3"},
    {name:"لیام رحمانی",className:"چهارم-3"},
    {name:"ایلیا سبزپوش",className:"چهارم-3"},
    {name:"ماهان سمنارشاد",className:"چهارم-3"},
    {name:"آروین عابدی",className:"چهارم-3"},
    {name:"ایلیا عرشی",className:"چهارم-3"},
    {name:"آراد عطاییان",className:"چهارم-3"},
    {name:"آرتین علمی",className:"چهارم-3"},
    {name:"مهرسام غضنفری",className:"چهارم-3"},
    {name:"نیکان فرجی",className:"چهارم-3"},
    {name:"دانیال کشاورز",className:"چهارم-3"},
    {name:"کارن کوهی",className:"چهارم-3"},
    
    {name:"رایان منتظری",className:"چهارم-3"},
    {name:"آرین نیک پی",className:"چهارم-3"},
    {name:"ویهان وهابی",className:"چهارم-3"},
    
    {name:"سید محمد اجاقی",className:"چهارم-2"},
    {name:"امیرمحمد امانی",className:"چهارم-2"},
    {name:"کارن امانی",className:"چهارم-2"},
    {name:"بنیامین حسین زاده",className:"چهارم-2"},
    {name:"سید سینا حسینی",className:"چهارم-2"},
    {name:"مبین دمرچلی",className:"چهارم-2"},
    {name:"سپهر ذوالفقاری",className:"چهارم-2"},
    {name:"علیسام رمضانی",className:"چهارم-2"},
    {name:"کیان علیا",className:"چهارم-2"},
    {name:"آرتین کوچاری",className:"چهارم-2"},
    {name:"سام خسروشاهی",className:"چهارم-2"},
    {name:"برکان محمدخانی",className:"چهارم-2"},
    {name:"مهراد منصفی",className:"چهارم-2"},
    {name:"سورنا منصوری",className:"چهارم-2"},
    {name:"ارسام مهری نژاد",className:"چهارم-2"},
    {name:"کیان مقدسی",className:"چهارم-2"},
    
    {name:"فرهام احمدی نژاد",className:"سوم-3"},
    { name: "آرشا تابع", className: "سوم-3" },
    {name:"نیکان تورجی",className:"سوم-3"},
    {name:"پارسا تهامی پور",className:"سوم-3"},
    {name:"حافظ جعفربیگی",className:"سوم-3"},
    {name:"رادوین دزیانی",className:"سوم-3"},
    {name:"نویان رنجبر",className:"سوم-3"},
    {name:"آرشا ترابی پور",className:"سوم-3"},
    {name:"رادمان سلیمانیه",className:"سوم-3"},
    {name:"کیان سهرابی",className:"سوم-3"},
    {name:"شایان شاوردیان",className:"سوم-3"},
    {name:"آرشا طیبی",className:"سوم-3"},
    {name:"امیرپارسا عباسی",className:"سوم-3"},
    {name:"ارس علوی",className:"سوم-3"},
    {name:"فرهام فرقانی",className:"سوم-3"},
    {name:"آریانمهر محمداکبری",className:"سوم-3"},
    {name:"کیاراد مرادی",className:"سوم-3"},
    {name:"بردیا میرشفیعی",className:"سوم-3"},
    
    {name:"مهربد بلند همت",className:"اول-3"},
    {name:"علیسان جهانی",className:"اول-3"},
    {name:"سامیار سلیمی",className:"اول-3"},
    {name:"لیام شریفی",className:"اول-3"},
    {name:"آرشا شریفی",className:"اول-3"},
    {name:"عرفان علیزاده",className:"اول-3"},
    {name:"رها علیزاده",className:"اول-3"},
    {name:"رادین عموحسن",className:"اول-3"},
    {name:"سپهراد مرادی",className:"اول-3"},
    {name:"آدرین نجارزاده",className:"اول-3"},
    {name:"کیاراد هوشی",className:"اول-3"},
    {name:"یزدان یوسفی",className:"اول-3"},
    
    {name:"دیان احمدی",className:"دوم-2"},
    {name:"رایبد آتش بهار",className:"دوم-2"},
    {name:"آرمان تقی ماهانی",className:"دوم-2"},
    {name:"مهرسام جلائیان",className:"دوم-2"},
    {name:"مهدیار حسنی",className:"دوم-2"},
    {name:"مانی حسینی",className:"دوم-2"},
    {name:"آروین خانی",className:"دوم-2"},
    {name:"رایان خمسه",className:"دوم-2"},
    {name:"آرتا خدابنده",className:"دوم-2"},
    {name:"کوروش درگاهی",className:"دوم-2"},
    {name:"رادین سعیدی",className:"دوم-2"},
    {name:"رهام سلطانزاده",className:"دوم-2"},
    {name:"پرهام صادقی",className:"دوم-2"},
    {name:"آرتین طاهری مقدم",className:"دوم-2"},
    {name:"آبتین عابدی",className:"دوم-2"},
    {name:"آیریک عباسی",className:"دوم-2"},
    {name:"محمدامین قدرتی",className:"دوم-2"},
    {name:"باربد قصابی",className:"دوم-2"},
    {name:"مانی کریمی",className:"دوم-2"},
    {name:"وبهان کمالپور",className:"دوم-2"},
    {name:"آرشا گرایلی",className:"دوم-2"},
    {name:"رهام منصوری",className:"دوم-2"},
    {name:"محمد پارسا نبوی زاده",className:"دوم-2"},
    {name:"رادین هادیان",className:"دوم-2"},
    
    {name:"رادمان احمدی طباطبایی",className:"دوم-1"},
    {name:"آراد بزرگی",className:"دوم-1"},
    {name:"آراد ثبوتی",className:"دوم-1"},
    {name:"رادمان حیدری",className:"دوم-1"},
    {name:"هیراد حسنی",className:"دوم-1"},
    {name:"شنتیا درویشی",className:"دوم-1"},
    {name:"امیررضا دوادانگه",className:"دوم-1"},
    {name:"رایان رادمنش",className:"دوم-1"},
    {name:"رامان رحیمی",className:"دوم-1"},
    {name:"رهام صناعت گر",className:"دوم-1"},
    {name:"سامیار طاهرزاده",className:"دوم-1"},
    {name:"شاهان علی آبادی",className:"دوم-1"},
    {name:"بردیا فاضل",className:"دوم-1"},
    {name:"یونا فیض دار",className:"دوم-1"},
    {name:"آرتا قلخانی",className:"دوم-1"},
    {name:"نیما کاکاسلطانی",className:"دوم-1"},
    {name:"ویهان لک",className:"دوم-1"},
    {name:"ارسلان معینی",className:"دوم-1"},
    {name:"ماهور منصوری",className:"دوم-1"},
    {name:"نیهاد نجاری",className:"دوم-1"},
    {name:"یونا هاتف",className:"دوم-1"},
    
    {name:"فرهاد احمدی نژاد",className:"ششم-2"},
    {name:"روهان حیدری",className:"ششم-2"},
    {name:"دانیال زارع قمشه",className:"ششم-2"},
    {name:"ماهان زند",className:"ششم-2"},
    {name:"آدرین سعیدی",className:"ششم-2"},
    {name:"محمدعلی شهبازی",className:"ششم-2"},
    {name:"متین عباسی",className:"ششم-2"},
    {name:"آرشام عمرانی",className:"ششم-2"},
    {name:"رادین فروغی",className:"ششم-2"},
    {name:"پدرام قربانی",className:"ششم-2"},
    {name:"آرکا کامیار",className:"ششم-2"},
    {name:"رایان کلانتری",className:"ششم-2"},
    {name:"دانا کاظمی",className:"ششم-2"},
    {name:"عماد لرستانی",className:"ششم-2"},
    {name:"عرفان مقدم لو",className:"ششم-2"},
    {name:"ماهان مجیدی",className:"ششم-2"},
    {name:"حسام مظلومی نیا",className:"ششم-2"},
    {name:"آدرین مهدی زاده",className:"ششم-2"},
    {name:"سپنتا محبی",className:"ششم-2"},
    {name:"فراز نعمت طلب",className:"ششم-2"},
    {name:"محمدحسین ناصری",className:"ششم-2"},
    {name:"امیرحسین وقار",className:"ششم-2"},
    
    {name:"محمدمهدی ابیض",className:"پنجم-1"},
    {name:"ماهان اجتهادی",className:"پنجم-1"},
    {name:"آرشا افتخاری",className:"پنجم-1"},
    {name:"کارن آتش بهار",className:"پنجم-1"},
    {name:"شهراد چم",className:"پنجم-1"},
    {name:"مهراد حسینی",className:"پنجم-1"},
    {name:"رهام روشنی صبح",className:"پنجم-1"},
    {name:"پارسا سعیدی نیا",className:"پنجم-1"},
    {name:"مهراد سفیدگران",className:"پنجم-1"},
    {name:"محمد سیف الهی",className:"پنجم-1"},
    {name:"سروش شمسیان",className:"پنجم-1"},
    {name:"آتیلا صفری",className:"پنجم-1"},
    {name:"رادین عباسی",className:"پنجم-1"},
    {name:"آرشام فتحی زاده",className:"پنجم-1"},
    {name:"آرسام کاظمی",className:"پنجم-1"},
    {name:"محمد کهتری",className:"پنجم-1"},
    {name:"ماهان مختاری",className:"پنجم-1"},
    {name:"آرشین مقدسی",className:"پنجم-1"},
    {name:"امیرمهدی میرزاآقایی",className:"پنجم-1"},
    {name:"مهراد جعفری",className:"پنجم-1"},
    {name:"فربد ناطقی",className:"پنجم-1"},
    {name:"کارن نعمتی",className:"پنجم-1"},
    {name:"فرهام هاشمی",className:"پنجم-1"},
    {name:"یاسین یوسفی",className:"پنجم-1"},
    
    {name:"کیان امامقلی",className:"پنجم-2"},
    {name:"مهراد امانی پور",className:"پنجم-2"},
    {name:"هیوا بهرامی",className:"پنجم-2"},
    {name:"اهورا تاتلاری",className:"پنجم-2"},
    {name:"کیان چابکی",className:"پنجم-2"},
    {name:"آرتین خدمتلو",className:"پنجم-2"},
    {name:"ویهان داداشعلی",className:"پنجم-2"},
    {name:"ماجد رسولی",className:"پنجم-2"},
    {name:"طاها زرگر",className:"پنجم-2"},
    {name:"ایلیا عباسی",className:"پنجم-2"},
    {name:"یزدان عبدالهی",className:"پنجم-2"},
    {name:"مهرسام علایی",className:"پنجم-2"},
    {name:"آرن فلاح",className:"پنجم-2"},
    {name:"مهراد فلاحتی",className:"پنجم-2"},
    {name:"امیرحافظ قمی",className:"پنجم-2"},
    {name:"امیرعلی کازرانی",className:"پنجم-2"},
    {name:"کیاراد کاظمی",className:"پنجم-2"},
    {name:"یاسان لشگری نژاد",className:"پنجم-2"},
    {name:"آریا لطیفی",className:"پنجم-2"},
    {name:"برسام محمداسماعیل",className:"پنجم-2"},
    {name:"سامیار مرادی",className:"پنجم-2"},
    {name:"سورنا مرادی",className:"پنجم-2"},
    {name:"یاسین مولایی",className:"پنجم-2"},
    {name:"محمدصدرا میرصادقی",className:"پنجم-2"},
    {name:"رادین یاهو",className:"پنجم-2"}
    
    ];
    const gradeOrder = ["پیش", "اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"];

const allowedClasses = [
    "پیش-1", "پیش-2",
    "اول-1", "اول-2", "اول-3",
    "دوم-1", "دوم-2",
    "سوم-1", "سوم-2", "سوم-3",
    "چهارم-1", "چهارم-2", "چهارم-3",
    "پنجم-1", "پنجم-2", "پنجم-3",
    "ششم-1", "ششم-2"
];

const container = document.getElementById("classesContainer");
const searchInput = document.getElementById("searchInput");
const resetButton = document.getElementById("resetCalls");

const attendanceState = new Map();
const latestCallState = new Map();
const lastSeenCallStatuses = new Map();

let refreshRunning = false;
let currentNazemDay = getDatabaseToday();

function normalizeText(text) {
    return String(text || "")
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\u200c/g, "")
        .replace(/\s+/g, "")
        .trim();
}

function classId(name) {
    return "class-" + name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "");
}

function getDatabaseToday() {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = {};
    parts.forEach(part => {
        values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
}

function todayDatabaseDate() {
    return getDatabaseToday();
}

function todayPersianDate() {
    return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

function timeNow() {
    return new Intl.DateTimeFormat("fa-IR", {
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).format(new Date());
}

function attendanceKey(studentName, className) {
    return normalizeText(studentName) + "|" + normalizeText(className);
}

function callKey(studentName, className) {
    return attendanceKey(studentName, className);
}

function hasAbsentAttendance(studentName, className) {
    return attendanceState.get(
        attendanceKey(studentName, className)
    ) === "غایب";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("پاسخ سرور معتبر نیست.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || `خطای سرور: ${response.status}`
        );
    }

    return result;
}
function createClasses() {
    container.innerHTML = "";

    const groups = {};

    students.forEach(student => {
        if (!groups[student.className]) {
            groups[student.className] = [];
        }

        groups[student.className].push(student);
    });

    gradeOrder.forEach(grade => {
        const classes = allowedClasses.filter(
            className => className.startsWith(grade + "-") &&
                         groups[className]
        );

        if (!classes.length) return;

        const section = document.createElement("section");
        section.className = "grade-section";

        section.innerHTML = `
            <div class="grade-header">
                <span>📚 پایه ${grade}</span>
                <span class="grade-arrow">▼</span>
            </div>
            <div class="grade-content"></div>
        `;

        const content = section.querySelector(".grade-content");

        section.querySelector(".grade-header").onclick = () => {
            section.classList.toggle("closed");
        };

        classes.forEach(className => {
            const box = document.createElement("div");
            box.className = "class-box";
            box.id = classId(className);

            box.innerHTML = `
                <div class="class-header">
                    <span class="called-total" id="called-${className}">0</span>
                    <span class="class-title">${className}</span>
                    <span class="student-total">${groups[className].length}</span>
                </div>
                <div class="students-list"></div>
            `;

            const list = box.querySelector(".students-list");

            groups[className]
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, "fa"))
                .forEach(student => {
                    const button = document.createElement("button");

                    button.type = "button";
                    button.className = "student-button pending";
                    button.dataset.name = student.name;
                    button.dataset.class = student.className;

                    button.innerHTML = `
                        <span class="student-name"></span>
                        <span class="student-status"></span>
                        <span class="status-time"></span>
                    `;

                    button.querySelector(".student-name").textContent =
                        student.name;

                    button.onclick = () => callStudent(student, button);

                    list.appendChild(button);
                });

            content.appendChild(box);
        });

        container.appendChild(section);
    });
}

function findButton(name, className) {
    const wantedName = normalizeText(name);
    const wantedClass = normalizeText(className);

    return Array.from(
        document.querySelectorAll(".student-button")
    ).find(button =>
        normalizeText(button.dataset.name) === wantedName &&
        normalizeText(button.dataset.class) === wantedClass
    ) || null;
}

function updateCount(className) {
    const box = document.getElementById(classId(className));
    if (!box) return;

    const count = box.querySelectorAll(
        ".student-button.called, .student-button.sent"
    ).length;

    const counter = document.getElementById("called-" + className);

    if (counter) counter.textContent = count;
}
function updateButton(button, call, force = false) {
    if (!button || !call) return;

    const incomingId = Number(call.id || 0);
    const currentId = Number(button.dataset.callId || 0);

    if (incomingId && currentId && incomingId < currentId) return;

    button.dataset.callId = String(incomingId || "");
    button.dataset.callStatus = call.status || "";
    button.dataset.callSource = call.source || "nazem";

    const statusElement = button.querySelector(".student-status");
    const timeElement = button.querySelector(".status-time");

    if (call.status === "لغو شد") {
        button.classList.remove("called", "sent", "absent");
        button.classList.add("pending");
        button.disabled = false;

        if (statusElement) statusElement.textContent = "";
        if (timeElement) timeElement.textContent = "";

        updateCount(button.dataset.class);
        return;
    }

    if (!force && hasAbsentAttendance(
        button.dataset.name,
        button.dataset.class
    )) {
        button.classList.remove("pending", "called", "sent");
        button.classList.add("absent");
        button.disabled = true;

        if (statusElement) statusElement.textContent = "(غایب)";
        if (timeElement) timeElement.textContent = "";

        updateCount(button.dataset.class);
        return;
    }

    button.classList.remove("pending", "called", "sent", "absent");

    if (call.status === "ارسال شد") {
        button.classList.add("sent");
        button.disabled = false;
    } else {
        button.classList.add("called");
        button.disabled = call.source === "parent";
    }

    if (statusElement) {
        statusElement.textContent = call.source === "parent"
            ? "(فراخوان والد)"
            : `(${call.status || "فراخوان شد"})`;
    }

    if (timeElement) {
        timeElement.textContent = call.called_time || "";
    }

    updateCount(button.dataset.class);
}

function applyAttendanceToNazem(record) {
    const button = findButton(record.student_name, record.class_name);
    if (!button) return;

    if (record.status === "غایب") {
        button.classList.remove("pending", "called", "sent");
        button.classList.add("absent");
        button.disabled = true;

        button.querySelector(".student-status").textContent = "(غایب)";
        button.querySelector(".status-time").textContent = "";

        updateCount(record.class_name);
        return;
    }

    if (record.status === "حاضر") {
        button.classList.remove("absent");
        button.disabled = false;

        const call = latestCallState.get(
            callKey(record.student_name, record.class_name)
        );

        if (call) {
            updateButton(button, call, true);
        } else {
            button.classList.remove("called", "sent");
            button.classList.add("pending");
            button.querySelector(".student-status").textContent = "";
            button.querySelector(".status-time").textContent = "";
        }

        updateCount(record.class_name);
    }
}
async function callStudent(student, button) {
    if (
        button.disabled ||
        button.classList.contains("absent") ||
        button.classList.contains("sent") ||
        button.dataset.processing === "true"
    ) {
        return;
    }

    if (button.dataset.callSource === "parent") {
        alert("فراخوان ثبت‌شده توسط والدین از پنل ناظم قابل لغو نیست.");
        return;
    }

    button.dataset.processing = "true";
    button.disabled = true;

    try {
        if (button.classList.contains("called")) {
            const callId = Number(button.dataset.callId || 0);

            if (!callId) {
                await refreshNazemPanel();
                throw new Error("شناسه فراخوان پیدا نشد؛ دوباره امتحان کنید.");
            }

            await apiRequest(UPDATE_CALL_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: callId,
                    status: "لغو شد"
                })
            });

            await refreshNazemPanel();
            return;
        }

        const now = new Date();

        const calledTime = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Tehran",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(now);

        const result = await apiRequest(CREATE_CALL_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                student_name: student.name,
                class_name: student.className,
                called_date: getDatabaseToday(),
                called_time: calledTime
            })
        });

        if (!result.data) {
            throw new Error("اطلاعات فراخوان از سرور دریافت نشد.");
        }

        updateButton(button, result.data, true);
        latestCallState.set(
            callKey(student.name, student.className),
            result.data
        );

        updateCount(student.className);
    } catch (error) {
        console.error("خطای فراخوان:", error);
        alert(error.message || "ثبت یا لغو فراخوان انجام نشد.");
        await refreshNazemPanel();
    } finally {
        delete button.dataset.processing;

        button.disabled =
            button.classList.contains("absent") ||
            button.dataset.callSource === "parent";
    }
}
async function loadCalls() {
    const today = getDatabaseToday();
    const allCalls = [];

    const results = await Promise.all(
        allowedClasses.map(async className => {
            const url =
                TEACHER_CALLS_API +
                "?class_name=" + encodeURIComponent(className) +
                "&date=" + encodeURIComponent(today);

            const result = await apiRequest(url);
            return result.data || [];
        })
    );

    results.flat().forEach(call => allCalls.push(call));

    const latestCalls = new Map();

    allCalls.forEach(call => {
        const key = callKey(call.student_name, call.class_name);
        const previous = latestCalls.get(key);

        if (!previous || Number(call.id) > Number(previous.id)) {
            latestCalls.set(key, call);
        }
    });

    latestCallState.clear();

    latestCalls.forEach((call, key) => {
        latestCallState.set(key, call);

        const button = findButton(call.student_name, call.class_name);
        if (!button) return;

        const oldStatus = lastSeenCallStatuses.get(key);

        if (
            call.status === "ارسال شد" &&
            oldStatus !== "ارسال شد" &&
            call.source !== "parent"
        ) {
            showTeacherSendPopup(call);
        }

        if (call.source === "parent" && oldStatus !== call.status) {
            showParentCallPopup(call);
        }

        lastSeenCallStatuses.set(key, call.status);

        updateButton(button, call);
    });

    allowedClasses.forEach(className => updateCount(className));
}

async function loadTodayAttendance() {
    const today = getDatabaseToday();

    const results = await Promise.all(
        allowedClasses.map(async className => {
            const url =
                ATTENDANCE_API +
                "?class_name=" + encodeURIComponent(className) +
                "&date=" + encodeURIComponent(today);

            const result = await apiRequest(url);
            return result.data || [];
        })
    );

    attendanceState.clear();

    results.flat().forEach(record => {
        attendanceState.set(
            attendanceKey(record.student_name, record.class_name),
            record.status
        );

        applyAttendanceToNazem(record);
    });
}
function showTeacherSendPopup(call) {
    const popup = document.getElementById("teacherSendPopup");
    const text = document.getElementById("teacherSendPopupText");
    const sound = document.getElementById("teacherSendSound");

    if (!popup || !text) return;

    text.textContent =
        `دانش‌آموز ${call.student_name} از کلاس ${call.class_name} توسط معلم ارسال شد.`;

    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    popup.classList.add("show");
    clearTimeout(window.teacherSendPopupTimer);

    window.teacherSendPopupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 6000);
}

const closeTeacherSendPopup =
    document.getElementById("closeTeacherSendPopup");

if (closeTeacherSendPopup) {
    closeTeacherSendPopup.onclick = () => {
        document.getElementById("teacherSendPopup")?.classList.remove("show");
    };
}

function showParentCallPopup(call) {
    let popup = document.getElementById("parentCallPopup");

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "parentCallPopup";
        document.body.appendChild(popup);
    }

    popup.replaceChildren();

    const title = document.createElement("strong");
    title.textContent = "فراخوانی توسط والد";

    const message = document.createElement("div");
    message.textContent =
        `دانش‌آموز ${call.student_name} از کلاس ${call.class_name} توسط والد فراخوانی شد.`;

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.onclick = () => popup.classList.remove("show");

    popup.append(title, message, close);
    popup.classList.add("show");

    clearTimeout(window.parentCallPopupTimer);

    window.parentCallPopupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 7000);
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const value = normalizeText(searchInput.value);

        document.querySelectorAll(".student-button").forEach(button => {
            button.classList.toggle(
                "search-hidden",
                Boolean(value) &&
                !normalizeText(button.dataset.name).includes(value)
            );
        });

        document.querySelectorAll(".class-box").forEach(box => {
            const visible = box.querySelectorAll(
                ".student-button:not(.search-hidden)"
            ).length;

            box.style.display = visible ? "" : "none";
        });
    });
}

if (resetButton) {
    resetButton.addEventListener("click", async () => {
        if (!confirm("آیا تمام فراخوان‌ها حذف شوند؟")) return;

        resetButton.disabled = true;

        try {
            await apiRequest(DELETE_ALL_CALLS_API, {
                method: "POST"
            });

            // پاک کردن اطلاعات فراخوان‌ها
            latestCallState.clear();
            lastSeenCallStatuses.clear();

            // بازگرداندن دکمه‌ها به حالت اولیه،
            // به‌جز دانش‌آموزانی که غایب هستند
            document.querySelectorAll(".student-button").forEach(button => {

                // اگر دانش‌آموز غایب است، وضعیتش را تغییر نده
                if (button.classList.contains("absent")) {
                    button.disabled = true;
                    return;
                }

                button.classList.remove("called", "sent");
                button.classList.add("pending");
                button.disabled = false;

                delete button.dataset.callId;
                delete button.dataset.callStatus;
                delete button.dataset.callSource;
                delete button.dataset.processing;

                const status = button.querySelector(".student-status");
                const time = button.querySelector(".status-time");

                if (status) status.textContent = "";
                if (time) time.textContent = "";
            });

            // صفر کردن شمارنده‌های فراخوان
            document.querySelectorAll(".called-total").forEach(counter => {
                counter.textContent = "0";
            });

            // دریافت مجدد اطلاعات از سرور
            await refreshNazemPanel();

            alert("تمام فراخوان‌ها حذف شدند.");

        } catch (error) {
            console.error("خطا در حذف فراخوان‌ها:", error);
            alert(error.message || "حذف فراخوان‌ها انجام نشد.");

            await refreshNazemPanel();
        } finally {
            resetButton.disabled = false;
        }
    });
}
async function refreshNazemPanel() {
    if (refreshRunning) return;

    refreshRunning = true;

    try {
        await loadCalls();
    } catch (error) {
        console.error("خطا در دریافت فراخوان‌ها:", error);
    }

    try {
        await loadTodayAttendance();
    } catch (error) {
        console.error("خطا در دریافت حضور و غیاب:", error);
    } finally {
        refreshRunning = false;
    }
}

async function initializeNazem() {
    console.log("پنل ناظم با API و MySQL راه‌اندازی شد.");

    createClasses();
    await refreshNazemPanel();
}

initializeNazem();

setInterval(() => {
    if (document.visibilityState === "visible") {
        refreshNazemPanel();
    }
}, 2000);

window.addEventListener("online", () => {
    refreshNazemPanel();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        refreshNazemPanel();
    }
});

setInterval(() => {
    const newDay = getDatabaseToday();

    if (newDay === currentNazemDay) return;

    currentNazemDay = newDay;
    attendanceState.clear();
    latestCallState.clear();
    lastSeenCallStatuses.clear();

    document.querySelectorAll(".student-button").forEach(button => {
        button.classList.remove("called", "sent", "absent");
        button.classList.add("pending");
        button.disabled = false;
        delete button.dataset.callId;
        delete button.dataset.callStatus;
        delete button.dataset.callSource;

        const status = button.querySelector(".student-status");
        const time = button.querySelector(".status-time");

        if (status) status.textContent = "";
        if (time) time.textContent = "";
    });

    document.querySelectorAll(".called-total").forEach(counter => {
        counter.textContent = "0";
    });

    refreshNazemPanel();
}, 30000);
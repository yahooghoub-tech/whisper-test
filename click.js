const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);


 

const students=[
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
{name:"مهراد مظفر",className:"ششم-1"},
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
{name:"آرمان کرمیان",className:"سوم-1"},
{name:"رهام ماندگارمقدم",className:"سوم-1"},
{name:"رادمان مرادیان نژاد",className:"سوم-1"},
{name:"مهراد ناصری",className:"سوم-1"},
{name:"آریا نصیرمحمدی",className:"سوم-1"},
{name:"آریا نعمتی",className:"سوم-1"},
{name:"مهرسام اسدرخت",className:"سوم-2"},
{name:"آریا اسماعیلی",className:"سوم-2"},
{name:"امیرعلی اکبرآبادی",className:"سوم-2"},
{name:"دانیال اکبری مهر",className:"سوم-2"},
{name:"سید محمدامیر انوری",className:"سوم-2"},
{name:"جانیار ایرجی",className:"سوم-2"},
{name:"ایلیا آغباشلو",className:"سوم-2"},
{name:"پندار خوش طینتان",className:"سوم-2"},
{name:"آروین سوری",className:"سوم-2"},
{name:"آبهان شهرتی",className:"سوم-2"},
{name:"رادین طلایی پناه",className:"سوم-2"},
{name:"آرمان عبدی",className:"سوم-2"},
{name:"سامیار عزیزی مقدم",className:"سوم-2"},
{name:"رادین فرشچین",className:"سوم-2"},
{name:"ایلیا قاسمی",className:"سوم-2"},
{name:"محمد مهدی کاظمی",className:"سوم-2"},
{name:"پویا کرمی",className:"سوم-2"},
{name:"نیکان گنجه",className:"سوم-2"},
{name:"حسین محمدی مهر",className:"سوم-2"},
{name:"ویهان منصوری",className:"سوم-2"},
{name:"میثم نظری",className:"سوم-2"},
{name:"آرسام ابهری",className:"اول-1"},
{name:"هومان باوی",className:"اول-1"},
{name:"سامراد دمیرچلی",className:"اول-1"},
{name:"آرش عبدی",className:"اول-1"},
{name:"میلان غلامی آبادانی",className:"اول-1"},
{name:"آیهان قاسمی",className:"اول-1"},
{name:"ویهان کاملی",className:"اول-1"},
{name:"رایان محرابی",className:"اول-1"},
{name:"آرشا محمودی",className:"اول-1"},
{name:"رایان مقدم",className:"اول-1"},
{name:"سبدصدرا منصورزاده",className:"اول-1"},
{name:"جاوید نصرالهی",className:"اول-1"},
{name:"محمدطاها احمدی",className:"چهارم-1"},
{name:"آریا آزاد پیما",className:"چهارم-1"},
{name:"رادمهر بشیری",className:"چهارم-1"},
{name:"مهراد بیاتی",className:"چهارم-1"},
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
{name:"رهام لطفی",className:"چهارم-1"},
{name:"امیرعلی ناعمی",className:"چهارم-1"},
{name:"یونا ایازیان",className:"اول-2"},
{name:"علی اینانلو گنجی",className:"اول-2"},
{name:"رادوین برادری",className:"اول-2"},
{name:"مانیاد رسام",className:"اول-2"},
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
{name:"آرسیین رضایی",className:"پنجم-3"},
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
{name:"علی گرجایی",className:"چهارم-3"},
{name:"رایان مننظری",className:"چهارم-3"},
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
{name:"سام لوحی خسروشاهی",className:"چهارم-2"},
{name:"برکان محمدخانی",className:"چهارم-2"},
{name:"مهراد منصفی",className:"چهارم-2"},
{name:"سورنا منصوری",className:"چهارم-2"},
{name:"ارسام مهری نژاد",className:"چهارم-2"},
{name:"فرهام احمدی نژاد",className:"سوم-3"},
{name:"آرشا تابع",className:"سوم-3"},
{name:"نیکان تورجی",className:"سوم-3"},
{name:"پارسا تهامی پور",className:"سوم-3"},
{name:"حافظ جعفربیگی",className:"سوم-3"},
{name:"رادوین دزیانی",className:"سوم-3"},
{name:"نویان رنجبر",className:"سوم-3"},
{name:"مهدیار رهبر",className:"سوم-3"},
{name:"رادمان سلیمانیه",className:"سوم-3"},
{name:"کیان سهرابی",className:"سوم-3"},
{name:"شایان شاوردین",className:"سوم-3"},
{name:"آرشا طیبی",className:"سوم-3"},
{name:"امیرپارسا عباسی",className:"سوم-3"},
{name:"ارس علوی",className:"سوم-3"},
{name:"فرهام فرقانی",className:"سوم-3"},
{name:"آریانمهر محمداکبری",className:"سوم-3"},
{name:"کیاراد مرادی",className:"سوم-3"},
{name:"بردیا میرشفیعی",className:"سوم-3"},
{name:"مهربد بلند همت",className:"اول-3"},
{name:"آدار جهانبانی",className:"اول-3"},
{name:"علیسان جهانی",className:"اول-3"},
{name:"سامیار سلیمی",className:"اول-3"},
{name:"لیام شریفی",className:"اول-3"},
{name:"آرشا شریفی",className:"اول-3"},
{name:"عرفان علیزاده",className:"اول-3"},
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
{name:"رهام منصوری",className:"دوم-2"},
{name:"محمد پارسا نبوی زاده",className:"دوم-2"},
{name:"رادین هادیان",className:"دوم-2"},
{name:"رادمان احمدی طباطبایی",className:"دوم-1"},
{name:"آراد بزرگی",className:"دوم-1"},
{name:"آراد ثبوتی",className:"دوم-1"},
{name:"رادمان حیدری",className:"دوم-1"},
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
{name:"لرستانی عماد",className:"ششم-2"},
{name:"آرشام عمرانی",className:"ششم-2"},
{name:"رادین فروغی",className:"ششم-2"},
{name:"پدرام قربانی",className:"ششم-2"},
{name:"آرکا کامیار",className:"ششم-2"},
{name:"رایان کلانتری",className:"ششم-2"},
{name:"دانا کاظمی",className:"ششم-2"},
{name:"عرفان مقدم لو",className:"ششم-2"},
{name:"ماهان مجیدی",className:"ششم-2"},
{name:"حسام مظلومی نیا",className:"ششم-2"},
{name:"آدرین مهدی زاده",className:"ششم-2"},
{name:"سپنتا محبی",className:"ششم-2"},
{name:"فراز نعمت طلب",className:"ششم-2"},
{name:"امیرحسین وقار",className:"ششم-2"},
{name:"محمدمهدی ابیض",className:"پنجم-1"},
{name:"ماهان اجتهادی",className:"پنجم-1"},
{name:"سامیار اسکندری",className:"پنجم-1"},
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
{name:"امیرعلی کریمی راد",className:"پنجم-1"},
{name:"محمد کهتری",className:"پنجم-1"},
{name:"ماهان مختاری",className:"پنجم-1"},
{name:"آرشین مقدسی",className:"پنجم-1"},
{name:"امیرمهدی میرزاآقایی",className:"پنجم-1"},
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

const gradeOrder=["اول","دوم","سوم","چهارم","پنجم","ششم"];
const container=document.getElementById("classesContainer");
const searchInput=document.getElementById("searchInput");
const resetButton=document.getElementById("resetCalls");

function normalizeText(text){
return String(text||"").replace(/ي/g,"ی").replace(/ى/g,"ی").replace(/ك/g,"ک").replace(/\u200c/g,"").replace(/\s+/g,"").trim();
}

function classId(name){
return "class-"+name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g,"");
}

function timeNow(){
return new Date().toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}

function todayPersianDate(){
return new Intl.DateTimeFormat(
"fa-IR-u-nu-latn",
{
year:"numeric",
month:"2-digit",
day:"2-digit"
}
).format(new Date());
}


function showTeacherSendPopup(call){

const popup=
document.getElementById("teacherSendPopup");

const text=
document.getElementById("teacherSendPopupText");

if(!popup||!text){

console.error(
"❌ عناصر اعلان ارسال دانش‌آموز پیدا نشدند"
);

return;
}

text.innerHTML=
`دانش‌آموز <strong>${call.student_name}</strong>
از کلاس <strong>${call.class_name}</strong>
توسط معلم ارسال شد.`;

popup.classList.add("show");

clearTimeout(window.teacherSendPopupTimer);

window.teacherSendPopupTimer=
setTimeout(()=>{
popup.classList.remove("show");
},7000);

}

const closeTeacherSendPopup=
document.getElementById("closeTeacherSendPopup");

if(closeTeacherSendPopup){

closeTeacherSendPopup.onclick=()=>{

const popup=
document.getElementById("teacherSendPopup");

if(popup){
popup.classList.remove("show");
}

};

}


function createClasses(){

const groups={};

students.forEach(s=>{
if(!groups[s.className])
groups[s.className]=[];

groups[s.className].push(s);
});

gradeOrder.forEach(grade=>{

const classes=
Object.keys(groups)
.filter(c=>c.startsWith(grade+"-"))
.sort(
(a,b)=>
Number(a.split("-")[1])-
Number(b.split("-")[1])
);

if(!classes.length)return;

const section=
document.createElement("section");

section.className="grade-section";

section.innerHTML=
`<div class="grade-header">
<span>📚 پایه ${grade}</span>
<span class="grade-arrow">▼</span>
</div>
<div class="grade-content"></div>`;

const content=
section.querySelector(".grade-content");

section.querySelector(".grade-header").onclick=
()=>section.classList.toggle("closed");

classes.forEach(className=>{

groups[className].sort(
(a,b)=>a.name.localeCompare(b.name,"fa")
);

const box=
document.createElement("div");

box.className="class-box";

box.id=classId(className);

box.innerHTML=
`<div class="class-header">
<span class="called-total" id="called-${className}">0</span>
<span class="class-title">${className}</span>
<span class="student-total">${groups[className].length}</span>
</div>
<div class="students-list"></div>`;

const list=
box.querySelector(".students-list");

groups[className].forEach(student=>{

const button=
document.createElement("button");

button.className=
"student-button pending";

button.dataset.name=
student.name;

button.dataset.class=
student.className;

button.innerHTML=
`<span class="student-name">${student.name}</span>
<span class="student-status"></span>
<span class="status-time"></span>`;

button.onclick=
()=>callStudent(student,button);

list.appendChild(button);

});

content.appendChild(box);

});

container.appendChild(section);

});

}


async function callStudent(student,button){

if(
button.classList.contains("called")||
button.classList.contains("sent")||
button.classList.contains("absent")
)return;

const {data,error}=
await supabaseClient
.from("calls")
.select("*")
.eq("student_name",student.name)
.eq("class_name",student.className)
.neq("status","ارسال شد");

if(error){
console.error(error);
return;
}

if(data&&data.length){
updateButton(button,data[0]);
return;
}

const time=timeNow();
const date=todayPersianDate();

const {
data:inserted,
error:insertError
}=
await supabaseClient
.from("calls")
.insert([
{
student_name:student.name,
class_name:student.className,
status:"فراخوان شد",
called_date:date,
called_time:time
}
])
.select()
.single();

if(insertError){
console.error(insertError);
return;
}

updateButton(button,inserted);
updateCount(student.className);

}


function updateButton(button,call,force=false){

if(!button||!call)return;

if(
!force&&
hasAbsentAttendance(
button.dataset.name,
button.dataset.class
)
){

button.classList.remove(
"pending",
"called",
"sent"
);

button.classList.add("absent");

button.disabled=true;

button.querySelector(
".student-status"
).textContent="(غایب)";

button.querySelector(
".status-time"
).textContent="";

return;

}

button.classList.remove(
"pending",
"called",
"sent",
"absent"
);

if(call.status==="ارسال شد")
button.classList.add("sent");
else
button.classList.add("called");

button.disabled=false;

button.querySelector(
".student-status"
).textContent=
`(${call.status})`;

button.querySelector(
".status-time"
).textContent=
call.called_time||"";

}


function updateCount(className){

const box=
document.getElementById(
classId(className)
);

if(!box)return;

const count=
box.querySelectorAll(
".student-button.called,.student-button.sent"
).length;

const counter=
document.getElementById(
"called-"+className
);

if(counter)
counter.textContent=count;

}


function findButton(name,className){

return document.querySelector(
`.student-button[data-name="${CSS.escape(name)}"][data-class="${CSS.escape(className)}"]`
);

}


async function loadCalls(){

const today=
todayPersianDate();

console.log(
"📅 بارگذاری فراخوان‌های امروز:",
today
);

const {data,error}=
await supabaseClient
.from("calls")
.select("*")
.eq("called_date",today)
.order("id",{ascending:true});

if(error){

console.error(
"❌ خطا در دریافت فراخوان‌های امروز:",
error
);

return;
}

(data||[]).forEach(call=>{

const button=
findButton(
call.student_name,
call.class_name
);

if(!button){

console.warn(
"⚠️ دکمه دانش‌آموز پیدا نشد:",
call.student_name,
call.class_name
);

return;
}

updateButton(
button,
call
);

updateCount(
call.class_name
);

});

}
async function loadTodayAttendance(){

    const today=todayPersianDate();
    
    console.log(
    "📅 دریافت حضور و غیاب امروز:",
    today
    );
    
    const {data,error}=
    await supabaseClient
    .from("attendance")
    .select("*")
    .eq("attendance_date",today);
    
    if(error){
    
    console.error(
    "❌ خطا در دریافت حضور و غیاب:",
    error
    );
    
    return;
    }
    
    attendanceState.clear();
    
    (data||[]).forEach(record=>{
    
    applyAttendanceToNazem(
    record,
    true
    );
    
    });
    
    console.log(
    "📋 وضعیت حضور و غیاب امروز اعمال شد:",
    (data||[]).length
    );
    
    }
    
    
    const attendanceState=
    new Map();
    
    
    function attendanceKey(
    studentName,
    className
    ){
    
    return normalizeText(studentName)+
    "|" +
    normalizeText(className);
    
    }
    
    
    function hasAbsentAttendance(
    studentName,
    className
    ){
    
    return attendanceState.get(
    attendanceKey(
    studentName,
    className
    )
    )==="غایب";
    
    }
    
    
    function applyAttendanceToNazem(
    record,
    updateMap=true
    ){
    
    if(
    !record||
    !record.student_name||
    !record.class_name
    )return;
    
    if(
    record.attendance_date!==
    todayPersianDate()
    )return;
    
    
    if(updateMap){
    
    attendanceState.set(
    attendanceKey(
    record.student_name,
    record.class_name
    ),
    record.status
    );
    
    }
    
    
    const button=
    findButton(
    record.student_name,
    record.class_name
    );
    
    if(!button)return;
    
    
    if(record.status==="غایب"){
    
    button.classList.remove(
    "pending",
    "called",
    "sent"
    );
    
    button.classList.add(
    "absent"
    );
    
    button.disabled=true;
    
    button.querySelector(
    ".student-status"
    ).textContent=
    "(غایب)";
    
    button.querySelector(
    ".status-time"
    ).textContent="";
    
    return;
    
    }
    
    
    if(record.status==="حاضر"){
    
    button.classList.remove(
    "absent"
    );
    
    button.disabled=false;
    
    restoreCallState(
    record.student_name,
    record.class_name,
    button
    );
    
    }
    
    }
    
    
    async function restoreCallState(
    studentName,
    className,
    button
    ){
    
    if(
    hasAbsentAttendance(
    studentName,
    className
    )
    )return;
    
    
    const {data,error}=
    await supabaseClient
    .from("calls")
    .select("*")
    .eq("student_name",studentName)
    .eq("class_name",className)
    .eq("called_date",todayPersianDate())
    .neq("status","ارسال شد")
    .order("id",{ascending:false})
    .limit(1);
    
    
    if(error){
    
    console.error(
    "❌ خطا در بازیابی وضعیت فراخوان:",
    error
    );
    
    return;
    
    }
    
    
    if(
    hasAbsentAttendance(
    studentName,
    className
    )
    )return;
    
    
    if(data&&data.length){
    
    updateButton(
    button,
    data[0],
    true
    );
    
    updateCount(
    className
    );
    
    return;
    
    }
    
    
    button.classList.remove(
    "called",
    "sent",
    "absent"
    );
    
    button.classList.add(
    "pending"
    );
    
    button.disabled=false;
    
    button.querySelector(
    ".student-status"
    ).textContent="";
    
    button.querySelector(
    ".status-time"
    ).textContent="";
    
    updateCount(
    className
    );
    
    }
    
    
    searchInput.addEventListener(
    "input",
    ()=>{
    
    const value=
    normalizeText(
    searchInput.value
    );
    
    document
    .querySelectorAll(
    ".student-button"
    )
    .forEach(button=>{
    
    const name=
    normalizeText(
    button.dataset.name
    );
    
    button.classList.toggle(
    "search-hidden",
    value&&!name.includes(value)
    );
    
    });
    
    
    document
    .querySelectorAll(
    ".class-box"
    )
    .forEach(box=>{
    
    const visible=
    box.querySelectorAll(
    ".student-button:not(.search-hidden)"
    ).length;
    
    box.style.display=
    visible?"":"none";
    
    });
    
    });
    
    
    resetButton.addEventListener(
    "click",
    async()=>{
    
    if(
    !confirm(
    "آیا تمام فراخوان‌ها حذف شوند؟"
    )
    )return;
    
    
    const {error}=
    await supabaseClient
    .from("calls")
    .delete()
    .gte("id",0);
    
    
    if(error){
    
    console.error(error);
    
    alert(
    "خطا در حذف فراخوان‌ها"
    );
    
    return;
    
    }
    
    
    document
    .querySelectorAll(
    ".student-button"
    )
    .forEach(button=>{
    
    /*
    غایبین نباید با حذف فراخوان‌ها تغییر کنند
    */
    
    if(
    button.classList.contains(
    "absent"
    )
    )return;
    
    
    button.classList.remove(
    "called",
    "sent"
    );
    
    button.classList.add(
    "pending"
    );
    
    button.querySelector(
    ".student-status"
    ).textContent="";
    
    button.querySelector(
    ".status-time"
    ).textContent="";
    
    });
    
    
    document
    .querySelectorAll(
    ".called-total"
    )
    .forEach(counter=>{
    
    counter.textContent="0";
    
    });
    
    
    console.log(
    "✅ تمام فراخوان‌ها در ناظم ریست شدند؛ غایبین دست‌نخورده ماندند"
    );
    
    });
    
    
    function handleCallRealtime(payload){
    
    const call=
    payload.new||
    payload.old;
    
    if(!call)return;
    
    
    if(
    call.called_date&&
    call.called_date!==
    todayPersianDate()
    )return;
    
    
    const button=
    findButton(
    call.student_name,
    call.class_name
    );
    
    if(!button)return;
    
    
    /*
    اگر دانش‌آموز غایب باشد،
    فراخوان نباید وضعیت غایب را خراب کند
    */
    
    if(
    hasAbsentAttendance(
    call.student_name,
    call.class_name
    )
    ){
    
    console.log(
    "⏭️ این دانش‌آموز غایب است؛ تغییر فراخوان روی دکمه اعمال نشد:",
    call.student_name
    );
    
    return;
    
    }
    
    
    /*
    حذف فراخوان
    */
    
    if(
    payload.eventType==="DELETE"
    ){
    
    button.classList.remove(
    "called",
    "sent"
    );
    
    button.classList.add(
    "pending"
    );
    
    button.disabled=false;
    
    button.querySelector(
    ".student-status"
    ).textContent="";
    
    button.querySelector(
    ".status-time"
    ).textContent="";
    
    updateCount(
    call.class_name
    );
    
    return;
    
    }
    
    
    /*
    INSERT / UPDATE فراخوان
    */
    
    updateButton(
    button,
    call,
    false
    );
    
    updateCount(
    call.class_name
    );
    
    }
    
    
    function handleAttendanceRealtime(
    payload
    ){
    
    const record=
    payload.new||
    payload.old;
    
    if(!record)return;
    
    console.log(
    "🔥 حضور و غیاب Realtime دریافت شد:",
    payload
    );
    
    
    if(
    record.attendance_date!==
    todayPersianDate()
    )return;
    
    
    const key=
    attendanceKey(
    record.student_name,
    record.class_name
    );
    
    
    /*
    حذف رکورد حضور و غیاب
    */
    
    if(
    payload.eventType==="DELETE"
    ){
    
    attendanceState.delete(
    key
    );
    
    const button=
    findButton(
    record.student_name,
    record.class_name
    );
    
    if(button){
    
    button.classList.remove(
    "absent"
    );
    
    button.disabled=false;
    
    restoreCallState(
    record.student_name,
    record.class_name,
    button
    );
    
    }
    
    return;
    
    }
    
    
    /*
    INSERT / UPDATE حضور و غیاب
    */
    
    attendanceState.set(
    key,
    record.status
    );
    
    applyAttendanceToNazem(
    record,
    false
    );
    
    }
    
    function subscribeNazemRealtime(){

        const channel =
        supabaseClient
        .channel("nazem-realtime")
        
        .on(
        "postgres_changes",
        {
        event:"*",
        schema:"public",
        table:"calls"
        },
        payload=>{
        
        console.log(
        "📡 تغییر Realtime فراخوان:",
        payload
        );
        
        handleCallRealtime(payload);
        
        }
        )
        
        .on(
        "postgres_changes",
        {
        event:"*",
        schema:"public",
        table:"attendance"
        },
        payload=>{
        
        console.log(
        "📡 تغییر Realtime حضور و غیاب:",
        payload
        );
        
        handleAttendanceRealtime(payload);
        
        }
        )
        
        .subscribe(
        status=>{
        
        console.log(
        "📡 وضعیت Realtime ناظم:",
        status
        );
        
        }
        );
        
        return channel;
        
        }
    
    
        createClasses();

        subscribeNazemRealtime();
        
        async function initializeNazem(){
        
            await loadCalls();
        
            await loadTodayAttendance();
        
        }
        
        initializeNazem();
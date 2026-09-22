const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";

const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";

const supabaseClient=supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);


const students=[
"آرتین اکبری",
"اهورا حاجی عیسی زاده",
"بنیامین حسین زاده",
"آرشاویر رحمتی",
"کارن رستم آبادی",
"امیرعلی شاکری",
"آرمان غفاری شیرازی",
"سام فراهانی",
"زانا قهرمانی",
"رادوین کیوان مهر",
"آیهان محمدی",
"آرمان مختاری",
"محمدرامان هلالی",
"بنیامین رنجبر"
];


const className="پیش-2";


function getToday(){

const now=new Date();

const iranTime=new Date(
now.toLocaleString(
"en-US",
{
timeZone:"Asia/Tehran"
}
)
);

const year=iranTime.getFullYear();

const month=String(
iranTime.getMonth()+1
).padStart(2,"0");

const day=String(
iranTime.getDate()
).padStart(2,"0");

return `${year}-${month}-${day}`;

}


function showDate(){

const dateElement=document.getElementById(
"todayDate"
);

if(!dateElement){
return;
}

const now=new Date();

const iranTime=new Date(
now.toLocaleString(
"en-US",
{
timeZone:"Asia/Tehran"
}
)
);

const options={
weekday:"long",
year:"numeric",
month:"long",
day:"numeric"
};

dateElement.textContent=
iranTime.toLocaleDateString(
"fa-IR",
options
);

}


function showMessage(
text,
type="success"
){

const message=document.getElementById(
"message"
);

if(!message){
return;
}

message.textContent=text;

message.className=
"message "+type;

setTimeout(
()=>{

message.textContent="";

message.className="message";

},
2500
);

}


/* =========================================================
   ساخت دانش‌آموزان
========================================================= */

function createStudents(){

const container=document.getElementById(
"studentsContainer"
);

if(!container){
return;
}

container.innerHTML="";

students.forEach(
(student,index)=>{

const button=document.createElement(
"button"
);

button.type="button";

button.className=
"student-button present";

button.dataset.name=student;

button.dataset.index=index;

button.textContent=student;

button.addEventListener(
"click",
()=>{

toggleAttendance(
student,
button
);

}
);

container.appendChild(button);

});

updateCounts();

}


/* =========================================================
   دریافت وضعیت امروز
========================================================= */

async function loadTodayAttendance(){

const today=getToday();

console.log(
"📅 دریافت حضور و غیاب پیش‌۲:",
today
);

const{
data,
error
}=await supabaseClient
.from("attendance")
.select(
"student_name,status,attendance_date,class_name"
)
.eq(
"class_name",
className
)
.eq(
"attendance_date",
today
);


if(error){

console.error(
"❌ خطا در دریافت حضور و غیاب پیش‌۲:",
error
);

showMessage(
"خطا در دریافت وضعیت حضور و غیاب",
"error"
);

return;

}


students.forEach(
student=>{

const record=data?.find(
item=>
item.student_name===student
);

const button=findButton(
student
);

if(!button){
return;
}


if(
record &&
record.status==="غایب"
){

setButtonAbsent(
button
);

}else{

setButtonPresent(
button
);

}

});

updateCounts();

}


/* =========================================================
   پیدا کردن دکمه دانش‌آموز
========================================================= */

function findButton(student){

return document.querySelector(
`.student-button[data-name="${CSS.escape(student)}"]`
);

}


/* =========================================================
   غایب
========================================================= */

function setButtonAbsent(button){

button.classList.remove(
"present"
);

button.classList.add(
"absent"
);

button.textContent=
button.dataset.name+
" (غایب)";

}


/* =========================================================
   حاضر
========================================================= */

function setButtonPresent(button){

button.classList.remove(
"absent"
);

button.classList.add(
"present"
);

button.textContent=
button.dataset.name;

}


/* =========================================================
   تغییر وضعیت حضور و غیاب
========================================================= */

async function toggleAttendance(
student,
button
){

const today=getToday();

const isAbsent=
button.classList.contains(
"absent"
);


button.disabled=true;


/* =========================================================
   غایب → حاضر
========================================================= */

if(isAbsent){

console.log(
"🟢 تلاش برای حاضر کردن:",
student
);

console.log(
"📅 تاریخ:",
today
);


const{
data,
error
}=await supabaseClient
.from("attendance")
.delete()
.eq(
"student_name",
student
)
.eq(
"class_name",
className
)
.eq(
"attendance_date",
today
)
.select();


console.log(
"🗑️ رکورد حذف‌شده:",
data
);


if(error){

console.error(
"❌ خطا در حذف غیبت:",
error
);

showMessage(
"خطا در ثبت وضعیت",
"error"
);

button.disabled=false;

return;

}


/* =========================================================
   بررسی اینکه واقعاً رکورد حذف شده
========================================================= */

if(
!data ||
data.length===0
){

console.warn(
"⚠️ رکورد غیبت پیدا نشد:",
student,
className,
today
);

showMessage(
"رکورد غیبت پیدا نشد",
"error"
);

button.disabled=false;

return;

}


/* =========================================================
   تغییر ظاهر دکمه
========================================================= */

setButtonPresent(
button
);


showMessage(
"دانش‌آموز حاضر شد"
);


console.log(
"✅ دانش‌آموز حاضر شد:",
student
);

}


/* =========================================================
   حاضر → غایب
========================================================= */

else{

console.log(
"🔴 تلاش برای ثبت غیبت:",
student
);

console.log(
"📅 تاریخ:",
today
);


const{
data,
error
}=await supabaseClient
.from("attendance")
.upsert(
{
student_name:student,
class_name:className,
status:"غایب",
attendance_date:today
},
{
onConflict:
"student_name,class_name,attendance_date"
}
)
.select();


console.log(
"🔴 رکورد غیبت ثبت‌شده:",
data
);


if(error){

console.error(
"❌ خطا در ثبت غیبت:",
error
);

showMessage(
"خطا در ثبت غیبت",
"error"
);

button.disabled=false;

return;

}


setButtonAbsent(
button
);


showMessage(
"غیبت دانش‌آموز ثبت شد"
);


console.log(
"✅ غیبت ثبت شد:",
student
);

}


button.disabled=false;

updateCounts();

}


/* =========================================================
   شمارنده‌ها
========================================================= */

function updateCounts(){

const total=students.length;

const absent=document.querySelectorAll(
".student-button.absent"
).length;

const present=total-absent;


const totalElement=
document.getElementById(
"totalCount"
);

const presentElement=
document.getElementById(
"presentCount"
);

const absentElement=
document.getElementById(
"absentCount"
);


if(totalElement){

totalElement.textContent=
total;

}


if(presentElement){

presentElement.textContent=
present;

}


if(absentElement){

absentElement.textContent=
absent;

}

}


/* =========================================================
   تغییر خودکار تاریخ
========================================================= */

let lastDate=getToday();


setInterval(
async()=>{

const today=getToday();

if(today!==lastDate){

lastDate=today;

showDate();

createStudents();

await loadTodayAttendance();

}

},
30000
);


/* =========================================================
   برگشت به صفحه
========================================================= */

document.addEventListener(
"visibilitychange",
async()=>{

if(!document.hidden){

showDate();

await loadTodayAttendance();

}

});


/* =========================================================
   فعال شدن دوباره پنجره
========================================================= */

window.addEventListener(
"focus",
async()=>{

showDate();

await loadTodayAttendance();

});


/* =========================================================
   شروع صفحه
========================================================= */

createStudents();

showDate();

loadTodayAttendance();


/* =========================================================
   Realtime فقط پیش‌۲
========================================================= */

const attendanceChannel=
supabaseClient
.channel(
"attendance-pre-2"
)
.on(
"postgres_changes",
{
event:"*",
schema:"public",
table:"attendance",
filter:`class_name=eq.${className}`
},
async(payload)=>{

console.log(
"📡 تغییر Realtime پیش‌۲:",
payload
);

await loadTodayAttendance();

}
)
.subscribe(
status=>{

console.log(
"Attendance realtime پیش‌۲:",
status
);

}
);
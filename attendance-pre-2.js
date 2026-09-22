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

function normalizeStudentName(name){
return String(name||"")
.replace(/[\u200B-\u200D\uFEFF]/g,"")
.replace(/\u200C/g,"")
.replace(/\s+/g," ")
.replace(/ي/g,"ی")
.replace(/ك/g,"ک")
.trim();
}

function getToday(){

const now=new Date();

const iranTime=new Date(
now.toLocaleString("en-US",{
timeZone:"Asia/Tehran"
})
);

const year=iranTime.getFullYear();
const month=String(iranTime.getMonth()+1).padStart(2,"0");
const day=String(iranTime.getDate()).padStart(2,"0");

return `${year}-${month}-${day}`;

}

function showDate(){

const now=new Date();

const iranTime=new Date(
now.toLocaleString("en-US",{
timeZone:"Asia/Tehran"
})
);

const options={
year:"numeric",
month:"long",
day:"numeric",
weekday:"long"
};

const dateText=iranTime.toLocaleDateString(
"fa-IR",
options
);

const dateElement=document.getElementById("todayDate");

if(dateElement){
dateElement.textContent=dateText;
}

}

function showMessage(text,type="success"){

let message=document.getElementById("attendanceMessage");

if(!message){

message=document.createElement("div");

message.id="attendanceMessage";

message.style.position="fixed";
message.style.bottom="25px";
message.style.left="50%";
message.style.transform="translateX(-50%)";
message.style.zIndex="99999";
message.style.padding="12px 22px";
message.style.borderRadius="12px";
message.style.fontFamily="inherit";
message.style.fontSize="15px";
message.style.fontWeight="700";
message.style.boxShadow="0 8px 30px rgba(0,0,0,.25)";
message.style.transition="all .25s ease";

document.body.appendChild(message);

}

message.textContent=text;

if(type==="error"){

message.style.background="#dc2626";
message.style.color="#fff";

}else{

message.style.background="#16a34a";
message.style.color="#fff";

}

message.style.opacity="1";

clearTimeout(message._timer);

message._timer=setTimeout(()=>{

message.style.opacity="0";

},2500);

}

function createStudents(){

const container=document.getElementById("studentsContainer");

if(!container)return;

container.innerHTML="";

students.forEach(student=>{

const button=document.createElement("button");

button.type="button";

button.className="student-button present";

button.dataset.name=student;

button.textContent=student;

button.addEventListener("click",()=>{

toggleAttendance(student,button);

});

container.appendChild(button);

});

}

function findButton(student){

const normalizedTarget=normalizeStudentName(student);

const buttons=document.querySelectorAll(".student-button");

for(const button of buttons){

const buttonName=normalizeStudentName(
button.dataset.name
);

if(buttonName===normalizedTarget){

return button;

}

}

return null;

}

function setButtonAbsent(button){

if(!button)return;

button.classList.remove("present");

button.classList.add("absent");

button.textContent=button.dataset.name+" (غایب)";

}

function setButtonPresent(button){

if(!button)return;

button.classList.remove("absent");

button.classList.add("present");

button.textContent=button.dataset.name;

}

async function loadTodayAttendance(){

const today=getToday();

const {data,error}=await supabaseClient
.from("attendance")
.select("student_name,status,attendance_date,class_name,updated_at")
.eq("class_name",className)
.eq("attendance_date",today);

if(error){

console.error(
"خطا در دریافت حضور و غیاب پیش‌۲:",
error
);

showMessage(
"خطا در دریافت وضعیت حضور و غیاب",
"error"
);

return;

}

students.forEach(student=>{

const button=findButton(student);

if(!button)return;

const normalizedStudent=normalizeStudentName(student);

const records=(data||[]).filter(record=>{

return normalizeStudentName(
record.student_name
)===normalizedStudent;

});

let record=null;

if(records.length){

records.sort((a,b)=>{

const dateA=new Date(a.updated_at||0).getTime();
const dateB=new Date(b.updated_at||0).getTime();

return dateB-dateA;

});

record=records[0];

}

if(record && record.status==="غایب"){

setButtonAbsent(button);

}else{

setButtonPresent(button);

}

});

updateCounts();

}

async function toggleAttendance(student,button){

if(!button)return;

const today=getToday();

const isAbsent=button.classList.contains("absent");

const newStatus=isAbsent
?"حاضر"
:"غایب";

button.disabled=true;

try{

const {data,error}=await supabaseClient
.from("attendance")
.upsert(
{
student_name:student,
class_name:className,
status:newStatus,
attendance_date:today,
updated_at:new Date().toISOString()
},
{
onConflict:"student_name,class_name,attendance_date"
}
)
.select();

if(error){

console.error(
"خطا در ثبت حضور و غیاب:",
error
);

showMessage(
"ثبت وضعیت انجام نشد",
"error"
);

button.disabled=false;

return;

}

if(newStatus==="غایب"){

setButtonAbsent(button);

showMessage(
"غیبت دانش‌آموز ثبت شد"
);

}else{

setButtonPresent(button);

showMessage(
"دانش‌آموز حاضر شد"
);

}

updateCounts();

console.log(
"✅ وضعیت پیش‌۲ ثبت شد:",
student,
newStatus,
data
);

}catch(error){

console.error(
"خطای غیرمنتظره:",
error
);

showMessage(
"خطا در ارتباط با سرور",
"error"
);

}

button.disabled=false;

}

function updateCounts(){

const buttons=document.querySelectorAll(
".student-button"
);

let absentCount=0;
let presentCount=0;

buttons.forEach(button=>{

if(button.classList.contains("absent")){

absentCount++;

}else{

presentCount++;

}

});

const absentElement=
document.getElementById("absentCount");

const presentElement=
document.getElementById("presentCount");

const totalElement=
document.getElementById("totalCount");

if(absentElement){

absentElement.textContent=absentCount;

}

if(presentElement){

presentElement.textContent=presentCount;

}

if(totalElement){

totalElement.textContent=buttons.length;

}

}

let lastDate=getToday();

setInterval(()=>{

const today=getToday();

if(today!==lastDate){

lastDate=today;

showDate();

loadTodayAttendance();

}

},30000);

document.addEventListener(
"visibilitychange",
()=>{

if(!document.hidden){

showDate();

loadTodayAttendance();

}

}
);

window.addEventListener(
"focus",
()=>{

showDate();

loadTodayAttendance();

}
);

createStudents();

showDate();

loadTodayAttendance();


const attendanceChannel=
supabaseClient
.channel("attendance-pre-2")

.on(
"postgres_changes",
{
event:"*",
schema:"public",
table:"attendance",
filter:"class_name=eq.پیش-2"
},
payload=>{

console.log(
"📡 Realtime پیش‌۲:",
payload
);

const record=payload.new;

if(!record){

console.log(
"⚠️ اطلاعات جدیدی در payload وجود ندارد:",
payload
);

return;

}

if(
record.class_name!==className
){

return;

}

if(
record.attendance_date!==getToday()
){

return;

}

const button=findButton(
record.student_name
);

if(!button){

console.log(
"⚠️ دکمه دانش‌آموز پیدا نشد:",
record.student_name
);

return;

}

if(record.status==="غایب"){

setButtonAbsent(button);

console.log(
"🔴 Realtime: دانش‌آموز غایب شد:",
record.student_name
);

}else{

setButtonPresent(button);

console.log(
"🟢 Realtime: دانش‌آموز حاضر شد:",
record.student_name
);

}

updateCounts();

}
)

.subscribe(status=>{

console.log(
"🚀 وضعیت Realtime پیش‌۲:",
status
);

});
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
"محمدرامان هلالی"
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

function createStudents(){

const container=document.getElementById(
"studentsContainer"
);

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

async function loadTodayAttendance(){

const today=getToday();

const{
data,
error
}=await supabaseClient
.from("attendance")
.select(
"student_name,status"
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

console.error(error);

showMessage(
"خطا در دریافت وضعیت حضور و غیاب",
"error"
);

return;

}

students.forEach(
student=>{

const record=data?.find(
item=>item.student_name===student
);

const button=findButton(student);

if(!button)return;

if(
record &&
record.status==="غایب"
){

setButtonAbsent(button);

}else{

setButtonPresent(button);

}

});

updateCounts();

}

function findButton(student){

return document.querySelector(
`.student-button[data-name="${CSS.escape(student)}"]`
);

}

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

if(isAbsent){

const{
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
);

if(error){

console.error(error);

showMessage(
"خطا در ثبت وضعیت",
"error"
);

button.disabled=false;

return;

}

setButtonPresent(button);

showMessage(
"دانش‌آموز حاضر شد"
);

}else{

const{
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
);

if(error){

console.error(error);

showMessage(
"خطا در ثبت غیبت",
"error"
);

button.disabled=false;

return;

}

setButtonAbsent(button);

showMessage(
"غیبت دانش‌آموز ثبت شد"
);

}

button.disabled=false;

updateCounts();

}

function updateCounts(){

const total=students.length;

const absent=document.querySelectorAll(
".student-button.absent"
).length;

const present=total-absent;

document.getElementById(
"totalCount"
).textContent=total;

document.getElementById(
"presentCount"
).textContent=present;

document.getElementById(
"absentCount"
).textContent=absent;

}

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

document.addEventListener(
"visibilitychange",
async()=>{

if(!document.hidden){

showDate();

await loadTodayAttendance();

}

});

window.addEventListener(
"focus",
async()=>{

showDate();

await loadTodayAttendance();

});

createStudents();

showDate();

loadTodayAttendance();

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
async()=>{

await loadTodayAttendance();

}
)
.subscribe(
status=>{

console.log(
"Attendance realtime:",
status
);

}
);
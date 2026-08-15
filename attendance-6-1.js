const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";

const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";

const supabaseClient=
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


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
{name:"مازیار نگهداری",className:"ششم-1"}

];


const className="ششم-1";

const studentsContainer=
document.getElementById("studentsContainer");

const totalCount=
document.getElementById("totalCount");

const presentCount=
document.getElementById("presentCount");

const absentCount=
document.getElementById("absentCount");

const todayDate=
document.getElementById("todayDate");

const message=
document.getElementById("message");


function getToday(){

    return new Intl.DateTimeFormat(
        "fa-IR-u-nu-latn",
        {
            year:"numeric",
            month:"2-digit",
            day:"2-digit"
        }
    ).format(new Date());

}


function showDate(){

todayDate.textContent=
new Date().toLocaleDateString(
"fa-IR",
{
weekday:"long",
year:"numeric",
month:"long",
day:"numeric"
}
);

}


function showMessage(text){

message.textContent=text;

message.classList.add("show");

clearTimeout(window.messageTimer);

window.messageTimer=
setTimeout(()=>{

message.classList.remove("show");

},2500);

}


function createStudents(){

studentsContainer.innerHTML="";

students.forEach(student=>{

const button=
document.createElement("button");

button.className=
"student-button present";

button.dataset.name=
student.name;

button.innerHTML=`

<span class="student-name">
${student.name}
</span>

<span class="student-status">
حاضر
</span>

`;

button.onclick=()=>{

toggleAttendance(
student,
button
);

};

studentsContainer.appendChild(button);

});

totalCount.textContent=
students.length;

updateCounts();

}


async function loadTodayAttendance(){

const today=
getToday();

const {data,error}=
await supabaseClient
.from("attendance")
.select("*")
.eq("class_name",className)
.eq("attendance_date",today);

if(error){

console.error(
"خطا در دریافت حضور و غیاب:",
error
);

showMessage(
"خطا در دریافت اطلاعات حضور و غیاب"
);

return;

}


data.forEach(record=>{

const button=
findButton(record.student_name);

if(!button)return;

if(record.status==="غایب"){

setButtonAbsent(button);

}else{

setButtonPresent(button);

}

});

updateCounts();

}


function findButton(name){

return document.querySelector(
`.student-button[data-name="${CSS.escape(name)}"]`
);

}


function setButtonAbsent(button){

button.classList.remove("present");

button.classList.add("absent");

button.querySelector(
".student-status"
).textContent="غایب";

}


function setButtonPresent(button){

button.classList.remove("absent");

button.classList.add("present");

button.querySelector(
".student-status"
).textContent="حاضر";

}


async function toggleAttendance(student,button){

const today=
getToday();

const isAbsent=
button.classList.contains("absent");

const newStatus=
isAbsent ? "حاضر" : "غایب";


const {error}=
await supabaseClient
.from("attendance")
.upsert(
{
student_name:student.name,
class_name:student.className,
status:newStatus,
attendance_date:today,
updated_at:new Date().toISOString()
},
{
onConflict:
"student_name,class_name,attendance_date"
}
);


if(error){

console.error(
"خطا در ثبت حضور و غیاب:",
error
);

showMessage(
"❌ ثبت وضعیت انجام نشد"
);

return;

}


if(newStatus==="غایب"){

setButtonAbsent(button);

showMessage(
`⚫ ${student.name} غایب شد`
);

}else{

setButtonPresent(button);

showMessage(
`🟢 ${student.name} حاضر شد`
);

}

updateCounts();

}


function updateCounts(){

const absent=
document.querySelectorAll(
".student-button.absent"
).length;

const present=
students.length-absent;

absentCount.textContent=
absent;

presentCount.textContent=
present;

}


supabaseClient
.channel("attendance-6-1")
.on(
"postgres_changes",
{
event:"*",
schema:"public",
table:"attendance",
filter:"class_name=eq.ششم-1"
},
payload=>{

console.log(
"📡 تغییر حضور و غیاب:",
payload
);

const record=
payload.new;

if(!record)return;

if(record.attendance_date!==getToday()){

return;

}

const button=
findButton(record.student_name);

if(!button)return;

if(record.status==="غایب"){

setButtonAbsent(button);

}else{

setButtonPresent(button);

}

updateCounts();

}
)
.subscribe(status=>{

console.log(
"Realtime حضور و غیاب ششم-1:",
status
);

});


showDate();

createStudents();

loadTodayAttendance();

let currentAttendanceDay = getToday();

function checkAttendanceDayChange(){

    const newDay = getToday();

    if(newDay === currentAttendanceDay){
        return;
    }

    console.log(
        "📅 روز جدید شروع شد:",
        currentAttendanceDay,
        "→",
        newDay
    );

    currentAttendanceDay = newDay;

    // تاریخ بالای صفحه را به‌روزرسانی کن
    showDate();

    // همه دانش‌آموزان را به حالت پیش‌فرض «حاضر» برگردان
    createStudents();

    // حضور و غیاب روز جدید را از Supabase دریافت کن
    loadTodayAttendance();

}

setInterval(
    checkAttendanceDayChange,
    30000
);
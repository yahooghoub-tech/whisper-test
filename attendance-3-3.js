const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient=
supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);
const students=[
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
];
const className="3-سوم";
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
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
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
.channel("attendance-3-3")
.on(
"postgres_changes",
{
event:"*",
schema:"public",
table:"attendance",
filter:"class_name=eq.3-سوم"
},
payload=>{
console.log(
"📡 تغییر حضور و غیاب:",
payload
);
const record=
payload.new;
if(!record){
loadTodayAttendance();
return;
}
if(record.class_name!=="3-سوم"){
return;
}
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
"Realtime حضور و غیاب 3-سوم:",
status
);
});
showDate();
createStudents();
loadTodayAttendance();


let currentAttendanceDay=getToday();
function checkAttendanceDayChange(){
const newDay=getToday();
if(newDay===currentAttendanceDay){
return;
}
console.log("📅 روز جدید حضور و غیاب:",currentAttendanceDay,"→",newDay);
currentAttendanceDay=newDay;
showDate();
createStudents();
loadTodayAttendance();
}
setInterval(checkAttendanceDayChange,30000);



async function refreshAttendance(){
    const today=
    getToday();
    const {data,error}=
    await supabaseClient
    .from("attendance")
    .select("*")
    .eq("class_name","3-سوم")
    .eq("attendance_date",today);
    if(error){
    console.error(
    "❌ خطا در بروزرسانی حضور و غیاب:",
    error
    );
    return;
    }
    students.forEach(student=>{
    const button=
    findButton(student.name);
    if(!button)return;
    const record=
    data.find(item=>
    item.student_name===student.name
    );
    if(record&&record.status==="غایب"){
    setButtonAbsent(button);
    }else{
    setButtonPresent(button);
    }
    });
    updateCounts();
    }
    window.addEventListener("focus",()=>{
    refreshAttendance();
    });
    document.addEventListener("visibilitychange",()=>{
    if(!document.hidden){
    refreshAttendance();
    }
    });
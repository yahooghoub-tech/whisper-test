const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient=
supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);
const students=[
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
];
const className="پنجم-1";
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
.channel("attendance-5-1")
.on(
"postgres_changes",
{
event:"*",
schema:"public",
table:"attendance",
filter:"class_name=eq.پنجم-1"
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
if(record.class_name!=="پنجم-1"){
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
"Realtime حضور و غیاب پنجم-1:",
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
    .eq("class_name","پنجم-1")
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
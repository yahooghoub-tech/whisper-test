const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";

const supabaseClient=supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

const className="چهارم-1";

const students=[
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
{name:"رایان مقدسی",className:"چهارم-1"}
];

const notificationSound=new Audio("notification.mp3");
notificationSound.preload="auto";

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

function getDatabaseToday(){
const d=new Date();
return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function normalizeText(text){
return String(text||"")
.replace(/\u200c/g,"")
.replace(/ي/g,"ی")
.replace(/ك/g,"ک")
.replace(/\s+/g,"")
.trim();
}

function findButton(name){
const target=normalizeText(name);
const buttons=document.querySelectorAll(".student-button");

for(const button of buttons){
if(normalizeText(button.dataset.name)===target){
return button;
}
}

return null;
}

function resetTeacherPanel(){
document.querySelectorAll(".student-button").forEach(button=>{
button.classList.remove("called");
button.classList.remove("sent");
button.classList.remove("absent");
button.classList.add("available");

const status=button.querySelector(".student-status");

if(status){
status.textContent="در انتظار";
}
});
}

function updateButton(call){

const button=findButton(call.student_name);

if(!button){
return;
}

button.classList.remove("available");
button.classList.remove("sent");
button.classList.remove("absent");

if(call.status==="ارسال شد"){

button.classList.add("sent");

const status=button.querySelector(".student-status");

if(status){
status.textContent="ارسال شد";
}

}else{

button.classList.add("called");

const status=button.querySelector(".student-status");

if(status){
status.textContent="فراخوان";
}

}

}

function updateCount(data){

const activeCalls=data.filter(
call=>call.status!=="ارسال شد"
);

const countElement=document.getElementById("callCount");

if(countElement){
countElement.textContent=activeCalls.length;
}

}

async function loadCalls(){

const today=getToday();

const {data,error}=await supabaseClient
.from("calls")
.select("*")
.eq("class_name",className)
.eq("called_date",today)
.order("id",{ascending:true});

if(error){

console.error(
"خطا در دریافت فراخوان:",
error
);

return;
}

resetTeacherPanel();

data.forEach(call=>{
updateButton(call);
});

updateCount(data);

await loadAbsentStudents();

}

async function sendStudent(student){

const {data,error}=await supabaseClient
.from("calls")
.select("*")
.eq("student_name",student.name)
.eq("class_name",className)
.neq("status","ارسال شد")
.order("id",{ascending:false})
.limit(1);

if(error){

console.error(
"خطا در پیدا کردن فراخوان:",
error
);

return;
}

if(!data||data.length===0){

console.log(
"فراخوان فعالی برای این دانش‌آموز وجود ندارد:",
student.name
);

return;
}

const call=data[0];

const {error:updateError}=await supabaseClient
.from("calls")
.update({
status:"ارسال شد",
sent_time:new Date().toISOString()
})
.eq("id",call.id);

if(updateError){

console.error(
"خطا در ارسال دانش‌آموز:",
updateError
);

return;
}

updateButton({
...call,
status:"ارسال شد"
});

await loadCalls();

}

async function loadAbsentStudents(){

const today=getDatabaseToday();

const {data,error}=await supabaseClient
.from("attendance")
.select("*")
.eq("class_name",className)
.eq("attendance_date",today)
.eq("status","غایب");

if(error){

console.error(
"خطا در دریافت غایبین:",
error
);

return;
}

document.querySelectorAll(".student-button").forEach(button=>{
button.classList.remove("absent");
});

data.forEach(record=>{

const button=findButton(record.student_name);

if(!button){
return;
}

button.classList.remove("available");
button.classList.remove("called");
button.classList.remove("sent");
button.classList.add("absent");

const status=button.querySelector(".student-status");

if(status){
status.textContent="غایب";
}

});

}

supabaseClient
.channel("teacher-4-1-realtime")
.on(
"postgres_changes",
{
event:"INSERT",
schema:"public",
table:"calls",
filter:"class_name=eq.چهارم-1"
},
payload=>{

console.log(
"📢 فراخوان جدید چهارم-1:",
payload
);

const call=payload.new;

if(!call){
return;
}

if(call.class_name!==className){
return;
}

if(call.called_date!==getToday()){
return;
}

updateButton(call);

updateCount(
[call]
);

try{
notificationSound.currentTime=0;
notificationSound.play();
}catch(error){
console.log("پخش صدا انجام نشد:",error);
}

}
)
.on(
"postgres_changes",
{
event:"UPDATE",
schema:"public",
table:"calls",
filter:"class_name=eq.چهارم-1"
},
payload=>{

console.log(
"📡 بروزرسانی فراخوان چهارم-1:",
payload
);

const call=payload.new;

if(!call){
return;
}

if(call.class_name!==className){
return;
}

if(call.called_date!==getToday()){
return;
}

updateButton(call);

loadCalls();

}
)
.on(
"postgres_changes",
{
event:"DELETE",
schema:"public",
table:"calls"
},
payload=>{

console.log(
"🗑 حذف فراخوان چهارم-1:",
payload
);

const deletedCall=payload.old;

if(
!deletedCall||
deletedCall.class_name!==className
){
return;
}

loadCalls();

}
)
.subscribe(status=>{

console.log(
"Realtime فراخوان چهارم-1:",
status
);

});

supabaseClient
.channel("teacher-4-1-attendance-realtime")
.on(
"postgres_changes",
{
event:"INSERT",
schema:"public",
table:"attendance",
filter:"class_name=eq.چهارم-1"
},
payload=>{

console.log(
"📡 حضور و غیاب جدید چهارم-1:",
payload
);

const record=payload.new;

if(!record){
return;
}

if(record.class_name!==className){
return;
}

if(record.attendance_date!==getDatabaseToday()){
return;
}

loadAbsentStudents();

}
)
.on(
"postgres_changes",
{
event:"UPDATE",
schema:"public",
table:"attendance",
filter:"class_name=eq.چهارم-1"
},
payload=>{

console.log(
"📡 بروزرسانی حضور و غیاب چهارم-1:",
payload
);

const record=payload.new;

if(!record){
return;
}

if(record.class_name!==className){
return;
}

if(record.attendance_date!==getDatabaseToday()){
return;
}

loadAbsentStudents();

}
)
.on(
"postgres_changes",
{
event:"DELETE",
schema:"public",
table:"attendance",
filter:"class_name=eq.چهارم-1"
},
payload=>{

console.log(
"🗑 حذف حضور و غیاب چهارم-1:",
payload
);

loadAbsentStudents();

}
)
.subscribe(status=>{

console.log(
"Realtime حضور و غیاب چهارم-1:",
status
);

});

function showSendNotification(name){

const popup=document.getElementById("sendNotification");

const popupName=document.getElementById("sendStudentName");

if(popupName){
popupName.textContent=name;
}

if(popup){
popup.classList.add("show");
}

}

function hideSendNotification(){

const popup=document.getElementById("sendNotification");

if(popup){
popup.classList.remove("show");
}

}

function createStudentButtons(){

const container=
document.getElementById("studentsContainer");

if(!container){
return;
}

if(
container.children.length>0
){
return;
}

students.forEach(student=>{

const button=document.createElement("button");

button.type="button";
button.className="student-button available";
button.dataset.name=student.name;

button.innerHTML=`
<span class="student-name">${student.name}</span>
<span class="student-status">در انتظار</span>
`;

button.addEventListener(
"click",
async()=>{
await sendStudent(student);
}
);

container.appendChild(button);

});

}

let currentCallDay=getToday();

function checkCallDayChange(){

const newDay=getToday();

if(newDay===currentCallDay){
return;
}

console.log(
"📅 روز جدید فراخوان:",
currentCallDay,
"→",
newDay
);

currentCallDay=newDay;

loadCalls();

}

setInterval(
checkCallDayChange,
30000
);

window.addEventListener(
"focus",
()=>{
loadCalls();
}
);

document.addEventListener(
"visibilitychange",
()=>{
if(!document.hidden){
loadCalls();
}
}
);

createStudentButtons();

loadCalls();
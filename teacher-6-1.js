
const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

if("serviceWorker" in navigator){

window.addEventListener("load",async()=>{

try{

const registration=
await navigator.serviceWorker.register(
"service-worker.js"
);

console.log(
"✅ Service Worker فعال شد:",
registration.scope
);

}catch(error){

console.error(
"❌ خطا در فعال‌سازی Service Worker:",
error
);

}

});

}


const isMobileOrTablet =
/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

if(isMobileOrTablet && "Notification" in window){

if(Notification.permission==="default"){

Notification.requestPermission().then(permission=>{

console.log("مجوز اعلان:",permission);

});

}

}

function showTeacherNotification(title,message){

if(!isMobileOrTablet)return;

if(!("Notification" in window))return;

if(Notification.permission!=="granted")return;

new Notification(title,{
body:message
});

}



if("Notification" in window){
if(Notification.permission==="default"){
Notification.requestPermission().then(permission=>{
console.log("Notification permission:",permission);
});
}
}

function showBrowserNotification(title,message){
if(!("Notification" in window))return;
if(Notification.permission==="granted"){
new Notification(title,{
body:message
});
}
}

let notificationAudio=null;

function playNotificationSound(){
try{
if(!notificationAudio){
notificationAudio=new Audio(
"data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQgAAAAA"
);
}
notificationAudio.currentTime=0;
notificationAudio.play().catch(error=>{
console.log("صدای اعلان پخش نشد:",error);
});
}catch(error){
console.error("خطا در پخش بوق:",error);
}
}


const students=[
{name:"مهان احمدی"},
{name:"پارسا بکایی"},
{name:"مهدی حسین زاده سیف"},
{name:"آرین خلج زاده"},
{name:"محسن دمرچلی"},
{name:"آرتین رضایی"},
{name:"علیسان صفیاری"},
{name:"آرتین عابدی"},
{name:"آراد عبدالله کرمی"},
{name:"مهیار غلامی"},
{name:"امیرپارسا فخرآبادی"},
{name:"سپهر فرج نژاد"},
{name:"رایان فرهبد"},
{name:"مهراد فخری"},
{name:"امیرحسین قابضی"},
{name:"آراد قیاسی"},
{name:"آرشا کیاپاشا"},
{name:"مهربد کاهانی"},
{name:"مهراد مظفر"},
{name:"عماد مظلومی نیا"},
{name:"آرتین محمدبیگی"},
{name:"میثم نگهداری"},
{name:"مازیار نگهداری"}
];

const studentsContainer=document.getElementById("studentsContainer");
const callCount=document.getElementById("callCount");
let notificationsEnabled=true;
function createStudents(){
studentsContainer.innerHTML="";
students.forEach(student=>{
const button=document.createElement("button");
button.className="student-button";
button.dataset.name=student.name;
button.innerHTML=`<div class="student-name">${student.name}</div><div class="student-status"></div><div class="student-time"></div>`;
button.addEventListener("click",()=>sendStudent(student));
studentsContainer.appendChild(button);
});
}

function findButton(name){
return [...document.querySelectorAll(".student-button")].find(button=>button.dataset.name===name);
}

function updateButton(call){
const button=findButton(call.student_name);
if(!button)return;
button.classList.remove("called","sent","received");
if(call.status==="فراخوان شد"){
button.classList.add("called");
button.querySelector(".student-status").innerText="(فراخوان)";
}
if(call.status==="دریافت فراخوان"){
button.classList.add("received");
button.querySelector(".student-status").innerText="(دریافت شد)";
}
if(call.status==="ارسال شد"){
button.classList.add("sent");
button.querySelector(".student-status").innerText="(ارسال شد)";
}
button.querySelector(".student-time").innerText=call.sent_time||call.received_time||call.called_time||"";
}


function resetStudentButton(call){

const button=findButton(call.student_name);

if(!button)return;

button.classList.remove(
"called",
"sent",
"received"
);

button.classList.add("pending");

button.querySelector(".student-status").innerText="";

button.querySelector(".student-time").innerText="";

}




async function loadCalls(){
const {data,error}=await supabaseClient.from("calls").select("*").eq("class_name","ششم-1").order("id",{ascending:true});
if(error){
console.error("خطا در دریافت فراخوان‌ها:",error);
return;
}
data.forEach(updateButton);
updateCount(data);
}

function updateCount(data){
if(!Array.isArray(data)){
console.error("updateCount: داده آرایه نیست:",data);
return;
}
const active=data.filter(call=>call.status!=="ارسال شد");
callCount.innerText=active.length+" فراخوان";
}

function resetTeacherPanel(){

document.querySelectorAll(".student-button").forEach(button=>{

button.classList.remove(
"called",
"sent",
"received"
);

button.classList.add("pending");

const status=
button.querySelector(".student-status");

const time=
button.querySelector(".student-time");

if(status){
status.innerText="";
}

if(time){
time.innerText="";
}

});

callCount.innerText="0 فراخوان";

console.log("🔄 صفحه معلم بدون Refresh ریست شد");

}


async function sendStudent(student){
const {data,error}=await supabaseClient.from("calls").select("*").eq("student_name",student.name).eq("class_name","ششم-1").neq("status","ارسال شد").order("id",{ascending:false}).limit(1);
if(error){
console.error(error);
return;
}
if(!data||data.length===0){
alert("برای این دانش‌آموز هنوز فراخوانی ثبت نشده است.");
return;
}
const call=data[0];
const now=new Date();
const time=now.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
const {data:updated,error:updateError}=await supabaseClient.from("calls").update({status:"ارسال شد",sent_time:time}).eq("id",call.id).select().single();
if(updateError){
console.error("خطا در ارسال دانش‌آموز:",updateError);
return;
}
updateButton(updated);
loadCalls();
showBrowserNotification(
"📤 ارسال دانش‌آموز",
student.name+" ارسال شد"
);
}

createStudents();
loadCalls();

supabaseClient
.channel("teacher-6-1-realtime")
.on(
"postgres_changes",
{
event:"INSERT",
schema:"public",
table:"calls",
filter:"class_name=eq.ششم-1"
},
payload=>{
const call=payload.new;

console.log("📢 فراخوان جدید:",call);

if(call.status!=="فراخوان شد")return;

playNotificationSound();

showTeacherNotification(
"📢 فراخوان جدید",
call.student_name+" از کلاس ششم-1 فراخوان شد"
);

const button=findButton(call.student_name);

if(button){
setTimeout(()=>{
updateButton({
...call,
status:"دریافت فراخوان"
});
button.classList.remove("called","sent");
button.classList.add("called");
},300);
}

loadCalls();

}
)
.on(
    "postgres_changes",
    {
    event:"UPDATE",
    schema:"public",
    table:"calls",
    filter:"class_name=eq.ششم-1"
    },
    payload=>{
    
    const call=payload.new;
    
    console.log("📤 تغییر وضعیت:",call);
    
    const button=findButton(call.student_name);
    
    if(button){
    updateButton(call);
    }
    
    loadCalls();
    
    if(call.status==="ارسال شد"){
    
    showBrowserNotification(
    "📤 ارسال دانش‌آموز",
    call.student_name+" ارسال شد"
    );
    
    }
    
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
        
        const deletedCall=payload.old;
        
        console.log(
        "🗑️ DELETE دریافت شد:",
        deletedCall
        );
        
        if(!deletedCall){
        return;
        }
        
        if(deletedCall.class_name!=="ششم-1"){
        return;
        }
        
        resetStudentButton(deletedCall);
        
        callCount.innerText="0 فراخوان";
        
        }
        )
    
    .subscribe(status=>{
    
    console.log(
    "Realtime teacher status:",
    status
    );
    
    });
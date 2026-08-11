
const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const VAPID_PUBLIC_KEY="BCmbfrcRi5ybjktf3b2y059xF5DW7djDCNusBR91iYOsPAbhU4lTwvWr4wkFRz_0IheO5iHsmiCInAbRvp918Co";

async function enablePushNotifications(){

const button=
document.getElementById("enablePushButton");

if(!button){
console.error(
"❌ دکمه enablePushButton پیدا نشد"
);
return;
}

try{

if(!("serviceWorker" in navigator)){

alert(
"این مرورگر از Push Notification پشتیبانی نمی‌کند."
);

return;

}

if(!("PushManager" in window)){

alert(
"Push Notification در این مرورگر پشتیبانی نمی‌شود."
);

return;

}

const permission=
await Notification.requestPermission();

if(permission!=="granted"){

alert(
"اجازه اعلان داده نشد."
);

return;

}

const registration=
await navigator.serviceWorker.ready;

let subscription=
await registration.pushManager.getSubscription();

if(!subscription){

subscription=
await registration.pushManager.subscribe({

userVisibleOnly:true,

applicationServerKey:
urlBase64ToUint8Array(
VAPID_PUBLIC_KEY
)

});

}

const subscriptionJSON=
subscription.toJSON();

const {error}=

await supabaseClient
.from("push_subscriptions")
.upsert({

class_name:"ششم-1",

endpoint:subscriptionJSON.endpoint,

p256dh:
subscriptionJSON.keys.p256dh,

auth:
subscriptionJSON.keys.auth

},{
onConflict:"endpoint"
});

if(error){

console.error(
"❌ خطا در ذخیره Subscription:",
error
);

alert(
"ثبت اعلان موبایل انجام نشد."
);

return;

}

button.innerText=
"✅ اعلان موبایل فعال است";

button.disabled=true;

console.log(
"✅ Push موبایل با موفقیت ثبت شد"
);

}catch(error){

console.error(
"❌ خطا در فعال‌سازی Push:",
error
);

alert(
"خطا در فعال‌سازی اعلان موبایل: "+
error.message
);

}

}
const testPushButton =
document.getElementById("testPushButton");

const pushTestResult =
document.getElementById("pushTestResult");

function pushTestMessage(
message,
success=false
){

pushTestResult.innerText=message;

pushTestResult.style.padding="12px";
pushTestResult.style.marginTop="10px";
pushTestResult.style.borderRadius="10px";
pushTestResult.style.fontWeight="bold";

if(success){

pushTestResult.style.background="#dcfce7";
pushTestResult.style.color="#166534";

}else{

pushTestResult.style.background="#fee2e2";
pushTestResult.style.color="#991b1b";

}

}

if(testPushButton){

testPushButton.addEventListener(
"click",
async()=>{

try{

pushTestMessage(
"⏳ در حال بررسی Push..."
);

if(!("serviceWorker" in navigator)){

throw new Error(
"Service Worker توسط مرورگر پشتیبانی نمی‌شود"
);

}

pushTestMessage(
"1️⃣ Service Worker در حال بررسی..."
);

const registration=
await navigator.serviceWorker.ready;

pushTestMessage(
"2️⃣ Service Worker فعال است ✅"
);

if(!("PushManager" in window)){

throw new Error(
"Push API در این مرورگر پشتیبانی نمی‌شود"
);

}

pushTestMessage(
"3️⃣ Push API فعال است ✅"
);

let subscription=
await registration.pushManager
.getSubscription();

if(subscription){

pushTestMessage(
"4️⃣ Subscription قبلی پیدا شد ✅"
);

}else{

pushTestMessage(
"4️⃣ در حال ساخت Subscription..."
);

const VAPID_PUBLIC_KEY="BCmbfrcRi5ybjktf3b2y059xF5DW7djDCNusBR91iYOsPAbhU4lTwvWr4wkFRz_0IheO5iHsmiCInAbRvp918Co";

subscription=
await registration.pushManager.subscribe({

userVisibleOnly:true,

applicationServerKey:
urlBase64ToUint8Array(
VAPID_PUBLIC_KEY
)

});

pushTestMessage(
"4️⃣ Subscription ساخته شد ✅"
);

}

console.log(
"Subscription:",
subscription
);

const json=
subscription.toJSON();

if(!json.endpoint){

throw new Error(
"Endpoint ساخته نشده است"
);

}

pushTestMessage(
"5️⃣ اطلاعات Push دریافت شد ✅"
);

const {error}=
await supabaseClient
.from("push_subscriptions")
.upsert({

endpoint:json.endpoint,

p256dh:json.keys.p256dh,

auth:json.keys.auth,

class_name:"ششم-1"

},{
onConflict:"endpoint"
});

if(error){

throw new Error(
"Supabase: "+
error.message
);

}

pushTestMessage(
"🎉 Push با موفقیت ثبت شد! ردیف Supabase ساخته شد.",
true
);

}catch(error){

console.error(error);

pushTestMessage(
"❌ خطا: "+
error.message
);

}

});

}
function urlBase64ToUint8Array(base64String){

const padding=
"=".repeat(
(4-base64String.length%4)%4
);

const base64=
(
base64String+
padding
)
.replace(/-/g,"+")
.replace(/_/g,"/");

const rawData=
window.atob(base64);

return Uint8Array.from(
[...rawData].map(
char=>char.charCodeAt(0)
)
);

}

const enablePushButton=
document.getElementById(
"enablePushButton"
);


console.log(
    "🔔 دکمه Push:",
    enablePushButton
    );


    if(enablePushButton){

        console.log(
        "✅ اتصال دکمه Push انجام شد"
        );
        
        enablePushButton.addEventListener(
        "click",
        async()=>{
        
        console.log(
        "🔘 دکمه فعال‌سازی Push کلیک شد"
        );
        
        await enablePushNotifications();
        
        });
        
        }else{
        
        console.error(
        "❌ enablePushButton در HTML پیدا نشد"
        );
        
        }
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


async function requestNotificationPermission(){

    if(!("Notification" in window)){
    
    console.log(
    "❌ Notification توسط مرورگر پشتیبانی نمی‌شود"
    );
    
    return;
    
    }
    
    if(Notification.permission==="default"){
    
    const permission=
    await Notification.requestPermission();
    
    console.log(
    "🔔 مجوز اعلان:",
    permission
    );
    
    }else{
    
    console.log(
    "🔔 وضعیت مجوز اعلان:",
    Notification.permission
    );
    
    }
    
    }
    
    async function showTeacherNotification(
    title,
    message
    ){
    
    if(!("Notification" in window)){
    
    console.log(
    "❌ Notification پشتیبانی نمی‌شود"
    );
    
    return;
    
    }
    
    if(Notification.permission!=="granted"){
    
    console.log(
    "⚠️ مجوز اعلان صادر نشده:",
    Notification.permission
    );
    
    return;
    
    }
    
    try{
    
    const registration=
    await navigator.serviceWorker.ready;
    
    await registration.showNotification(
    title,
    {
    
    body:message,
    
    icon:"icon-192.png",
    
    badge:"icon-192.png",
    
    tag:"student-call",
    
    renotify:true,
    
    vibrate:[
    200,
    100,
    200,
    100,
    300
    ]
    
    }
    );
    
    console.log(
    "🔔 اعلان نمایش داده شد"
    );
    
    }catch(error){
    
    console.error(
    "❌ خطا در نمایش اعلان:",
    error
    );
    
    }
    
    }
    
    requestNotificationPermission();



let notificationAudio=null;
let soundEnabled=false;

function setupSound(){

const button=
document.getElementById("enableSoundButton");

if(!button){

console.error(
"❌ دکمه enableSoundButton در HTML پیدا نشد"
);

return;

}

console.log(
"✅ دکمه فعال‌سازی صدا پیدا شد"
);

button.addEventListener("click",async()=>{

console.log(
"🔘 روی فعال‌سازی صدا کلیک شد"
);

try{

notificationAudio=
new Audio("notification.mp3");

notificationAudio.preload="auto";

notificationAudio.volume=1;

await notificationAudio.play();

notificationAudio.pause();

notificationAudio.currentTime=0;

soundEnabled=true;

button.innerText=
"🔊 صدای فراخوان فعال است";

button.disabled=true;

console.log(
"✅ صدای فراخوان فعال شد"
);

}catch(error){

console.error(
"❌ خطای فعال‌سازی صدا:",
error
);

alert(
"فایل صوتی پخش نشد: "+
error.message
);

}

});

}

function playNotificationSound(){

if(!soundEnabled||!notificationAudio){

console.log(
"⚠️ صدای فراخوان فعال نشده"
);

return;

}

try{

notificationAudio.currentTime=0;

notificationAudio.play().catch(error=>{

console.error(
"❌ خطا در پخش موسیقی:",
error
);

});

console.log(
"🔊 موسیقی فراخوان پخش شد"
);

}catch(error){

console.error(
"❌ خطای پخش موسیقی:",
error
);

}

}

window.addEventListener(
"load",
setupSound
);












window.addEventListener(
"load",
setupSound
);

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

setTimeout(()=>{

showTeacherNotification(
"📢 فراخوان جدید",
call.student_name+" از کلاس ششم-1 فراخوان شد"
);

},250);

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


    const permissionTestButton =
document.createElement("button");

permissionTestButton.innerText =
"🔍 تست مجوز اعلان";

permissionTestButton.style.cssText =
"width:100%;padding:14px;margin-top:10px;border:0;border-radius:12px;background:#2563eb;color:white;font-size:16px;font-weight:bold;";

document.body.appendChild(
permissionTestButton
);

permissionTestButton.onclick =
async()=>{

try{

const before =
Notification.permission;

let result="";

if(before==="default"){

result =
await Notification.requestPermission();

}else{

result=before;

}

alert(
"وضعیت مجوز قبل: "+
before+
"\n\nوضعیت مجوز بعد: "+
result
);

}catch(error){

alert(
"خطا:\n"+
error.message
);

}

};
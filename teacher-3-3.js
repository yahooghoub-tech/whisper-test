const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let notificationAudio=null;
let soundEnabled=false;
function setupSound(){
const button=document.getElementById("enableSoundButton");
if(!button){
console.error("❌ دکمه enableSoundButton در HTML پیدا نشد");
return;
}
console.log("✅ دکمه فعال‌سازی صدا پیدا شد");
button.addEventListener("click",async()=>{
console.log("🔘 روی دکمه صدای فراخوان کلیک شد");
try{
if(!soundEnabled){
notificationAudio=new Audio("notification.mp3");
notificationAudio.preload="auto";
notificationAudio.volume=1;
await notificationAudio.play();
notificationAudio.pause();
notificationAudio.currentTime=0;
soundEnabled=true;
button.innerText="🔊 صدای فراخوان فعال است";
button.style.background="#22c55e";
console.log("✅ صدای فراخوان فعال شد");
}else{
soundEnabled=false;
if(notificationAudio){
notificationAudio.pause();
notificationAudio.currentTime=0;
}
button.innerText="🔇 صدای فراخوان غیرفعال است";
button.style.background="#ef4444";
console.log("🔇 صدای فراخوان غیرفعال شد");
}
}catch(error){
console.error("❌ خطای تغییر وضعیت صدا:",error);
alert("خطا در تغییر وضعیت صدا: "+error.message);
}
});
}
function playNotificationSound(){
if(!soundEnabled||!notificationAudio){
console.log("⚠️ صدای فراخوان فعال نشده");
return;
}
try{
notificationAudio.currentTime=0;
notificationAudio.play().catch(error=>{
console.error("❌ خطا در پخش موسیقی:",error);
});
console.log("🔊 موسیقی فراخوان پخش شد");
}catch(error){
console.error("❌ خطای پخش موسیقی:",error);
}
}
function showSendNotification(studentName){
const popup=document.getElementById("callPopup");
const student=document.getElementById("callPopupStudent");
student.innerText="📤 "+studentName+" ارسال شد";
popup.classList.add("show");
playNotificationSound();
setTimeout(()=>{
popup.classList.remove("show");
},5000);
}
function showCallPopup(studentName){
const popup=document.getElementById("callPopup");
const student=document.getElementById("callPopupStudent");
if(!popup||!student){
console.error("❌ عناصر callPopup یا callPopupStudent پیدا نشدند");
return;
}
student.innerText=studentName+" فراخوان شد";
popup.classList.add("show");
setTimeout(()=>{
popup.classList.remove("show");
},7000);
}
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
const studentsContainer=document.getElementById("studentsContainer");
const callCount=document.getElementById("callCount");
function getToday(){
return new Intl.DateTimeFormat("fa-IR-u-nu-latn",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}

function getDatabaseToday(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }


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
if(button.classList.contains("absent")){
return;
}
button.classList.remove("called","sent","received");
if(call.status==="فراخوان شد"){
button.classList.add("called");
button.querySelector(".student-status").innerText="🔴 فراخوان";
}
if(call.status==="دریافت فراخوان"){
button.classList.add("received");
button.querySelector(".student-status").innerText="🟠 دریافت شد";
}
if(call.status==="ارسال شد"){
button.classList.add("sent");
button.querySelector(".student-status").innerText="🟢 ارسال شد";
}
let timeText="";
if(call.called_time){
timeText="🕐 فراخوان: "+call.called_time;
}
if(call.sent_time){
timeText+="<br>📤 ارسال: "+call.sent_time;
}
button.querySelector(".student-time").innerHTML=timeText;
}
function resetStudentButton(call){
    const button=findButton(call.student_name);
    if(!button)return;
    if(button.classList.contains("absent")){
    return;
    }
    button.classList.remove("called","sent","received");
    button.classList.add("pending");
    button.querySelector(".student-status").innerText="";
    button.querySelector(".student-time").innerText="";
    }
    async function loadCalls(){
    const today=getToday();
    const {data,error}=await supabaseClient.from("calls").select("*").eq("class_name","سوم-3").eq("called_date",today).order("id",{ascending:true});
    if(error){
    console.error("خطا در دریافت فراخوان‌های امروز:",error);
    return;
    }
    resetTeacherPanel();
    data.forEach(updateButton);
    updateCount(data);
    await loadAbsentStudents();
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
    if(button.classList.contains("absent")){
    return;
    }
    button.classList.remove("called","sent","received");
    button.classList.add("pending");
    const status=button.querySelector(".student-status");
    const time=button.querySelector(".student-time");
    if(status)status.innerText="";
    if(time)time.innerText="";
    });
    callCount.innerText="0 فراخوان";
    console.log("🔄 صفحه معلم بدون Refresh ریست شد");
    }
    async function sendStudent(student){
    const button=findButton(student.name);
    if(button&&button.classList.contains("absent")){
    console.log("⛔ این دانش‌آموز غایب است و امکان ارسال ندارد:",student.name);
    return;
    }
    const {data,error}=await supabaseClient.from("calls").select("*").eq("student_name",student.name).eq("class_name","سوم-3").neq("status","ارسال شد").order("id",{ascending:false}).limit(1);
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
    }
    async function loadAbsentStudents(){
    const today=getDatabaseToday()
    const {data,error}=await supabaseClient.from("attendance").select("*").eq("class_name","سوم-3").eq("attendance_date",today).eq("status","غایب");
    if(error){
    console.error("❌ خطا در دریافت غایبین:",error);
    return;
    }
    document.querySelectorAll(".student-button").forEach(button=>{
    button.classList.remove("absent");
    button.disabled=false;
    const nameDiv=button.querySelector(".student-name");
    if(nameDiv){
    nameDiv.innerText=button.dataset.name;
    }
    });
    data.forEach(absent=>{
    const button=findButton(absent.student_name);
    if(!button)return;
    button.classList.remove("called","sent","received","pending");
    button.classList.add("absent");
    button.disabled=true;
    const nameDiv=button.querySelector(".student-name");
    const status=button.querySelector(".student-status");
    const time=button.querySelector(".student-time");
    if(nameDiv){
    nameDiv.innerText=absent.student_name+" (غایب)";
    }
    if(status)status.innerText="";
    if(time)time.innerText="";
    });
    console.log("👤 غایبین امروز بارگذاری شدند:",data.length);
    }
    createStudents();
    loadCalls();
    loadAbsentStudents();
    window.addEventListener("load",setupSound);
    let currentTeacherCallDay=getToday();
    function checkTeacherCallDayChange(){
    const newDay=getToday();
    if(newDay===currentTeacherCallDay){
    return;
    }
    console.log("📅 روز فراخوان تغییر کرد:",currentTeacherCallDay,"→",newDay);
    currentTeacherCallDay=newDay;
    resetTeacherPanel();
    loadCalls();
    loadAbsentStudents();
    }
    setInterval(checkTeacherCallDayChange,30000);
    supabaseClient.channel("teacher-3-3-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"calls",filter:"class_name=eq.سوم-3"},payload=>{
        const call=payload.new;
        console.log("📢 فراخوان جدید:",call);
        if(call.status!=="فراخوان شد")return;
        if(call.called_date!==getToday()){
        console.log("⏭️ فراخوان مربوط به روز قبل است:",call.called_date);
        return;
        }
        const absentButton=findButton(call.student_name);
        if(absentButton&&absentButton.classList.contains("absent")){
        console.log("⛔ فراخوان برای دانش‌آموز غایب نادیده گرفته شد:",call.student_name);
        return;
        }
        showCallPopup(call.student_name);
        playNotificationSound();
        const button=findButton(call.student_name);
        if(button){
        setTimeout(()=>{
        if(button.classList.contains("absent"))return;
        updateButton({...call,status:"دریافت فراخوان"});
        button.classList.remove("called","sent");
        button.classList.add("called");
        },300);
        }
        loadCalls();
        }).on("postgres_changes",{event:"UPDATE",schema:"public",table:"calls",filter:"class_name=eq.سوم-3"},payload=>{
        const call=payload.new;
        const oldCall=payload.old;
        if(!call)return;
        if(call.class_name!=="سوم-3")return;
        if(call.called_date!==getToday()){
        console.log("⏭️ UPDATE مربوط به روز قبل است:",call.called_date);
        return;
        }
        console.log("📡 تغییر فراخوان:",call);
        if(oldCall.status!=="ارسال شد"&&call.status==="ارسال شد"){
        showSendNotification(call.student_name);
        }
        updateButton(call);
        loadCalls();
        }).on("postgres_changes",{event:"DELETE",schema:"public",table:"calls"},payload=>{
        const deletedCall=payload.old;
        console.log("🗑️ DELETE دریافت شد:",deletedCall);
        if(!deletedCall)return;
        if(deletedCall.class_name!=="سوم-3")return;
        resetStudentButton(deletedCall);
        loadCalls();
        }).subscribe(status=>{
        console.log("Realtime teacher status:",status);
        });
        supabaseClient.channel("teacher-3-3-attendance-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"attendance",filter:"class_name=eq.سوم-3"},payload=>{
        console.log("🟢 وضعیت حضور و غیاب جدید:",payload.new);
        if(!payload.new)return;
        if(payload.new.attendance_date!==getDatabaseToday())return;
        loadAbsentStudents();
        }).on("postgres_changes",{event:"UPDATE",schema:"public",table:"attendance",filter:"class_name=eq.سوم-3"},payload=>{
        console.log("🟡 وضعیت حضور و غیاب تغییر کرد:",payload.new);
        if(!payload.new)return;
        if(payload.new.attendance_date!==getToday())return;
        loadAbsentStudents();
        }).on("postgres_changes",{event:"DELETE",schema:"public",table:"attendance",filter:"class_name=eq.سوم-3"},payload=>{
        console.log("🔵 وضعیت حضور و غیاب حذف شد:",payload.old);
        loadAbsentStudents();
        }).subscribe(status=>{
        console.log("Realtime attendance status:",status);
        });
        
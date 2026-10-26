const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let notificationAudio=null;
let soundEnabled=false;
let lastTeacherCallsLoad = Date.now();
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
const students = [

    {name:"آرسام ابهری",className:"اول-1"},

    {name:"هومان باوی",className:"اول-1"},

    {name:"سامراد دمیرچلی",className:"اول-1"},

    {name:"آرش عبدی",className:"اول-1"},

    {name:"رادین عبدی",className:"اول-1"},

    {name:"میلان غلامی آبادانی",className:"اول-1"},

    {name:"آیهان قاسمی",className:"اول-1"},

    {name:"ویهان کاملی",className:"اول-1"},

    {name:"رایان محرابی",className:"اول-1"},

    {name:"آرشا محمودی",className:"اول-1"},

    {name:"رایان مقدم",className:"اول-1"},

    {name:"سید صدرا منصورزاده",className:"اول-1"},

    {name:"جاوید نصرالهی",className:"اول-1"}

];
const studentsContainer=document.getElementById("studentsContainer");
const callCount=document.getElementById("callCount");
function getToday(){
return new Intl.DateTimeFormat("fa-IR-u-nu-latn",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}

function getDatabaseToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        calendar: "gregory",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const part = type =>
        parts.find(item => item.type === type)?.value || "";

    return `${part("year")}-${part("month")}-${part("day")}`;
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
   
let teacherCallsLoading = false;

async function loadCalls() {
    if (teacherCallsLoading) return;

    teacherCallsLoading = true;

    try {
        const response = await fetch(
            "https://berandil.ir/farakhan-api/teacher-calls.php?class_name=" +
            encodeURIComponent("اول-1") +
            "&date=" + encodeURIComponent(getDatabaseToday()) +
            "&_=" + Date.now(),
            { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error("خطا در دریافت فراخوان‌ها:", result);
            return;
        }

        lastTeacherCallsLoad = Date.now();

        resetTeacherPanel();

        const calls = Array.isArray(result.data) ? result.data : [];

        calls.forEach(updateButton);
        updateCount(calls);

        // حضور و غیاب فعلاً طبق روش فعلی بارگذاری می‌شود
        await loadAbsentStudents();

    } catch (error) {
        console.error("خطا در دریافت فراخوان از هاست:", error);
    } finally {
        teacherCallsLoading = false;
    }
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
    
async function sendStudent(student) {
    const button = findButton(student.name);

    if (button && button.classList.contains("absent")) {
        alert("این دانش‌آموز غایب است و امکان ارسال ندارد.");
        return;
    }

    try {
        const response = await fetch(
            "https://berandil.ir/farakhan-api/teacher-calls.php?class_name=" +
            encodeURIComponent("اول-1") +
            "&date=" + encodeURIComponent(getDatabaseToday()),
            { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert("دریافت اطلاعات فراخوان ناموفق بود.");
            console.error(result);
            return;
        }

        const calls = Array.isArray(result.data) ? result.data : [];

        const call = calls
            .filter(item =>
                item.student_name === student.name &&
                item.status !== "ارسال شد" &&
                item.status !== "لغو شد"
            )
            .sort((a, b) => Number(b.id) - Number(a.id))[0];

        if (!call) {
            alert("برای این دانش‌آموز فراخوان فعالی پیدا نشد.");
            return;
        }

        const updateResponse = await fetch(
            "https://berandil.ir/farakhan-api/update-call-status.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: call.id,
                    status: "ارسال شد"
                })
            }
        );

        const updateResult = await updateResponse.json();

        if (!updateResponse.ok || !updateResult.success) {
            alert("تغییر وضعیت فراخوان انجام نشد.");
            console.error(updateResult);
            return;
        }

        await loadCalls();

    } catch (error) {
        console.error("خطا در ارسال فراخوان:", error);
        alert("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    }
}

    async function loadAbsentStudents(){
    const today=getDatabaseToday()
    const {data,error}=await supabaseClient.from("attendance").select("*").eq("class_name","اول-1").eq("attendance_date",today).eq("status","غایب");
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


    let teacherRealtimeChannel = null;

    function connectTeacherRealtime() {
    
        console.log("🔄 در حال اتصال Realtime پنل معلم...");
    
        if (teacherRealtimeChannel) {
            supabaseClient.removeChannel(teacherRealtimeChannel);
            teacherRealtimeChannel = null;
        }
    
        teacherRealtimeChannel = supabaseClient
            .channel("teacher-1-1-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "calls",
                    filter: "class_name=eq.اول-1"
                },
                payload => {
    
                    const call = payload.new;
    
                    console.log("📢 فراخوان جدید:", call);
    
                    if (call.status !== "فراخوان شد") return;
    
                    if (call.called_date !== getToday()) {
                        console.log("⏭️ فراخوان مربوط به روز قبل است:", call.called_date);
                        return;
                    }
    
                    const absentButton = findButton(call.student_name);
    
                    if (
                        absentButton &&
                        absentButton.classList.contains("absent")
                    ) {
                        console.log(
                            "⛔ فراخوان برای دانش‌آموز غایب نادیده گرفته شد:",
                            call.student_name
                        );
                        return;
                    }
    
                    showCallPopup(call.student_name);
    
                    playNotificationSound();
    
                    const button = findButton(call.student_name);
    
                    if (button) {
    
                        setTimeout(() => {
    
                            if (button.classList.contains("absent")) return;
    
                            updateButton({
                                ...call,
                                status: "دریافت فراخوان"
                            });
    
                            button.classList.remove("called", "sent");
                            button.classList.add("called");
    
                        }, 300);
                    }
    
                    loadCalls();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "calls",
                    filter: "class_name=eq.اول-1"
                },
                payload => {
    
                    const call = payload.new;
                    const oldCall = payload.old;
    
                    if (!call) return;
    
                    if (call.class_name !== "اول-1") return;
    
                    if (call.called_date !== getToday()) {
                        console.log(
                            "⏭️ UPDATE مربوط به روز قبل است:",
                            call.called_date
                        );
                        return;
                    }
    
                    console.log("📡 تغییر فراخوان:", call);
    
                    if (
                        oldCall.status !== "ارسال شد" &&
                        call.status === "ارسال شد"
                    ) {
                        showSendNotification(call.student_name);
                    }
    
                    updateButton(call);
                    loadCalls();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "calls"
                },
                payload => {
    
                    const deletedCall = payload.old;
    
                    console.log("🗑️ DELETE دریافت شد:", deletedCall);
    
                    if (!deletedCall) return;
    
                    if (deletedCall.class_name !== "اول-1") return;
    
                    resetStudentButton(deletedCall);
                    loadCalls();
                }
            )
            .subscribe(status => {
    
                console.log("Realtime teacher status:", status);
    
                if (status === "SUBSCRIBED") {
    
                    console.log("🟢 Realtime پنل معلم متصل شد");
    
                    loadCalls();
    
                }
    
                if (
                    status === "CHANNEL_ERROR" ||
                    status === "TIMED_OUT" ||
                    status === "CLOSED"
                ) {
    
                    console.log(
                        "🔴 اتصال Realtime قطع شد:",
                        status
                    );
    
                    setTimeout(() => {
    
                        console.log(
                            "🔄 تلاش مجدد برای اتصال Realtime..."
                        );
    
                        connectTeacherRealtime();
    
                    }, 3000);
                }
            });
    }







    connectTeacherRealtime();
    let lastTeacherRealtimeCheck = Date.now();

setInterval(async () => {

    console.log("🔎 بررسی سلامت اتصال پنل معلم...");

    try {

        const { error } = await supabaseClient
            .from("calls")
            .select("id")
            .eq("class_name", "اول-1")
            .limit(1);

        if (error) {

            console.log(
                "🔴 ارتباط با دیتابیس مشکل دارد:",
                error.message
            );

            return;
        }

        lastTeacherRealtimeCheck = Date.now();

        console.log("🟢 ارتباط با دیتابیس سالم است");

        await loadCalls();

    } catch (error) {

        console.error(
            "❌ خطا در بررسی سلامت اتصال:",
            error
        );
    }

}, 30000);
let teacherAttendanceRealtimeChannel = null;

function connectTeacherAttendanceRealtime() {

    console.log("🔄 در حال اتصال Realtime حضور و غیاب...");

    if (teacherAttendanceRealtimeChannel) {
        supabaseClient.removeChannel(
            teacherAttendanceRealtimeChannel
        );

        teacherAttendanceRealtimeChannel = null;
    }

    teacherAttendanceRealtimeChannel = supabaseClient
        .channel("teacher-1-1-attendance-realtime")

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "attendance",
                filter: "class_name=eq.اول-1"
            },
            payload => {

                console.log(
                    "🟢 وضعیت حضور و غیاب جدید:",
                    payload.new
                );

                if (!payload.new) return;

                if (
                    payload.new.attendance_date !==
                    getDatabaseToday()
                ) {
                    return;
                }

                loadAbsentStudents();
            }
        )

        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "attendance",
                filter: "class_name=eq.اول-1"
            },
            payload => {

                console.log(
                    "🟡 وضعیت حضور و غیاب تغییر کرد:",
                    payload.new
                );

                if (!payload.new) return;

                if (
                    payload.new.attendance_date !==
                    getDatabaseToday()
                ) {
                    return;
                }

                loadAbsentStudents();
            }
        )

        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "attendance",
                filter: "class_name=eq.اول-1"
            },
            payload => {

                console.log(
                    "🔵 وضعیت حضور و غیاب حذف شد:",
                    payload.old
                );

                loadAbsentStudents();
            }
        )

        .subscribe(status => {

            console.log(
                "Realtime attendance status:",
                status
            );

            if (status === "SUBSCRIBED") {

                console.log(
                    "🟢 Realtime حضور و غیاب متصل شد"
                );

                loadAbsentStudents();
            }

            if (
                status === "CHANNEL_ERROR" ||
                status === "TIMED_OUT" ||
                status === "CLOSED"
            ) {

                console.log(
                    "🔴 اتصال Realtime حضور و غیاب قطع شد:",
                    status
                );

                setTimeout(() => {

                    console.log(
                        "🔄 تلاش مجدد برای اتصال حضور و غیاب..."
                    );

                    connectTeacherAttendanceRealtime();

                }, 3000);
            }
        });
}

connectTeacherAttendanceRealtime();


let teacherInternetWasOffline = false;

window.addEventListener("offline", () => {

    teacherInternetWasOffline = true;

    console.log("🔴 اینترنت پنل معلم قطع شد");

});

window.addEventListener("online", async () => {

    console.log("🟢 اینترنت پنل معلم دوباره وصل شد");

    if (!teacherInternetWasOffline) {
        return;
    }

    teacherInternetWasOffline = false;

    console.log("🔄 در حال بازسازی اتصال‌های Realtime...");

    try {

        connectTeacherRealtime();

        connectTeacherAttendanceRealtime();

        await loadCalls();

        await loadAbsentStudents();

        console.log(
            "✅ پنل معلم بعد از اتصال مجدد اینترنت به‌روزرسانی شد"
        );

    } catch (error) {

        console.error(
            "❌ خطا هنگام بازسازی اتصال پنل معلم:",
            error
        );

    }

});
setInterval(async () => {

    if (!navigator.onLine) {

        console.log(
            "⏸️ Watchdog: اینترنت قطع است"
        );

        return;
    }

    const now = Date.now();

    const secondsSinceLastLoad =
        (now - lastTeacherCallsLoad) / 1000;

    console.log(
        "🩺 Watchdog Realtime:",
        Math.round(secondsSinceLastLoad),
        "ثانیه از آخرین بررسی"
    );

    if (secondsSinceLastLoad < 90) {
        return;
    }

    console.log(
        "⚠️ Watchdog: اتصال Realtime احتمالاً گیر کرده است"
    );

    try {

        console.log(
            "🔄 Watchdog: بازسازی اتصال Realtime..."
        );

        connectTeacherRealtime();

        connectTeacherAttendanceRealtime();

        await loadCalls();

        await loadAbsentStudents();

        console.log(
            "✅ Watchdog: اتصال‌ها بازسازی شدند"
        );

    } catch (error) {

        console.error(
            "❌ Watchdog: خطا در بازسازی اتصال:",
            error
        );

    }

}, 30000);



/* REAL-TIME فراخوان معلم از هاست */

let hostRealtimeTimer = null;

function startHostRealtime() {
    if (hostRealtimeTimer !== null) {
        clearInterval(hostRealtimeTimer);
    }

    hostRealtimeTimer = setInterval(() => {
        if (document.visibilityState === "visible") {
            loadCalls();
        }
    }, 500);
}

startHostRealtime();
/* به‌روزرسانی خودکار پنل فراخوان هر ۳ ثانیه */

setInterval(() => {
    if (document.visibilityState === "visible") {
        loadCalls();
    }
}, 1000);
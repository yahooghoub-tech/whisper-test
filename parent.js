const SUPABASE_URL =
"https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY =
"sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);
const loginScreen =
document.getElementById("loginScreen");
const parentPanel =
document.getElementById("parentPanel");
const loginButton =
document.getElementById("loginButton");
const studentNameInput =
document.getElementById("studentName");
const parentCodeInput =
document.getElementById("parentCode");
const message =
document.getElementById("message");
const panelStudentName =
document.getElementById("panelStudentName");
const panelClassName =
document.getElementById("panelClassName");
const currentDate =
document.getElementById("currentDate");
const currentTime =
document.getElementById("currentTime");
const callButton =
document.getElementById("callButton");
const locationStatus =
document.getElementById("locationStatus");
const callActivationTime =
document.getElementById("callActivationTime");
const callDescription =
document.getElementById("callDescription");
let currentStudentName = "";
let currentClassName = "";
let parentCallChannel = null;
/* =========================
زمان مجاز هر کلاس
========================= */
function getCallSchedule(className) {
if (
className === "پیش-1" ||
className === "پیش-2"
) {
return {
start: 14 * 60,
end: 24 * 60,
text: "۱۴:۰۰ تا ۲۴:۰۰"
};
}
if (
className === "اول-1" ||
className === "اول-2" ||
className === "اول-3"
) {
return {
start: 14 * 60 + 30,
end: 24 * 60,
text: "۱۴:۳۰ تا ۲۴:۰۰"
};
}
return {
start: 14 * 60 + 40,
end: 16 * 60,
text: "۱۴:۴۰ تا ۲۴:۰۰"
};
}
/* =========================
ساعت ایران
========================= */
function getIranTimeParts() {
const parts =
new Intl.DateTimeFormat(
"en-US",
{
timeZone: "Asia/Tehran",
hour: "2-digit",
minute: "2-digit",
second: "2-digit",
hour12: false
}
).formatToParts(
new Date()
);
const hour =
Number(
parts.find(
item =>
item.type === "hour"
).value
);
const minute =
Number(
parts.find(
item =>
item.type === "minute"
).value
);
const second =
Number(
parts.find(
item =>
item.type === "second"
).value
);
return {
hour,
minute,
second,
totalMinutes:
hour * 60 + minute
};
}
/* =========================
تاریخ ایران
========================= */
function getIranDate() {
return new Intl.DateTimeFormat(
"fa-IR-u-nu-latn",
{
timeZone: "Asia/Tehran",
year: "numeric",
month: "2-digit",
day: "2-digit"
}
).format(
new Date()
);
}
function getIranTime() {
const iran =
getIranTimeParts();
return String(
iran.hour
).padStart(
2,
"0"
) +
":" +
String(
iran.minute
).padStart(
2,
"0"
) +
":" +
String(
iran.second
).padStart(
2,
"0"
);
}
/* =========================
تاریخ شمسی نمایشی
========================= */
function getPersianDate() {
return new Intl.DateTimeFormat(
"fa-IR-u-ca-persian",
{
timeZone: "Asia/Tehran",
weekday: "long",
year: "numeric",
month: "long",
day: "numeric"
}
).format(
new Date()
);
}
/* =========================
ساعت و تاریخ پنل
========================= */
function updateDateTime() {
const iran =
getIranTimeParts();
currentDate.textContent =
getPersianDate();
currentTime.textContent =
new Intl.NumberFormat(
"fa-IR"
).format(
iran.hour
) +
":" +
new Intl.NumberFormat(
"fa-IR"
).format(
iran.minute
) +
":" +
new Intl.NumberFormat(
"fa-IR"
).format(
iran.second
);
}
updateDateTime();
setInterval(
updateDateTime,
1000
);
/* =========================
بررسی زمان مجاز
========================= */
function isCallTimeActive() {
if (
!currentClassName
) {
return false;
}
const schedule =
getCallSchedule(
currentClassName
);
const iran =
getIranTimeParts();
return (
iran.totalMinutes >=
schedule.start
&&
iran.totalMinutes <
schedule.end
);
}
/* =========================
وضعیت زمان فراخوان
========================= */
function updateCallScheduleUI() {
if (
!currentClassName
) {
return;
}
const schedule =
getCallSchedule(
currentClassName
);
callActivationTime.textContent =
"ساعت " +
schedule.text;
callDescription.textContent =
"فراخوانی دانش‌آموز از ساعت " +
schedule.text +
" فعال است. برای ارسال فراخوان، ابتدا موقعیت مکانی شما بررسی می‌شود.";
const active =
isCallTimeActive();
if (active) {
if (
callButton.dataset.locked !==
"true"
) {
callButton.disabled =
false;
callButton.dataset.timeBlocked =
"false";
callButton.textContent =
"📢 فراخوانی دانش‌آموز";
callButton.style.background =
"linear-gradient(135deg, #2563eb, #0284c7)";
callButton.style.boxShadow =
"0 15px 30px rgba(37, 99, 235, 0.25)";
}
}
else {
if (
callButton.dataset.locked !==
"true"
) {
callButton.disabled =
true;
callButton.dataset.timeBlocked =
"true";
callButton.textContent =
"⏰ خارج از زمان فراخوان";
callButton.style.background =
"linear-gradient(135deg, #94a3b8, #64748b)";
callButton.style.boxShadow =
"none";
}
}
}
setInterval(
() => {
if (
currentStudentName &&
currentClassName
) {
updateCallScheduleUI();
}
},
1000
);
/* =========================
وضعیت فراخوان
========================= */
function updateParentCallStatus(
call
) {
if (!call) {
return;
}
const statusElement =
document.querySelector(
".status"
);
const statusDot =
document.querySelector(
".status-dot"
);
if (
call.status ===
"فراخوان شد"
) {
statusElement.lastChild.textContent =
" فراخوان شد";
statusDot.style.background =
"#f59e0b";
}
else if (
call.status ===
"دریافت فراخوان"
) {
statusElement.lastChild.textContent =
" دریافت فراخوان";
statusDot.style.background =
"#2563eb";
}
else if (
call.status ===
"ارسال شد"
) {
statusElement.lastChild.textContent =
" ارسال شد";
statusDot.style.background =
"#16a34a";
}
}
/* =========================
دریافت فراخوان امروز
========================= */
async function loadExistingCall() {
if (
!currentStudentName ||
!currentClassName
) {
return;
}
const today =
getIranDate();
const {
data,
error
} =
await supabaseClient
.from("calls")
.select("*")
.eq(
"student_name",
currentStudentName
)
.eq(
"class_name",
currentClassName
)
.eq(
"called_date",
today
)
.in(
"status",
[
"فراخوان شد",
"دریافت فراخوان",
"ارسال شد"
]
)
.order(
"id",
{
ascending: false
}
)
.limit(1)
.maybeSingle();
if (error) {
console.error(
"خطا در دریافت فراخوان:",
error
);
return;
}
if (!data) {
callButton.dataset.locked =
"false";
updateCallScheduleUI();
return;
}
updateParentCallStatus(
data
);
callButton.dataset.locked =
"true";
if (
data.status ===
"فراخوان شد"
) {
callButton.disabled =
true;
callButton.textContent =
"📢 فراخوان ارسال شده";
callButton.style.background =
"linear-gradient(135deg, #16a34a, #22c55e)";
}
else if (
data.status ===
"دریافت فراخوان"
) {
callButton.disabled =
true;
callButton.textContent =
"📢 فراخوان در حال پیگیری";
}
else if (
data.status ===
"ارسال شد"
) {
callButton.disabled =
true;
callButton.textContent =
"✅ فراخوان ارسال شد";
callButton.style.background =
"linear-gradient(135deg, #16a34a, #22c55e)";
}
}
/* =========================
Realtime
========================= */
function startParentRealtime() {
if (
!currentStudentName ||
!currentClassName
) {
return;
}
if (parentCallChannel) {
supabaseClient.removeChannel(
parentCallChannel
);
}
parentCallChannel =
supabaseClient
.channel(
"parent-call-" +
Date.now()
)
.on(
"postgres_changes",
{
event: "*",
schema: "public",
table: "calls",
filter:
"class_name=eq." +
currentClassName
},
(payload) => {
const call =
payload.new;
if (!call) {
return;
}
if (
call.student_name !==
currentStudentName
) {
return;
}
if (
call.called_date !==
getIranDate()
) {
return;
}
updateParentCallStatus(
call
);
callButton.dataset.locked =
"true";
if (
call.status ===
"فراخوان شد"
) {
callButton.disabled =
true;
callButton.textContent =
"📢 فراخوان ارسال شده";
callButton.style.background =
"linear-gradient(135deg, #16a34a, #22c55e)";
}
else if (
call.status ===
"دریافت فراخوان"
) {
callButton.disabled =
true;
callButton.textContent =
"📢 فراخوان در حال پیگیری";
}
else if (
call.status ===
"ارسال شد"
) {
callButton.disabled =
true;
callButton.textContent =
"✅ فراخوان ارسال شد";
callButton.style.background =
"linear-gradient(135deg, #16a34a, #22c55e)";
}
}
)
.subscribe(
(status) => {
console.log(
"Parent Realtime:",
status
);
}
);
}
/* =========================
ورود والد
========================= */
loginButton.addEventListener(
"click",
async () => {
const name =
studentNameInput.value.trim();
const code =
parentCodeInput.value.trim();
message.textContent =
"";
if (
!name ||
!code
) {
message.textContent =
"لطفاً نام دانش‌آموز و کد ورود را وارد کنید.";
message.style.color =
"#dc2626";
return;
}
if (
!/^\d{4}$/.test(code)
) {
message.textContent =
"کد ورود باید دقیقاً ۴ رقم باشد.";
message.style.color =
"#dc2626";
return;
}
loginButton.disabled =
true;
loginButton.textContent =
"در حال بررسی...";
const {
data,
error
} =
await supabaseClient
.from("parent_accounts")
.select(
"id, student_name, class_name"
)
.eq(
"student_name",
name
)
.eq(
"parent_code",
code
)
.maybeSingle();
if (error) {
console.error(
"LOGIN ERROR:",
error
);
message.textContent =
"خطا در ارتباط با سامانه.";
message.style.color =
"#dc2626";
}
else if (!data) {
message.textContent =
"نام دانش‌آموز یا کد ورود صحیح نیست.";
message.style.color =
"#dc2626";
}
else {
currentStudentName =
data.student_name;
currentClassName =
data.class_name;
panelStudentName.textContent =
data.student_name;
panelClassName.textContent =
"کلاس " +
data.class_name;
updateCallScheduleUI();
message.textContent =
"ورود موفق بود ✅";
message.style.color =
"#16a34a";
setTimeout(
async () => {
loginScreen.style.display =
"none";
parentPanel.style.display =
"block";
window.scrollTo(
{
top: 0,
behavior: "smooth"
}
);
updateCallScheduleUI();
await loadExistingCall();
startParentRealtime();
},
400
);
}
loginButton.disabled =
false;
loginButton.textContent =
"ورود به پنل";
}
);
/* =========================
ورود با Enter
========================= */
studentNameInput.addEventListener(
"keydown",
event => {
if (
event.key ===
"Enter"
) {
loginButton.click();
}
}
);
parentCodeInput.addEventListener(
"keydown",
event => {
if (
event.key ===
"Enter"
) {
loginButton.click();
}
}
);
/* =========================
فقط ۴ رقم برای کد
========================= */
parentCodeInput.addEventListener(
"input",
() => {
parentCodeInput.value =
parentCodeInput.value
.replace(
/\D/g,
""
)
.slice(
0,
4
);
}
);
/* =========================
ثبت فراخوان
========================= */
callButton.addEventListener(
"click",
async () => {
if (
!currentStudentName ||
!currentClassName
) {
alert(
"اطلاعات دانش‌آموز یافت نشد."
);
return;
}
if (
!isCallTimeActive()
) {
const schedule =
getCallSchedule(
currentClassName
);
alert(
"فراخوانی این کلاس فقط از ساعت " +
schedule.text +
" فعال است."
);
updateCallScheduleUI();
return;
}
if (
callButton.dataset.locked ===
"true"
) {
return;
}
if (
!navigator.geolocation
) {
alert(
"مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند."
);
return;
}
callButton.disabled =
true;
callButton.textContent =
"📍 در حال بررسی موقعیت...";
locationStatus.textContent =
"در حال بررسی موقعیت...";
locationStatus.style.color =
"#2563eb";
navigator.geolocation.getCurrentPosition(
async (position) => {
const latitude =
position.coords.latitude;
const longitude =
position.coords.longitude;
const schoolLat =
35.76494314018861;
const schoolLng =
51.32257158390593;
const allowedRadius =
5000;
const earthRadius =
6371000;
const lat1 =
latitude *
Math.PI /
180;
const lat2 =
schoolLat *
Math.PI /
180;
const dLat =
(
schoolLat -
latitude
) *
Math.PI /
180;
const dLng =
(
schoolLng -
longitude
) *
Math.PI /
180;
const a =
Math.sin(
dLat / 2
) ** 2 +
Math.cos(lat1) *
Math.cos(lat2) *
Math.sin(
dLng / 2
) ** 2;
const c =
2 *
Math.atan2(
Math.sqrt(a),
Math.sqrt(1 - a)
);
const distance =
Math.round(
earthRadius * c
);
if (
distance >
allowedRadius
) {
locationStatus.textContent =
`خارج از محدوده مدرسه — ${distance} متر`;
locationStatus.style.color =
"#dc2626";
callButton.disabled =
false;
callButton.textContent =
"📢 فراخوانی دانش‌آموز";
alert(
`شما خارج از محدوده مجاز مدرسه هستید.\nفاصله: ${distance} متر\nمحدوده مجاز: ۵۰ متر`
);
return;
}
locationStatus.textContent =
`داخل محدوده مدرسه — ${distance} متر`;
locationStatus.style.color =
"#16a34a";
callButton.textContent =
"📢 در حال ارسال فراخوان...";
const today =
getIranDate();
const {
data: activeCall,
error: activeError
} =
await supabaseClient
.from("calls")
.select("*")
.eq(
"student_name",
currentStudentName
)
.eq(
"class_name",
currentClassName
)
.eq(
"called_date",
today
)
.in(
"status",
[
"فراخوان شد",
"دریافت فراخوان"
]
)
.order(
"id",
{
ascending: false
}
)
.limit(1)
.maybeSingle();
if (activeError) {
console.error(
activeError
);
callButton.disabled =
false;
callButton.textContent =
"📢 فراخوانی دانش‌آموز";
alert(
"خطا در بررسی فراخوان قبلی."
);
return;
}
if (activeCall) {
updateParentCallStatus(
activeCall
);
callButton.dataset.locked =
"true";
callButton.disabled =
true;
callButton.textContent =
"📢 فراخوان قبلاً ارسال شده";
alert(
"برای این دانش‌آموز یک فراخوان فعال وجود دارد."
);
return;
}
const calledDate =
getIranDate();
const calledTime =
getIranTime();
const {
data: newCall,
error: insertError
} =
await supabaseClient
.from("calls")
.insert(
[
{
student_name:
currentStudentName,
class_name:
currentClassName,
status:
"فراخوان شد",
called_date:
calledDate,
called_time:
calledTime
}
]
)
.select()
.single();
if (insertError) {
console.error(
"CALL INSERT ERROR:",
insertError
);
callButton.disabled =
false;
callButton.textContent =
"📢 فراخوانی دانش‌آموز";
alert(
"ارسال فراخوان انجام نشد.\nلطفاً دوباره تلاش کنید."
);
return;
}
callButton.dataset.locked =
"true";
callButton.disabled =
true;
callButton.textContent =
"✅ فراخوان ارسال شد";
callButton.style.background =
"linear-gradient(135deg, #16a34a, #22c55e)";
callButton.style.boxShadow =
"0 15px 30px rgba(22, 163, 74, 0.25)";
updateParentCallStatus(
newCall
);
alert(
`فراخوان با موفقیت ارسال شد.\nزمان ارسال: ${calledTime}`
);
},
(error) => {
console.error(
"GPS ERROR:",
error
);
callButton.disabled =
false;
callButton.textContent =
"📢 فراخوانی دانش‌آموز";
locationStatus.textContent =
"خطا در دریافت موقعیت";
locationStatus.style.color =
"#dc2626";
if (
error.code === 1
) {
alert(
"دسترسی به موقعیت مکانی داده نشد."
);
}
else if (
error.code === 2
) {
alert(
"موقعیت مکانی شما قابل تشخیص نیست."
);
}
else if (
error.code === 3
) {
alert(
"زمان دریافت موقعیت مکانی تمام شد."
);
}
else {
alert(
"خطا در دریافت موقعیت مکانی."
);
}
},
{
enableHighAccuracy: true,
timeout: 10000,
maximumAge: 0
}
);
}
);
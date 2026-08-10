const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
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
button.classList.remove("called","sent");
if(call.status==="دریافت فراخوان"){
button.classList.add("called");
button.querySelector(".student-status").innerText="(دریافت شد)";
}
if(call.status==="ارسال شد"){
button.classList.add("sent");
button.querySelector(".student-status").innerText="(ارسال شد)";
}
button.querySelector(".student-time").innerText=call.sent_time||call.received_time||call.called_time||"";
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
const active=data.filter(call=>call.status!=="ارسال شد");
callCount.innerText=active.length+" فراخوان";
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
}
createStudents();
loadCalls();
supabaseClient.channel("click-realtime").on("postgres_changes",{event:"UPDATE",schema:"public",table:"calls"},payload=>{
    const call=payload.new;
    
    const button=findButton(call.student_name,call.class_name);
    
    if(button){
    updateButton(button,call);
    updateCount(call.class_name);
    }
    
    if(call.status==="ارسال شد"){
    showBrowserNotification(
    "📤 ارسال دانش‌آموز",
    call.student_name+" توسط معلم ارسال شد"
    );
    }
    
    }).subscribe();
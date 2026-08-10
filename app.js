const startBtn=document.getElementById("startBtn");
const stopBtn=document.getElementById("stopBtn");
const status=document.getElementById("status");
const liveText=document.getElementById("liveText");
const result=document.getElementById("result");

const students=[
"امیرپارسا فخرآبادی",
"علیسان صفیاری",
"محمدرضا احمدی",
"پارسا رستمی",
"آرین محمدی",
"مهدی کریمی"
];

let stream=null;
let recorder=null;
let listening=false;
let processing=false;
let audioChunks=[];
let currentTimer=null;
let calledStudents=[];

const CHUNK_TIME=5000;
const MIN_AUDIO_SIZE=2000;
const MATCH_THRESHOLD=0.90;

startBtn.addEventListener("click",startListening);
stopBtn.addEventListener("click",stopListening);

async function startListening(){

if(listening){
return;
}

try{

stream=await navigator.mediaDevices.getUserMedia({
audio:{
echoCancellation:true,
noiseSuppression:true,
autoGainControl:true
}
});

listening=true;

startBtn.disabled=true;
stopBtn.disabled=false;

status.textContent="🟢 میکروفون فعال است";
liveText.textContent="در انتظار اسم...";

startRecorder();

}catch(error){

console.error(error);

status.textContent="❌ خطا در فعال کردن میکروفون";

}

}

function startRecorder(){

if(!listening){
return;
}

audioChunks=[];

recorder=new MediaRecorder(
stream,
{
mimeType:"audio/webm"
}
);

recorder.ondataavailable=event=>{

if(event.data.size>0){
audioChunks.push(event.data);
}

};

recorder.onstop=async()=>{

const blob=new Blob(
audioChunks,
{
type:"audio/webm"
}
);

if(blob.size>=MIN_AUDIO_SIZE){
await processAudio(blob);
}

if(listening){

setTimeout(
()=>{
startRecorder();
},
100
);

}

};

recorder.start();

currentTimer=setTimeout(
()=>{
stopCurrentChunk();
},
CHUNK_TIME
);

}

function stopCurrentChunk(){

if(currentTimer){

clearTimeout(currentTimer);
currentTimer=null;

}

if(
recorder &&
recorder.state!=="inactive"
){

recorder.stop();

}

}

async function processAudio(blob){

if(processing){
return;
}

processing=true;

const start=performance.now();

try{

status.textContent="☁️ در حال تشخیص...";

const formData=new FormData();

formData.append(
"file",
blob,
"recording.webm"
);

const response=await fetch(
"/api/transcribe",
{
method:"POST",
body:formData
}
);

const data=await response.json();

if(!response.ok){

throw new Error(
data.error||
"خطا از سرور"
);

}

const time=(
(performance.now()-start)/1000
).toFixed(2);

console.log(
"Groq response:",
data
);

console.log(
"Processing time:",
time,
"seconds"
);

if(
data.text &&
data.text.trim()
){

const text=data.text.trim();

liveText.textContent=text;

findStudentNames(text);

}

status.textContent=
`🟢 آماده شنیدن | پردازش ${time} ثانیه`;

}catch(error){

console.error(
"Transcription error:",
error
);

status.textContent="❌ خطا در تشخیص صدا";

}

processing=false;

}

function findStudentNames(text){

const words=normalizeText(text)
.split(" ")
.filter(Boolean);

const foundStudents=[];

for(
let start=0;
start<words.length;
start++
){

let bestStudent=null;
let bestScore=0;
let bestLength=0;

for(
let length=1;
length<=4 &&
start+length<=words.length;
length++
){

const candidate=
words
.slice(start,start+length)
.join(" ");

students.forEach(student=>{

const score=similarity(
candidate,
student
);

if(score>bestScore){

bestScore=score;
bestStudent=student;
bestLength=length;

}

});

}

if(
bestStudent &&
bestScore>=MATCH_THRESHOLD
){

if(
!foundStudents.includes(bestStudent)
){

foundStudents.push(bestStudent);

console.log(
"Student found:",
bestStudent,
"Score:",
(bestScore*100).toFixed(1)+"%"
);

}

start+=bestLength-1;

}

}

if(foundStudents.length===0){

console.log(
"هیچ اسمی با حداقل 90٪ شباهت پیدا نشد"
);

return;

}

foundStudents.forEach(student=>{

if(
!calledStudents.includes(student)
){

calledStudents.push(student);

showExactStudent(
student
);

}

});

}

function showExactStudent(student){

if(
result.textContent.trim()==="هنوز اسمی تشخیص داده نشده"
){

result.innerHTML="";
}

const item=document.createElement("div");

item.className="item";

item.textContent=student;

result.prepend(item);

liveText.textContent=
"در انتظار اسم بعدی...";

}

function normalizeText(text){

return text
.toString()
.trim()
.toLowerCase()
.replace(/ي/g,"ی")
.replace(/ى/g,"ی")
.replace(/ك/g,"ک")
.replace(/ۀ/g,"ه")
.replace(/ة/g,"ه")
.replace(/ؤ/g,"و")
.replace(/إ/g,"ا")
.replace(/أ/g,"ا")
.replace(/آ/g,"ا")
.replace(/‌/g," ")
.replace(/[.,،؛:!?؟"'\-_/\\()]/g," ")
.replace(/\s+/g," ")
.trim();

}

function similarity(a,b){

a=normalizeText(a)
.replace(/\s/g,"");

b=normalizeText(b)
.replace(/\s/g,"");

if(!a || !b){
return 0;
}

if(a===b){
return 1;
}

const distance=levenshtein(a,b);

const maxLength=Math.max(
a.length,
b.length
);

return 1-distance/maxLength;

}

function levenshtein(a,b){

const matrix=[];

for(
let i=0;
i<=b.length;
i++
){

matrix[i]=[i];

}

for(
let j=0;
j<=a.length;
j++
){

matrix[0][j]=j;

}

for(
let i=1;
i<=b.length;
i++
){

for(
let j=1;
j<=a.length;
j++
){

if(
b.charAt(i-1)===
a.charAt(j-1)
){

matrix[i][j]=
matrix[i-1][j-1];

}else{

matrix[i][j]=Math.min(
matrix[i-1][j]+1,
matrix[i][j-1]+1,
matrix[i-1][j-1]+1
);

}

}

}

return matrix[b.length][a.length];

}

function stopListening(){

listening=false;

if(currentTimer){

clearTimeout(currentTimer);
currentTimer=null;

}

if(
recorder &&
recorder.state!=="inactive"
){

recorder.stop();

}

if(stream){

stream
.getTracks()
.forEach(track=>track.stop());

stream=null;

}

startBtn.disabled=false;
stopBtn.disabled=true;

status.textContent="⛔ شنیدن متوقف شد";
liveText.textContent="میکروفون خاموش است";

}
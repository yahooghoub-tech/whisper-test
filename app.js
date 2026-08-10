
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

let speechBuffer="";

let calledStudents=[];

const CHUNK_TIME=5000;

const OVERLAP_TIME=1500;

const MIN_AUDIO_SIZE=2000;

const MATCH_THRESHOLD=0.90;


startBtn.addEventListener(
"click",
startListening
);


stopBtn.addEventListener(
"click",
stopListening
);


async function startListening(){

if(listening){
return;
}

try{

stream=
await navigator.mediaDevices.getUserMedia({
audio:{
echoCancellation:true,
noiseSuppression:true,
autoGainControl:true
}
});

listening=true;

startBtn.disabled=true;

stopBtn.disabled=false;

status.textContent=
"🟢 میکروفون همیشه فعال است";

speechBuffer="";

liveText.textContent=
"در انتظار اسم...";

startRecorder();

}catch(error){

console.error(error);

status.textContent=
"❌ خطا در فعال کردن میکروفون";

}

}


function startRecorder(){

if(!listening){
return;
}

audioChunks=[];

recorder=
new MediaRecorder(
stream,
{
mimeType:"audio/webm"
}
);


recorder.ondataavailable=
event=>{

if(event.data.size>0){

audioChunks.push(event.data);

}

};


recorder.onstop=
async()=>{

const blob=
new Blob(
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


currentTimer=
setTimeout(
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

const start=
performance.now();

try{

status.textContent=
"☁️ در حال تشخیص...";


const formData=
new FormData();

formData.append(
"file",
blob,
"recording.webm"
);


const response=
await fetch(
"/api/transcribe",
{
method:"POST",
body:formData
}
);


const data=
await response.json();


if(!response.ok){

throw new Error(
data.error||
"خطا از سرور"
);

}


const time=
(
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

const text=
data.text.trim();

liveText.textContent=
text;

processRecognizedText(text);

}


status.textContent=
`🟢 آماده شنیدن | پردازش ${time} ثانیه`;

}catch(error){

console.error(
"Transcription error:",
error
);

status.textContent=
"❌ خطا در تشخیص صدا";

}

processing=false;

}


function processRecognizedText(text){

speechBuffer=
`${speechBuffer} ${text}`.trim();

speechBuffer=
normalizeText(speechBuffer);

console.log(
"Speech buffer:",
speechBuffer
);


let foundAny=false;


students.forEach(
student=>{

const normalizedStudent=
normalizeText(student);

const score=
similarity(
speechBuffer,
normalizedStudent
);


if(score>=MATCH_THRESHOLD){

if(
!calledStudents.includes(student)
){

calledStudents.push(student);

addStudent(
student,
score
);

foundAny=true;

}

}

}
);


if(foundAny){

speechBuffer="";

liveText.textContent=
"در انتظار اسم بعدی...";

}

}


function addStudent(student,score){

if(
result.textContent.trim()===
"هنوز اسمی تشخیص داده نشده"
){

result.innerHTML="";
}


const item=
document.createElement("div");

item.className=
"item";


item.innerHTML=
`
<strong>${escapeHtml(student)}</strong>
<br>
<small>
شباهت: ${(score*100).toFixed(1)}٪
</small>
`;


result.prepend(item);

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
.replace(/‌/g,"")
.replace(/\s+/g,"")
.replace(/[.,،؛:!?؟"'\-_/\\()]/g,"");

}


function similarity(a,b){

a=normalizeText(a);

b=normalizeText(b);


if(a===b){

return 1;

}


if(!a || !b){

return 0;

}


const distance=
levenshtein(a,b);


const maxLength=
Math.max(
a.length,
b.length
);


return 1-
distance/maxLength;

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

matrix[i][j]=
Math.min(
matrix[i-1][j]+1,
matrix[i][j-1]+1,
matrix[i-1][j-1]+1
);

}

}

}


return matrix[b.length][a.length];

}


function escapeHtml(text){

const div=
document.createElement("div");

div.textContent=text;

return div.innerHTML;

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
.forEach(
track=>track.stop()
);

stream=null;

}


startBtn.disabled=false;

stopBtn.disabled=true;

status.textContent=
"⛔ شنیدن متوقف شد";

liveText.textContent=
"میکروفون خاموش است";

}

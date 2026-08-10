
const startBtn =
document.getElementById("startBtn");

const status =
document.getElementById("status");

const result =
document.getElementById("result");

startBtn.addEventListener("click",async()=>{

startBtn.disabled=true;

let stream=null;

try{

status.textContent=
"🎙️ در حال دسترسی به میکروفون...";

stream=
await navigator.mediaDevices.getUserMedia({
audio:true
});

const recorder=
new MediaRecorder(stream);

const chunks=[];

recorder.ondataavailable=(event)=>{

if(event.data.size>0){
chunks.push(event.data);
}

};

const recording=
new Promise((resolve,reject)=>{

recorder.onstop=()=>{

const blob=
new Blob(chunks,{
type:recorder.mimeType
});

resolve(blob);

};

recorder.onerror=(event)=>{
reject(event.error);
};

});

recorder.start();

status.textContent=
"🔴 ضبط شروع شد... ۵ ثانیه صحبت کنید";

await new Promise(resolve=>{
setTimeout(resolve,5000);
});

recorder.stop();

const audioBlob=
await recording;

stream
.getTracks()
.forEach(track=>track.stop());

status.textContent=
"☁️ در حال ارسال صدا به AI...";

const formData=
new FormData();

formData.append(
"file",
audioBlob,
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
data.error ||
"خطا در ارتباط با سرور"
);

}

result.textContent=
data.text ||
"متنی تشخیص داده نشد";

status.textContent=
"✅ تشخیص صدا تمام شد";

console.log(
"Groq response:",
data
);

}catch(error){

console.error(error);

status.textContent=
"❌ خطا";

result.textContent=
error.message ||
String(error);

if(stream){

stream
.getTracks()
.forEach(track=>track.stop());

}

}finally{

startBtn.disabled=false;

}

});

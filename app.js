// app.js

const status=document.getElementById("status");
const result=document.getElementById("result");

let model=null;

async function loadVosk(){

try{

status.textContent="⏳ در حال بارگذاری مدل Vosk...";

console.log("Vosk:",Vosk);

model=await Vosk.createModel(
"./model/vosk-model-small-fa-0.42"
);

console.log("Vosk model:",model);

status.textContent="✅ مدل Vosk با موفقیت بارگذاری شد";

result.textContent="مدل آماده است";

}catch(error){

console.error(
"Vosk model error:",
error
);

status.textContent="❌ مدل Vosk بارگذاری نشد";

result.textContent=
"خطا در بارگذاری مدل";

}

}

loadVosk();
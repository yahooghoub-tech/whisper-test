const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";

const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";

const supabaseClient=supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const students=[

    "آرتین اکبری",

    "اهورا حاجی عیسی زاده",

    "بنیامین حسین زاده",

    "آرشاویر رحمتی",

    "کارن رستم آبادی",

    "امیرعلی شاکری",

    "آرمان غفاری شیرازی",

    "سام فراهانی",

    "زانا قهرمانی",

    "رادوین کیوان مهر",

    "آیهان محمدی",

    "آرمان مختاری",

    "محمدرامان هلالی",

    "بنیامین رنجبر"

];


const className="پیش-2";


const studentsContainer=
    document.getElementById(
        "studentsContainer"
    );

const totalCount=
    document.getElementById(
        "totalCount"
    );

const presentCount=
    document.getElementById(
        "presentCount"
    );

const absentCount=
    document.getElementById(
        "absentCount"
    );

const todayDate=
    document.getElementById(
        "todayDate"
    );

const message=
    document.getElementById(
        "message"
    );


/* =========================================================
   تاریخ امروز ایران
========================================================= */

function getToday(){

    const now=new Date();

    const iranTime=
        new Date(
            now.toLocaleString(
                "en-US",
                {
                    timeZone:
                        "Asia/Tehran"
                }
            )
        );

    const year=
        iranTime.getFullYear();

    const month=
        String(
            iranTime.getMonth()+1
        ).padStart(2,"0");

    const day=
        String(
            iranTime.getDate()
        ).padStart(2,"0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   نمایش تاریخ
========================================================= */

function showDate(){

    if(!todayDate){
        return;
    }

    const now=new Date();

    const iranTime=
        new Date(
            now.toLocaleString(
                "en-US",
                {
                    timeZone:
                        "Asia/Tehran"
                }
            )
        );

    todayDate.textContent=
        iranTime.toLocaleDateString(
            "fa-IR",
            {
                weekday:"long",
                year:"numeric",
                month:"long",
                day:"numeric"
            }
        );

}


/* =========================================================
   پیام
========================================================= */

function showMessage(
    text,
    type="success"
){

    if(!message){
        return;
    }

    message.textContent=text;

    message.className=
        "message "+type;

    clearTimeout(
        window.messageTimer
    );

    window.messageTimer=
        setTimeout(
            ()=>{
                message.textContent="";
                message.className="message";
            },
            2500
        );

}


/* =========================================================
   یکسان‌سازی نام
========================================================= */

function normalizeStudentName(name){

    return String(name ?? "")
        .normalize("NFC")
        .replace(
            /[\u200B-\u200D\uFEFF]/g,
            ""
        )
        .replace(
            /\u200C/g,
            ""
        )
        .replace(
            /\s+/g,
            ""
        )
        .replace(
            /ي/g,
            "ی"
        )
        .replace(
            /ى/g,
            "ی"
        )
        .replace(
            /ك/g,
            "ک"
        )
        .trim();

}


/* =========================================================
   ساخت دانش‌آموزان
========================================================= */

function createStudents(){

    if(!studentsContainer){
        return;
    }

    studentsContainer.innerHTML="";

    students.forEach(
        (student,index)=>{

            const button=
                document.createElement(
                    "button"
                );

            button.type="button";

            button.className=
                "student-button present";

            button.dataset.name=
                student;

            button.dataset.index=
                index;

            button.innerHTML=`
                <span class="student-name">
                    ${student}
                </span>
                <span class="student-status">
                    حاضر
                </span>
            `;

            button.onclick=()=>{
                toggleAttendance(
                    student,
                    button
                );
            };

            studentsContainer.appendChild(
                button
            );

        }
    );

    totalCount.textContent=
        students.length;

    updateCounts();

}


/* =========================================================
   پیدا کردن دکمه دانش‌آموز
========================================================= */

function findButton(name){

    const target=
        normalizeStudentName(name);

    return [
        ...document.querySelectorAll(
            ".student-button"
        )
    ].find(
        button=>
            normalizeStudentName(
                button.dataset.name
            )===target
    );

}


/* =========================================================
   غایب
========================================================= */

function setButtonAbsent(button){

    button.classList.remove(
        "present"
    );

    button.classList.add(
        "absent"
    );

    const status=
        button.querySelector(
            ".student-status"
        );

    if(status){
        status.textContent="غایب";
    }

}


/* =========================================================
   حاضر
========================================================= */

function setButtonPresent(button){

    button.classList.remove(
        "absent"
    );

    button.classList.add(
        "present"
    );

    const status=
        button.querySelector(
            ".student-status"
        );

    if(status){
        status.textContent="حاضر";
    }

}


/* =========================================================
   دریافت حضور و غیاب امروز
========================================================= */

async function loadTodayAttendance(){

    const today=getToday();

    console.log(
        "📅 دریافت حضور و غیاب پیش‌۲:",
        today
    );


    const {
        data,
        error
    }=
        await supabaseClient
        .from("attendance")
        .select("*")
        .eq(
            "class_name",
            className
        )
        .eq(
            "attendance_date",
            today
        )
        .order(
            "updated_at",
            {
                ascending:false
            }
        )
        .order(
            "id",
            {
                ascending:false
            }
        );


    if(error){

        console.error(
            "❌ خطا در دریافت حضور و غیاب:",
            error
        );

        showMessage(
            "خطا در دریافت اطلاعات حضور و غیاب",
            "error"
        );

        return;

    }


    const latestRecords=
        new Map();


    (data || []).forEach(
        record=>{

            const key=
                normalizeStudentName(
                    record.student_name
                );

            if(
                !latestRecords.has(key)
            ){

                latestRecords.set(
                    key,
                    record
                );

            }

        }
    );


    students.forEach(
        student=>{

            const button=
                findButton(student);

            if(!button){
                return;
            }


            const record=
                latestRecords.get(
                    normalizeStudentName(
                        student
                    )
                );


            if(
                record &&
                record.status==="غایب"
            ){

                setButtonAbsent(
                    button
                );

            }else{

                setButtonPresent(
                    button
                );

            }

        }
    );


    updateCounts();

}


/* =========================================================
   ثبت حضور و غیاب
========================================================= */

async function toggleAttendance(
    student,
    button
){

    const today=getToday();

    const isAbsent=
        button.classList.contains(
            "absent"
        );


    button.disabled=true;


    /* =====================================================
       غایب → حاضر
    ===================================================== */

    if(isAbsent){

        console.log(
            "🟢 حاضر کردن:",
            student
        );


        const {
            data,
            error
        }=
            await supabaseClient
            .from("attendance")
            .delete()
            .eq(
                "student_name",
                student
            )
            .eq(
                "class_name",
                className
            )
            .eq(
                "attendance_date",
                today
            )
            .select();


        if(error){

            console.error(
                "❌ خطا در حذف غیبت:",
                error
            );

            showMessage(
                "❌ ثبت وضعیت انجام نشد",
                "error"
            );

            button.disabled=false;

            return;

        }


        console.log(
            "🗑️ رکورد حذف‌شده:",
            data
        );


        setButtonPresent(
            button
        );


        showMessage(
            `🟢 ${student} حاضر شد`
        );


    }


    /* =====================================================
       حاضر → غایب
    ===================================================== */

    else{

        console.log(
            "🔴 غایب کردن:",
            student
        );


        const {
            data,
            error
        }=
            await supabaseClient
            .from("attendance")
            .upsert(
                {
                    student_name:
                        student,

                    class_name:
                        className,

                    status:
                        "غایب",

                    attendance_date:
                        today,

                    updated_at:
                        new Date().toISOString()
                },
                {
                    onConflict:
                        "student_name,class_name,attendance_date"
                }
            )
            .select();


        if(error){

            console.error(
                "❌ خطا در ثبت غیبت:",
                error
            );

            showMessage(
                "❌ ثبت وضعیت انجام نشد",
                "error"
            );

            button.disabled=false;

            return;

        }


        console.log(
            "🔴 رکورد ثبت‌شده:",
            data
        );


        setButtonAbsent(
            button
        );


        showMessage(
            `⚫ ${student} غایب شد`
        );

    }


    button.disabled=false;

    updateCounts();

}


/* =========================================================
   شمارنده‌ها
========================================================= */

function updateCounts(){

    const absent=
        document.querySelectorAll(
            ".student-button.absent"
        ).length;


    const present=
        students.length-absent;


    if(totalCount){

        totalCount.textContent=
            students.length;

    }


    if(absentCount){

        absentCount.textContent=
            absent;

    }


    if(presentCount){

        presentCount.textContent=
            present;

    }

}


/* =========================================================
   Realtime حضور و غیاب پیش‌۲
========================================================= */

const attendanceChannel=
    supabaseClient
    .channel(
        "attendance-pre-2"
    )
    .on(
        "postgres_changes",
        {
            event:"*",
            schema:"public",
            table:"attendance",
            filter:"class_name=eq.پیش-2"
        },
        payload=>{

            console.log(
                "📡 تغییر حضور و غیاب پیش‌۲:",
                payload
            );


            const record=
                payload.new ||
                payload.old;


            if(!record){
                return;
            }


            if(
                record.class_name!=="پیش-2"
            ){

                return;

            }


            if(
                record.attendance_date!==getToday()
            ){

                return;

            }


            const button=
                findButton(
                    record.student_name
                );


            if(!button){
                return;
            }


            /*
            ================================================
            ثبت غیبت
            ================================================
            */

            if(
                payload.eventType==="INSERT" ||
                payload.eventType==="UPDATE"
            ){

                if(
                    record.status==="غایب"
                ){

                    setButtonAbsent(
                        button
                    );

                }else{

                    setButtonPresent(
                        button
                    );

                }

            }


            /*
            ================================================
            حذف غیبت = حاضر
            ================================================
            */

            if(
                payload.eventType==="DELETE"
            ){

                setButtonPresent(
                    button
                );

            }


            updateCounts();

        }
    )
    .subscribe(
        status=>{

            console.log(
                "Realtime حضور و غیاب پیش‌۲:",
                status
            );

        }
    );


/* =========================================================
   شروع
========================================================= */

showDate();

createStudents();

loadTodayAttendance();


/* =========================================================
   تغییر روز
========================================================= */

let currentAttendanceDay=
    getToday();


function checkAttendanceDayChange(){

    const newDay=
        getToday();


    if(
        newDay===currentAttendanceDay
    ){

        return;

    }


    console.log(
        "📅 روز جدید پیش‌۲:",
        currentAttendanceDay,
        "→",
        newDay
    );


    currentAttendanceDay=
        newDay;


    showDate();

    createStudents();

    loadTodayAttendance();

}


setInterval(
    checkAttendanceDayChange,
    30000
);


/* =========================================================
   بروزرسانی هنگام برگشت به صفحه
========================================================= */

document.addEventListener(
    "visibilitychange",
    async()=>{

        if(!document.hidden){

            showDate();

            await loadTodayAttendance();

        }

    }
);


/* =========================================================
   بروزرسانی هنگام Focus
========================================================= */

window.addEventListener(
    "focus",
    async()=>{

        showDate();

        await loadTodayAttendance();

    }
);


/* =========================================================
   بروزرسانی دوره‌ای برای اطمینان
========================================================= */

async function refreshAttendance(){

    await loadTodayAttendance();

}


setInterval(
    refreshAttendance,
    60000
);
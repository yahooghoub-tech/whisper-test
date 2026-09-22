const SUPABASE_URL="https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY="sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


const students=[

    "آرتین اکبری",
    "اهورا حاجی عیسی زاده",
    "بنیامین حسین زاده",
    "بنیامین رنجبر",
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

];


const className="پیش-2";


function getToday(){

    const now =
        new Date();

    const iranTime =
        new Date(
            now.toLocaleString(
                "en-US",
                {
                    timeZone:
                    "Asia/Tehran"
                }
            )
        );

    const year =
        iranTime.getFullYear();

    const month =
        String(
            iranTime.getMonth()+1
        ).padStart(2,"0");

    const day =
        String(
            iranTime.getDate()
        ).padStart(2,"0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   ساخت لیست دانش‌آموزان
========================================================= */

function createStudents(){

    const container =
        document.getElementById(
            "studentsContainer"
        );

    container.innerHTML="";

    students.forEach(
        (student,index)=>{

            const button =
                document.createElement(
                    "button"
                );

            button.type="button";

            button.className =
                "student-button present";

            button.dataset.name =
                student;

            button.dataset.index =
                index;

            button.textContent =
                student;

            button.addEventListener(
                "click",
                ()=>{
                    toggleAttendance(
                        student,
                        button
                    );
                }
            );

            container.appendChild(
                button
            );

        }
    );

    updateCounts();

}


/* =========================================================
   نمایش غایب
========================================================= */

function setButtonAbsent(button){

    button.classList.remove(
        "present"
    );

    button.classList.add(
        "absent"
    );

    button.textContent =
        button.dataset.name +
        " (غایب)";

}


/* =========================================================
   نمایش حاضر
========================================================= */

function setButtonPresent(button){

    button.classList.remove(
        "absent"
    );

    button.classList.add(
        "present"
    );

    button.textContent =
        button.dataset.name;

}


/* =========================================================
   تغییر وضعیت حضور و غیاب
========================================================= */

async function toggleAttendance(
    student,
    button
){

    const today =
        getToday();

    const isAbsent =
        button.classList.contains(
            "absent"
        );

    button.disabled=true;


    /* =====================================================
       اگر دانش‌آموز غایب است
       کلیک دوباره = حاضر
    ===================================================== */

    if(isAbsent){

        const {
            error
        } =
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
        );


        if(error){

            console.error(
                "❌ خطا در حذف غیبت:",
                error
            );

            showMessage(
                "خطا در ثبت وضعیت",
                "error"
            );

            button.disabled=false;

            return;

        }


        setButtonPresent(
            button
        );


        showMessage(
            "دانش‌آموز حاضر شد"
        );


    }


    /* =====================================================
       اگر دانش‌آموز حاضر است
       کلیک = غایب
    ===================================================== */

    else{

        const {
            error
        } =
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
                    today
            },
            {
                onConflict:
                    "student_name,class_name,attendance_date"
            }
        );


        if(error){

            console.error(
                "❌ خطا در ثبت غیبت:",
                error
            );

            showMessage(
                "خطا در ثبت غیبت",
                "error"
            );

            button.disabled=false;

            return;

        }


        setButtonAbsent(
            button
        );


        showMessage(
            "غیبت دانش‌آموز ثبت شد"
        );

    }


    button.disabled=false;

    updateCounts();

}


/* =========================================================
   دریافت وضعیت حضور و غیاب امروز
========================================================= */

async function loadAttendance(){

    const today =
        getToday();

    const {
        data,
        error
    } =
    await supabaseClient
    .from("attendance")
    .select("*")
    .eq(
        "attendance_date",
        today
    )
    .eq(
        "class_name",
        className
    );


    if(error){

        console.error(
            "❌ خطا در دریافت حضور و غیاب:",
            error
        );

        return;

    }


    if(!data){
        return;
    }


    data.forEach(
        record=>{

            const button =
                document.querySelector(
                    `.student-button[data-name="${CSS.escape(record.student_name)}"]`
                );

            if(!button){
                return;
            }


            if(
                record.status ===
                "غایب"
            ){

                setButtonAbsent(
                    button
                );

                button.disabled=true;

            }

        }
    );


    updateCounts();

}


/* =========================================================
   تعداد حاضر و غایب
========================================================= */

function updateCounts(){

    const buttons =
        document.querySelectorAll(
            ".student-button"
        );

    let absent=0;

    buttons.forEach(
        button=>{

            if(
                button.classList.contains(
                    "absent"
                )
            ){

                absent++;

            }

        }
    );


    const total =
        students.length;

    const present =
        total-absent;


    const presentElement =
        document.getElementById(
            "presentCount"
        );

    const absentElement =
        document.getElementById(
            "absentCount"
        );


    if(presentElement){

        presentElement.textContent =
            present;

    }


    if(absentElement){

        absentElement.textContent =
            absent;

    }

}


/* =========================================================
   پیام
========================================================= */

function showMessage(
    message,
    type="success"
){

    const oldMessage =
        document.querySelector(
            ".attendance-message"
        );

    if(oldMessage){

        oldMessage.remove();

    }


    const messageBox =
        document.createElement(
            "div"
        );

    messageBox.className =
        "attendance-message " +
        type;

    messageBox.textContent =
        message;


    document.body.appendChild(
        messageBox
    );


    setTimeout(
        ()=>{
            messageBox.remove();
        },
        2500
    );

}


/* =========================================================
   شروع صفحه
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async ()=>{

        createStudents();

        await loadAttendance();

    }
);
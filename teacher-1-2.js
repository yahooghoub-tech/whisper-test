const SUPABASE_URL = "https://ghnpiijihybuhfetnxjp.supabase.co";
const SUPABASE_KEY = "sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let notificationAudio = null;
let soundEnabled = false;
let lastTeacherCallsLoad = Date.now();
let teacherCallsLoading = false;

function setupSound() {
    const button = document.getElementById("enableSoundButton");

    if (!button) {
        console.error("❌ دکمه enableSoundButton در HTML پیدا نشد");
        return;
    }

    button.addEventListener("click", async () => {
        try {
            if (!soundEnabled) {
                notificationAudio = new Audio("notification.mp3");
                notificationAudio.preload = "auto";
                notificationAudio.volume = 1;

                await notificationAudio.play();
                notificationAudio.pause();
                notificationAudio.currentTime = 0;

                soundEnabled = true;
                button.innerText = "🔊 صدای فراخوان فعال است";
                button.style.background = "#22c55e";
            } else {
                soundEnabled = false;

                if (notificationAudio) {
                    notificationAudio.pause();
                    notificationAudio.currentTime = 0;
                }

                button.innerText = "🔇 صدای فراخوان غیرفعال است";
                button.style.background = "#ef4444";
            }
        } catch (error) {
            console.error("❌ خطای تغییر وضعیت صدا:", error);
            alert("خطا در تغییر وضعیت صدا: " + error.message);
        }
    });
}

function playNotificationSound() {
    if (!soundEnabled || !notificationAudio) return;

    try {
        notificationAudio.currentTime = 0;
        notificationAudio.play().catch(error => {
            console.error("❌ خطا در پخش صدا:", error);
        });
    } catch (error) {
        console.error("❌ خطای پخش صدا:", error);
    }
}

function showSendNotification(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) return;

    student.innerText = "📤 " + studentName + " ارسال شد";
    popup.classList.add("show");
    playNotificationSound();

    setTimeout(() => popup.classList.remove("show"), 5000);
}

function showCallPopup(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) return;

    student.innerText = studentName + " فراخوان شد";
    popup.classList.add("show");

    setTimeout(() => popup.classList.remove("show"), 7000);
}

const students = [
    { name: "یونا ایازیان", className: "اول-2" },
    { name: "علی اینانلو گنجی", className: "اول-2" },
    { name: "محمدرضا الماسی", className: "اول-2" },
    { name: "رادوین برادری همپا", className: "اول-2" },
    { name: "امیرعلی صفاوردی", className: "اول-2" },
    { name: "آروین عباسی", className: "اول-2" },
    { name: "شاهان فراهانی", className: "اول-2" },
    { name: "حسین فخیمی شایسته", className: "اول-2" },
    { name: "صدرا قنبری", className: "اول-2" },
    { name: "رادمهر کارشناس", className: "اول-2" },
    { name: "رادمان نادمی", className: "اول-2" },
    { name: "کسری نعمت زاده", className: "اول-2" },
    { name: "نامی هاشمی", className: "اول-2" }
];

const studentsContainer = document.getElementById("studentsContainer");
const callCount = document.getElementById("callCount");

function getToday() {
    return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
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

function createStudents() {
    if (!studentsContainer) {
        console.error("❌ studentsContainer در HTML پیدا نشد");
        return;
    }

    studentsContainer.innerHTML = "";

    students.forEach(student => {
        const button = document.createElement("button");
        button.className = "student-button";
        button.dataset.name = student.name;

        button.innerHTML = `
            <div class="student-name">${student.name}</div>
            <div class="student-status"></div>
            <div class="student-time"></div>
        `;

        button.addEventListener("click", () => sendStudent(student));
        studentsContainer.appendChild(button);
    });
}

function findButton(name) {
    return [...document.querySelectorAll(".student-button")]
        .find(button => button.dataset.name === name);
}

function updateButton(call) {
    if (!call) return;

    const button = findButton(call.student_name);
    if (!button || button.classList.contains("absent")) return;

    if (call.status === "لغو شد") {
        resetStudentButton(call);
        return;
    }

    button.classList.remove("called", "sent", "received", "pending");

    const statusElement = button.querySelector(".student-status");
    const timeElement = button.querySelector(".student-time");

    if (call.status === "فراخوان شد") {
        button.classList.add("called");
        statusElement.innerText = "🔴 فراخوان";
    } else if (call.status === "دریافت فراخوان") {
        button.classList.add("received");
        statusElement.innerText = "🟠 دریافت شد";
    } else if (call.status === "ارسال شد") {
        button.classList.add("sent");
        statusElement.innerText = "🟢 ارسال شد";
    } else {
        button.classList.add("pending");
        statusElement.innerText = "";
    }

    let timeText = "";

    if (call.called_time) {
        timeText = "🕐 فراخوان: " + call.called_time;
    }

    if (call.sent_time && call.status === "ارسال شد") {
        timeText += (timeText ? "<br>" : "") + "📤 ارسال: " + call.sent_time;
    }

    timeElement.innerHTML = timeText;
}

function resetStudentButton(call) {
    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) return;

    button.classList.remove("called", "sent", "received");
    button.classList.add("pending");

    button.querySelector(".student-status").innerText = "";
    button.querySelector(".student-time").innerText = "";
}



async function loadCalls() {
    if (teacherCallsLoading) return;

    teacherCallsLoading = true;

    try {
        const response = await fetch(
            "https://berandil.ir/farakhan-api/teacher-calls.php?class_name=" +
            encodeURIComponent("اول-2") +
            "&date=" + encodeURIComponent(getDatabaseToday()) +
            "&_=" + Date.now(),
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "خطا در دریافت فراخوان‌ها");
        }

        lastTeacherCallsLoad = Date.now();

        const calls = Array.isArray(result.data) ? result.data : [];

        resetTeacherPanel();

        calls.forEach(updateButton);
        updateCount(calls);

    } catch (error) {
        console.error("❌ خطا در دریافت فراخوان از هاست:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

function updateCount(data) {
    if (!Array.isArray(data) || !callCount) return;

    const active = data.filter(call =>
        call.status !== "ارسال شد" &&
        call.status !== "لغو شد"
    );

    callCount.innerText = active.length + " فراخوان";
}

function resetTeacherPanel() {
    document.querySelectorAll(".student-button").forEach(button => {
        if (button.classList.contains("absent")) return;

        button.classList.remove("called", "sent", "received");
        button.classList.add("pending");

        const status = button.querySelector(".student-status");
        const time = button.querySelector(".student-time");

        if (status) status.innerText = "";
        if (time) time.innerText = "";
    });

    if (callCount) callCount.innerText = "0 فراخوان";
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
            encodeURIComponent("اول-2") +
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
        console.error("❌ خطا در ارسال فراخوان:", error);
        alert("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    }
}

async function loadAbsentStudents() {
    const today = getDatabaseToday();

    const { data, error } = await supabaseClient
        .from("attendance")
        .select("*")
        .eq("class_name", "اول-2")
        .eq("attendance_date", today)
        .eq("status", "غایب");

    if (error) {
        console.error("❌ خطا در دریافت غایبین:", error);
        return;
    }

    document.querySelectorAll(".student-button").forEach(button => {
        button.classList.remove("absent");
        button.disabled = false;

        const nameDiv = button.querySelector(".student-name");
        if (nameDiv) nameDiv.innerText = button.dataset.name;
    });

    (data || []).forEach(absent => {
        const button = findButton(absent.student_name);
        if (!button) return;

        button.classList.remove("called", "sent", "received", "pending");
        button.classList.add("absent");
        button.disabled = true;

        const nameDiv = button.querySelector(".student-name");
        const status = button.querySelector(".student-status");
        const time = button.querySelector(".student-time");

        if (nameDiv) nameDiv.innerText = absent.student_name + " (غایب)";
        if (status) status.innerText = "";
        if (time) time.innerText = "";
    });

    console.log("👤 غایبین امروز بارگذاری شدند:", (data || []).length);
}

createStudents();
loadCalls();
loadAbsentStudents();

window.addEventListener("load", setupSound);

let currentTeacherCallDay = getDatabaseToday();

function checkTeacherCallDayChange() {
    const newDay = getDatabaseToday();

    if (newDay === currentTeacherCallDay) return;

    console.log("📅 روز فراخوان تغییر کرد:", currentTeacherCallDay, "→", newDay);

    currentTeacherCallDay = newDay;

    resetTeacherPanel();
    loadCalls();
    loadAbsentStudents();
}

setInterval(checkTeacherCallDayChange, 30000);

let teacherRealtimeChannel = null;
let teacherAttendanceRealtimeChannel = null;

function connectTeacherRealtime() {
    console.log("🔄 در حال اتصال Realtime پنل معلم...");

    if (teacherRealtimeChannel) {
        supabaseClient.removeChannel(teacherRealtimeChannel);
        teacherRealtimeChannel = null;
    }

    teacherRealtimeChannel = supabaseClient
        .channel("teacher-1-2-realtime")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "calls",
                filter: "class_name=eq.اول-2"
            },
            payload => {
                const call = payload.new;
                if (!call || call.status !== "فراخوان شد") return;
                if (call.called_date !== getToday()) return;

                const absentButton = findButton(call.student_name);

                if (absentButton && absentButton.classList.contains("absent")) {
                    console.log("⛔ فراخوان دانش‌آموز غایب نادیده گرفته شد:", call.student_name);
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
                filter: "class_name=eq.اول-2"
            },
            payload => {
                const call = payload.new;
                const oldCall = payload.old;

                if (!call || call.class_name !== "اول-2") return;
                if (call.called_date !== getToday()) return;

                if (
                    oldCall &&
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

                if (!deletedCall || deletedCall.class_name !== "اول-2") return;
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

            if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
                console.error("🔴 اتصال Realtime قطع شد:", status);

                setTimeout(() => {
                    connectTeacherRealtime();
                }, 3000);
            }
        });
}

function connectTeacherAttendanceRealtime() {
    console.log("🔄 در حال اتصال Realtime حضور و غیاب...");

    if (teacherAttendanceRealtimeChannel) {
        supabaseClient.removeChannel(teacherAttendanceRealtimeChannel);
        teacherAttendanceRealtimeChannel = null;
    }

    teacherAttendanceRealtimeChannel = supabaseClient
        .channel("teacher-1-2-attendance-realtime")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "attendance",
                filter: "class_name=eq.اول-2"
            },
            payload => {
                if (!payload.new) return;
                if (payload.new.attendance_date !== getDatabaseToday()) return;
                loadAbsentStudents();
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "attendance",
                filter: "class_name=eq.اول-2"
            },
            payload => {
                if (!payload.new) return;
                if (payload.new.attendance_date !== getDatabaseToday()) return;
                loadAbsentStudents();
            }
        )
        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "attendance",
                filter: "class_name=eq.اول-2"
            },
            payload => {
                if (!payload.old) return;
                if (payload.old.attendance_date !== getDatabaseToday()) return;
                loadAbsentStudents();
            }
        )
        .subscribe(status => {
            console.log("Realtime attendance status:", status);

            if (status === "SUBSCRIBED") {
                console.log("🟢 Realtime حضور و غیاب متصل شد");
                loadAbsentStudents();
            }

            if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
                console.error("🔴 اتصال Realtime حضور و غیاب قطع شد:", status);

                setTimeout(() => {
                    connectTeacherAttendanceRealtime();
                }, 3000);
            }
        });
}

connectTeacherRealtime();
connectTeacherAttendanceRealtime();

let teacherInternetWasOffline = false;

window.addEventListener("offline", () => {
    teacherInternetWasOffline = true;
    console.log("🔴 اینترنت پنل معلم قطع شد");
});

window.addEventListener("online", async () => {
    console.log("🟢 اینترنت پنل معلم دوباره وصل شد");

    if (!teacherInternetWasOffline) return;

    teacherInternetWasOffline = false;

    try {
        connectTeacherRealtime();
        connectTeacherAttendanceRealtime();

        await loadCalls();
        await loadAbsentStudents();

        console.log("✅ پنل بعد از اتصال مجدد اینترنت به‌روزرسانی شد");
    } catch (error) {
        console.error("❌ خطا هنگام بازسازی اتصال پنل:", error);
    }
});

setInterval(async () => {
    if (!navigator.onLine) return;

    const secondsSinceLastLoad = (Date.now() - lastTeacherCallsLoad) / 1000;

    if (secondsSinceLastLoad < 90) return;

    console.warn("⚠️ Watchdog: اتصال احتمالاً متوقف شده است");

    connectTeacherRealtime();
    connectTeacherAttendanceRealtime();

    await loadCalls();
    await loadAbsentStudents();
}, 10000);

/* بررسی فراخوان‌ها از هاست */
setInterval(() => {
    if (document.visibilityState === "visible") {
        loadCalls();
    }
}, 3000);
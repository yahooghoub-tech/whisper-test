/* =====================================================
   پنل فراخوان معلم - دبستان علوی
   کلاس: اول-2
   پایگاه داده: MySQL روی berandil.ir
   بدون وابستگی به Supabase
===================================================== */

const API_BASE = "https://berandil.ir/farakhan-api";

const CALLS_API = `${API_BASE}/teacher-calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;

const className = "اول-2";

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

let notificationAudio = null;
let soundEnabled = false;

let teacherCallsLoading = false;
let absentStudentsLoading = false;
let teacherPanelRefreshRunning = false;

let currentTeacherCallDay = getDatabaseToday();
let lastTeacherCallsLoad = 0;
let lastAbsentStudentsLoad = 0;

const studentButtons = new Map();

/* =====================================================
   تاریخ امروز بر اساس منطقه زمانی تهران
===================================================== */

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

/* =====================================================
   درخواست به API هاست
===================================================== */

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        cache: "no-store",
        ...options,
        headers: {
            "Accept": "application/json",
            ...(options.headers || {})
        }
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("پاسخ سرور JSON معتبر نیست.");
    }

    if (!response.ok || !result.success) {
        throw new Error(
            result.message || `خطای سرور: ${response.status}`
        );
    }

    return result;
}

/* =====================================================
   نمایش پیام
===================================================== */

function showMessage(text) {
    const message = document.getElementById("message");

    if (message) {
        message.textContent = text;
        message.classList.add("show");

        clearTimeout(window.teacherMessageTimer);

        window.teacherMessageTimer = setTimeout(() => {
            message.classList.remove("show");
        }, 3000);

        return;
    }

    console.log(text);
}

/* =====================================================
   فعال‌سازی صدای فراخوان
===================================================== */

function setupSound() {
    const button = document.getElementById("enableSoundButton");

    if (!button) {
        console.warn("دکمه enableSoundButton در HTML وجود ندارد.");
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

                showMessage("صدای فراخوان فعال شد.");
            } else {
                soundEnabled = false;

                if (notificationAudio) {
                    notificationAudio.pause();
                    notificationAudio.currentTime = 0;
                }

                button.innerText = "🔇 صدای فراخوان غیرفعال است";
                button.style.background = "#ef4444";

                showMessage("صدای فراخوان غیرفعال شد.");
            }
        } catch (error) {
            console.error("خطا در تغییر وضعیت صدا:", error);
            alert("پخش صدا ناموفق بود: " + error.message);
        }
    });
}

function playNotificationSound() {
    if (!soundEnabled || !notificationAudio) return;

    notificationAudio.currentTime = 0;

    notificationAudio.play().catch(error => {
        console.error("خطا در پخش صدای فراخوان:", error);
    });
}

/* =====================================================
   پنجره‌های اطلاع‌رسانی فراخوان
===================================================== */

function showSendNotification(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.warn("عناصر پنجره فراخوان در HTML پیدا نشدند.");
        playNotificationSound();
        return;
    }

    student.innerText = "📤 " + studentName + " ارسال شد";
    popup.classList.add("show");
    playNotificationSound();

    clearTimeout(window.teacherCallPopupTimer);

    window.teacherCallPopupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 5000);
}

function showCallPopup(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.warn("عناصر پنجره فراخوان در HTML پیدا نشدند.");
        playNotificationSound();
        return;
    }

    student.innerText = studentName + " فراخوان شد";
    popup.classList.add("show");

    clearTimeout(window.teacherCallPopupTimer);

    window.teacherCallPopupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 7000);

    playNotificationSound();
}

/* =====================================================
   ساخت دکمه‌های دانش‌آموزان
===================================================== */

function createStudents() {
    if (!studentsContainer) {
        console.error("عنصر studentsContainer در HTML پیدا نشد.");
        return;
    }

    studentsContainer.innerHTML = "";
    studentButtons.clear();

    students.forEach(student => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "student-button pending";
        button.dataset.name = student.name;

        const nameDiv = document.createElement("div");
        nameDiv.className = "student-name";
        nameDiv.textContent = student.name;

        const statusDiv = document.createElement("div");
        statusDiv.className = "student-status";

        const timeDiv = document.createElement("div");
        timeDiv.className = "student-time";

        button.append(nameDiv, statusDiv, timeDiv);

        button.addEventListener("click", () => {
            sendStudent(student);
        });

        studentsContainer.appendChild(button);
        studentButtons.set(student.name, button);
    });

    updateCount([]);
}

function findButton(name) {
    return studentButtons.get(name) || null;
}

/* =====================================================
   مدیریت وضعیت دکمه‌های دانش‌آموزان
===================================================== */

function updateButton(call) {
    if (!call || !call.student_name) return;

    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) return;

    if (call.status === "لغو شد") {
        resetStudentButton(call);
        return;
    }

    button.classList.remove(
        "called",
        "sent",
        "received",
        "pending"
    );

    const statusElement = button.querySelector(".student-status");
    const timeElement = button.querySelector(".student-time");

    if (!statusElement || !timeElement) return;

    if (call.status === "فراخوان شد") {
        button.classList.add("called");
        statusElement.textContent = "🔴 فراخوان";
    } else if (call.status === "دریافت فراخوان") {
        button.classList.add("received");
        statusElement.textContent = "🟠 دریافت شد";
    } else if (call.status === "ارسال شد") {
        button.classList.add("sent");
        statusElement.textContent = "🟢 ارسال شد";
    } else {
        button.classList.add("pending");
        statusElement.textContent = "";
    }

    const timeLines = [];

    if (call.called_time) {
        timeLines.push("🕐 فراخوان: " + call.called_time);
    }

    if (call.sent_time && call.status === "ارسال شد") {
        timeLines.push("📤 ارسال: " + call.sent_time);
    }

    timeElement.replaceChildren();

    timeLines.forEach((line, index) => {
        if (index > 0) {
            timeElement.appendChild(document.createElement("br"));
        }

        timeElement.appendChild(document.createTextNode(line));
    });
}

/* =====================================================
   بازگرداندن دکمه به حالت اولیه
===================================================== */

function resetStudentButton(call) {
    if (!call || !call.student_name) return;

    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) return;

    button.classList.remove("called", "sent", "received");
    button.classList.add("pending");

    const status = button.querySelector(".student-status");
    const time = button.querySelector(".student-time");

    if (status) status.textContent = "";
    if (time) time.textContent = "";
}

/* =====================================================
   پاک‌سازی وضعیت‌های قبلی پنل
   غایبان حفظ می‌شوند.
===================================================== */

function resetTeacherPanel() {
    document.querySelectorAll(".student-button").forEach(button => {
        if (button.classList.contains("absent")) return;

        button.classList.remove("called", "sent", "received");
        button.classList.add("pending");

        const status = button.querySelector(".student-status");
        const time = button.querySelector(".student-time");

        if (status) status.textContent = "";
        if (time) time.textContent = "";
    });

    if (callCount) {
        callCount.textContent = "0 فراخوان";
    }
}
/* =====================================================
   شمارش فراخوان‌های فعال
===================================================== */

function updateCount(data) {
    if (!Array.isArray(data)) {
        console.error("اطلاعات فراخوان آرایه نیست:", data);
        return;
    }

    const activeCalls = data.filter(call =>
        call.status !== "ارسال شد" &&
        call.status !== "لغو شد"
    );

    if (callCount) {
        callCount.textContent = activeCalls.length + " فراخوان";
    }
}

/* =====================================================
   دریافت فراخوان‌های امروز از MySQL
===================================================== */

async function loadCalls() {
    if (teacherCallsLoading) return;

    teacherCallsLoading = true;

    try {
        const today = getDatabaseToday();

        const url = CALLS_API + "?" + new URLSearchParams({
            class_name: className,
            date: today,
            _: Date.now()
        });

        const result = await apiRequest(url);

        if (today !== getDatabaseToday()) return;

        const calls = Array.isArray(result.data)
            ? result.data
            : [];

        resetTeacherPanel();

        const todayCalls = calls.filter(call =>
            call.class_name === className &&
            call.called_date === today
        );

        todayCalls.forEach(updateButton);
        updateCount(todayCalls);

        lastTeacherCallsLoad = Date.now();
    } catch (error) {
        console.error("خطا در دریافت فراخوان‌ها از هاست:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

/* =====================================================
   دریافت غایبان امروز از MySQL روی هاست
===================================================== */

async function loadAbsentStudents() {
    if (absentStudentsLoading) return;

    absentStudentsLoading = true;

    try {
        const today = getDatabaseToday();

        const url = ATTENDANCE_API + "?" + new URLSearchParams({
            class_name: className,
            date: today,
            _: Date.now()
        });

        const result = await apiRequest(url);

        if (today !== getDatabaseToday()) return;

        const records = Array.isArray(result.data)
            ? result.data
            : [];

        // ابتدا وضعیت غیبت قبلی را پاک می‌کنیم.
        document.querySelectorAll(".student-button").forEach(button => {
            button.classList.remove("absent");
            button.disabled = false;

            const nameDiv = button.querySelector(".student-name");

            if (nameDiv) {
                nameDiv.textContent = button.dataset.name;
            }
        });

        // سپس غایبان ثبت‌شده در دیتابیس را اعمال می‌کنیم.
        records.forEach(record => {
            if (
                record.class_name !== className ||
                record.attendance_date !== today ||
                record.status !== "غایب"
            ) {
                return;
            }

            const button = findButton(record.student_name);
            if (!button) return;

            button.classList.remove(
                "called",
                "sent",
                "received",
                "pending"
            );

            button.classList.add("absent");
            button.disabled = true;

            const nameDiv = button.querySelector(".student-name");
            const status = button.querySelector(".student-status");
            const time = button.querySelector(".student-time");

            if (nameDiv) {
                nameDiv.textContent = record.student_name + " (غایب)";
            }

            if (status) status.textContent = "";
            if (time) time.textContent = "";
        });

        lastAbsentStudentsLoad = Date.now();

        console.log(
            "غایبان دریافت شدند:",
            records.filter(record =>
                record.class_name === className &&
                record.attendance_date === today &&
                record.status === "غایب"
            ).length
        );
    } catch (error) {
        console.error("خطا در دریافت غایبان از هاست:", error);
    } finally {
        absentStudentsLoading = false;
    }
}

/* =====================================================
   ارسال فراخوان دانش‌آموز
===================================================== */

async function sendStudent(student) {
    const button = findButton(student.name);

    if (!button) return;

    if (button.classList.contains("absent")) {
        alert("این دانش‌آموز غایب است و امکان ارسال فراخوان ندارد.");
        return;
    }

    if (button.dataset.sending === "true") return;

    button.dataset.sending = "true";
    button.disabled = true;

    try {
        const today = getDatabaseToday();

        // ابتدا فراخوان‌های امروز را از هاست می‌گیریم.
        const callsUrl = CALLS_API + "?" + new URLSearchParams({
            class_name: className,
            date: today,
            _: Date.now()
        });

        const result = await apiRequest(callsUrl);

        if (today !== getDatabaseToday()) {
            showMessage("تاریخ روز تغییر کرده است؛ دوباره تلاش کنید.");
            return;
        }

        // وضعیت غیبت را قبل از تغییر فراخوان دوباره بررسی می‌کنیم.
        await loadAbsentStudents();

        if (button.classList.contains("absent")) {
            alert("این دانش‌آموز غایب است و امکان ارسال فراخوان ندارد.");
            return;
        }

        const calls = Array.isArray(result.data)
            ? result.data
            : [];

        const activeCall = calls
            .filter(call =>
                call.student_name === student.name &&
                call.class_name === className &&
                call.called_date === today &&
                call.status !== "ارسال شد" &&
                call.status !== "لغو شد"
            )
            .sort((a, b) => Number(b.id) - Number(a.id))[0];

        if (!activeCall) {
            alert("برای این دانش‌آموز فراخوان فعالی پیدا نشد.");
            return;
        }

        // آخرین بررسی قبل از تغییر وضعیت.
        if (button.classList.contains("absent")) {
            alert("این دانش‌آموز غایب است و امکان ارسال فراخوان ندارد.");
            return;
        }

        const updateResult = await apiRequest(UPDATE_CALL_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: activeCall.id,
                status: "ارسال شد"
            })
        });

        console.log("وضعیت فراخوان به‌روزرسانی شد:", updateResult);

        showMessage("📤 فراخوان " + student.name + " ارسال شد.");

        await loadCalls();
    } catch (error) {
        console.error("خطا در ارسال فراخوان:", error);

        alert(
            "ارسال فراخوان ناموفق بود. اتصال هاست و پاسخ API را بررسی کنید."
        );
    } finally {
        delete button.dataset.sending;

        // وضعیت غیبت را دوباره از سرور بررسی می‌کنیم.
        await loadAbsentStudents();

        if (!button.classList.contains("absent")) {
            button.disabled = false;
        }
    }
}

/* =====================================================
   تشخیص تغییر روز و تازه‌سازی پنل
===================================================== */

function checkTeacherCallDayChange() {
    const newDay = getDatabaseToday();

    if (newDay === currentTeacherCallDay) return false;

    console.log(
        "روز حضور و غیاب تغییر کرد:",
        currentTeacherCallDay,
        "→",
        newDay
    );

    currentTeacherCallDay = newDay;

    resetTeacherPanel();

    return true;
}

/* =====================================================
   تازه‌سازی اطلاعات پنل
===================================================== */

async function refreshTeacherPanel() {
    if (
        teacherPanelRefreshRunning ||
        document.visibilityState !== "visible" ||
        !navigator.onLine
    ) {
        return;
    }

    teacherPanelRefreshRunning = true;

    try {
        checkTeacherCallDayChange();

        await Promise.all([
            loadCalls(),
            loadAbsentStudents()
        ]);
    } catch (error) {
        console.error("خطا در به‌روزرسانی پنل معلم:", error);
    } finally {
        teacherPanelRefreshRunning = false;
    }
}

/* =====================================================
   راه‌اندازی اولیه
===================================================== */

function initializeTeacherPanel() {
    createStudents();
    setupSound();

    refreshTeacherPanel();

    console.log("پنل فراخوان معلم کلاس اول-2 آماده است.");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeTeacherPanel,
        { once: true }
    );
} else {
    initializeTeacherPanel();
}

/* =====================================================
   به‌روزرسانی خودکار هر 5 ثانیه
===================================================== */

setInterval(() => {
    refreshTeacherPanel();
}, 5000);

/* =====================================================
   بازگشت به پنل یا وصل شدن مجدد اینترنت
===================================================== */

window.addEventListener("focus", () => {
    refreshTeacherPanel();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        refreshTeacherPanel();
    }
});

window.addEventListener("online", () => {
    console.log("اتصال اینترنت برقرار شد.");
    refreshTeacherPanel();
});

window.addEventListener("offline", () => {
    console.warn("اتصال اینترنت قطع شد.");
});
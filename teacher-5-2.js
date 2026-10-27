/* =====================================================
   پنل فراخوان معلم - دبستان علوی
   کلاس: پنجم-2
   پایگاه داده: MySQL روی berandil.ir
   الگوی مرجع: کلاس ششم-1
   بدون وابستگی به Supabase
===================================================== */

"use strict";

const API_BASE = "https://berandil.ir/farakhan-api";

const CALLS_API = `${API_BASE}/teacher-calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;

const className = "پنجم-2";

/* =====================================================
   فهرست دانش‌آموزان کلاس پنجم-2
===================================================== */

const students = [
    { name: "کیان امامقلی", className: "پنجم-2" },
    { name: "مهراد امانی پور", className: "پنجم-2" },
    { name: "هیوا بهرامی", className: "پنجم-2" },
    { name: "اهورا تاتلاری", className: "پنجم-2" },
    { name: "کیان چابکی", className: "پنجم-2" },
    { name: "آرتین خدمتلو", className: "پنجم-2" },
    { name: "ویهان داداشعلی", className: "پنجم-2" },
    { name: "ماجد رسولی", className: "پنجم-2" },
    { name: "طاها زرگر", className: "پنجم-2" },
    { name: "ایلیا عباسی", className: "پنجم-2" },
    { name: "یزدان عبدالهی", className: "پنجم-2" },
    { name: "مهرسام علایی", className: "پنجم-2" },
    { name: "آرن فلاح", className: "پنجم-2" },
    { name: "مهراد فلاحتی", className: "پنجم-2" },
    { name: "امیرحافظ قمی", className: "پنجم-2" },
    { name: "امیرعلی کازرانی", className: "پنجم-2" },
    { name: "کیاراد کاظمی", className: "پنجم-2" },
    { name: "یاسان لشگری نژاد", className: "پنجم-2" },
    { name: "آریا لطیفی", className: "پنجم-2" },
    { name: "برسام محمداسماعیل", className: "پنجم-2" },
    { name: "سامیار مرادی", className: "پنجم-2" },
    { name: "سورنا مرادی", className: "پنجم-2" },
    { name: "یاسین مولایی", className: "پنجم-2" },
    { name: "محمدصدرا میرصادقی", className: "پنجم-2" },
    { name: "رادین یاهو", className: "پنجم-2" }
];

/* =====================================================
   عناصر HTML
===================================================== */

const studentsContainer =
    document.getElementById("studentsContainer");

const callCount =
    document.getElementById("callCount");

/* =====================================================
   وضعیت‌های داخلی پنل
===================================================== */

let notificationAudio = null;
let soundEnabled = false;

let teacherCallsLoading = false;
let absentStudentsLoading = false;
let teacherPanelRefreshRunning = false;

let currentTeacherCallDay = getDatabaseToday();

let lastTeacherCallsLoad = 0;
let lastAbsentStudentsLoad = 0;

let callsInitialized = false;

const previousCallStates = new Map();
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
   درخواست استاندارد به API
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
        throw new Error(
            `پاسخ API معتبر نیست (HTTP ${response.status})`
        );
    }

    if (!response.ok || !result.success) {
        throw new Error(
            result.message || `خطای API (HTTP ${response.status})`
        );
    }

    return result;
}

/* =====================================================
   نمایش پیام
===================================================== */

function showMessage(text) {
    const message = document.getElementById("message");

    if (!message) {
        console.log(text);
        return;
    }

    message.textContent = text;
    message.classList.add("show");

    clearTimeout(window.teacherMessageTimer);

    window.teacherMessageTimer = setTimeout(() => {
        message.classList.remove("show");
    }, 3000);
}

/* =====================================================
   فعال‌سازی صدای فراخوان
===================================================== */

function setupSound() {
    const button = document.getElementById("enableSoundButton");

    if (!button) {
        console.warn(
            "دکمه enableSoundButton در HTML وجود ندارد."
        );
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

/* =====================================================
   پخش صدای اعلان
===================================================== */

function playNotificationSound() {
    if (!soundEnabled || !notificationAudio) return;

    notificationAudio.currentTime = 0;

    notificationAudio.play().catch(error => {
        console.error("خطا در پخش صدای فراخوان:", error);
    });
}

/* =====================================================
   اعلان ارسال فراخوان
===================================================== */

function showSendNotification(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.warn("عناصر پنجره فراخوان پیدا نشدند.");
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

/* =====================================================
   اعلان فراخوان جدید
===================================================== */

function showCallPopup(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.warn("عناصر پنجره فراخوان پیدا نشدند.");
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

/* =====================================================
   یکسان‌سازی نام دانش‌آموزان
===================================================== */

function normalizeStudentName(name) {
    return String(name ?? "")
        .normalize("NFC")
        .replace(/[\u200B-\u200D\uFEFF\u200C]/g, "")
        .replace(/\s+/g, "")
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک");
}

/* =====================================================
   پیدا کردن دکمه دانش‌آموز
===================================================== */

function findButton(name) {
    const exact = studentButtons.get(name);

    if (exact) return exact;

    const target = normalizeStudentName(name);

    for (const [studentName, button] of studentButtons.entries()) {
        if (normalizeStudentName(studentName) === target) {
            return button;
        }
    }

    return null;
}

/* =====================================================
   مدیریت وضعیت دکمه دانش‌آموز
===================================================== */

function updateButton(call) {
    if (!call || !call.student_name) return;

    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) return;

    const statusElement = button.querySelector(".student-status");
    const timeElement = button.querySelector(".student-time");

    if (!statusElement || !timeElement) return;

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
   پاک‌سازی ظاهری وضعیت‌های قبلی
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
   دریافت فراخوان‌های امروز از هاست
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

        const todayCalls = calls.filter(call =>
            call.class_name === className &&
            call.called_date === today
        );

        const currentCallStates = new Map();

        todayCalls.forEach(call => {
            const key = String(call.id);
            currentCallStates.set(key, call);

            if (!callsInitialized) return;

            const previous = previousCallStates.get(key);

            if (!previous && call.status === "فراخوان شد") {
                const button = findButton(call.student_name);

                if (button && !button.classList.contains("absent")) {
                    showCallPopup(call.student_name);
                }
            } else if (
                previous &&
                previous.status !== "ارسال شد" &&
                call.status === "ارسال شد"
            ) {
                showSendNotification(call.student_name);
            }
        });

        resetTeacherPanel();

        todayCalls.forEach(updateButton);
        updateCount(todayCalls);

        previousCallStates.clear();

        currentCallStates.forEach((call, key) => {
            previousCallStates.set(key, call);
        });

        callsInitialized = true;
        lastTeacherCallsLoad = Date.now();

    } catch (error) {
        console.error("خطا در دریافت فراخوان‌های امروز:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

/* =====================================================
   دریافت غایبان امروز از هاست
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

        document.querySelectorAll(".student-button").forEach(button => {
            button.classList.remove("absent");

            button.disabled = button.dataset.sending === "true";

            const nameDiv = button.querySelector(".student-name");

            if (nameDiv) {
                nameDiv.textContent = button.dataset.name;
            }
        });

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
                nameDiv.textContent = button.dataset.name + " (غایب)";
            }

            if (status) status.textContent = "";
            if (time) time.textContent = "";
        });

        lastAbsentStudentsLoad = Date.now();

    } catch (error) {
        console.error("خطا در دریافت غایبان:", error);
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
                normalizeStudentName(call.student_name) ===
                    normalizeStudentName(student.name) &&
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

        await loadAbsentStudents();

        if (!button.classList.contains("absent")) {
            button.disabled = false;
        }
    }
}

/* =====================================================
   تشخیص تغییر روز
===================================================== */

function checkTeacherCallDayChange() {
    const newDay = getDatabaseToday();

    if (newDay === currentTeacherCallDay) return false;

    console.log(
        "روز فراخوان تغییر کرد:",
        currentTeacherCallDay,
        "→",
        newDay
    );

    currentTeacherCallDay = newDay;

    resetTeacherPanel();
    previousCallStates.clear();

    callsInitialized = false;

    lastTeacherCallsLoad = 0;
    lastAbsentStudentsLoad = 0;

    return true;
}

/* =====================================================
   تازه‌سازی هماهنگ پنل
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
        console.error("خطا در به‌روزرسانی پنل:", error);
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

    console.log("پنل فراخوان کلاس پنجم-2 آماده است.");
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
   بازگشت به پنل معلم
===================================================== */

window.addEventListener("focus", () => {
    refreshTeacherPanel();
});

/* =====================================================
   بازگشت تب به حالت قابل مشاهده
===================================================== */

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        refreshTeacherPanel();
    }
});

/* =====================================================
   اتصال مجدد اینترنت
===================================================== */

window.addEventListener("online", () => {
    console.log("اتصال اینترنت برقرار شد.");
    refreshTeacherPanel();
});

/* =====================================================
   قطع اینترنت
===================================================== */

window.addEventListener("offline", () => {
    console.warn("اتصال اینترنت قطع شد.");

    showMessage("اتصال اینترنت قطع شده است.");
});

/* =====================================================
   بررسی سلامت دریافت اطلاعات - Watchdog
===================================================== */

setInterval(() => {
    if (
        document.visibilityState !== "visible" ||
        !navigator.onLine
    ) {
        return;
    }

    const now = Date.now();

    const callsStale =
        lastTeacherCallsLoad > 0 &&
        now - lastTeacherCallsLoad > 20000;

    const attendanceStale =
        lastAbsentStudentsLoad > 0 &&
        now - lastAbsentStudentsLoad > 20000;

    if (callsStale || attendanceStale) {
        console.warn(
            "Watchdog: تأخیر در دریافت اطلاعات پنل تشخیص داده شد."
        );

        refreshTeacherPanel();
    }
}, 10000);
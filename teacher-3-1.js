/* =====================================================
   پنل فراخوان معلم - کلاس سوم-1
   الگوی مرجع: کلاس ششم-1
   API: berandil.ir/farakhan-api
===================================================== */

"use strict";

const API_BASE = "https://berandil.ir/farakhan-api";

const CALLS_API = `${API_BASE}/teacher-calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;

const className = "سوم-1";

let notificationAudio = null;
let soundEnabled = false;

let teacherCallsLoading = false;
let absentStudentsLoading = false;
let teacherPanelRefreshRunning = false;

let callsInitialized = false;
let currentTeacherCallDay = getDatabaseToday();

let lastTeacherCallsLoad = 0;
let lastAbsentStudentsLoad = 0;

const previousCallStates = new Map();
const studentButtons = new Map();

/* =====================================================
   فهرست دانش‌آموزان کلاس سوم-1
===================================================== */

const students = [
    { name: "ساتیار امیری", className: "سوم-1" },
    { name: "پارسا تقی زاده", className: "سوم-1" },
    { name: "رایان جمشیدی", className: "سوم-1" },
    { name: "رادین جمشیدی", className: "سوم-1" },
    { name: "پرهام دولتخواه", className: "سوم-1" },
    { name: "کارن جهانی", className: "سوم-1" },
    { name: "بهراد حسینی نژاد", className: "سوم-1" },
    { name: "نویان خدامرادی", className: "سوم-1" },
    { name: "فرداد خدایاری", className: "سوم-1" },
    { name: "آدرین سلاجقه", className: "سوم-1" },
    { name: "شهریار سلگی", className: "سوم-1" },
    { name: "آراد شریفی", className: "سوم-1" },
    { name: "آرین صفری", className: "سوم-1" },
    { name: "رایان عیسی زاده", className: "سوم-1" },
    { name: "آرشان عیوض نژاد", className: "سوم-1" },
    { name: "کارن کاردان", className: "سوم-1" },
    { name: "رادمان کامکار", className: "سوم-1" },
    { name: "آرمان کریمیان", className: "سوم-1" },
    { name: "رهام ماندگارمقدم", className: "سوم-1" },
    { name: "رادمان مرادیان نژاد", className: "سوم-1" },
    { name: "مهراد ناصری", className: "سوم-1" },
    { name: "آریا نصیرمحمدی", className: "سوم-1" },
    { name: "آریا نعمتی", className: "سوم-1" },
    { name: "ابوالفضل یوسفی", className: "سوم-1" }
];

const studentsContainer = document.getElementById("studentsContainer");
const callCount = document.getElementById("callCount");

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

/* سازگاری با الگوی تاریخ مرجع */
function getToday() {
    return getDatabaseToday();
}

/* =====================================================
   درخواست به API
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

    if (!response.ok || !result || result.success !== true) {
        throw new Error(
            result?.message || `خطای API (HTTP ${response.status})`
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
   فعال‌سازی صدای اعلان
===================================================== */

function setupSound() {
    const button = document.getElementById("enableSoundButton");

    if (!button) {
        console.error("دکمه enableSoundButton در HTML پیدا نشد.");
        return;
    }

    button.addEventListener("click", async () => {
        try {
            if (!soundEnabled) {
                if (!notificationAudio) {
                    notificationAudio = new Audio("notification.mp3");
                    notificationAudio.preload = "auto";
                    notificationAudio.volume = 1;
                }

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
            alert("خطا در تغییر وضعیت صدا: " + error.message);
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
   پنجره اعلان فراخوان
===================================================== */

function showSendNotification(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
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
        playNotificationSound();
        return;
    }

    student.innerText = studentName + " فراخوان شد";
    popup.classList.add("show");

    playNotificationSound();

    clearTimeout(window.teacherCallPopupTimer);

    window.teacherCallPopupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 7000);
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

        const nameElement = document.createElement("div");
        nameElement.className = "student-name";
        nameElement.textContent = student.name;

        const statusElement = document.createElement("div");
        statusElement.className = "student-status";

        const timeElement = document.createElement("div");
        timeElement.className = "student-time";

        button.append(nameElement, statusElement, timeElement);

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

    const normalizedName = normalizeStudentName(name);

    for (const [studentName, button] of studentButtons.entries()) {
        if (normalizeStudentName(studentName) === normalizedName) {
            return button;
        }
    }

    return null;
}

/* =====================================================
   به‌روزرسانی وضعیت فراخوان
===================================================== */

function updateButton(call) {
    if (!call || !call.student_name) return;

    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) return;

    if (call.status === "لغو شد") {
        resetStudentButton(call);
        return;
    }

    button.classList.remove("called", "sent", "received", "pending");

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

    timeElement.replaceChildren();

    const lines = [];

    if (call.called_time) {
        lines.push("🕐 فراخوان: " + call.called_time);
    }

    if (call.sent_time && call.status === "ارسال شد") {
        lines.push("📤 ارسال: " + call.sent_time);
    }

    lines.forEach((line, index) => {
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
   ریست ظاهری پنل؛ وضعیت غایبان حفظ می‌شود
===================================================== */

function resetTeacherPanel() {
    studentButtons.forEach(button => {
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
        console.error("updateCount: داده آرایه نیست:", data);
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
   دریافت فراخوان‌های امروز
===================================================== */

async function loadCalls() {
    if (teacherCallsLoading) return;

    teacherCallsLoading = true;

    try {
        const today = getDatabaseToday();

        const params = new URLSearchParams({
            class_name: className,
            date: today,
            _: String(Date.now())
        });

        const result = await apiRequest(
            `${CALLS_API}?${params.toString()}`
        );

        const allCalls = Array.isArray(result.data)
            ? result.data
            : [];

        const data = allCalls.filter(call =>
            call.class_name === className &&
            call.called_date === today
        );

        const nextStates = new Map();

        resetTeacherPanel();

        data.forEach(call => {
            const key = String(
                call.id ??
                `${call.student_name}_${call.called_time ?? ""}`
            );

            const state = `${call.status}_${call.sent_time ?? ""}`;
            const previousState = previousCallStates.get(key);

            nextStates.set(key, state);

            if (
                callsInitialized &&
                call.status === "فراخوان شد" &&
                previousState !== state
            ) {
                const button = findButton(call.student_name);

                if (button && !button.classList.contains("absent")) {
                    showCallPopup(call.student_name);
                }
            }

            if (
                callsInitialized &&
                call.status === "ارسال شد" &&
                previousState !== state
            ) {
                showSendNotification(call.student_name);
            }

            updateButton(call);
        });

        previousCallStates.clear();

        nextStates.forEach((value, key) => {
            previousCallStates.set(key, value);
        });

        callsInitialized = true;

        updateCount(data);
        lastTeacherCallsLoad = Date.now();

    } catch (error) {
        console.error("خطا در دریافت فراخوان‌های امروز:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

/* =====================================================
   دریافت وضعیت حضور و غیاب
===================================================== */

async function loadAbsentStudents() {
    if (absentStudentsLoading) return;

    absentStudentsLoading = true;

    try {
        const today = getDatabaseToday();

        const params = new URLSearchParams({
            class_name: className,
            date: today,
            _: String(Date.now())
        });

        const result = await apiRequest(
            `${ATTENDANCE_API}?${params.toString()}`
        );

        const allAttendance = Array.isArray(result.data)
            ? result.data
            : [];

        const attendance = allAttendance.filter(record =>
            record.class_name === className &&
            record.attendance_date === today &&
            record.status === "غایب"
        );

        studentButtons.forEach(button => {
            button.classList.remove("absent");

            const nameElement = button.querySelector(".student-name");
            const statusElement = button.querySelector(".student-status");
            const timeElement = button.querySelector(".student-time");

            if (nameElement) {
                nameElement.textContent = button.dataset.name;
            }

            const isAbsent = attendance.some(record =>
                normalizeStudentName(record.student_name) ===
                normalizeStudentName(button.dataset.name)
            );

            if (isAbsent) {
                button.classList.add("absent");
                button.disabled = true;

                if (statusElement) statusElement.textContent = "⚫ غایب";
                if (timeElement) timeElement.textContent = "";
            } else if (button.dataset.sending !== "true") {
                button.disabled = false;
            }
        });

        lastAbsentStudentsLoad = Date.now();

    } catch (error) {
        console.error("خطا در دریافت حضور و غیاب:", error);
    } finally {
        absentStudentsLoading = false;
    }
}

/* =====================================================
   ارسال فراخوان دانش‌آموز
===================================================== */

async function sendStudent(student) {
    const button = findButton(student.name);

    if (!button) {
        showMessage("دکمه دانش‌آموز پیدا نشد.");
        return;
    }

    if (
        button.disabled ||
        button.dataset.sending === "true" ||
        button.classList.contains("absent")
    ) {
        return;
    }

    if (!navigator.onLine) {
        showMessage("اتصال اینترنت برقرار نیست.");
        return;
    }

    button.dataset.sending = "true";
    button.disabled = true;

    try {
        await loadAbsentStudents();

        if (button.classList.contains("absent")) {
            showMessage("دانش‌آموز غایب است و امکان ارسال ندارد.");
            return;
        }

        const today = getDatabaseToday();

        const params = new URLSearchParams({
            class_name: className,
            date: today,
            student_name: student.name,
            _: String(Date.now())
        });

        const result = await apiRequest(
            `${CALLS_API}?${params.toString()}`
        );

        const allCalls = Array.isArray(result.data)
            ? result.data
            : [];

        const activeCalls = allCalls.filter(call =>
            call.class_name === className &&
            call.called_date === today &&
            normalizeStudentName(call.student_name) ===
                normalizeStudentName(student.name) &&
            call.status !== "ارسال شد" &&
            call.status !== "لغو شد"
        );

        activeCalls.sort((a, b) =>
            Number(b.id || 0) - Number(a.id || 0)
        );

        const activeCall = activeCalls[0];

        if (!activeCall) {
            showMessage("فراخوان فعالی برای این دانش‌آموز پیدا نشد.");
            await loadCalls();
            return;
        }

        await apiRequest(UPDATE_CALL_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: activeCall.id,
                status: "ارسال شد"
            })
        });

        showMessage("فراخوان " + student.name + " ارسال شد.");

        await loadCalls();

    } catch (error) {
        console.error("خطا در ارسال فراخوان:", error);

        showMessage(
            error.message || "ارسال فراخوان ناموفق بود."
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
   بررسی تغییر تاریخ تهران
===================================================== */

function checkTeacherCallDayChange() {
    const today = getDatabaseToday();

    if (today === currentTeacherCallDay) {
        return false;
    }

    console.log(
        "تاریخ فراخوان تغییر کرد:",
        currentTeacherCallDay,
        "به",
        today
    );

    currentTeacherCallDay = today;

    previousCallStates.clear();
    callsInitialized = false;

    resetTeacherPanel();

    lastTeacherCallsLoad = 0;
    lastAbsentStudentsLoad = 0;

    return true;
}

/* =====================================================
   همگام‌سازی و تازه‌سازی پنل
===================================================== */

async function refreshTeacherPanel() {
    if (teacherPanelRefreshRunning) return;
    if (document.hidden) return;
    if (!navigator.onLine) return;

    teacherPanelRefreshRunning = true;

    try {
        checkTeacherCallDayChange();

        await Promise.all([
            loadCalls(),
            loadAbsentStudents()
        ]);
    } catch (error) {
        console.error("خطا در تازه‌سازی پنل:", error);
    } finally {
        teacherPanelRefreshRunning = false;
    }
}

/* =====================================================
   تشخیص قطع و وصل اینترنت
===================================================== */

window.addEventListener("offline", () => {
    showMessage("اتصال اینترنت قطع شد.");
});

window.addEventListener("online", () => {
    showMessage("اتصال اینترنت برقرار شد.");
    refreshTeacherPanel();
});

/* =====================================================
   تازه‌سازی هنگام بازگشت به صفحه
===================================================== */

window.addEventListener("focus", () => {
    refreshTeacherPanel();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        refreshTeacherPanel();
    }
});

/* =====================================================
   راه‌اندازی پنل
===================================================== */

async function initializeTeacherPanel() {
    createStudents();
    setupSound();

    await refreshTeacherPanel();
}

/* =====================================================
   شروع پنل و بررسی‌های دوره‌ای
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initializeTeacherPanel();

    window.teacherCallsInterval = setInterval(() => {
        refreshTeacherPanel();
    }, 5000);

    window.teacherDayCheckInterval = setInterval(() => {
        if (checkTeacherCallDayChange()) {
            refreshTeacherPanel();
        }
    }, 30000);
});
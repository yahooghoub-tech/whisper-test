
/* =====================================================
   پنل فراخوان معلم - دبستان علوی
   کلاس: چهارم-3
   الگوی مرجع: ششم-1
   پایگاه داده: MySQL روی berandil.ir
   بدون وابستگی به Supabase
===================================================== */

"use strict";

const API_BASE = "https://berandil.ir/farakhan-api";

const CALLS_API = `${API_BASE}/teacher-calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;

const className = "چهارم-3";

const students = [
    { name: "آرسام حسینی", className: "چهارم-3" },
    { name: "لیام رحمانی", className: "چهارم-3" },
    { name: "شاهان ترکاشوند", className: "چهارم-3" },
    { name: "ایلیا سبزپوش", className: "چهارم-3" },
    { name: "ماهان سمنارشاد", className: "چهارم-3" },
    { name: "آروین عابدی", className: "چهارم-3" },
    { name: "ایلیا عرشی", className: "چهارم-3" },
    { name: "آراد عطاییان", className: "چهارم-3" },
    { name: "آرتین علمی", className: "چهارم-3" },
    { name: "مهرسام غضنفری", className: "چهارم-3" },
    { name: "نیکان فرجی", className: "چهارم-3" },
    { name: "دانیال کشاورز", className: "چهارم-3" },
    { name: "کارن کوهی", className: "چهارم-3" },
    { name: "رایان منتظری", className: "چهارم-3" },
    { name: "آرین نیک پی", className: "چهارم-3" },
    { name: "ویهان وهابی", className: "چهارم-3" }
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

    if (!response.ok || !result || result.success !== true) {
        throw new Error(
            result?.message || `خطای سرور: ${response.status}`
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
        console.warn("دکمه enableSoundButton در HTML وجود ندارد.");
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
   پنجره اطلاع‌رسانی ارسال فراخوان
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

/* =====================================================
   پنجره اطلاع‌رسانی فراخوان جدید
===================================================== */

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
   پاک‌سازی وضعیت پنل
   غایبان حفظ می‌شوند.
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
   دریافت فراخوان‌های کلاس
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

        const allCalls = Array.isArray(result)
            ? result
            : Array.isArray(result.data)
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

            nextStates.set(key, state);

            const previousState = previousCallStates.get(key);

            if (
                callsInitialized &&
                call.status === "فراخوان شد" &&
                previousState !== state
            ) {
                showCallPopup(call.student_name);
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
        console.error("خطا در دریافت فراخوان‌ها:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

/* =====================================================
   دریافت فهرست دانش‌آموزان غایب
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

        const allAttendance = Array.isArray(result)
            ? result
            : Array.isArray(result.data)
                ? result.data
                : [];

        const attendance = allAttendance.filter(record =>
            record.class_name === className &&
            record.attendance_date === today &&
            record.status === "غایب"
        );

        studentButtons.forEach(button => {
            button.classList.remove("absent");

            const name = button.dataset.name;

            const isAbsent = attendance.some(record =>
                normalizeStudentName(record.student_name) ===
                normalizeStudentName(name)
            );

            if (isAbsent) {
                button.classList.add("absent");
                button.disabled = true;

                const status = button.querySelector(".student-status");
                const time = button.querySelector(".student-time");

                if (status) status.textContent = "⚫ غایب";
                if (time) time.textContent = "";
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
        button.classList.contains("absent") ||
        !navigator.onLine
    ) {
        if (!navigator.onLine) {
            showMessage("اتصال اینترنت برقرار نیست.");
        }

        return;
    }

    button.dataset.sending = "true";
    button.disabled = true;

    try {
        await loadAbsentStudents();

        if (button.classList.contains("absent")) {
            showMessage("این دانش‌آموز غایب است.");
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

        const allCalls = Array.isArray(result)
            ? result
            : Array.isArray(result.data)
                ? result.data
                : [];

        const studentCalls = allCalls.filter(call =>
            call.class_name === className &&
            call.called_date === today &&
            normalizeStudentName(call.student_name) ===
                normalizeStudentName(student.name) &&
            call.status !== "ارسال شد" &&
            call.status !== "لغو شد"
        );

        if (studentCalls.length === 0) {
            showMessage("برای این دانش‌آموز فراخوان فعالی پیدا نشد.");
            await loadCalls();
            return;
        }

        studentCalls.sort((a, b) =>
            Number(b.id || 0) - Number(a.id || 0)
        );

        const activeCall = studentCalls[0];

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

        showSendNotification(student.name);
        showMessage("فراخوان " + student.name + " ارسال شد.");

        await loadCalls();

    } catch (error) {
        console.error("خطا در ارسال فراخوان:", error);

        showMessage(
            error.message || "ارسال فراخوان با خطا مواجه شد."
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
   بررسی تغییر روز بر اساس ساعت تهران
===================================================== */

function checkTeacherCallDayChange() {
    const today = getDatabaseToday();

    if (today === currentTeacherCallDay) return;

    currentTeacherCallDay = today;

    previousCallStates.clear();
    callsInitialized = false;

    resetTeacherPanel();

    lastTeacherCallsLoad = 0;
    lastAbsentStudentsLoad = 0;

    refreshTeacherPanel();
}

/* =====================================================
   تازه‌سازی پنل
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
   مدیریت اتصال اینترنت
===================================================== */

window.addEventListener("online", () => {
    showMessage("اتصال اینترنت برقرار شد.");

    refreshTeacherPanel();
});

window.addEventListener("offline", () => {
    showMessage("اتصال اینترنت قطع شد.");
});

/* =====================================================
   بازگشت به پنل و تغییر وضعیت صفحه
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
   اجرای پنل و پایش دوره‌ای
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initializeTeacherPanel();

    window.teacherCallsInterval = setInterval(() => {
        refreshTeacherPanel();
    }, 5000);

    window.teacherDayCheckInterval = setInterval(() => {
        checkTeacherCallDayChange();
    }, 30000);
});

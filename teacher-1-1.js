/* =====================================================
   پنل فراخوان معلم - دبستان علوی
   کلاس: اول-1
   الگوی مرجع: ششم-1
   پایگاه داده: MySQL روی berandil.ir
   بدون Supabase
===================================================== */

"use strict";

const API_BASE = "https://berandil.ir/farakhan-api";

const CALLS_API = `${API_BASE}/teacher-calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;

const className = "اول-1";

/* =====================================================
   فهرست دانش‌آموزان کلاس اول-1
===================================================== */

const students = [
    { name: "آرسام ابهری", className: "اول-1" },
    { name: "هومان باوی", className: "اول-1" },
    { name: "سامراد دمیرچلی", className: "اول-1" },
    { name: "آرش عبدی", className: "اول-1" },
    { name: "رادین عبدی", className: "اول-1" },
    { name: "میلان غلامی آبادانی", className: "اول-1" },
    { name: "آیهان قاسمی", className: "اول-1" },
    { name: "ویهان کاملی", className: "اول-1" },
    { name: "رایان محرابی", className: "اول-1" },
    { name: "آرشا محمودی", className: "اول-1" },
    { name: "رایان مقدم", className: "اول-1" },
    { name: "سید صدرا منصورزاده", className: "اول-1" },
    { name: "جاوید نصرالهی", className: "اول-1" }
];

const studentsContainer = document.getElementById("studentsContainer");
const callCount = document.getElementById("callCount");

let notificationAudio = null;
let soundEnabled = false;

let teacherCallsLoading = false;
let absentStudentsLoading = false;
let teacherPanelRefreshRunning = false;

let currentTeacherCallDay = getDatabaseToday();
let callsInitialized = false;

let lastTeacherCallsLoad = 0;
let lastAbsentStudentsLoad = 0;

const previousCallStates = new Map();
const studentButtons = new Map();

/* =====================================================
   تاریخ امروز بر اساس منطقه زمانی تهران
   خروجی: YYYY-MM-DD
===================================================== */

function getDatabaseToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        calendar: "gregory",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const getPart = type =>
        parts.find(part => part.type === type)?.value || "";

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
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
   فعال‌سازی صدای فراخوان
===================================================== */

function setupSound() {
    const button = document.getElementById("enableSoundButton");

    if (!button || button.dataset.soundInitialized === "true") {
        return;
    }

    button.dataset.soundInitialized = "true";

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
            console.error("خطا در فعال‌سازی صدا:", error);
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
   پنجره اعلان‌ها
===================================================== */

function showPopup(text, duration = 5000) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.warn("عناصر پنجره اعلان در HTML پیدا نشدند.");
        playNotificationSound();
        return;
    }

    student.textContent = text;
    popup.classList.add("show");

    clearTimeout(window.teacherCallPopupTimer);

    window.teacherCallPopupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, duration);

    playNotificationSound();
}

function showSendNotification(studentName) {
    showPopup("📤 " + studentName + " ارسال شد", 5000);
}

function showCallPopup(studentName) {
    showPopup(studentName + " فراخوان شد", 7000);
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
   یکسان‌سازی نام‌ها
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
    const exact = studentButtons.get(String(name ?? "").trim());

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
   نمایش وضعیت فراخوان روی دکمه
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
   پاک‌سازی ظاهری پنل؛ غایبان حفظ می‌شوند
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
   شناسه فراخوان برای تشخیص تغییر وضعیت
===================================================== */

function getCallKey(call) {
    if (call.id !== undefined && call.id !== null) {
        return String(call.id);
    }

    return [
        call.student_name || "",
        call.called_date || "",
        call.called_time || ""
    ].join("|");
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

        if (today !== getDatabaseToday()) return;

        const allCalls = Array.isArray(result.data)
            ? result.data
            : [];

        const calls = allCalls.filter(call =>
            call.class_name === className &&
            call.called_date === today
        );

        const nextStates = new Map();

        resetTeacherPanel();

        calls.forEach(call => {
            const key = getCallKey(call);
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

        updateCount(calls);
        lastTeacherCallsLoad = Date.now();

    } catch (error) {
        console.error("خطا در دریافت فراخوان‌ها:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

/* =====================================================
   دریافت غایبان امروز
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

        if (today !== getDatabaseToday()) return;

        const allAttendance = Array.isArray(result.data)
            ? result.data
            : [];

        const absentStudents = allAttendance.filter(record =>
            record.class_name === className &&
            record.attendance_date === today &&
            record.status === "غایب"
        );

        studentButtons.forEach(button => {
            button.classList.remove("absent");

            const nameElement = button.querySelector(".student-name");

            if (nameElement) {
                nameElement.textContent = button.dataset.name;
            }

            const isAbsent = absentStudents.some(record =>
                normalizeStudentName(record.student_name) ===
                normalizeStudentName(button.dataset.name)
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
        button.classList.contains("absent") ||
        button.dataset.sending === "true"
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
        // ابتدا وضعیت غیبت را بررسی می‌کنیم.
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

        if (today !== getDatabaseToday()) {
            showMessage("تاریخ تغییر کرده است؛ دوباره تلاش کنید.");
            return;
        }

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

        // زمان ارسال بر اساس منطقه زمانی تهران
        const sentTime = new Date().toLocaleTimeString("fa-IR", {
            timeZone: "Asia/Tehran",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        await apiRequest(UPDATE_CALL_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: activeCall.id,
                status: "ارسال شد",
                sent_time: sentTime
            })
        });

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
   تشخیص تغییر روز بر اساس ساعت تهران
===================================================== */

function checkTeacherCallDayChange() {
    const today = getDatabaseToday();

    if (today === currentTeacherCallDay) {
        return false;
    }

    console.log(
        "روز فراخوان تغییر کرد:",
        currentTeacherCallDay,
        "→",
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
   همگام‌سازی پنل
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
        console.error("خطا در همگام‌سازی پنل:", error);
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
   تازه‌سازی هنگام بازگشت به پنل
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

    console.log("پنل فراخوان کلاس اول-1 آماده است.");
}

/* =====================================================
   اجرای اولیه و جلوگیری از راه‌اندازی تکراری
===================================================== */

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
   بررسی و همگام‌سازی دوره‌ای هر ۵ ثانیه
===================================================== */

window.teacherCallsInterval = setInterval(() => {
    refreshTeacherPanel();
}, 5000);

window.teacherDayCheckInterval = setInterval(() => {
    if (checkTeacherCallDayChange()) {
        refreshTeacherPanel();
    }
}, 30000);
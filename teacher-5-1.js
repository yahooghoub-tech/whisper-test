/* =====================================================
   دریافت فراخوان‌های امروز از هاست
===================================================== */
/* =====================================================
   پنل فراخوان معلم - دبستان علوی
   کلاس: پنجم-1
   پایگاه داده: MySQL روی berandil.ir
   بدون وابستگی به Supabase
   الگوی مرجع: کلاس ششم-1
===================================================== */

"use strict";

const API_BASE = "https://berandil.ir/farakhan-api";

const CALLS_API = `${API_BASE}/teacher-calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;

const className = "پنجم-1";

const students = [
    { name: "محمدمهدی ابیض", className: "پنجم-1" },
    { name: "ماهان اجتهادی", className: "پنجم-1" },
    { name: "آرشا افتخاری", className: "پنجم-1" },
    { name: "کارن آتش بهار", className: "پنجم-1" },
    { name: "شهراد چم", className: "پنجم-1" },
    { name: "مهراد حسینی", className: "پنجم-1" },
    { name: "رهام روشنی صبح", className: "پنجم-1" },
    { name: "پارسا سعیدی نیا", className: "پنجم-1" },
    { name: "مهراد سفیدگران", className: "پنجم-1" },
    { name: "محمد سیف الهی", className: "پنجم-1" },
    { name: "سروش شمسیان", className: "پنجم-1" },
    { name: "آتیلا صفری", className: "پنجم-1" },
    { name: "رادین عباسی", className: "پنجم-1" },
    { name: "آرشام فتحی زاده", className: "پنجم-1" },
    { name: "آرسام کاظمی", className: "پنجم-1" },
    { name: "محمد کهتری", className: "پنجم-1" },
    { name: "ماهان مختاری", className: "پنجم-1" },
    { name: "آرشین مقدسی", className: "پنجم-1" },
    { name: "امیرمهدی میرزاآقایی", className: "پنجم-1" },
    { name: "مهراد جعفری", className: "پنجم-1" },
    { name: "فربد ناطقی", className: "پنجم-1" },
    { name: "کارن نعمتی", className: "پنجم-1" },
    { name: "فرهام هاشمی", className: "پنجم-1" },
    { name: "یاسین یوسفی", className: "پنجم-1" }
];

const studentsContainer = document.getElementById("studentsContainer");
const callCount = document.getElementById("callCount");

let notificationAudio = null;
let soundEnabled = false;

let teacherCallsLoading = false;
let absentStudentsLoading = false;
let teacherPanelRefreshRunning = false;
let refreshRequestedAgain = false;

let currentTeacherCallDay = getDatabaseToday();
let lastTeacherCallsLoad = 0;
let lastAbsentStudentsLoad = 0;
let callsInitialized = false;

let watchdogTimer = null;
let popupTimer = null;

const previousCallStates = new Map();
const studentButtons = new Map();
const sendingStudents = new Set();

/* =====================================================
   تاریخ امروز بر اساس منطقه زمانی تهران
   خروجی میلادی: YYYY-MM-DD
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
        throw new Error(
            `پاسخ سرور JSON معتبر نیست (HTTP ${response.status}).`
        );
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

    if (!button || button.dataset.soundInitialized === "1") {
        return;
    }

    button.dataset.soundInitialized = "1";

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

function playNotificationSound() {
    if (!soundEnabled || !notificationAudio) {
        return;
    }

    try {
        notificationAudio.currentTime = 0;

        notificationAudio.play().catch(error => {
            console.error("خطا در پخش صدای فراخوان:", error);
        });
    } catch (error) {
        console.error("خطای پخش صدای فراخوان:", error);
    }
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

    student.textContent = "📤 " + studentName + " ارسال شد";
    popup.classList.add("show");

    clearTimeout(popupTimer);

    popupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 5000);

    playNotificationSound();
}

function showCallPopup(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.warn("عناصر پنجره فراخوان در HTML پیدا نشدند.");
        playNotificationSound();
        return;
    }

    student.textContent = studentName + " فراخوان شد";
    popup.classList.add("show");

    clearTimeout(popupTimer);

    popupTimer = setTimeout(() => {
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

    studentsContainer.replaceChildren();
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
        .replace(/[\u200B-\u200F\uFEFF]/g, "")
        .replace(/\s+/g, "")
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک");
}

function findButton(name) {
    const exact = studentButtons.get(name);

    if (exact) {
        return exact;
    }

    const target = normalizeStudentName(name);

    for (const [studentName, button] of studentButtons.entries()) {
        if (normalizeStudentName(studentName) === target) {
            return button;
        }
    }

    return null;
}

/* =====================================================
   مدیریت وضعیت دکمه‌های دانش‌آموزان
===================================================== */

function updateButton(call) {
    if (!call || !call.student_name) {
        return;
    }

    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) {
        return;
    }

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

    if (!statusElement || !timeElement) {
        return;
    }

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
    if (!call || !call.student_name) {
        return;
    }

    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) {
        return;
    }

    button.classList.remove("called", "sent", "received");
    button.classList.add("pending");

    const status = button.querySelector(".student-status");
    const time = button.querySelector(".student-time");

    if (status) status.textContent = "";
    if (time) time.textContent = "";
}

/* =====================================================
   پاک‌سازی ظاهری پنل با حفظ وضعیت غایبان
===================================================== */

function resetTeacherPanel() {
    document.querySelectorAll(".student-button").forEach(button => {
        if (button.classList.contains("absent")) {
            return;
        }

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
   پایان بخش اول
   بخش دوم را دقیقاً بعد از این قسمت قرار بده
===================================================== */
async function loadCalls() {
    if (teacherCallsLoading || !navigator.onLine) {
        return;
    }

    teacherCallsLoading = true;

    try {
        const today = getDatabaseToday();

        const url = CALLS_API + "?" + new URLSearchParams({
            class_name: className,
            date: today,
            _: String(Date.now())
        });

        const result = await apiRequest(url);

        /* جلوگیری از اعمال پاسخ مربوط به روز قبلی */

        if (today !== getDatabaseToday()) {
            return;
        }

        const calls = Array.isArray(result.data)
            ? result.data
            : [];

        const todayCalls = calls.filter(call => {
            const sameClass =
                call.class_name === className;

            const sameDate =
                String(call.called_date || "").slice(0, 10) === today;

            return sameClass && sameDate;
        });

        const currentCallStates = new Map();

        todayCalls.forEach(call => {
            const key = String(call.id);
            currentCallStates.set(key, call);

            /* بارگذاری اولیه نباید اعلان تکراری ایجاد کند. */

            if (!callsInitialized) {
                return;
            }

            const previous = previousCallStates.get(key);

            if (
                !previous &&
                call.status === "فراخوان شد"
            ) {
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

        /* فقط ظاهر دکمه‌ها بازنشانی می‌شود؛ غایبان حفظ می‌شوند. */

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
        console.error("خطا در دریافت فراخوان‌ها از هاست:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

/* =====================================================
   دریافت غایبان امروز از هاست
===================================================== */

async function loadAbsentStudents() {
    if (absentStudentsLoading || !navigator.onLine) {
        return;
    }

    absentStudentsLoading = true;

    try {
        const today = getDatabaseToday();

        const url = ATTENDANCE_API + "?" + new URLSearchParams({
            class_name: className,
            date: today,
            _: String(Date.now())
        });

        const result = await apiRequest(url);

        if (today !== getDatabaseToday()) {
            return;
        }

        const records = Array.isArray(result.data)
            ? result.data
            : [];

        /* پاک‌کردن وضعیت غیبت قبلی پیش از اعمال اطلاعات جدید */

        document.querySelectorAll(".student-button").forEach(button => {
            button.classList.remove("absent");

            const normalizedName = normalizeStudentName(
                button.dataset.name
            );

            button.disabled = sendingStudents.has(normalizedName);

            const nameDiv = button.querySelector(".student-name");

            if (nameDiv) {
                nameDiv.textContent = button.dataset.name;
            }
        });

        records.forEach(record => {
            const sameClass = record.class_name === className;

            const sameDate =
                String(record.attendance_date || "").slice(0, 10) === today;

            if (
                !sameClass ||
                !sameDate ||
                record.status !== "غایب"
            ) {
                return;
            }

            const button = findButton(record.student_name);

            if (!button) {
                return;
            }

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
                nameDiv.textContent =
                    button.dataset.name + " (غایب)";
            }

            if (status) status.textContent = "";
            if (time) time.textContent = "";
        });

        lastAbsentStudentsLoad = Date.now();

        console.log(
            "غایبان کلاس پنجم-1 دریافت شدند:",
            records.filter(record =>
                record.class_name === className &&
                String(record.attendance_date || "").slice(0, 10) === today &&
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
   بررسی مجدد غیبت از سرور پیش از ارسال
===================================================== */

async function isStudentAbsent(studentName) {
    const today = getDatabaseToday();

    const url = ATTENDANCE_API + "?" + new URLSearchParams({
        class_name: className,
        date: today,
        _: String(Date.now())
    });

    const result = await apiRequest(url);

    if (!Array.isArray(result.data)) {
        throw new Error("اطلاعات حضور و غیاب معتبر نیست.");
    }

    return result.data.some(record => {
        return (
            record.class_name === className &&
            String(record.attendance_date || "").slice(0, 10) === today &&
            normalizeStudentName(record.student_name) ===
                normalizeStudentName(studentName) &&
            record.status === "غایب"
        );
    });
}

/* =====================================================
   ارسال فراخوان دانش‌آموز
===================================================== */

async function sendStudent(student) {
    const button = findButton(student.name);

    if (!button) {
        return;
    }

    const normalizedName = normalizeStudentName(student.name);

    if (
        button.classList.contains("absent") ||
        button.disabled ||
        sendingStudents.has(normalizedName)
    ) {
        return;
    }

    if (!navigator.onLine) {
        showMessage("اتصال اینترنت برقرار نیست.");
        return;
    }

    sendingStudents.add(normalizedName);
    button.dataset.sending = "true";
    button.disabled = true;

    try {
        const today = getDatabaseToday();

        /* بررسی مجدد وضعیت غیبت */

        const absent = await isStudentAbsent(student.name);

        if (today !== getDatabaseToday()) {
            showMessage("روز جدید آغاز شده است؛ دوباره تلاش کنید.");
            return;
        }

        if (absent) {
            button.classList.add("absent");
            button.classList.remove(
                "called",
                "sent",
                "received",
                "pending"
            );

            const nameDiv = button.querySelector(".student-name");

            if (nameDiv) {
                nameDiv.textContent = student.name + " (غایب)";
            }

            showMessage("این دانش‌آموز غایب است و امکان ارسال ندارد.");
            return;
        }

        /* دریافت آخرین فراخوان‌های کلاس */

        const callsUrl = CALLS_API + "?" + new URLSearchParams({
            class_name: className,
            date: today,
            _: String(Date.now())
        });

        const result = await apiRequest(callsUrl);

        if (today !== getDatabaseToday()) {
            showMessage("روز جدید آغاز شده است؛ دوباره تلاش کنید.");
            return;
        }

        const calls = Array.isArray(result.data)
            ? result.data
            : [];

        /* انتخاب جدیدترین فراخوان فعال همین دانش‌آموز */

        const activeCall = calls
            .filter(call =>
                call.class_name === className &&
                String(call.called_date || "").slice(0, 10) === today &&
                normalizeStudentName(call.student_name) === normalizedName &&
                call.status !== "ارسال شد" &&
                call.status !== "لغو شد"
            )
            .sort((a, b) => Number(b.id) - Number(a.id))[0];

        if (!activeCall) {
            showMessage("برای این دانش‌آموز فراخوان فعالی پیدا نشد.");
            await loadCalls();
            return;
        }

        /* ثبت وضعیت ارسال مطابق قرارداد API مرجع */

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

        showMessage("📤 فراخوان " + student.name + " ارسال شد.");

        await loadCalls();

    } catch (error) {
        console.error("خطا در ارسال فراخوان:", error);

        showMessage(
            "ارسال فراخوان ناموفق بود: " + error.message
        );
    } finally {
        sendingStudents.delete(normalizedName);
        delete button.dataset.sending;

        /* وضعیت غیبت مجدداً از سرور دریافت می‌شود. */

        if (navigator.onLine) {
            await loadAbsentStudents();
        } else if (!button.classList.contains("absent")) {
            button.disabled = false;
        }
    }
}

/* =====================================================
   تشخیص تغییر روز تهران
===================================================== */

function checkTeacherCallDayChange() {
    const newDay = getDatabaseToday();

    if (newDay === currentTeacherCallDay) {
        return false;
    }

    console.log(
        "تاریخ پنل تغییر کرد:",
        currentTeacherCallDay,
        "→",
        newDay
    );

    currentTeacherCallDay = newDay;

    previousCallStates.clear();
    callsInitialized = false;

    lastTeacherCallsLoad = 0;
    lastAbsentStudentsLoad = 0;

    resetTeacherPanel();

    return true;
}

/* =====================================================
   تازه‌سازی هماهنگ پنل
===================================================== */

async function refreshTeacherPanel() {
    if (
        document.hidden ||
        !navigator.onLine
    ) {
        return;
    }

    if (teacherPanelRefreshRunning) {
        refreshRequestedAgain = true;
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

        if (refreshRequestedAgain) {
            refreshRequestedAgain = false;

            if (navigator.onLine && !document.hidden) {
                setTimeout(refreshTeacherPanel, 100);
            }
        }
    }
}

/* =====================================================
   Watchdog - بررسی سلامت به‌روزرسانی
===================================================== */

function runTeacherPanelWatchdog() {
    if (
        document.hidden ||
        !navigator.onLine
    ) {
        return;
    }

    const now = Date.now();
    const maxDelay = 20000;

    if (
        !teacherCallsLoading &&
        (
            !lastTeacherCallsLoad ||
            now - lastTeacherCallsLoad > maxDelay
        )
    ) {
        console.warn("Watchdog: تلاش مجدد برای دریافت فراخوان‌ها.");
        loadCalls();
    }

    if (
        !absentStudentsLoading &&
        (
            !lastAbsentStudentsLoad ||
            now - lastAbsentStudentsLoad > maxDelay
        )
    ) {
        console.warn("Watchdog: تلاش مجدد برای دریافت حضور و غیاب.");
        loadAbsentStudents();
    }
}

/* =====================================================
   راه‌اندازی اولیه پنل
===================================================== */

function initializeTeacherPanel() {
    createStudents();
    setupSound();

    refreshTeacherPanel();

    if (watchdogTimer) {
        clearInterval(watchdogTimer);
    }

    watchdogTimer = setInterval(
        runTeacherPanelWatchdog,
        10000
    );

    console.log("پنل فراخوان کلاس پنجم-1 آماده است.");
}

/* =====================================================
   اجرای اولیه پس از آماده‌شدن صفحه
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
   به‌روزرسانی خودکار هر ۵ ثانیه
===================================================== */

setInterval(() => {
    refreshTeacherPanel();
}, 5000);

/* =====================================================
   بررسی تغییر روز هر ۱۵ ثانیه
===================================================== */

setInterval(() => {
    if (checkTeacherCallDayChange()) {
        refreshTeacherPanel();
    }
}, 15000);

/* =====================================================
   بازگشت به پنل یا وصل‌شدن مجدد اینترنت
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

    lastTeacherCallsLoad = 0;
    lastAbsentStudentsLoad = 0;

    refreshTeacherPanel();
});

window.addEventListener("offline", () => {
    console.warn("اتصال اینترنت قطع شد.");
});
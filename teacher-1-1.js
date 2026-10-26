/* =====================================================
   پنل فراخوان معلم - دبستان علوی
   کلاس: اول-1
   پایگاه داده: MySQL روی berandil.ir
   بدون Supabase و بدون Realtime
===================================================== */

const API_BASE = "https://berandil.ir/farakhan-api";
const CALLS_API = `${API_BASE}/teacher-calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;

const className = "اول-1";

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
let previousCallStates = new Map();
let callsLoadedOnce = false;

let popupTimer = null;
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

    const getPart = type =>
        parts.find(part => part.type === type)?.value || "";

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

/* =====================================================
   درخواست به API هاست
===================================================== */

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        cache: "no-store",
        headers: {
            Accept: "application/json",
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

    if (!response.ok || result.success === false) {
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
            console.error("خطا در فعال‌سازی صدا:", error);
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
   پاپ‌آپ اعلان‌ها
===================================================== */

function showPopup(text, duration = 5000) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.warn("عناصر پاپ‌آپ در HTML پیدا نشدند.");
        playNotificationSound();
        return;
    }

    student.innerText = text;
    popup.classList.add("show");

    clearTimeout(popupTimer);

    popupTimer = setTimeout(() => {
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
    return studentButtons.get(String(name || "").trim()) || null;
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
   پاک‌سازی وضعیت‌های نمایشی
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
   شناسه یکتا برای تشخیص تغییر وضعیت فراخوان
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
   دریافت فراخوان‌های امروز از API
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

        // اگر هنگام دریافت اطلاعات تاریخ عوض شده باشد،
        // نتیجه مربوط به روز قبلی را نمایش نمی‌دهیم.
        if (today !== getDatabaseToday()) return;

        const calls = Array.isArray(result.data)
            ? result.data.filter(call =>
                call.class_name === className &&
                call.called_date === today
            )
            : [];

        const currentStates = new Map();

        calls.forEach(call => {
            const key = getCallKey(call);
            currentStates.set(key, call);

            // بار اول فقط وضعیت فعلی را نمایش می‌دهیم؛
            // اعلان برای فراخوان‌های قدیمی پخش نمی‌شود.
            if (!callsLoadedOnce) return;

            const previous = previousCallStates.get(key);
            const button = findButton(call.student_name);

            if (!previous && call.status === "فراخوان شد") {
                if (!(button && button.classList.contains("absent"))) {
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

        calls.forEach(updateButton);
        updateCount(calls);

        previousCallStates = currentStates;
        callsLoadedOnce = true;

    } catch (error) {
        console.error("خطا در دریافت فراخوان‌ها از هاست:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

/* =====================================================
   دریافت غایبان امروز از API
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

        // سپس غایبان امروز را از پاسخ API اعمال می‌کنیم.
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

        console.log(
            "غایبان امروز بارگذاری شدند:",
            records.filter(record =>
                record.class_name === className &&
                record.attendance_date === today &&
                record.status === "غایب"
            ).length
        );

    } catch (error) {
        // در صورت خطای API وضعیت قبلی دکمه‌ها را پاک نمی‌کنیم.
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

    if (button.classList.contains("absent") || button.disabled) {
        showMessage("این دانش‌آموز غایب است و امکان ارسال ندارد.");
        return;
    }

    // جلوگیری از کلیک چندباره روی یک دانش‌آموز
    if (button.dataset.sending === "true") return;

    button.dataset.sending = "true";
    button.disabled = true;

    try {
        const today = getDatabaseToday();

        const url = CALLS_API + "?" + new URLSearchParams({
            class_name: className,
            date: today,
            _: Date.now()
        });

        const result = await apiRequest(url);

        if (today !== getDatabaseToday()) {
            showMessage("تاریخ تغییر کرده است؛ دوباره تلاش کنید.");
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
            showMessage("برای این دانش‌آموز فراخوان فعالی پیدا نشد.");
            return;
        }

        // یک بار دیگر غیبت را بررسی می‌کنیم.
        if (button.classList.contains("absent")) {
            showMessage("این دانش‌آموز غایب است و امکان ارسال ندارد.");
            return;
        }

        const sentTime = new Date().toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Tehran"
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

        showMessage("📤 فراخوان " + student.name + " ارسال شد.");

        // دریافت وضعیت تازه از سرور
        await loadCalls();

    } catch (error) {
        console.error("خطا در ارسال فراخوان:", error);

        alert(
            "ارسال فراخوان ناموفق بود.\n" +
            "اتصال هاست و پاسخ API را بررسی کنید."
        );
    } finally {
        delete button.dataset.sending;

        // وضعیت حضور و غیاب را دوباره دریافت می‌کنیم.
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
    const newDay = getDatabaseToday();

    if (newDay === currentTeacherCallDay) {
        return false;
    }

    console.log(
        "روز فراخوان تغییر کرد:",
        currentTeacherCallDay,
        "→",
        newDay
    );

    currentTeacherCallDay = newDay;

    previousCallStates.clear();
    callsLoadedOnce = false;

    resetTeacherPanel();

    return true;
}

/* =====================================================
   همگام‌سازی اطلاعات پنل
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
        console.error("خطا در همگام‌سازی پنل:", error);
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

    console.log("پنل فراخوان کلاس اول-1 آماده است.");
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
   همگام‌سازی دوره‌ای هر ۵ ثانیه
===================================================== */

setInterval(() => {
    refreshTeacherPanel();
}, 5000);

/* =====================================================
   همگام‌سازی هنگام بازگشت به صفحه یا اتصال اینترنت
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
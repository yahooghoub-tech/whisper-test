const API_BASE = "https://berandil.ir/farakhan-api";

let notificationAudio = null;
let soundEnabled = false;
let callsLoadedOnce = false;
let previousCallStates = new Map();
let callsLoading = false;
let attendanceLoading = false;
let popupTimer = null;

function getToday() {
    return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tehran"
    }).format(new Date());
}

function getDatabaseToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tehran"
    }).formatToParts(new Date());
    const values = {};
    parts.forEach(part => {
        if (part.type !== "literal") values[part.type] = part.value;
    });
    return `${values.year}-${values.month}-${values.day}`;
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}/${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        cache: "no-store"
    });

    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error(`پاسخ API معتبر نیست (HTTP ${response.status})`);
    }

    if (!response.ok || result.success === false) {
        throw new Error(result.message || `خطای API (HTTP ${response.status})`);
    }
    return result;
}

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
        notificationAudio.play().catch(error =>
            console.error("❌ خطا در پخش صدا:", error)
        );
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

    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(() => popup.classList.remove("show"), 5000);
}

function showCallPopup(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.error("❌ عناصر callPopup یا callPopupStudent پیدا نشدند");
        return;
    }

    student.innerText = studentName + " فراخوان شد";
    popup.classList.add("show");

    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(() => popup.classList.remove("show"), 7000);
    playNotificationSound();
}

const students = [
    { name: "آراد احمدیان", className: "پنجم-3" },
    { name: "رادین امیری", className: "پنجم-3" },
    { name: "آران جهانبانی", className: "پنجم-3" },
    { name: "آوش حسینبکی", className: "پنجم-3" },
    { name: "علی خادم", className: "پنجم-3" },
    { name: "ماهان دیلمقانی زاده", className: "پنجم-3" },
    { name: "سپهر رجاء", className: "پنجم-3" },
    { name: "آرسین رضایی", className: "پنجم-3" },
    { name: "آرسیس رضایی", className: "پنجم-3" },
    { name: "همایون رفیعی", className: "پنجم-3" },
    { name: "میعاد زمانی", className: "پنجم-3" },
    { name: "راستین زهدی", className: "پنجم-3" },
    { name: "مهبد شکری", className: "پنجم-3" },
    { name: "آرتا شیرازی", className: "پنجم-3" },
    { name: "محمدامین صیادنورد", className: "پنجم-3" },
    { name: "بردیا ضیایی", className: "پنجم-3" },
    { name: "سید آیین عظیمی", className: "پنجم-3" },
    { name: "مهرسام علیزاده", className: "پنجم-3" },
    { name: "بردیا قلعه گلاب", className: "پنجم-3" },
    { name: "رادمان مرسلی", className: "پنجم-3" },
    { name: "آریا میرزاده", className: "پنجم-3" },
    { name: "هومان نصرتی", className: "پنجم-3" },
    { name: "رادمان نوروزی", className: "پنجم-3" },
    { name: "محمدرضا یارلو", className: "پنجم-3" }
];

const studentsContainer = document.getElementById("studentsContainer");
const callCount = document.getElementById("callCount");

function createStudents() {
    if (!studentsContainer) {
        console.error("❌ عنصر studentsContainer در HTML پیدا نشد");
        return;
    }

    studentsContainer.innerHTML = "";
    students.forEach(student => {
        const button = document.createElement("button");
        button.className = "student-button pending";
        button.dataset.name = student.name;
        button.innerHTML =
            `<div class="student-name"></div><div class="student-status"></div><div class="student-time"></div>`;

        button.querySelector(".student-name").innerText = student.name;
        button.addEventListener("click", () => sendStudent(student));
        studentsContainer.appendChild(button);
    });
}

function findButton(name) {
    return [...document.querySelectorAll(".student-button")]
        .find(button => button.dataset.name === name);
}

function updateButton(call) {
    const button = findButton(call.student_name);
    if (!button || button.classList.contains("absent")) return;

    button.classList.remove("called", "sent", "received", "pending");
    const status = button.querySelector(".student-status");

    if (call.status === "فراخوان شد") {
        button.classList.add("called");
        status.innerText = "🔴 فراخوان";
    } else if (call.status === "دریافت فراخوان") {
        button.classList.add("received");
        status.innerText = "🟠 دریافت شد";
    } else if (call.status === "ارسال شد") {
        button.classList.add("sent");
        status.innerText = "🟢 ارسال شد";
    } else {
        button.classList.add("pending");
        status.innerText = "";
    }

    let timeText = "";
    if (call.called_time) {
        timeText = "🕐 فراخوان: " + call.called_time;
    }
    if (call.sent_time) {
        timeText += (timeText ? "<br>" : "") + "📤 ارسال: " + call.sent_time;
    }

    button.querySelector(".student-time").innerHTML = timeText;
}

function resetStudentButton(call) {
    const button = findButton(call.student_name);
    if (!button || button.classList.contains("absent")) return;

    button.classList.remove("called", "sent", "received");
    button.classList.add("pending");
    button.querySelector(".student-status").innerText = "";
    button.querySelector(".student-time").innerText = "";
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
    previousCallStates.clear();
    callsLoadedOnce = false;
    console.log("🔄 صفحه معلم ریست شد");
}
function updateCount(data) {
    if (!Array.isArray(data)) {
        console.error("updateCount: داده آرایه نیست:", data);
        return;
    }

    const active = data.filter(call => call.status !== "ارسال شد");
    if (callCount) callCount.innerText = active.length + " فراخوان";
}

async function loadCalls() {
    if (callsLoading) return;
    callsLoading = true;

    try {
        const query = new URLSearchParams({
            class_name: "پنجم-3",
            date: getToday()
        });

        const result = await apiRequest(`teacher-calls.php?${query.toString()}`);
        const data = Array.isArray(result.data) ? result.data : [];
        const currentStates = new Map();

        data.forEach(call => {
            const key = String(
                call.id ?? `${call.student_name}-${call.called_date}-${call.called_time ?? ""}`
            );

            currentStates.set(key, call);

            if (callsLoadedOnce) {
                const previous = previousCallStates.get(key);

                if (!previous && call.status === "فراخوان شد") {
                    const button = findButton(call.student_name);

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
            }
        });

        resetTeacherPanelVisualOnly();
        data.forEach(updateButton);
        updateCount(data);

        previousCallStates = currentStates;
        callsLoadedOnce = true;
    } catch (error) {
        console.error("❌ خطا در دریافت فراخوان‌های امروز:", error);
    } finally {
        callsLoading = false;
    }
}

function resetTeacherPanelVisualOnly() {
    document.querySelectorAll(".student-button").forEach(button => {
        if (button.classList.contains("absent")) return;

        button.classList.remove("called", "sent", "received");
        button.classList.add("pending");

        const status = button.querySelector(".student-status");
        const time = button.querySelector(".student-time");

        if (status) status.innerText = "";
        if (time) time.innerText = "";
    });
}

async function sendStudent(student) {
    const button = findButton(student.name);

    if (button && (button.classList.contains("absent") || button.disabled)) {
        console.log("⛔ دانش‌آموز غایب است و امکان ارسال ندارد:", student.name);
        return;
    }

    try {
        const query = new URLSearchParams({
            class_name: "پنجم-3",
            student_name: student.name,
            date: getToday(),
            active_only: "1"
        });

        const result = await apiRequest(`teacher-calls.php?${query.toString()}`);
        const data = Array.isArray(result.data) ? result.data : [];

        const call = data
            .filter(item => item.status !== "ارسال شد")
            .sort((a, b) => Number(b.id) - Number(a.id))[0];

        if (!call) {
            alert("برای این دانش‌آموز هنوز فراخوان فعالی ثبت نشده است.");
            return;
        }

        const now = new Date();
        const time = now.toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Tehran"
        });

        await apiRequest("update-call-status.php", {
            method: "POST",
            body: JSON.stringify({
                id: call.id,
                status: "ارسال شد",
                sent_time: time
            })
        });

        await loadCalls();
    } catch (error) {
        console.error("❌ خطا در ارسال دانش‌آموز:", error);
        alert("خطا در ثبت ارسال دانش‌آموز: " + error.message);
    }
}

async function loadAbsentStudents() {
    if (attendanceLoading) return;
    attendanceLoading = true;

    try {
        const query = new URLSearchParams({
            class_name: "پنجم-3",
            date: getDatabaseToday()
        });

        const result = await apiRequest(`attendance.php?${query.toString()}`);
        const data = Array.isArray(result.data) ? result.data : [];

        document.querySelectorAll(".student-button").forEach(button => {
            button.classList.remove("absent");
            button.disabled = false;

            const nameDiv = button.querySelector(".student-name");
            if (nameDiv) nameDiv.innerText = button.dataset.name;
        });

        data.filter(item => item.status === "غایب").forEach(absent => {
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
    } catch (error) {
        console.error("❌ خطا در دریافت غایبین:", error);
    } finally {
        attendanceLoading = false;
    }
}

createStudents();
loadCalls();
loadAbsentStudents();

window.addEventListener("load", setupSound);

let currentTeacherCallDay = getToday();
let currentAttendanceDay = getDatabaseToday();

function checkTeacherCallDayChange() {
    const newCallDay = getToday();
    const newAttendanceDay = getDatabaseToday();

    if (newCallDay !== currentTeacherCallDay) {
        console.log(
            "📅 روز فراخوان تغییر کرد:",
            currentTeacherCallDay,
            "→",
            newCallDay
        );

        currentTeacherCallDay = newCallDay;
        resetTeacherPanel();
        loadCalls();
    }

    if (newAttendanceDay !== currentAttendanceDay) {
        currentAttendanceDay = newAttendanceDay;
        loadAbsentStudents();
    }
}

setInterval(() => {
    loadCalls();
    loadAbsentStudents();
}, 5000);

setInterval(checkTeacherCallDayChange, 30000);
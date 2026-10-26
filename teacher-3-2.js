
const API_BASE = "https://berandil.ir/farakhan-api";

let notificationAudio = null;
let soundEnabled = false;

let teacherCallsLoading = false;
let absentStudentsLoading = false;
let teacherPanelRefreshRunning = false;
let currentTeacherCallDay = getDatabaseToday();
let previousCallStates = new Map();
let callsLoadedOnce = false;

let callsPollingTimer = null;
let attendancePollingTimer = null;

function getDatabaseToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getToday() {
    return getDatabaseToday();
}

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`خطای API: ${response.status}`);
    }

    const result = await response.json();

    if (result.success === false) {
        throw new Error(result.message || "درخواست به API ناموفق بود");
    }

    return result.data ?? result;
}

function setupSound() {
    const button = document.getElementById("enableSoundButton");

    if (!button) {
        console.error("دکمه enableSoundButton در HTML پیدا نشد");
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
            console.error("خطا در فعال‌سازی صدا:", error);
            alert("فعال‌سازی صدا ناموفق بود. وجود فایل notification.mp3 را بررسی کنید.");
        }
    });
}

function playNotificationSound() {
    if (!soundEnabled || !notificationAudio) return;

    try {
        notificationAudio.currentTime = 0;

        notificationAudio.play().catch(error => {
            console.error("خطا در پخش صدای اعلان:", error);
        });
    } catch (error) {
        console.error("خطا در پخش صدا:", error);
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

    if (!popup || !student) {
        console.error("عناصر callPopup یا callPopupStudent پیدا نشدند");
        return;
    }

    student.innerText = studentName + " فراخوان شد";
    popup.classList.add("show");

    playNotificationSound();

    setTimeout(() => popup.classList.remove("show"), 7000);
}

const students = [
    { name: "مهرسام اسدرخت", className: "سوم-2" },
    { name: "آریا اسماعیلی", className: "سوم-2" },
    { name: "امیرعلی اکبرآبادی", className: "سوم-2" },
    { name: "دانیال اکبری مهر", className: "سوم-2" },
    { name: "سید محمدامیر انوری", className: "سوم-2" },
    { name: "جانیار ایرجی", className: "سوم-2" },
    { name: "ایلیا آغباشلو", className: "سوم-2" },
    { name: "پندار خوش طینتان", className: "سوم-2" },
    { name: "آروین سوری", className: "سوم-2" },
    { name: "آیهان شهرتی", className: "سوم-2" },
    { name: "رادین طلایی پناه", className: "سوم-2" },
    { name: "آرمان عبدی", className: "سوم-2" },
    { name: "سامیار عزیزی مقدم", className: "سوم-2" },
    { name: "رادین فرشچین", className: "سوم-2" },
    { name: "آریا فرج نژاد", className: "سوم-2" },
    { name: "ایلیا قاسمی", className: "سوم-2" },
    { name: "محمد مهدی کاظمی", className: "سوم-2" },
    { name: "پویا کرمی", className: "سوم-2" },
    { name: "کیان گنجه", className: "سوم-2" },
    { name: "حسین محمدی مهر", className: "سوم-2" },
    { name: "ویهان منصوری", className: "سوم-2" },
    { name: "میثم نظری", className: "سوم-2" }
];

const studentsContainer = document.getElementById("studentsContainer");
const callCount = document.getElementById("callCount");

function createStudents() {
    if (!studentsContainer) {
        console.error("عنصر studentsContainer پیدا نشد");
        return;
    }

    studentsContainer.innerHTML = "";

    students.forEach(student => {
        const button = document.createElement("button");

        button.className = "student-button pending";
        button.dataset.name = student.name;

        button.innerHTML = `
            <div class="student-name"></div>
            <div class="student-status"></div>
            <div class="student-time"></div>
        `;

        button.querySelector(".student-name").innerText = student.name;
        button.addEventListener("click", () => sendStudent(student));

        studentsContainer.appendChild(button);
    });
}

function findButton(name) {
    return [...document.querySelectorAll(".student-button")]
        .find(button => button.dataset.name === name);
}

function getCallKey(call) {
    return String(call.id);
}

function updateButton(call) {
    const button = findButton(call.student_name);
    if (!button || button.classList.contains("absent")) return;

    button.classList.remove("called", "sent", "received", "pending");

    const status = button.querySelector(".student-status");
    const time = button.querySelector(".student-time");

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
        status.innerText = call.status || "";
    }

    let timeText = "";

    if (call.called_time) {
        timeText = "🕐 فراخوان: " + call.called_time;
    }

    if (call.sent_time) {
        timeText += (timeText ? "<br>" : "") + "📤 ارسال: " + call.sent_time;
    }

    time.innerHTML = timeText;
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
}

function updateCount(data) {
    if (!Array.isArray(data)) return;

    const active = data.filter(call => call.status !== "ارسال شد");

    if (callCount) {
        callCount.innerText = active.length + " فراخوان";
    }
}

async function loadCalls() {
    if (teacherCallsLoading) return;

    teacherCallsLoading = true;

    try {
        const params = new URLSearchParams({
            class_name: "سوم-2",
            date: getToday()
        });

        const result = await apiRequest(
            `teacher-calls.php?${params.toString()}`
        );

        const data = Array.isArray(result) ? result : [];

        const currentStates = new Map();

        data.forEach(call => {
            const key = getCallKey(call);
            currentStates.set(key, call.status);

            const previousStatus = previousCallStates.get(key);

            // در بارگذاری اول، اعلان‌های قدیمی پخش نمی‌شوند.
            if (callsLoadedOnce && previousStatus === undefined) {
                if (call.status === "فراخوان شد") {
                    const button = findButton(call.student_name);

                    if (button && !button.classList.contains("absent")) {
                        showCallPopup(call.student_name);
                    }
                }
            } else if (callsLoadedOnce && previousStatus !== call.status) {
                if (
                    previousStatus !== "ارسال شد" &&
                    call.status === "ارسال شد"
                ) {
                    showSendNotification(call.student_name);
                } else if (
                    previousStatus !== "فراخوان شد" &&
                    call.status === "فراخوان شد"
                ) {
                    const button = findButton(call.student_name);

                    if (button && !button.classList.contains("absent")) {
                        showCallPopup(call.student_name);
                    }
                }
            }

            updateButton(call);
        });

        previousCallStates = currentStates;
        callsLoadedOnce = true;

        // وضعیت غایبان پس از به‌روزرسانی فراخوان‌ها اعمال می‌شود.
        await loadAbsentStudents();
        updateCount(data);

    } catch (error) {
        console.error("خطا در دریافت فراخوان‌ها:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

async function loadAbsentStudents() {
    if (absentStudentsLoading) return;

    absentStudentsLoading = true;

    try {
        const params = new URLSearchParams({
            class_name: "سوم-2",
            date: getDatabaseToday()
        });

        const result = await apiRequest(
            `attendance.php?${params.toString()}`
        );

        const data = Array.isArray(result) ? result : [];

        document.querySelectorAll(".student-button").forEach(button => {
            button.classList.remove("absent");
            button.disabled = false;

            const nameDiv = button.querySelector(".student-name");

            if (nameDiv) {
                nameDiv.innerText = button.dataset.name;
            }
        });

        data.forEach(attendance => {
            if (attendance.status !== "غایب") return;

            const button = findButton(attendance.student_name);
            if (!button) return;

            button.classList.remove(
                "called", "sent", "received", "pending"
            );

            button.classList.add("absent");
            button.disabled = true;

            const nameDiv = button.querySelector(".student-name");
            const status = button.querySelector(".student-status");
            const time = button.querySelector(".student-time");

            if (nameDiv) {
                nameDiv.innerText = attendance.student_name + " (غایب)";
            }

            if (status) status.innerText = "";
            if (time) time.innerText = "";
        });

        console.log("غایبان بارگذاری شدند:", data.length);

    } catch (error) {
        console.error("خطا در دریافت غایبان:", error);
    } finally {
        absentStudentsLoading = false;
    }
}

async function sendStudent(student) {
    const button = findButton(student.name);

    if (button && button.classList.contains("absent")) {
        console.log("ارسال برای دانش‌آموز غایب مجاز نیست:", student.name);
        return;
    }

    try {
        const params = new URLSearchParams({
            class_name: "سوم-2",
            student_name: student.name
        });

        const result = await apiRequest(
            `teacher-calls.php?${params.toString()}`
        );

        const records = Array.isArray(result) ? result : [];

        const call = records
            .filter(item => item.status !== "ارسال شد")
            .sort((a, b) => Number(b.id) - Number(a.id))[0];

        if (!call) {
            alert("برای این دانش‌آموز فراخوان فعالی ثبت نشده است.");
            return;
        }

        const now = new Date();
        const sentTime = now.toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        await apiRequest("update-call-status.php", {
            method: "POST",
            body: JSON.stringify({
                id: call.id,
                status: "ارسال شد",
                sent_time: sentTime
            })
        });

        await loadCalls();

    } catch (error) {
        console.error("خطا در ارسال دانش‌آموز:", error);
        alert("ارسال انجام نشد. ارتباط با سرور و تنظیمات API را بررسی کنید.");
    }
}

async function refreshTeacherPanel() {
    if (teacherPanelRefreshRunning) return;

    teacherPanelRefreshRunning = true;

    try {
        await loadCalls();
    } finally {
        teacherPanelRefreshRunning = false;
    }
}

function checkTeacherCallDayChange() {
    const newDay = getDatabaseToday();

    if (newDay === currentTeacherCallDay) return;

    console.log("روز جدید تشخیص داده شد:", currentTeacherCallDay, "→", newDay);

    currentTeacherCallDay = newDay;
    previousCallStates.clear();
    callsLoadedOnce = false;

    resetTeacherPanel();

    loadAbsentStudents();
    loadCalls();
}

function startTeacherPanel() {
    createStudents();
    setupSound();

    loadAbsentStudents();
    loadCalls();

    if (callsPollingTimer) clearInterval(callsPollingTimer);
    if (attendancePollingTimer) clearInterval(attendancePollingTimer);

    callsPollingTimer = setInterval(() => {
        checkTeacherCallDayChange();
        refreshTeacherPanel();
    }, 5000);

    attendancePollingTimer = setInterval(() => {
        loadAbsentStudents();
    }, 5000);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTeacherPanel);
} else {
    startTeacherPanel();
}
